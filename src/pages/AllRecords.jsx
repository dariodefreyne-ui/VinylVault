import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRecords } from '../hooks/useRecords.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { isBeheerder } from '../utils/roles.js';
import RecordCard from '../components/records/RecordCard.jsx';
import Chip from '../components/ui/Chip.jsx';
import ImportModal from '../components/ImportModal.jsx';
import { exportToExcel } from '../utils/importExcel.js';
import { colors, radius, buttonStyle } from '../styles/tokens.js';

const SORT_OPTIONS = [
  { value: 'artist_asc', label: 'Artiest A-Z' },
  { value: 'artist_desc', label: 'Artiest Z-A' },
  { value: 'newest', label: 'Nieuwste eerst' },
  { value: 'price_desc', label: 'Duurste eerst' },
];

const OWNER_FILTERS = [
  { value: '', label: 'Alles' },
  { value: 'dario', label: 'Dario' },
  { value: 'papa', label: 'Papa' },
];

function sortRecords(list, sortValue) {
  const sorted = [...list];
  switch (sortValue) {
    case 'artist_desc':
      return sorted.sort((a, b) =>
        (b.artistSort || b.artist || '').localeCompare(a.artistSort || a.artist || '')
      );
    case 'newest':
      return sorted.sort((a, b) => {
        const da = a.dateAdded ? (a.dateAdded.toDate ? a.dateAdded.toDate() : new Date(a.dateAdded)) : new Date(0);
        const db_ = b.dateAdded ? (b.dateAdded.toDate ? b.dateAdded.toDate() : new Date(b.dateAdded)) : new Date(0);
        return db_ - da;
      });
    case 'price_desc':
      return sorted.sort((a, b) => (parseFloat(b.purchasePrice) || 0) - (parseFloat(a.purchasePrice) || 0));
    case 'artist_asc':
    default:
      return sorted.sort((a, b) =>
        (a.artistSort || a.artist || '').localeCompare(b.artistSort || b.artist || '')
      );
  }
}

export default function AllRecords() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { records, loading } = useRecords();
  const { role } = useAuth();
  const [importOpen, setImportOpen] = useState(false);

  const urlSearch = searchParams.get('search') || '';
  const urlOwner = searchParams.get('owner') || '';

  const [search, setSearch] = useState(urlSearch);
  const [ownerFilter, setOwnerFilter] = useState(urlOwner);
  const [genreFilter, setGenreFilter] = useState('');
  const [sortValue, setSortValue] = useState('artist_asc');

  // Sync URL params on mount
  useEffect(() => {
    setSearch(urlSearch);
    setOwnerFilter(urlOwner);
  }, [urlSearch, urlOwner]);

  // Unique genres from all records
  const allGenres = useMemo(() => {
    const set = new Set();
    for (const r of records) {
      if (Array.isArray(r.genres)) {
        r.genres.forEach((g) => set.add(g));
      }
    }
    return [...set].sort();
  }, [records]);

  // Apply filters
  const filtered = useMemo(() => {
    let list = records;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          (r.artist || '').toLowerCase().includes(q) ||
          (r.title || '').toLowerCase().includes(q)
      );
    }

    if (ownerFilter) {
      list = list.filter(
        (r) => (r.owner || '').toLowerCase() === ownerFilter.toLowerCase()
      );
    }

    if (genreFilter) {
      list = list.filter(
        (r) => Array.isArray(r.genres) && r.genres.includes(genreFilter)
      );
    }

    return sortRecords(list, sortValue);
  }, [records, search, ownerFilter, genreFilter, sortValue]);

  // Stats for filtered list
  const filteredValue = filtered.reduce(
    (sum, r) => sum + (parseFloat(r.purchasePrice) || 0),
    0
  );

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

  const actionBarStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '16px',
  };

  const searchInnerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: colors.bgCard,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radius.md,
    padding: '8px 12px',
    flex: '1 1 220px',
    minWidth: '180px',
  };

  const searchInputStyle = {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    color: colors.textPrimary,
  };

  const chipRowStyle = {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    alignItems: 'center',
  };

  const selectStyle = {
    backgroundColor: colors.bgCard,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radius.md,
    padding: '8px 12px',
    fontSize: '14px',
    color: colors.textPrimary,
    cursor: 'pointer',
    outline: 'none',
  };

  const statsBarStyle = {
    fontSize: '13px',
    color: colors.textSecondary,
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
    padding: '32px 0',
  };

  return (
    <div style={pageStyle}>
      {/* Page header */}
      <h1 style={headingStyle}>Alle Platen</h1>
      <p style={subtitleStyle}>
        {loading
          ? 'Laden...'
          : `${filtered.length} van ${records.length} platen`}
      </p>

      {/* Top action bar */}
      <div style={actionBarStyle}>
        {/* Search */}
        <div style={searchInnerStyle}>
          <span style={{ fontSize: '16px', color: colors.textSecondary }}>🔍</span>
          <input
            style={searchInputStyle}
            type="text"
            placeholder="Zoek op artiest of titel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Owner filter chips */}
        <div style={chipRowStyle}>
          {OWNER_FILTERS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              active={ownerFilter === o.value}
              onClick={() => setOwnerFilter(o.value)}
            />
          ))}
        </div>

        {/* Genre select */}
        <select
          style={selectStyle}
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
        >
          <option value="">Alle genres</option>
          {allGenres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        {/* Sort select */}
        <select
          style={selectStyle}
          value={sortValue}
          onChange={(e) => setSortValue(e.target.value)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Export button (alle gebruikers) */}
        <button
          style={buttonStyle('secondary')}
          onClick={() => exportToExcel(filtered, 'vinylvault-export.xlsx')}
          disabled={loading || filtered.length === 0}
        >
          Exporteer
        </button>

        {/* Add + Import buttons (beheerder only) */}
        {isBeheerder(role) && (
          <>
            <button
              style={buttonStyle('primary')}
              onClick={() => navigate('/platen/nieuw')}
            >
              + Plaat toevoegen
            </button>
            <button
              style={buttonStyle('secondary')}
              onClick={() => setImportOpen(true)}
            >
              Importeer
            </button>
          </>
        )}
      </div>

      {/* Stats bar */}
      {!loading && (
        <div style={statsBarStyle}>
          {filtered.length} platen getoond &middot; Totale waarde: &euro;{filteredValue.toFixed(2)}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <p style={emptyStyle}>Laden...</p>
      ) : filtered.length === 0 ? (
        <p style={emptyStyle}>Geen platen gevonden.</p>
      ) : (
        <div style={gridStyle}>
          {filtered.map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </div>
      )}

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
