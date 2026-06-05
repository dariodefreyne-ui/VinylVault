import { useState, useRef, useCallback } from 'react';
import { useRecords } from '../hooks/useRecords.js';
import { lookupRelease } from '../firebase/lookup.js';
import { useToast } from './ui/Toast.jsx';
import DetailModal from './ui/DetailModal.jsx';
import { colors, radius, buttonStyle } from '../styles/tokens.js';

const FORMAT_OPTIONS = ['LP', '7"', '10"', '12"', 'Box Set', 'Andere'];
const DELAY_MS = 1500; // gespreid i.v.m. API-limieten (Discogs/MusicBrainz)

// Een lp heeft baat bij aanvulling als cover, genres, jaar of tracklist ontbreken.
function needsEnrichment(r) {
  return (
    !r.coverImageUrl ||
    !(Array.isArray(r.genres) && r.genres.length > 0) ||
    !r.year ||
    !(Array.isArray(r.tracklist) && r.tracklist.length > 0)
  );
}

// Bouwt de update op met ENKEL lege velden (overschrijft niets bestaands).
function buildUpdates(r, res) {
  const u = {};
  if (!r.label && res.label) u.label = res.label;
  if (!r.year && res.year) u.year = res.year;
  if (!r.releaseYear && res.releaseYear) u.releaseYear = res.releaseYear;
  if (!r.country && res.country) u.country = res.country;
  if (!r.catalogNumber && res.catalogNumber) u.catalogNumber = res.catalogNumber;
  if (!r.barcode && res.barcode) u.barcode = res.barcode;
  if (!r.format && res.format && FORMAT_OPTIONS.includes(res.format)) u.format = res.format;
  if ((!Array.isArray(r.genres) || r.genres.length === 0) && Array.isArray(res.genres) && res.genres.length > 0) {
    u.genres = res.genres;
  }
  if ((!Array.isArray(r.tracklist) || r.tracklist.length === 0) && Array.isArray(res.tracklist) && res.tracklist.length > 0) {
    u.tracklist = res.tracklist;
  }
  if (!r.coverImageUrl && res.coverImageUrl) u.coverImageUrl = res.coverImageUrl;
  return u;
}

function paramsFor(r) {
  // Artiest/titel altijd meesturen zodat de server ambigue matches kan verifiëren.
  const extra = { artist: (r.artist || '').trim(), title: (r.title || '').trim() };
  const barcode = (r.barcode != null ? String(r.barcode) : '').trim();
  if (barcode) return { barcode, ...extra };
  if (r.catalogNumber) return { catalogNumber: String(r.catalogNumber).trim(), ...extra };
  const q = `${r.artist || ''} ${r.title || ''}`.trim();
  return q ? { query: q, ...extra } : null;
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

export default function EnrichModal({ open, onClose }) {
  const { records, updateRecord } = useRecords();
  const showToast = useToast();

  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [done, setDone] = useState(0);
  const [updated, setUpdated] = useState(0);
  const [total, setTotal] = useState(0);
  const cancelRef = useRef(false);

  const start = useCallback(async () => {
    const targets = records.filter(needsEnrichment);
    setTotal(targets.length);
    setDone(0);
    setUpdated(0);
    setFinished(false);
    setRunning(true);
    cancelRef.current = false;

    let count = 0;
    let changed = 0;
    for (const r of targets) {
      if (cancelRef.current) break;
      const params = paramsFor(r);
      if (params) {
        try {
          const res = await lookupRelease(params);
          if (res.found && res.result) {
            const updates = buildUpdates(r, res.result);
            if (Object.keys(updates).length > 0) {
              await updateRecord(r.id, updates);
              changed += 1;
              setUpdated(changed);
            }
          }
        } catch (err) {
          console.error('EnrichModal: lookup faalde voor', r.id, err);
          // ga gewoon door met de volgende
        }
      }
      count += 1;
      setDone(count);
      if (count < targets.length && !cancelRef.current) await sleep(DELAY_MS);
    }

    setRunning(false);
    setFinished(true);
    showToast(`Klaar: ${changed} lp's aangevuld.`, 'success');
  }, [records, updateRecord, showToast]);

  function handleClose() {
    cancelRef.current = true;
    setRunning(false);
    setFinished(false);
    setDone(0);
    setUpdated(0);
    setTotal(0);
    onClose();
  }

  const candidates = records.filter(needsEnrichment).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const barBg = {
    width: '100%',
    height: '8px',
    backgroundColor: colors.bgHover,
    borderRadius: radius.sm,
    overflow: 'hidden',
    margin: '14px 0 8px',
  };
  const barFill = {
    height: '100%',
    width: pct + '%',
    backgroundColor: colors.brand,
    borderRadius: radius.sm,
    transition: 'width 0.3s ease',
  };

  return (
    <DetailModal open={open} onClose={handleClose} title="Metadata aanvullen">
      {!running && !finished && (
        <div>
          <p style={{ fontSize: '14px', color: colors.textSecondary, lineHeight: 1.6 }}>
            Dit zoekt automatisch ontbrekende gegevens (cover, genres, jaar, label…) op
            voor lp's waar die nog ontbreken, op basis van barcode, catalogusnummer of
            artiest+titel. Bestaande gegevens worden <strong>nooit</strong> overschreven.
          </p>
          <p style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '10px' }}>
            {candidates} van {records.length} lp's komen in aanmerking. Dit verloopt
            gespreid (±{DELAY_MS / 1000}s per lp) om de externe diensten niet te overbelasten —
            je kunt het venster open laten staan.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button style={buttonStyle('secondary')} onClick={handleClose}>Annuleer</button>
            <button
              style={{ ...buttonStyle('primary'), opacity: candidates === 0 ? 0.5 : 1 }}
              onClick={start}
              disabled={candidates === 0}
            >
              Start ({candidates})
            </button>
          </div>
        </div>
      )}

      {(running || finished) && (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <p style={{ fontSize: '16px', fontWeight: 600, color: colors.textPrimary, marginBottom: '4px' }}>
            {finished ? 'Voltooid!' : 'Bezig met aanvullen…'}
          </p>
          <p style={{ fontSize: '14px', color: colors.textSecondary }}>
            {done} van {total} verwerkt · {updated} aangevuld
          </p>
          <div style={barBg}><div style={barFill} /></div>
          <p style={{ fontSize: '12px', color: colors.textSecondary }}>{pct}%</p>
          <div style={{ marginTop: '16px' }}>
            <button style={buttonStyle(finished ? 'primary' : 'secondary')} onClick={handleClose}>
              {finished ? 'Sluiten' : 'Stoppen'}
            </button>
          </div>
        </div>
      )}
    </DetailModal>
  );
}
