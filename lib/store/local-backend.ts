/**
 * A JSON file store.
 *
 * Deliberately unsophisticated. It holds a few hundred civic reports for a demo
 * or a single-ward pilot, and nothing about this project needs more than that.
 * Everything is kept in memory and flushed to disk on write, so reads cost
 * nothing and there is no quota to exhaust.
 *
 * Writes are serialised through a promise chain, because two requests landing
 * together would otherwise interleave a read-modify-write and lose one of them.
 * That is the only concurrency this file worries about, which is appropriate for
 * a single Node process.
 *
 * If this ever needs to outgrow a file, the StoreBackend interface is the seam:
 * write a Postgres backend and change one line in lib/store/index.ts.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { StoreBackend, StoredDoc } from './index';

const DATA_DIR = path.join(process.cwd(), '.data');

type Collections = Record<string, StoredDoc[]>;

let cache: Collections | null = null;
/**
 * Modification time of the file each cached collection was read from.
 *
 * The in-memory copy must be invalidated when the file changes underneath it.
 * Next.js can hold more than one module instance in development, so a write
 * made while serving one route would otherwise be invisible to another: the
 * seeder wrote eighteen reports to disk and the dashboard kept serving the
 * empty array it had cached before the seed.
 */
let cachedMtime: Record<string, number> = {};
let writeChain: Promise<unknown> = Promise.resolve();

function filePath(collection: string): string {
  // Collection names come from our own code, never from a request, but strip
  // anything path-like regardless.
  const safe = collection.replace(/[^a-z0-9_-]/gi, '');
  return path.join(DATA_DIR, `${safe}.json`);
}

async function loadCollection(collection: string): Promise<StoredDoc[]> {
  cache ??= {};

  let mtime = 0;
  try {
    mtime = (await fs.stat(filePath(collection))).mtimeMs;
  } catch {
    // No file yet.
  }

  if (cache[collection] && cachedMtime[collection] === mtime) {
    return cache[collection];
  }

  try {
    const raw = await fs.readFile(filePath(collection), 'utf8');
    cache[collection] = JSON.parse(raw);
  } catch {
    // A missing file is an empty collection, not an error.
    cache[collection] = [];
  }

  cachedMtime[collection] = mtime;
  return cache[collection];
}

async function flush(collection: string): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    filePath(collection),
    JSON.stringify(cache?.[collection] ?? [], null, 2),
    'utf8'
  );
}

/** Serialises writes so concurrent requests cannot lose each other's changes. */
function queue<T>(work: () => Promise<T>): Promise<T> {
  const next = writeChain.then(work, work);
  writeChain = next.catch(() => undefined);
  return next;
}

export function localBackend(): StoreBackend {
  return {
    name: 'local',

    async list(collection) {
      return [...(await loadCollection(collection))];
    },

    async get(collection, id) {
      const rows = await loadCollection(collection);
      return rows.find((r) => r.id === id) ?? null;
    },

    async add(collection, data) {
      return queue(async () => {
        const rows = await loadCollection(collection);
        const id = randomUUID();
        rows.push({ id, ...data });
        await flush(collection);
        return id;
      });
    },

    async update(collection, id, patch) {
      return queue(async () => {
        const rows = await loadCollection(collection);
        const index = rows.findIndex((r) => r.id === id);
        if (index === -1) throw new Error(`No document ${id} in ${collection}`);
        rows[index] = { ...rows[index], ...patch };
        await flush(collection);
      });
    },

    async remove(collection, id) {
      return queue(async () => {
        const rows = await loadCollection(collection);
        const index = rows.findIndex((r) => r.id === id);
        if (index !== -1) {
          rows.splice(index, 1);
          await flush(collection);
        }
      });
    },

    async removeWhere(collection, predicate) {
      return queue(async () => {
        const rows = await loadCollection(collection);
        const keep = rows.filter((r) => !predicate(r));
        const removed = rows.length - keep.length;
        if (removed > 0) {
          cache![collection] = keep;
          await flush(collection);
        }
        return removed;
      });
    },
  };
}
