import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

/**
 * The browser-side Firebase handle.
 *
 * Note for anyone reading this expecting the app to depend on it: it mostly
 * does not. Every screen that matters reads through /api, where the server owns
 * the storage backend, so this client exists only for a handful of legacy
 * subscriptions that have not been rewritten yet.
 *
 * Those subscriptions will fail when the project's rules deny client reads, or
 * when STORE_BACKEND=local means there is no Firestore data at all. That is
 * expected and harmless, provided each one passes an error callback. See
 * lib/firebase/safe-snapshot.ts.
 */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

/** True when the server is using the local file store, so Firestore holds nothing. */
export const usingLocalStore = process.env.NEXT_PUBLIC_STORE_BACKEND === 'local';

export { app, db, auth, storage };
