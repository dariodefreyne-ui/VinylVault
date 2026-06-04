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
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { useAuth } from './useAuth.jsx';

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
    if (r.price) totalValue += parseFloat(r.price) || 0;
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
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'records'),
          orderBy('artistSort', 'asc')
        );
        const snap = await getDocs(q);
        if (!cancelled) {
          setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      } catch (err) {
        console.error('useRecords: failed to load records', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadRecentRecords(n) {
    const q = query(
      collection(db, 'records'),
      orderBy('dateAdded', 'desc'),
      limit(n)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

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
    setRecords((prev) =>
      [...prev, newRecord].sort((a, b) =>
        (a.artistSort || '').localeCompare(b.artistSort || '')
      )
    );
    return ref.id;
  }

  async function updateRecord(id, data) {
    const ref = doc(db, 'records', id);
    await updateDoc(ref, data);
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...data } : r))
    );
  }

  async function deleteRecord(id) {
    const ref = doc(db, 'records', id);
    await deleteDoc(ref);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }

  const kpis = computeKpis(records);

  return {
    records,
    loading,
    loadRecentRecords,
    addRecord,
    updateRecord,
    deleteRecord,
    kpis,
  };
}
