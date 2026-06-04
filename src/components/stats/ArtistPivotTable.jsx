import { useNavigate } from 'react-router-dom';
import { colors, radius } from '../../styles/tokens.js';

function computeArtistRows(records, ownerFilter) {
  const filtered =
    ownerFilter === 'alles'
      ? records
      : records.filter(
          (r) => (r.owner || '').toLowerCase() === ownerFilter.toLowerCase()
        );

  const map = {};
  for (const r of filtered) {
    const artist = r.artist || 'Onbekend';
    const qty = Number(r.quantity) || 1;
    const price = parseFloat(r.purchasePrice) || 0;
    if (!map[artist]) {
      map[artist] = { artist, count: 0, totalValue: 0 };
    }
    map[artist].count += qty;
    map[artist].totalValue += price * qty;
  }

  return Object.values(map).sort((a, b) => b.totalValue - a.totalValue);
}

const thStyle = {
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: colors.textSecondary,
  backgroundColor: colors.bgHover,
  padding: '10px 14px',
  textAlign: 'left',
  fontWeight: 600,
};

const tdStyle = {
  padding: '10px 14px',
  fontSize: '14px',
  color: colors.textPrimary,
  borderBottom: `1px solid ${colors.borderColor}`,
};

const tdNumStyle = {
  ...tdStyle,
  textAlign: 'right',
};

export default function ArtistPivotTable({ records, ownerFilter }) {
  const navigate = useNavigate();
  const rows = computeArtistRows(records, ownerFilter);

  const totalCount = rows.reduce((s, r) => s + r.count, 0);
  const totalValue = rows.reduce((s, r) => s + r.totalValue, 0);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: colors.bgCard,
          borderRadius: radius.md,
          overflow: 'hidden',
        }}
      >
        <thead>
          <tr>
            <th style={{ ...thStyle, width: '48px', textAlign: 'right' }}>N°</th>
            <th style={thStyle}>Artiest</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Aantal platen</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Totale waarde (EUR)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.artist}
              style={{ cursor: 'pointer' }}
              onClick={() =>
                navigate(`/platen?search=${encodeURIComponent(row.artist)}`)
              }
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bgHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  i % 2 === 0 ? colors.bgCard : 'transparent';
              }}
            >
              <td
                style={{
                  ...tdStyle,
                  textAlign: 'right',
                  color: colors.textSecondary,
                  backgroundColor: i % 2 === 0 ? colors.bgCard : colors.bgHover,
                }}
              >
                {i + 1}
              </td>
              <td
                style={{
                  ...tdStyle,
                  backgroundColor: i % 2 === 0 ? colors.bgCard : colors.bgHover,
                }}
              >
                {row.artist}
              </td>
              <td
                style={{
                  ...tdNumStyle,
                  backgroundColor: i % 2 === 0 ? colors.bgCard : colors.bgHover,
                }}
              >
                {row.count}
              </td>
              <td
                style={{
                  ...tdNumStyle,
                  backgroundColor: i % 2 === 0 ? colors.bgCard : colors.bgHover,
                }}
              >
                € {row.totalValue.toFixed(2)}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={4}
                style={{ ...tdStyle, textAlign: 'center', color: colors.textSecondary }}
              >
                Geen platen gevonden.
              </td>
            </tr>
          )}
        </tbody>
        {rows.length > 0 && (
          <tfoot>
            <tr
              style={{
                backgroundColor: colors.bgHover,
                borderTop: `2px solid ${colors.borderColor}`,
              }}
            >
              <td
                style={{
                  ...tdStyle,
                  fontWeight: 700,
                  borderBottom: 'none',
                  textAlign: 'right',
                }}
              />
              <td style={{ ...tdStyle, fontWeight: 700, borderBottom: 'none' }}>
                Totaal
              </td>
              <td
                style={{
                  ...tdNumStyle,
                  fontWeight: 700,
                  borderBottom: 'none',
                }}
              >
                {totalCount}
              </td>
              <td
                style={{
                  ...tdNumStyle,
                  fontWeight: 700,
                  borderBottom: 'none',
                  color: colors.accentGreen,
                }}
              >
                € {totalValue.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
