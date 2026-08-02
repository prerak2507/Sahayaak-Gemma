/**
 * A JSON file store.
 *
 * Deliberately unsophisticated. It holds a few hundred civic reports for a demo
 * or a single-ward pilot, and nothing about this project needs more than that.
 *
 * Two things about running this on a serverless host, both learned the hard way
 * on Vercel:
 *
 *  1. **The bundle directory is read only.** Writing to `.data/` under the
 *     project root fails with `ENOENT: mkdir '/var/task/.data'`. Only `/tmp` is
 *     writable, so that is where the data goes when a serverless environment is
 *     detected.
 *  2. **`/tmp` is per instance and does not survive a cold start.** So a board
 *     seeded by one request can be invisible to the next, which makes a demo
 *     look broken at random. To make that survivable, an empty collection is
 *     transparently filled from the committed fixture on first read. Every cold
 *     instance therefore serves a complete board without anybody having to
 *     re-seed it.
 *
 * Writes are serialised through a promise chain, because two requests landing
 * together would otherwise interleave a read-modify-write and lose one.
 *
 * If this ever needs to outgrow a file, StoreBackend is the seam: write a
 * Postgres backend and change one line in lib/store/index.ts.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import type { StoreBackend, StoredDoc } from './index';

/** Vercel and most serverless runtimes only allow writes under /tmp. */
const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

const DATA_DIR = IS_SERVERLESS
  ? path.join(os.tmpdir(), 'sahaayak-data')
  : path.join(process.cwd(), '.data');

type Collections = Record<string, StoredDoc[]>;

let cache: Collections | null = null;
let cachedMtime: Record<string, number> = {};
let writeChain: Promise<unknown> = Promise.resolve();

function filePath(collection: string): string {
  // Collection names come from our own code, never from a request, but strip
  // anything path-like regardless.
  const safe = collection.replace(/[^a-z0-9_-]/gi, '');
  return path.join(DATA_DIR, `${safe}.json`);
}

/**
 * Stable ids for seeded records.
 *
 * These must be deterministic, and it is not a cosmetic point. Seeded rows were
 * originally given randomUUID()s, which meant every serverless instance
 * generated a different set. The browser would read the board from one instance
 * and then PATCH a report by id against another, which had never heard of that
 * id, so every write returned 404. The officer dashboard's bulk assign appeared
 * completely broken for exactly this reason.
 *
 * Deriving the id from position makes a seeded record the same record
 * everywhere, so a change made against one instance is at least addressed to
 * the right row.
 */
function seedId(prefix: string, index: number): string {
  return `${prefix}-${String(index).padStart(3, '0')}`;
}

/**
 * Seed content for a collection that has never been written.
 *
 * The reports fixture is the output of a real Gemma run, committed so a cold
 * serverless instance can serve a full board immediately. Loaded lazily so a
 * local install with real data never pays for it.
 */
async function fixtureFor(collection: string): Promise<StoredDoc[]> {
  if (collection === 'needs') {
    const { default: rows } = await import('@/lib/data/fixtures/seeded-board.json');
    const now = Date.now();
    return (rows as Array<Record<string, unknown>>).map((row, i) => {
      // Spread ages over the last two days so the board reads as a live
      // backlog rather than a batch stamped at one instant.
      const ageMinutes = 5 + Math.round((i / Math.max(rows.length - 1, 1)) * 2800);
      const at = new Date(now - ageMinutes * 60000).toISOString();
      return { id: seedId('need', i), ...row, created_at: at, updated_at: at, seed_mode: 'prebuilt' };
    });
  }

  if (collection === 'volunteers') {
    const { DEMO_VOLUNTEERS, buildVolunteer } = await import('@/lib/data/volunteers');
    return DEMO_VOLUNTEERS.map((v, i) => ({ id: seedId('vol', i), ...buildVolunteer(v) }));
  }

  return [];
}

async function loadCollection(collection: string): Promise<StoredDoc[]> {
  cache ??= {};

  let mtime = 0;
  let exists = true;
  try {
    mtime = (await fs.stat(filePath(collection))).mtimeMs;
  } catch {
    exists = false;
  }

  if (cache[collection] && cachedMtime[collection] === mtime && exists) {
    return cache[collection];
  }

  if (exists) {
    try {
      const loaded: StoredDoc[] = JSON.parse(await fs.readFile(filePath(collection), 'utf8'));

      // Top up rather than only filling an empty collection.
      //
      // On a serverless host /tmp can survive between deployments, so an
      // instance may hold a file written by an older build: a couple of rows
      // and none of the seeded board. Because the file existed, the seed was
      // skipped, and every write addressed to a seeded id returned 404 from
      // that instance while reads from a fresh instance looked fine. Merging
      // the fixture in when its rows are absent makes any instance serve the
      // same board.
      const needsSeed =
        (IS_SERVERLESS || process.env.STORE_AUTOSEED === 'true') &&
        !loaded.some((r) => (r as any).seed_mode === 'prebuilt');

      if (needsSeed) {
        const seeded = await fixtureFor(collection);
        if (seeded.length > 0) {
          const have = new Set(loaded.map((r) => r.id));
          cache[collection] = [...seeded.filter((r) => !have.has(r.id)), ...loaded];
          await persist(collection);
          return cache[collection];
        }
      }

      cache[collection] = loaded;
      cachedMtime[collection] = mtime;
      return cache[collection];
    } catch {
      // Fall through to the fixture on a corrupt file.
    }
  }

  // Nothing on disk. On a serverless host, fill from the fixture so a cold
  // instance is not blank.
  //
  // Only there. Locally an empty collection must stay empty, otherwise the real
  // seeder cannot start from a clean board: it deletes the old rows, and the
  // very next read would put the fixture straight back.
  if (!cache[collection] && (IS_SERVERLESS || process.env.STORE_AUTOSEED === 'true')) {
    const seeded = await fixtureFor(collection);
    cache[collection] = seeded;
    if (seeded.length > 0) {
      try {
        await flush(collection);
        cachedMtime[collection] = (await fs.stat(filePath(collection))).mtimeMs;
      } catch (error) {
        // Even a read-only filesystem is survivable: the data stays in memory
        // for the life of this instance.
        console.warn('[store] could not persist the seeded board:', (error as Error).message);
      }
    }
  }

  cache[collection] ??= [];
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

/** Persist, tolerating a read-only filesystem by keeping the change in memory. */
async function persist(collection: string): Promise<void> {
  try {
    await flush(collection);
    cachedMtime[collection] = (await fs.stat(filePath(collection))).mtimeMs;
  } catch (error) {
    console.warn('[store] write not persisted to disk:', (error as Error).message);
  }
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
        await persist(collection);
        return id;
      });
    },

    async update(collection, id, patch) {
      return queue(async () => {
        const rows = await loadCollection(collection);
        const index = rows.findIndex((r) => r.id === id);
        if (index === -1) throw new Error(`No document ${id} in ${collection}`);
        rows[index] = { ...rows[index], ...patch };
        await persist(collection);
      });
    },

    async remove(collection, id) {
      return queue(async () => {
        const rows = await loadCollection(collection);
        const index = rows.findIndex((r) => r.id === id);
        if (index !== -1) {
          rows.splice(index, 1);
          await persist(collection);
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
          await persist(collection);
        }
        return removed;
      });
    },
  };
}
