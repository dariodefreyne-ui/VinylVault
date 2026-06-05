import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { useAuth } from './useAuth.jsx';

/**
 * Beheert collectionGrants: wie toegang heeft tot wiens (private) collectie.
 *
 * grant-document:
 *   granterUid: wie geeft toegang
 *   granteeUid: wie krijgt toegang
 *   canRead: true
 *   canWrite: false
 *   grantedAt: timestamp
 */
export function useGrants() {
  const { user } = useAuth();
  const uid = user?.uid;

  // Grants die IK heb uitgedeeld (granterUid == mij)
  const [granted, setGranted] = useState([]);
  // Grants die IK heb ontvangen (granteeUid == mij)
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const grantsRef = collection(db, 'collectionGrants');
      const [grantedSnap, receivedSnap] = await Promise.all([
        getDocs(query(grantsRef, where('granterUid', '==', uid))),
        getDocs(query(grantsRef, where('granteeUid', '==', uid))),
      ]);
      setGranted(grantedSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setReceived(receivedSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('useGrants: failed to load grants', err);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    load();
  }, [load]);

  async function grantAccess(granteeUid) {
    if (!uid || !granteeUid || granteeUid === uid) return;
    if (granted.some((g) => g.granteeUid === granteeUid)) return;
    const ref = await addDoc(collection(db, 'collectionGrants'), {
      granterUid: uid,
      granteeUid,
      canRead: true,
      canWrite: false,
      grantedAt: serverTimestamp(),
    });
    setGranted((prev) => [
      ...prev,
      { id: ref.id, granterUid: uid, granteeUid, canRead: true, canWrite: false },
    ]);
  }

  async function revokeAccess(granteeUid) {
    const target = granted.find((g) => g.granteeUid === granteeUid);
    if (!target) return;
    await deleteDoc(doc(db, 'collectionGrants', target.id));
    setGranted((prev) => prev.filter((g) => g.id !== target.id));
  }

  return { granted, received, loading, grantAccess, revokeAccess, reload: load };
}

/**
 * Mag de huidige gebruiker de collectie van `owner` bekijken?
 * Publieke collecties: altijd. Private: enkel de eigenaar of wie een grant kreeg.
 */
export function canViewCollection(owner, myUid, receivedGrants = []) {
  if (!owner) return false;
  if (owner.id === myUid) return true;
  if ((owner.collectionVisibility || 'public') !== 'private') return true;
  return receivedGrants.some((g) => g.granterUid === owner.id && g.canRead);
}
