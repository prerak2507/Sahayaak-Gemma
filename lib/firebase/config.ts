import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

/**
 * The browser-side Firebase handle.
 *
 * Note the placeholder values below, because they are load-bearing.
 *
 * This module used to pass the raw environment variables straight to
 * initializeApp. With none configured, apiKey is undefined, and getAuth then
 * throws `auth/invalid-api-key` at import time. Next evaluates every route
 * module while collecting page data, so that single throw failed the whole
 * production build with a message pointing at an unrelated API route. It only
 * ever worked locally because a .env.local happened to be present.
 *
 * Substituting syntactically valid placeholders lets the SDK construct without
 * complaint. Calls made against it fail at the network, which is exactly what
 * already happens when the security rules deny a read, and every subscription
 * in the app has an error handler for that case.
 *
 * This is deliberately forgiving because Firebase is optional here. The app
 * defaults to the local file store and the server never uses this module.
 */

/** True when a real Firebase project is configured. */
export const firebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);

/** True when the server is using the local file store, so Firestore holds nothing. */
export const usingLocalStore = process.env.NEXT_PUBLIC_STORE_BACKEND === 'local';

const firebaseConfig = {
  // Placeholders keep the SDK constructible when nothing is configured.
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'not-configured',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'not-configured.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'not-configured',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'not-configured.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000000000',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

if (!firebaseConfigured && typeof window !== 'undefined') {
  console.info('[firebase] not configured; the app is using the local store.');
}

export { app, db, auth, storage };
