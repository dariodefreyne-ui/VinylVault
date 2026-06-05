import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRecords } from '../hooks/useRecords.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { isBeheerder } from '../utils/roles.js';
import RecordCard from '../components/records/RecordCard.jsx';
import Icon from '../components/ui/Icon.jsx';
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
  // Meerdere eigenaren tegelijk selecteerbaar (gemengde collectie). Lege selectie = alles.
  const [selectedOwners, setSelectedOwners] = useState(urlOwner ? [urlOwner] : []);
  const [genreFilter, setGenreFilter] = useState('');
  const [sortValue, setSortValue] = useState('artist_asc');

  // Sync URL params on mount
  useEffect(() => {
    setSearch(urlSearch);
    setSelectedOwners(urlOwner ? [urlOwner] : []);
  }, [urlSearch, urlOwner]);

  // Unieke eigenaren uit de records (de labels die echt voorkomen).
  const ownerList = useMemo(() => {
    const set = new Set();
    for (const r of records) {
      if (r.owner && r.owner.trim()) set.add(r.owner.trim());
    }
    return [...set].sort((a, b) =>
      a.localeCompare(b, 'nl', { sensitivity: 'base' })
    );
  }, [records]);

  function toggleOwner(label) {
    setSelectedOwners((prev) =>
      prev.some((o) => o.toLowerCase() === label.toLowerCase())
        ? prev.filter((o) => o.toLowerCase() !== label.toLowerCase())
        : [...prev, label]
    );
  }

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

    if (selectedOwners.length > 0) {
      const set = new Set(selectedOwners.map((o) => o.toLowerCase()));
      list = list.filter((r) => set.has((r.owner || '').toLowerCase()));
    }

    if (genreFilter) {
      list = list.filter(
        (r) => Array.isArray(r.genres) && r.genres.includes(genreFilter)
      );
    }

    return sortRecords(list, sortValue);
  }, [records, search, selectedOwners, genreFilter, sortValue]);

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
      <h1 style={headingStyle}>Alle Lp's</h1>
      <p style={subtitleStyle}>
        {loading
          ? 'Laden...'
          : `${filtered.length} van ${records.length} lp's`}
      </p>

      {/* Top action bar */}
      <div style={actionBarStyle}>
        {/* Search */}
        <div style={searchInnerStyle}>
          <span style={{ color: colors.textSecondary, display: 'flex' }}>
            <Icon name="search" size={17} />
          </span>
          <input
            style={searchInputStyle}
            type="text"
            placeholder="Zoek op artiest of titel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Owner filter chips — meerdere tegelijk = gemengde collectie */}
        <div style={chipRowStyle}>
          <Chip
            label="Alles"
            active={selectedOwners.length === 0}
            onClick={() => setSelectedOwners([])}
          />
          {ownerList.map((label) => (
            <Chip
              key={label}
              label={label}
              active={selectedOwners.some(
                (o) => o.toLowerCase() === label.toLowerCase()
              )}
              onClick={() => toggleOwner(label)}
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
          <Icon name="upload" size={15} /> Exporteer
        </button>

        {/* Add + Import buttons (beheerder only) */}
        {isBeheerder(role) && (
          <>
            <button
              style={buttonStyle('primary')}
              onClick={() => navigate('/platen/nieuw')}
            >
              <Icon name="plus" size={15} /> Lp toevoegen
            </button>
            <button
              style={buttonStyle('secondary')}
              onClick={() => setImportOpen(true)}
            >
              <Icon name="download" size={15} /> Importeer
            </button>
          </>
        )}
      </div>

      {/* Stats bar */}
      {!loading && (
        <div style={statsBarStyle}>
          {filtered.length} lp's getoond &middot; Totale waarde: &euro;{filteredValue.toFixed(2)}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <p style={emptyStyle}>Laden...</p>
      ) : filtered.length === 0 ? (
        <p style={emptyStyle}>Geen lp's gevonden.</p>
      ) : (
        <div style={gridStyle} className="vv-stagger">
          {filtered.map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </div>
      )}

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
