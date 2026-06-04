import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase/config.js';
import { useAuth } from './useAuth.jsx';

export function useAdmin() {
  useAuth(); // ensure we're in auth context
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'users'));
        if (!cancelled) {
          const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

          // Sort: pending first, then by createdAt ascending
          all.sort((a, b) => {
            const aPending = a.role === 'pending' ? 0 : 1;
            const bPending = b.role === 'pending' ? 0 : 1;
            if (aPending !== bPending) return aPending - bPending;
            const aTime =
              a.createdAt && a.createdAt.toMillis
                ? a.createdAt.toMillis()
                : 0;
            const bTime =
              b.createdAt && b.createdAt.toMillis
                ? b.createdAt.toMillis()
                : 0;
            return aTime - bTime;
          });

          setUsers(all);
        }
      } catch (err) {
        console.error('useAdmin: failed to load users', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  async function updateUserRole(uid, newRole) {
    const ref = doc(db, 'users', uid);
    await updateDoc(ref, { role: newRole });
    setUsers((prev) =>
      prev.map((u) => (u.id === uid ? { ...u, role: newRole } : u))
    );
  }

  async function deleteUser(uid) {
    const ref = doc(db, 'users', uid);
    await deleteDoc(ref);
    setUsers((prev) => prev.filter((u) => u.id !== uid));

    try {
      const functions = getFunctions();
      const deleteAuthUserFn = httpsCallable(functions, 'deleteAuthUser');
      await deleteAuthUserFn({ uid });
    } catch (err) {
      console.error('useAdmin: failed to delete Firebase Auth account', err);
    }
  }

  return { users, loading, updateUserRole, deleteUser };
}
