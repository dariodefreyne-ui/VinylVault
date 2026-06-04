import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecords } from '../hooks/useRecords.js';
import { useWishlist } from '../hooks/useWishlist.js';
import KpiTegel from '../components/ui/KpiTegel.jsx';
import RecordCard from '../components/records/RecordCard.jsx';
import { colors, radius } from '../styles/tokens.js';

export default function Home() {
  const navigate = useNavigate();
  const { records, loading, kpis } = useRecords();
  const { items: wishlistItems } = useWishlist();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef(null);

  const recentRecords = useMemo(() =>
    [...records]
      .sort((a, b) => {
        const da = a.dateAdded?.toDate?.() ?? new Date(a.dateAdded ?? 0);
        const db_ = b.dateAdded?.toDate?.() ?? new Date(b.dateAdded ?? 0);
        return db_ - da;
      })
      .slice(0, 5),
    [records]
  );

  const activeWishlistCount = useMemo(
    () => wishlistItems.filter((i) => i.status === 'actief').length,
    [wishlistItems]
  );

  // Top 10 artists by frequency from loaded records
  const artistSuggestions = (() => {
    const freq = {};
    for (const r of records) {
      if (r.artist) freq[r.artist] = (freq[r.artist] || 0) + 1;
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([artist]) => artist);
  })();

  function handleSearchKeyDown(e) {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate('/platen?search=' + encodeURIComponent(searchQuery.trim()));
    }
  }

  function handleSuggestionClick(artist) {
    navigate('/platen?search=' + encodeURIComponent(artist));
  }

  const showSuggestions =
    searchFocused && searchQuery === '' && artistSuggestions.length > 0;

  // --- Styles ---

  const pageStyle = {
    color: colors.textPrimary,
    maxWidth: '1100px',
  };

  const headingStyle = {
    fontSize: '28px',
    fontWeight: 700,
    color: colors.textPrimary,
    margin: '0 0 4px 0',
  };

  const subtitleStyle = {
    fontSize: '14px',
    color: colors.textSecondary,
    margin: '0 0 24px 0',
  };

  const searchWrapStyle = {
    position: 'relative',
    marginBottom: '24px',
  };

  const searchInnerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: colors.bgCard,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radius.md,
    padding: '10px 14px',
  };

  const searchInputStyle = {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    fontSize: '15px',
    color: colors.textPrimary,
  };

  const dropdownStyle = {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    backgroundColor: colors.bgCard,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radius.md,
    zIndex: 100,
    overflow: 'hidden',
  };

  const suggestionItemStyle = {
    padding: '10px 14px',
    fontSize: '14px',
    color: colors.textPrimary,
    cursor: 'pointer',
  };

  const kpiRowStyle = {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '32px',
  };

  const sectionTitleStyle = {
    fontSize: '18px',
    fontWeight: 600,
    color: colors.textPrimary,
    marginBottom: '16px',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  };

  const emptyStyle = {
    color: colors.textSecondary,
    fontSize: '14px',
  };

  return (
    <div style={pageStyle}>
      {/* Page header */}
      <h1 style={headingStyle}>Mijn Platencollectie</h1>
      <p style={subtitleStyle}>
        {loading ? '…' : kpis.totalRecords} platen in de collectie
      </p>

      {/* Search bar */}
      <div style={searchWrapStyle}>
        <div style={searchInnerStyle}>
          <span style={{ fontSize: '18px', color: colors.textSecondary }}>🔍</span>
          <input
            ref={searchRef}
            style={searchInputStyle}
            type="text"
            placeholder="Zoek op artiest of titel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
          />
        </div>

        {showSuggestions && (
          <div style={dropdownStyle}>
            {artistSuggestions.map((artist) => (
              <SuggestionItem
                key={artist}
                label={artist}
                baseStyle={suggestionItemStyle}
                onClick={() => handleSuggestionClick(artist)}
              />
            ))}
          </div>
        )}
      </div>

      {/* KPI strip */}
      <div style={kpiRowStyle}>
        <KpiTegel
          label="Totaal platen"
          value={kpis.totalRecords}
          onClick={() => navigate('/platen')}
        />
        <KpiTegel
          label="Totale waarde"
          value={'€' + kpis.totalValue.toFixed(2)}
          color="green"
        />
        <KpiTegel
          label="Dario"
          value={kpis.darioCount}
          color="blue"
          onClick={() => navigate('/platen?owner=dario')}
        />
        <KpiTegel
          label="Papa"
          value={kpis.papaCount}
          color="orange"
          onClick={() => navigate('/platen?owner=papa')}
        />
        <KpiTegel
          label="Wishlist actief"
          value={activeWishlistCount}
          color="orange"
          onClick={() => navigate('/wishlist')}
        />
      </div>

      {/* Nieuw toegevoegd */}
      <div>
        <div style={sectionTitleStyle}>Nieuw toegevoegd</div>
        {loading ? (
          <p style={emptyStyle}>Laden...</p>
        ) : recentRecords.length === 0 ? (
          <p style={emptyStyle}>Nog geen platen toegevoegd.</p>
        ) : (
          <div style={gridStyle}>
            {recentRecords.map((record) => (
              <RecordCard key={record.id} record={record} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SuggestionItem({ label, baseStyle, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        ...baseStyle,
        backgroundColor: hovered ? colors.bgHover : 'transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={onClick}
    >
      {label}
    </div>
  );
}
