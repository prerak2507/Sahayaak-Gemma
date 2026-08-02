/**
 * Where reports are stored.
 *
 * Two backends behind one interface:
 *
 *   firestore  used when Firebase credentials are present
 *   local      a JSON file under .data/, used when they are not
 *
 * The local backend exists for three reasons, all of which bit us:
 *
 *  1. A judge cloning this repository has no Firebase project. Without a local
 *     backend they get a blank app and no way to try it, which is the worst
 *     possible outcome for a submission that has to be runnable.
 *  2. Firestore's free tier bills a read per document. Polling dashboards
 *     exhausted the daily quota during development, and when that happens every
 *     screen empties at once with no warning.
 *  3. The whole point of running Gemma locally is that the system works with no
 *     network. Keeping the database in the cloud undercut that claim. With the
 *     local backend, Sahaayak genuinely runs with the wifi off.
 *
 * Firestore stays the default when configured, because that is what a real
 * deployment would use.
 */

import { firestoreBackend } from './firestore-backend';
import { localBackend } from './local-backend';

export interface StoredDoc {
  id: string;
  [key: string]: unknown;
}

/**
 * Anything object-shaped. Deliberately looser than Record<string, unknown>,
 * which typed interfaces such as NeedDocument do not satisfy because they have
 * no index signature.
 */
export type Storable = object;

export interface StoreBackend {
  readonly name: 'firestore' | 'local';
  list(collection: string): Promise<StoredDoc[]>;
  get(collection: string, id: string): Promise<StoredDoc | null>;
  add(collection: string, data: Storable): Promise<string>;
  update(collection: string, id: string, patch: Storable): Promise<void>;
  remove(collection: string, id: string): Promise<void>;
  removeWhere(collection: string, predicate: (doc: StoredDoc) => boolean): Promise<number>;
}

function hasFirebaseCredentials(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );
}

let resolved: StoreBackend | null = null;

/**
 * The active backend.
 *
 * Set STORE_BACKEND=local to force the file store even with Firebase
 * configured, which is how you run a demo that cannot be broken by a quota.
 */
export function store(): StoreBackend {
  if (resolved) return resolved;

  const forced = process.env.STORE_BACKEND;

  if (forced === 'local' || (!forced && !hasFirebaseCredentials())) {
    resolved = localBackend();
    console.log('[store] using the local file backend (.data/). No Firebase required.');
  } else {
    resolved = firestoreBackend();
    console.log('[store] using Firestore.');
  }

  return resolved;
}

/** Which backend is serving, for the health endpoint and the UI badge. */
export function storeName(): 'firestore' | 'local' {
  return store().name;
}
