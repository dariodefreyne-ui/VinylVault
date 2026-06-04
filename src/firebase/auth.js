import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config.js';

export function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerUser(email, password, displayName) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  try {
    await setDoc(doc(db, 'users', credential.user.uid), {
      email,
      displayName,
      role: 'pending',
      createdAt: serverTimestamp(),
    });
  } catch (firestoreErr) {
    // Firestore schrijven mislukt — verwijder Auth account zodat gebruiker opnieuw kan proberen
    try { await credential.user.delete(); } catch (_) {}
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
