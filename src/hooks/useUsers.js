import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { useAuth } from './useAuth.jsx';

// Module-level cache zodat de lijst niet bij elke pagina opnieuw geladen wordt.
let cachedUsers = null;

export function invalidateUsersCache() {
  cachedUsers = null;
}

/**
 * Laadt de lichte lijst van alle gebruikers (id, displayName, collectionLabel,
 * collectionVisibility, role). Gebruikt voor owner-selectors, profielen en
 * collectie-browsing. Vereist dat de Firestore-rules activated users toelaten
 * om users te lezen.
 */
export function useUsers() {
  const { role } = useAuth();
  const [users, setUsers] = useState(cachedUsers || []);
  const [loading, setLoading] = useState(cachedUsers === null);

  useEffect(() => {
    if (cachedUsers !== null) return;
    let cancelled = false;

    async function load() {
      try {
        const snap = await getDocs(collection(db, 'users'));
        if (cancelled) return;
        const loaded = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        cachedUsers = loaded;
        setUsers(loaded);
      } catch (err) {
        console.error('useUsers: failed to load users', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // role in deps: zodra de gebruiker geactiveerd is mag hij de lijst lezen.
  }, [role]);

  return { users, loading };
}
