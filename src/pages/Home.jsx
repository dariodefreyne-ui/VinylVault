import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecords } from '../hooks/useRecords.js';
import { useWishlist } from '../hooks/useWishlist.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { isOwnRecord } from '../utils/owners.js';
import KpiTegel from '../components/ui/KpiTegel.jsx';
import RecordCard from '../components/records/RecordCard.jsx';
import { colors, radius, buttonStyle } from '../styles/tokens.js';

export default function Home() {
  const navigate = useNavigate();
  const { records, loading } = useRecords();
  const { items: wishlistItems } = useWishlist();
  const { user, userDoc } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const searchRef = useRef(null);

  const uid = user?.uid;
  const collectionLabel = userDoc?.collectionLabel;
  const displayName = userDoc?.displayName || 'collega-verzamelaar';

  // Records die op de pagina getoond worden: eigen collectie of alles.
  const scopedRecords = useMemo(() => {
    if (showAll) return records;
    return records.filter((r) => isOwnRecord(r, uid, collectionLabel));
  }, [records, showAll, uid, collectionLabel]);

  // KPI's afgeleid van de actieve scope.
  const kpis = useMemo(() => {
    let totalValue = 0;
    for (const r of scopedRecords) {
      totalValue += (parseFloat(r.purchasePrice) || 0) * (Number(r.quantity) || 1);
    }
    return { totalRecords: scopedRecords.length, totalValue };
  }, [scopedRecords]);

  const recentRecords = useMemo(() =>
    [...scopedRecords]
      .sort((a, b) => {
        const da = a.dateAdded?.toDate?.() ?? new Date(a.dateAdded ?? 0);
        const db_ = b.dateAdded?.toDate?.() ?? new Date(b.dateAdded ?? 0);
        return db_ - da;
      })
      .slice(0, 5),
    [scopedRecords]
  );

  const activeWishlistCount = useMemo(
    () => wishlistItems.filter(
      (i) => i.status === 'actief'
        && (showAll || isOwnRecord(i, uid, collectionLabel))
    ).length,
    [wishlistItems, showAll, uid, collectionLabel]
  );

  // Top 10 artists by frequency from scoped records
  const artistSuggestions = (() => {
    const freq = {};
    for (const r of scopedRecords) {
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 style={headingStyle}>
            {showAll ? 'Alle collecties' : `Welkom, ${displayName}`}
          </h1>
          <p style={subtitleStyle}>
            {loading ? '…' : kpis.totalRecords}{' '}
            {showAll ? 'platen in alle collecties' : 'platen in jouw collectie'}
          </p>
        </div>
        <button
          style={buttonStyle('secondary')}
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? '👤 Toon mijn collectie' : '👥 Toon alle collecties'}
        </button>
      </div>

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
          label={showAll ? 'Totaal platen' : 'Mijn platen'}
          value={kpis.totalRecords}
          onClick={() => navigate('/platen')}
        />
        <KpiTegel
          label={showAll ? 'Totale waarde' : 'Mijn waarde'}
          value={'€' + kpis.totalValue.toFixed(2)}
          color="green"
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
          <p style={emptyStyle}>
            {showAll
              ? 'Nog geen platen toegevoegd.'
              : 'Je hebt nog geen platen in je collectie. Voeg er een toe of bekijk alle collecties.'}
          </p>
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
