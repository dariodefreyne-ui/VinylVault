import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { useAuth } from './useAuth.jsx';

let cachedRecords = null;
let cachedForUid = null;

function generateSearchKeywords(artist, title) {
  const text = ((artist || '') + ' ' + (title || '')).toLowerCase();
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  return [...new Set(words)];
}

function computeKpis(records) {
  let totalValue = 0;
  for (const r of records) {
    const qty = Number(r.quantity) || 1;
    totalValue += (parseFloat(r.purchasePrice) || 0) * qty;
  }
  return {
    totalRecords: records.length,
    totalValue,
  };
}

export function invalidateRecordsCache() {
  cachedRecords = null;
  cachedForUid = null;
}

export function useRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState(cachedRecords || []);
  const [loading, setLoading] = useState(cachedRecords === null);

  useEffect(() => {
    const currentUid = user?.uid ?? null;
    if (cachedRecords !== null && cachedForUid === currentUid) return;

    // User switched — clear stale cache from previous session.
    if (cachedForUid !== currentUid) {
      cachedRecords = null;
      cachedForUid = currentUid;
      setRecords([]);
      setLoading(true);
    }

    if (!currentUid) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadAll() {
      try {
        // Geen orderBy — records zonder artistSort (bijv. ouder of geïmporteerd) worden anders uitgesloten.
        // Sortering gebeurt client-side zodat ook records zonder artistSort zichtbaar zijn.
        const snap = await getDocs(collection(db, 'records'));
        if (!cancelled) {
          const loaded = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          loaded.sort((a, b) => {
            const ka = a.artistSort || (a.artist || '').toLowerCase().replace(/^the\s+/i, '');
            const kb = b.artistSort || (b.artist || '').toLowerCase().replace(/^the\s+/i, '');
            return ka.localeCompare(kb);
          });
          cachedRecords = loaded;
          cachedForUid = currentUid;
          setRecords(loaded);
          setLoading(false);
        }
      } catch (err) {
        console.error('useRecords: failed to load records', err);
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function addRecord(data) {
    const keywords = generateSearchKeywords(data.artist, data.title);
    const artistSort = (data.artist || '').toLowerCase().replace(/^the\s+/i, '');
    const payload = {
      ...data,
      artistSort,
      searchKeywords: keywords,
      dateAdded: serverTimestamp(),
      addedBy: user ? user.uid : null,
    };
    const ref = await addDoc(collection(db, 'records'), payload);
    const newRecord = { id: ref.id, ...payload, dateAdded: new Date() };
    const next = [...(cachedRecords || []), newRecord].sort((a, b) =>
      (a.artistSort || '').localeCompare(b.artistSort || '')
    );
    cachedRecords = next;
    setRecords(next);
    return ref.id;
  }

  async function updateRecord(id, data) {
    const ref = doc(db, 'records', id);
    await updateDoc(ref, data);
    const next = (cachedRecords || []).map((r) => (r.id === id ? { ...r, ...data } : r));
    cachedRecords = next;
    setRecords(next);
  }

  async function deleteRecord(id) {
    const ref = doc(db, 'records', id);
    await deleteDoc(ref);
    const next = (cachedRecords || []).filter((r) => r.id !== id);
    cachedRecords = next;
    setRecords(next);
  }

  const kpis = computeKpis(records);

  return {
    records,
    loading,
    addRecord,
    updateRecord,
    deleteRecord,
    kpis,
  };
}
