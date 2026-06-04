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

export function useWishlist() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'wishlist'),
          orderBy('addedAt', 'desc')
        );
        const snap = await getDocs(q);
        if (!cancelled) {
          setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      } catch (err) {
        console.error('useWishlist: failed to load wishlist items', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  async function addWishlistItem(data) {
    const payload = {
      ...data,
      addedAt: serverTimestamp(),
      addedBy: user ? user.uid : null,
    };
    const ref = await addDoc(collection(db, 'wishlist'), payload);
    const newItem = { id: ref.id, ...payload, addedAt: new Date() };
    setItems((prev) => [newItem, ...prev]);
    return ref.id;
  }

  async function updateWishlistItem(id, data) {
    const ref = doc(db, 'wishlist', id);
    await updateDoc(ref, data);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
  }

  async function deleteWishlistItem(id) {
    const ref = doc(db, 'wishlist', id);
    await deleteDoc(ref);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function markAsGekocht(id) {
    await updateWishlistItem(id, { status: 'gekocht' });
  }

  return {
    items,
    loading,
    addWishlistItem,
    updateWishlistItem,
    deleteWishlistItem,
    markAsGekocht,
  };
}
