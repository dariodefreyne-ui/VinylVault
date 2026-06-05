import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../firebase/config.js';
import { invalidateRecordsCache } from '../../hooks/useRecords.js';
import { useToast } from '../ui/Toast.jsx';
import { colors, radius, buttonStyle } from '../../styles/tokens.js';

// Beheert de 'owner'-labels die op records staan. Er is GEEN aparte eigenaars-
// collectie — een eigenaar is enkel het tekstveld `owner` op plaat-documenten.
// Hier kun je een eigenaar hernoemen (samenvoegen) of al zijn platen verwijderen.
async function commitInChunks(ids, apply) {
  const CHUNK = 400;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const batch = writeBatch(db);
    for (const id of ids.slice(i, i + CHUNK)) apply(batch, doc(db, 'records', id));
    await batch.commit();
  }
}

export default function OwnerManager() {
  const showToast = useToast();
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [renameValue, setRenameValue] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null); // lowercased key

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'records'));
      const map = new Map();
      snap.forEach((d) => {
        const o = (d.data().owner || '').trim();
        if (!o) return;
        const key = o.toLowerCase();
        if (!map.has(key)) map.set(key, { key, label: o, count: 0, ids: [] });
        const e = map.get(key);
        e.count += 1;
        e.ids.push(d.id);
      });
      setOwners([...map.values()].sort((a, b) => a.label.localeCompare(b.label, 'nl', { sensitivity: 'base' })));
    } catch (err) {
      console.error('OwnerManager: load failed', err);
      showToast('Kon eigenaars niet laden.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  async function rename(entry) {
    const newLabel = (renameValue[entry.key] || '').trim();
    if (!newLabel) { showToast('Geef een nieuwe naam in.', 'error'); return; }
    if (newLabel.toLowerCase() === entry.key) { showToast('Naam is ongewijzigd.', 'error'); return; }
    setBusy(entry.key);
    try {
      await commitInChunks(entry.ids, (batch, ref) => batch.update(ref, { owner: newLabel }));
      invalidateRecordsCache();
      showToast(`${entry.count} lp's hernoemd naar "${newLabel}".`, 'success');
      setRenameValue((p) => ({ ...p, [entry.key]: '' }));
      await load();
    } catch (err) {
      console.error('OwnerManager: rename failed', err);
      showToast('Fout bij hernoemen.', 'error');
    } finally {
      setBusy('');
    }
  }

  async function remove(entry) {
    setBusy(entry.key);
    try {
      await commitInChunks(entry.ids, (batch, ref) => batch.delete(ref));
      invalidateRecordsCache();
      showToast(`${entry.count} lp's van "${entry.label}" verwijderd.`, 'success');
      setConfirmDelete(null);
      await load();
    } catch (err) {
      console.error('OwnerManager: delete failed', err);
      showToast('Fout bij verwijderen.', 'error');
    } finally {
      setBusy('');
    }
  }

  const inputStyle = {
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: radius.sm,
    padding: '7px 10px',
    color: colors.textPrimary,
    fontSize: '13px',
    outline: 'none',
    width: '150px',
  };

  return (
    <div style={{ marginTop: '36px' }}>
      <div style={{ fontSize: '16px', fontWeight: 700, color: colors.textPrimary, marginBottom: '4px' }}>
        Eigenaars beheren
      </div>
      <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '16px', lineHeight: 1.6 }}>
        Een "eigenaar" is geen apart account, maar het veld <code>owner</code> op de platen.
        Hier kun je een eigenaar <strong>hernoemen</strong> (alle platen krijgen de nieuwe naam —
        handig om bv. "dario" samen te voegen met je gebruikersnaam) of <strong>al zijn platen
        verwijderen</strong>.
      </div>

      {loading ? (
        <div style={{ fontSize: '13px', color: colors.textSecondary }}>Laden…</div>
      ) : owners.length === 0 ? (
        <div style={{ fontSize: '13px', color: colors.textSecondary }}>Geen platen/eigenaars gevonden.</div>
      ) : (
        owners.map((entry) => (
          <div
            key={entry.key}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
              padding: '12px 0', borderBottom: `1px solid ${colors.borderColor}`,
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary, minWidth: '120px' }}>
              {entry.label}
            </span>
            <span style={{ fontSize: '12px', color: colors.textSecondary, minWidth: '70px' }}>
              {entry.count} lp{entry.count !== 1 ? "'s" : ''}
            </span>

            <input
              style={inputStyle}
              placeholder="nieuwe naam…"
              value={renameValue[entry.key] || ''}
              onChange={(e) => setRenameValue((p) => ({ ...p, [entry.key]: e.target.value }))}
              disabled={busy === entry.key}
            />
            <button
              style={{ ...buttonStyle('secondary'), opacity: busy === entry.key ? 0.6 : 1 }}
              onClick={() => rename(entry)}
              disabled={busy === entry.key}
            >
              Hernoem
            </button>

            {confirmDelete === entry.key ? (
              <>
                <span style={{ fontSize: '12px', color: colors.accentRed }}>Zeker?</span>
                <button
                  style={{ ...buttonStyle('danger'), opacity: busy === entry.key ? 0.6 : 1 }}
                  onClick={() => remove(entry)}
                  disabled={busy === entry.key}
                >
                  {busy === entry.key ? 'Bezig…' : `Ja, verwijder ${entry.count}`}
                </button>
                <button style={buttonStyle('ghost')} onClick={() => setConfirmDelete(null)} disabled={busy === entry.key}>
                  Annuleer
                </button>
              </>
            ) : (
              <button style={buttonStyle('danger')} onClick={() => setConfirmDelete(entry.key)} disabled={!!busy}>
                Verwijder
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
