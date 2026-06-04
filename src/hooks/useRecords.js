import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { useAuth } from './useAuth.jsx';

let cachedRecords = null;

function generateSearchKeywords(artist, title) {
  const text = ((artist || '') + ' ' + (title || '')).toLowerCase();
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  return [...new Set(words)];
}

function computeKpis(records) {
  let totalValue = 0;
  let darioCount = 0;
  let papaCount = 0;

  for (const r of records) {
    if (r.purchasePrice) totalValue += parseFloat(r.purchasePrice) || 0;
    const owner = (r.owner || '').toLowerCase();
    if (owner === 'dario') darioCount += 1;
    else if (owner === 'papa') papaCount += 1;
  }

  return {
    totalRecords: records.length,
    totalValue,
    darioCount,
    papaCount,
  };
}

export function useRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState(cachedRecords || []);
  const [loading, setLoading] = useState(cachedRecords === null);

  useEffect(() => {
    if (cachedRecords !== null) return;

    let cancelled = false;

    async function loadAll() {
      try {
        const q = query(
          collection(db, 'records'),
          orderBy('artistSort', 'asc')
        );
        const snap = await getDocs(q);
        if (!cancelled) {
          const loaded = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          cachedRecords = loaded;
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
  }, []);

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
