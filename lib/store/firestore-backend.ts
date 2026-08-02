/**
 * The Firestore backend.
 *
 * A thin adapter over the admin SDK so the rest of the app never imports
 * Firebase directly and can be pointed at the local file store instead.
 */

import { db as adminDb } from '@/lib/firebase/admin';
import type { StoreBackend, StoredDoc } from './index';

export function firestoreBackend(): StoreBackend {
  return {
    name: 'firestore',

    async list(collection) {
      const snap = await adminDb.collection(collection).get();
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as StoredDoc);
    },

    async get(collection, id) {
      const snap = await adminDb.collection(collection).doc(id).get();
      return snap.exists ? ({ id: snap.id, ...snap.data() } as StoredDoc) : null;
    },

    async add(collection, data) {
      const ref = await adminDb.collection(collection).add(data);
      return ref.id;
    },

    async update(collection, id, patch) {
      await adminDb.collection(collection).doc(id).update(patch);
    },

    async remove(collection, id) {
      await adminDb.collection(collection).doc(id).delete();
    },

    async removeWhere(collection, predicate) {
      const snap = await adminDb.collection(collection).get();
      const doomed = snap.docs.filter((d) => predicate({ id: d.id, ...d.data() } as StoredDoc));
      if (doomed.length === 0) return 0;

      // Firestore batches cap at 500 operations.
      for (let i = 0; i < doomed.length; i += 450) {
        const batch = adminDb.batch();
        doomed.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }

      return doomed.length;
    },
  };
}
