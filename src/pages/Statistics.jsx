import { useState } from 'react';
import { useRecords } from '../hooks/useRecords.js';
import KpiTegel from '../components/ui/KpiTegel.jsx';
import Chip from '../components/ui/Chip.jsx';
import ArtistPivotTable from '../components/stats/ArtistPivotTable.jsx';
import ValueChart from '../components/stats/ValueChart.jsx';
import { colors, radius } from '../styles/tokens.js';

const pageStyle = {
  padding: '32px',
  maxWidth: '1100px',
  margin: '0 auto',
};

const headingStyle = {
  fontSize: '26px',
  fontWeight: 700,
  color: colors.textPrimary,
  marginBottom: '28px',
};

const sectionStyle = {
  marginBottom: '36px',
};

const sectionTitleStyle = {
  fontSize: '16px',
  fontWeight: 700,
  color: colors.textPrimary,
  marginBottom: '14px',
};

const ownerFilters = [
  { key: 'alles', label: 'Alles' },
  { key: 'dario', label: 'Dario' },
  { key: 'papa', label: 'Papa' },
];

function computeStats(records, ownerFilter) {
  const filtered =
    ownerFilter === 'alles'
      ? records
      : records.filter(
          (r) => (r.owner || '').toLowerCase() === ownerFilter.toLowerCase()
        );

  let totalQuantity = 0;
  let totalValue = 0;
  const artists = new Set();

  let darioValue = 0;
  let papaValue = 0;

  for (const r of filtered) {
    const qty = Number(r.quantity) || 1;
    const price = parseFloat(r.purchasePrice) || 0;
    totalQuantity += qty;
    totalValue += price * qty;
    if (r.artist) artists.add(r.artist);
  }

  for (const r of records) {
    const qty = Number(r.quantity) || 1;
    const price = parseFloat(r.purchasePrice) || 0;
    const val = price * qty;
    const owner = (r.owner || '').toLowerCase();
    if (owner === 'dario') darioValue += val;
    else if (owner === 'papa') papaValue += val;
  }

  return {
    totalQuantity,
    totalValue,
    uniqueArtists: artists.size,
    darioValue,
    papaValue,
  };
}

function computeGenres(records, ownerFilter) {
  const filtered =
    ownerFilter === 'alles'
      ? records
      : records.filter(
          (r) => (r.owner || '').toLowerCase() === ownerFilter.toLowerCase()
        );

  const map = {};
  for (const r of filtered) {
    const genres = Array.isArray(r.genres) ? r.genres : ['Onbekend'];
    for (const genre of genres) {
      map[genre] = (map[genre] || 0) + (Number(r.quantity) || 1);
    }
  }

  return Object.entries(map)
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count);
}

export default function Statistics() {
  const { records, loading } = useRecords();
  const [ownerFilter, setOwnerFilter] = useState('alles');

  const filteredRecords =
    ownerFilter === 'alles'
      ? records
      : records.filter(
          (r) => (r.owner || '').toLowerCase() === ownerFilter.toLowerCase()
        );

  const stats = computeStats(records, ownerFilter);
  const genres = computeGenres(records, ownerFilter);
  const maxGenreCount = genres.length > 0 ? genres[0].count : 1;

  return (
    <div style={pageStyle}>
      {/* Page header */}
      <div style={headingStyle}>Statistieken</div>

      {loading ? (
        <div style={{ color: colors.textSecondary, fontSize: '14px' }}>
          Laden...
        </div>
      ) : (
        <>
          {/* KPI strip */}
          <div style={{ ...sectionStyle }}>
            <div
              style={{
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              <KpiTegel label="Totaal platen" value={stats.totalQuantity} />
              <KpiTegel
                label="Totale waarde"
                value={`€${stats.totalValue.toFixed(2)}`}
                color="green"
              />
              <KpiTegel label="Unieke artiesten" value={stats.uniqueArtists} />
              <KpiTegel
                label="Dario waarde"
                value={`€${stats.darioValue.toFixed(2)}`}
                color="blue"
              />
              <KpiTegel
                label="Papa waarde"
                value={`€${stats.papaValue.toFixed(2)}`}
                color="orange"
              />
            </div>
          </div>

          {/* Owner filter chips */}
          <div style={{ ...sectionStyle, display: 'flex', gap: '8px' }}>
            {ownerFilters.map((f) => (
              <Chip
                key={f.key}
                label={f.label}
                active={ownerFilter === f.key}
                onClick={() => setOwnerFilter(f.key)}
              />
            ))}
          </div>

          {/* Artiest overzicht */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Artiest overzicht</div>
            <ArtistPivotTable records={filteredRecords} ownerFilter={ownerFilter} />
          </div>

          {/* Grafieken */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Grafieken</div>
            <ValueChart records={filteredRecords} ownerFilter={ownerFilter} />
          </div>

          {/* Genre verdeling */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Genre verdeling</div>
            {genres.length === 0 ? (
              <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                Geen genres beschikbaar.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {genres.map(({ genre, count }) => {
                  const pct = (count / maxGenreCount) * 100;
                  return (
                    <div key={genre}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginBottom: '4px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '13px',
                            color: colors.textPrimary,
                            minWidth: '140px',
                            flexShrink: 0,
                          }}
                        >
                          {genre}
                        </span>
                        <div
                          style={{
                            flex: 1,
                            backgroundColor: colors.bgHover,
                            borderRadius: radius.sm,
                            height: '20px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              backgroundColor: colors.accentRed,
                              borderRadius: radius.sm,
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: '13px',
                            color: colors.textSecondary,
                            minWidth: '28px',
                            textAlign: 'right',
                            flexShrink: 0,
                          }}
                        >
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
