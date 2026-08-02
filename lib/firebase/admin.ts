import * as admin from 'firebase-admin';

/**
 * The Firebase Admin SDK, initialised on first use.
 *
 * This module used to call initializeApp and admin.firestore() at import time.
 * With no service account configured that throws `Service account object must
 * contain a string "project_id" property`, and because Next evaluates every
 * route module while collecting page data, the throw failed the entire
 * production build. It only worked locally because a .env.local was present.
 *
 * Firebase is optional in this project. The default storage backend is a local
 * JSON file, so a deployment with no service account is a normal, supported
 * configuration and must not break the build.
 */

export function firebaseAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );
}

let initialised = false;

function ensureApp(): void {
  if (initialised) return;

  if (!firebaseAdminConfigured()) {
    throw new Error(
      'Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY, or use STORE_BACKEND=local.'
    );
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/['"]/g, '').replace(/\\n/g, '\n'),
      }),
    });
  }

  initialised = true;
}

/**
 * Deferred handles.
 *
 * A Proxy so `db.collection(...)` still reads naturally at every call site,
 * while nothing touches Firebase until a property is actually accessed. If it
 * is accessed without credentials, the error names the missing variables rather
 * than surfacing as an unrelated build failure.
 */
function deferred<T extends object>(get: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      ensureApp();
      const real = get();
      const value = (real as any)[prop];
      return typeof value === 'function' ? value.bind(real) : value;
    },
  });
}

const db = deferred<admin.firestore.Firestore>(() => admin.firestore());
const auth = deferred<admin.auth.Auth>(() => admin.auth());

export { db, auth };
