import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRecords } from '../hooks/useRecords.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { isBeheerder } from '../utils/roles.js';
import RecordCard from '../components/records/RecordCard.jsx';
import Icon from '../components/ui/Icon.jsx';
import Chip from '../components/ui/Chip.jsx';
import ImportModal from '../components/ImportModal.jsx';
import EnrichModal from '../components/EnrichModal.jsx';
import { exportToExcel } from '../utils/importExcel.js';
import { colors, radius, buttonStyle } from '../styles/tokens.js';

const SORT_OPTIONS = [
  { value: 'artist_asc', label: 'Artiest A-Z, dan jaar' },
  { value: 'artist_desc', label: 'Artiest Z-A, dan jaar' },
  { value: 'year_asc', label: 'Jaar (oudste eerst)' },
  { value: 'year_desc', label: 'Jaar (nieuwste eerst)' },
  { value: 'newest', label: 'Recent toegevoegd' },
  { value: 'price_desc', label: 'Duurste eerst' },
];

function cmpArtist(a, b) {
  return (a.artistSort || a.artist || '').localeCompare(b.artistSort || b.artist || '', 'nl', { sensitivity: 'base' });
}
// Jaar-vergelijking; records zonder jaar gaan achteraan.
function cmpYear(a, b, dir = 1) {
  const ya = parseInt(a.year, 10);
  const yb = parseInt(b.year, 10);
  const va = isNaN(ya) ? null : ya;
  const vb = isNaN(yb) ? null : yb;
  if (va == null && vb == null) return 0;
  if (va == null) return 1;
  if (vb == null) return -1;
  return (va - vb) * dir;
}

function sortRecords(list, sortValue) {
  const sorted = [...list];
  switch (sortValue) {
    case 'artist_desc':
      return sorted.sort((a, b) => -cmpArtist(a, b) || cmpYear(a, b, 1));
    case 'year_asc':
      return sorted.sort((a, b) => cmpYear(a, b, 1) || cmpArtist(a, b));
    case 'year_desc':
      return sorted.sort((a, b) => cmpYear(a, b, -1) || cmpArtist(a, b));
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
      // Eerst op artiest, daarna op jaar (oudste eerst).
      return sorted.sort((a, b) => cmpArtist(a, b) || cmpYear(a, b, 1));
  }
}

// Onthoudt filters + scrollpositie zodat je na 'terug' niet bovenaan herbegint.
const VIEW_KEY = 'vv:allrecords';
function loadView() {
  try { return JSON.parse(sessionStorage.getItem(VIEW_KEY)) || {}; } catch { return {}; }
}
function saveView(patch) {
  try { sessionStorage.setItem(VIEW_KEY, JSON.stringify({ ...loadView(), ...patch })); } catch { /* negeren */ }
}

export default function AllRecords() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { records, loading } = useRecords();
  const { role } = useAuth();
  const [importOpen, setImportOpen] = useState(false);
  const [enrichOpen, setEnrichOpen] = useState(false);

  const urlSearch = searchParams.get('search') || '';
  const urlOwner = searchParams.get('owner') || '';

  // Begin vanuit URL-params indien aanwezig, anders vanuit de bewaarde view.
  const savedView = useRef(loadView()).current;
  const [search, setSearch] = useState(urlSearch || savedView.search || '');
  // Meerdere eigenaren tegelijk selecteerbaar (gemengde collectie). Lege selectie = alles.
  const [selectedOwners, setSelectedOwners] = useState(
    urlOwner ? [urlOwner] : (savedView.selectedOwners || [])
  );
  const [genreFilter, setGenreFilter] = useState(savedView.genreFilter || '');
  const [sortValue, setSortValue] = useState(savedView.sortValue || 'artist_asc');

  // URL-params toepassen wanneer ze veranderen én aanwezig zijn (bv. via 'Bekijk collectie').
  useEffect(() => {
    if (urlSearch) setSearch(urlSearch);
    if (urlOwner) setSelectedOwners([urlOwner]);
  }, [urlSearch, urlOwner]);

  // Filters bewaren bij wijziging.
  useEffect(() => {
    saveView({ search, selectedOwners, genreFilter, sortValue });
  }, [search, selectedOwners, genreFilter, sortValue]);

  // Scrollpositie bewaren + herstellen (de scroll-container is de Layout-content).
  const restoredRef = useRef(false);
  useEffect(() => {
    const el = document.getElementById('vv-scroll');
    if (!el) return undefined;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => saveView({ scrollTop: el.scrollTop }));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => { el.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);
  useEffect(() => {
    if (restoredRef.current || loading) return;
    const el = document.getElementById('vv-scroll');
    const top = loadView().scrollTop;
    if (el && top) requestAnimationFrame(() => { el.scrollTop = top; });
    restoredRef.current = true;
  }, [loading]);

  // Unieke eigenaren uit de records — hoofdletterongevoelig samengevoegd
  // ('Dario' en 'dario' tellen als één), met de eerst geziene schrijfwijze.
  const ownerList = useMemo(() => {
    const byKey = new Map();
    for (const r of records) {
      const label = (r.owner || '').trim();
      if (!label) continue;
      const key = label.toLowerCase();
      if (!byKey.has(key)) byKey.set(key, label);
    }
    return [...byKey.values()].sort((a, b) =>
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
    <div style={pageStyle} className="vv-in">
      {/* Page header */}
      <h1 style={headingStyle}>Alle Lp's</h1>
      <p style={subtitleStyle}>
        {loading
          ? 'Laden...'
          : `${filtered.length} van ${records.length} lp's`}
      </p>

      {/* Rij 1: Zoekbalk + genre/sort selects + actieknoppen */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
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

        <select
          style={selectStyle}
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          aria-label="Filter op genre"
        >
          <option value="">Alle genres</option>
          {allGenres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select
          style={selectStyle}
          value={sortValue}
          onChange={(e) => setSortValue(e.target.value)}
          aria-label="Sorteervolgorde"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            style={buttonStyle('secondary')}
            onClick={() => exportToExcel(filtered, 'vinylvault-export.xlsx')}
            disabled={loading || filtered.length === 0}
          >
            <Icon name="upload" size={15} /> Exporteer
          </button>

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
              <button
                style={buttonStyle('secondary')}
                onClick={() => setEnrichOpen(true)}
              >
                <Icon name="search" size={15} /> Metadata aanvullen
              </button>
            </>
          )}
        </div>
      </div>

      {/* Rij 2: Eigenaar-chips */}
      <div style={{ ...chipRowStyle, marginBottom: '16px' }}>
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
        <div style={gridStyle} className="vv-stagger vv-stagger-large">
          {filtered.map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </div>
      )}

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
      <EnrichModal open={enrichOpen} onClose={() => setEnrichOpen(false)} />
    </div>
  );
}
