import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config.js';

export function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerUser(email, password, displayName) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  // Forceer token-refresh zodat Firestore Security Rules de nieuwe user herkent.
  // Zonder dit kan setDoc falen met permission-denied door een propagation delay.
  await credential.user.getIdToken(true);

  try {
    await setDoc(doc(db, 'users', credential.user.uid), {
      email,
      displayName,
      role: 'pending',
      createdAt: serverTimestamp(),
    });
  } catch (firestoreErr) {
    console.error('Firestore setDoc fout:', firestoreErr.code, firestoreErr.message);
    try {
      await credential.user.delete();
    } catch (deleteErr) {
      console.error('Rollback Auth mislukt:', deleteErr.code, deleteErr.message);
    }
    throw firestoreErr;
  }

  return credential;
}

export function logout() {
  return signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}
