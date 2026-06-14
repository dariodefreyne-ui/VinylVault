import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecords } from '../hooks/useRecords.js';
import Icon from '../components/ui/Icon.jsx';
import { colors, radius, fonts, badgeStyle, buttonStyle, ownerColor } from '../styles/tokens.js';

// Datum (ms) voor "recent aangekocht": aankoopdatum indien aanwezig, anders
// toegevoegd-op. Ondersteunt zowel string-datums als Firestore-timestamps.
function recordDateMs(r) {
  if (r.purchaseDate) {
    const d = new Date(r.purchaseDate);
    if (!isNaN(d)) return d.getTime();
  }
  const da = r.dateAdded;
  if (da && typeof da.toDate === 'function') return da.toDate().getTime();
  if (da) {
    const d = new Date(da);
    if (!isNaN(d)) return d.getTime();
  }
  return 0;
}

function NavButton({ side, onClick, label, children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      style={{
        position: 'absolute',
        top: '50%',
        [side]: '16px',
        transform: 'translateY(-50%)',
        width: '52px',
        height: '52px',
        borderRadius: '50%',
        border: '1px solid rgba(242, 235, 221, 0.25)',
        backgroundColor: hovered ? 'rgba(242, 235, 221, 0.2)' : 'rgba(242, 235, 221, 0.1)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        color: colors.textPrimary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 5,
        transition: 'background-color 0.18s ease',
      }}
      onClick={onClick}
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
}

// Schermvullende bezoekers-/kioskmodus: veeg (swipe) door de collectie met grote
// cover-art. Draait achter de login (geen extra datatoegang), zonder zijbalk.
export default function Kiosk() {
  const navigate = useNavigate();
  const { records, loading } = useRecords();
  const [search, setSearch] = useState('');
  const [owner, setOwner] = useState('');
  const [genre, setGenre] = useState('');
  const [sortMode, setSortMode] = useState('az'); // 'az' | 'recent'
  const [index, setIndex] = useState(0);
  const trackRef = useRef(null);

  const allGenres = useMemo(() => {
    const set = new Set();
    for (const r of records) {
      if (Array.isArray(r.genres)) r.genres.forEach((g) => set.add(g));
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'nl', { sensitivity: 'base' }));
  }, [records]);

  const ownerList = useMemo(() => {
    const byKey = new Map();
    for (const r of records) {
      const l = (r.owner || '').trim();
      if (l && !byKey.has(l.toLowerCase())) byKey.set(l.toLowerCase(), l);
    }
    return [...byKey.values()].sort((a, b) => a.localeCompare(b, 'nl', { sensitivity: 'base' }));
  }, [records]);

  const items = useMemo(() => {
    let list = records;
    if (owner) list = list.filter((r) => (r.owner || '').toLowerCase() === owner.toLowerCase());
    if (genre) list = list.filter((r) => Array.isArray(r.genres) && r.genres.includes(genre));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) => (r.artist || '').toLowerCase().includes(q) || (r.title || '').toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    if (sortMode === 'recent') {
      sorted.sort((a, b) => recordDateMs(b) - recordDateMs(a));
    } else {
      sorted.sort((a, b) =>
        (a.artistSort || a.artist || '').localeCompare(b.artistSort || b.artist || '', 'nl', { sensitivity: 'base' })
      );
    }
    return sorted;
  }, [records, owner, genre, search, sortMode]);

  // Reset naar begin wanneer de filter/sortering wijzigt
  useEffect(() => {
    if (trackRef.current) trackRef.current.scrollTo({ left: 0 });
    setIndex(0);
  }, [search, owner, genre, sortMode]);

  function surprise() {
    if (items.length === 0) return;
    const i = Math.floor(Math.random() * items.length);
    const el = trackRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
    setIndex(i);
  }

  function onScroll() {
    const el = trackRef.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    setIndex(Math.round(el.scrollLeft / w));
  }

  function go(delta) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: delta * el.clientWidth, behavior: 'smooth' });
  }

  const pageStyle = {
    position: 'fixed',
    inset: 0,
    height: '100dvh',
    width: '100%',
    backgroundColor: colors.bgPrimary,
    display: 'flex',
    flexDirection: 'column',
    color: colors.textPrimary,
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: 'calc(env(safe-area-inset-top) + 12px) 16px 12px',
    borderBottom: `1px solid ${colors.borderColor}`,
    flexWrap: 'wrap',
  };

  const searchWrap = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: colors.bgCard,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: '999px',
    padding: '10px 16px',
    flex: '1 1 240px',
    minWidth: '160px',
  };

  const chipRow = { display: 'flex', gap: '6px', flexWrap: 'wrap' };
  function chip(active) {
    return {
      padding: '7px 14px',
      borderRadius: '999px',
      fontSize: '14px',
      cursor: 'pointer',
      border: `1px solid ${active ? colors.brand : colors.borderColor}`,
      backgroundColor: active ? colors.brandDim : 'transparent',
      color: active ? colors.brandStrong : colors.textSecondary,
    };
  }

  const trackStyle = {
    flex: 1,
    display: 'flex',
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollSnapType: 'x mandatory',
    scrollBehavior: 'smooth',
    WebkitOverflowScrolling: 'touch',
  };

  const panelStyle = {
    minWidth: '100%',
    scrollSnapAlign: 'center',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '18px',
    padding: '24px',
    boxSizing: 'border-box',
  };

  const coverStyle = {
    width: 'min(62vh, 86vw)',
    height: 'min(62vh, 86vw)',
    objectFit: 'cover',
    borderRadius: radius.lg,
    boxShadow: '0 18px 50px rgba(0,0,0,0.55)',
    border: `1px solid ${colors.borderColor}`,
  };


  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={{ color: colors.brand, display: 'flex' }}><Icon name="disc" size={26} /></span>
        <div style={{ fontFamily: fonts.display, fontSize: '20px', fontWeight: 600 }}>
          Catalogus
        </div>
        <div style={searchWrap}>
          <Icon name="search" size={18} style={{ color: colors.textSecondary }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek artiest of titel…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: colors.textPrimary, fontSize: '16px' }}
          />
        </div>
        <button style={{ ...buttonStyle('secondary') }} onClick={() => navigate('/')}>
          <Icon name="close" size={16} /> Sluiten
        </button>
      </div>

      {/* Filterbalk: eigenaar, genre, sortering, verras me */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', padding: '10px 16px 0' }}>
        {ownerList.length > 1 && (
          <div style={chipRow}>
            <span style={chip(owner === '')} onClick={() => setOwner('')}>Alle eigenaars</span>
            {ownerList.map((o) => (
              <span key={o} style={chip(owner.toLowerCase() === o.toLowerCase())} onClick={() => setOwner(o)}>
                {o}
              </span>
            ))}
          </div>
        )}

        {allGenres.length > 0 && (
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            style={{
              backgroundColor: colors.bgCard,
              border: `1px solid ${genre ? colors.brand : colors.borderColor}`,
              borderRadius: '999px',
              padding: '7px 14px',
              color: genre ? colors.brandStrong : colors.textSecondary,
              fontSize: '14px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">Alle genres</option>
            {allGenres.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        )}

        <div style={chipRow}>
          <span style={chip(sortMode === 'az')} onClick={() => setSortMode('az')}>A–Z</span>
          <span style={chip(sortMode === 'recent')} onClick={() => setSortMode('recent')}>Recent aangekocht</span>
        </div>

        <button
          style={{ ...buttonStyle('primary'), marginLeft: 'auto' }}
          onClick={surprise}
          disabled={items.length === 0}
        >
          <Icon name="sparkle" size={16} /> Verras me
        </button>
      </div>

      {/* Swipe-track */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: colors.textSecondary }}>
            Laden…
          </div>
        ) : items.length === 0 ? (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: colors.textSecondary }}>
            Geen lp's gevonden.
          </div>
        ) : (
          <>
            <div ref={trackRef} style={trackStyle} onScroll={onScroll}>
              {items.map((r) => (
                <div key={r.id} style={panelStyle}>
                  {r.coverImageUrl ? (
                    <img src={r.coverImageUrl} alt={r.title} style={coverStyle} loading="lazy" />
                  ) : (
                    <div style={{ ...coverStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.brand, backgroundColor: colors.bgCard }}>
                      <Icon name="disc" size={140} strokeWidth={1.1} />
                    </div>
                  )}
                  <div style={{ textAlign: 'center', maxWidth: '90vw' }}>
                    <div style={{ fontFamily: fonts.display, fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 600 }}>
                      {r.artist}
                    </div>
                    <div style={{ fontSize: 'clamp(15px, 2.6vw, 20px)', color: colors.textSecondary, marginTop: '4px' }}>
                      {r.title}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '12px', alignItems: 'center' }}>
                      {r.owner && <span style={badgeStyle(ownerColor(r.owner))}>{r.owner}</span>}
                      {[r.year, r.format, r.label].filter(Boolean).map((p, i) => (
                        <span key={i} style={{ fontSize: '13px', color: colors.textSecondary }}>{p}</span>
                      ))}
                    </div>
                    {Array.isArray(r.genres) && r.genres.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
                        {r.genres.slice(0, 4).map((g) => (
                          <span key={g} style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', backgroundColor: colors.brandDim, color: colors.brandStrong }}>
                            {g}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <NavButton side="left" onClick={() => go(-1)} label="Vorige">
              <Icon name="back" size={22} />
            </NavButton>
            <NavButton side="right" onClick={() => go(1)} label="Volgende">
              <Icon name="forward" size={22} />
            </NavButton>

            <div style={{
              position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
              backgroundColor: 'rgba(28,24,21,0.8)', border: `1px solid ${colors.borderColor}`,
              borderRadius: '999px', padding: '5px 14px', fontSize: '13px', color: colors.textSecondary,
            }}>
              {index + 1} / {items.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
