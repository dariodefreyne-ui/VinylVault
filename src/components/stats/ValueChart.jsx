import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { colors } from '../../styles/tokens.js';

const sectionHeadingStyle = {
  fontSize: '13px',
  fontWeight: 600,
  color: colors.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '12px',
};

const tooltipStyle = {
  backgroundColor: colors.bgCard,
  border: `1px solid ${colors.borderColor}`,
  borderRadius: '6px',
  color: colors.textPrimary,
  fontSize: '13px',
};

function computeTop10(records, ownerFilter) {
  const filtered =
    ownerFilter === 'alles'
      ? records
      : records.filter(
          (r) => (r.owner || '').toLowerCase() === ownerFilter.toLowerCase()
        );

  const map = {};
  for (const r of filtered) {
    const artist = (r.artist || 'Onbekend').slice(0, 15);
    const qty = Number(r.quantity) || 1;
    const price = parseFloat(r.purchasePrice) || 0;
    if (!map[artist]) map[artist] = 0;
    map[artist] += price * qty;
  }

  return Object.entries(map)
    .map(([artist, value]) => ({ artist, value: parseFloat(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

function computeOwnerSplit(records) {
  let dario = 0;
  let papa = 0;
  for (const r of records) {
    const qty = Number(r.quantity) || 1;
    const price = parseFloat(r.purchasePrice) || 0;
    const val = price * qty;
    const owner = (r.owner || '').toLowerCase();
    if (owner === 'dario') dario += val;
    else if (owner === 'papa') papa += val;
  }
  return [
    { name: 'Dario', value: parseFloat(dario.toFixed(2)) },
    { name: 'Papa', value: parseFloat(papa.toFixed(2)) },
  ];
}

function computeMonthlyLine(records) {
  const monthly = {};
  for (const r of records) {
    if (!r.purchaseDate) continue;
    let date;
    try {
      date =
        r.purchaseDate && r.purchaseDate.toDate
          ? r.purchaseDate.toDate()
          : new Date(r.purchaseDate);
      if (isNaN(date.getTime())) continue;
    } catch {
      continue;
    }
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const qty = Number(r.quantity) || 1;
    const price = parseFloat(r.purchasePrice) || 0;
    if (!monthly[key]) monthly[key] = 0;
    monthly[key] += price * qty;
  }

  const sorted = Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b));

  return sorted.map(([key, value]) => {
    const [year, month] = key.split('-');
    const d = new Date(Number(year), Number(month) - 1, 1);
    const label = d.toLocaleDateString('nl-BE', { month: 'short', year: 'numeric' });
    return { month: label, value: parseFloat(value.toFixed(2)) };
  });
}

const tickStyle = { fill: colors.textSecondary, fontSize: 11 };

export default function ValueChart({ records, ownerFilter }) {
  const top10 = computeTop10(records, ownerFilter);
  const ownerSplit = computeOwnerSplit(records);
  const monthly = computeMonthlyLine(records);

  const PIE_COLORS = [colors.accentBlue, colors.accentOrange];

  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.04) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill={colors.textPrimary}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
      {/* Chart 1 — Top 10 artiesten */}
      <div>
        <div style={sectionHeadingStyle}>Top 10 artiesten (waarde)</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={top10}
            margin={{ top: 4, right: 16, left: 0, bottom: 48 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={colors.borderColor} />
            <XAxis
              dataKey="artist"
              tick={{ ...tickStyle, fontSize: 11 }}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              tick={tickStyle}
              tickFormatter={(v) => `€${v}`}
              width={64}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v) => [`€ ${v}`, 'Waarde']}
              cursor={{ fill: colors.bgHover }}
            />
            <Bar dataKey="value" fill={colors.accentRed} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 2 — Dario vs Papa */}
      <div>
        <div style={sectionHeadingStyle}>Dario vs Papa (totale waarde)</div>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={ownerSplit}
              cx="50%"
              cy="45%"
              outerRadius={90}
              dataKey="value"
              labelLine={false}
              label={renderPieLabel}
            >
              {ownerSplit.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v) => [`€ ${v}`, 'Waarde']}
            />
            <Legend
              formatter={(value) => (
                <span style={{ color: colors.textSecondary, fontSize: '13px' }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 3 — Aankopen per maand */}
      <div>
        <div style={sectionHeadingStyle}>Aankopen per maand</div>
        {monthly.length === 0 ? (
          <div style={{ fontSize: '13px', color: colors.textSecondary }}>
            Geen aankoopdatums beschikbaar.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={monthly}
              margin={{ top: 4, right: 16, left: 0, bottom: 48 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={colors.borderColor} />
              <XAxis
                dataKey="month"
                tick={{ ...tickStyle, fontSize: 11 }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                tick={tickStyle}
                tickFormatter={(v) => `€${v}`}
                width={64}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => [`€ ${v}`, 'Waarde']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={colors.accentGreen}
                strokeWidth={2}
                dot={{ fill: colors.accentGreen, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
