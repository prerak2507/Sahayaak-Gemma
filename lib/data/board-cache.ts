/**
 * A short-lived server-side cache over the reports board.
 *
 * Why this exists, written down so nobody removes it:
 *
 * Firestore bills a read per document, not per query. /api/needs and /api/stats
 * both read the whole collection, and several screens poll them. With twenty
 * reports and three screens open, that is a few thousand document reads an hour
 * doing nothing but redrawing the same numbers. On the free tier that exhausts
 * the daily quota in an afternoon, and when it does, every screen goes blank at
 * once. That happened during development and would have happened during a demo.
 *
 * Ten seconds of staleness is invisible on a municipal board and removes almost
 * all of the traffic. One fetch serves every caller in that window, including
 * concurrent ones, because the in-flight promise is shared rather than the
 * result.
 *
 * Any write invalidates immediately, so a change is never hidden behind the
 * cache. That matters more than the freshness window: an officer who moves a
 * ticket must see it move.
 */

import { store } from '@/lib/store';
import { scopeToCity, type NeedDocument } from './needs';

const TTL_MS = Number(process.env.BOARD_CACHE_TTL_MS) || 10_000;

type BoardRow = Partial<NeedDocument> & { id: string };

let cachedAt = 0;
let cached: BoardRow[] | null = null;
/** Shared so ten simultaneous requests cause one read, not ten. */
let inFlight: Promise<BoardRow[]> | null = null;

async function readBoard(): Promise<BoardRow[]> {
  const rows = await store().list('needs');
  return scopeToCity(rows as BoardRow[]);
}

/**
 * The reports board, at most `TTL_MS` old.
 * Throws if Firestore is unreachable and nothing is cached, so callers can
 * surface a real error rather than an empty board.
 */
export async function getBoard(): Promise<BoardRow[]> {
  const now = Date.now();

  if (cached && now - cachedAt < TTL_MS) return cached;
  if (inFlight) return inFlight;

  inFlight = readBoard()
    .then((rows) => {
      cached = rows;
      cachedAt = Date.now();
      return rows;
    })
    .catch((error) => {
      // Serve stale rather than blank when the quota is spent or the network
      // drops. A board that is a minute old beats a board that says zero.
      if (cached) {
        console.warn('[board-cache] read failed, serving stale data:', error?.message ?? error);
        return cached;
      }
      throw error;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/** Call after any write so the next read reflects it immediately. */
export function invalidateBoard(): void {
  cachedAt = 0;
  cached = null;
}

/** For the health endpoint: how old the served data is, in ms. */
export function boardCacheAge(): number | null {
  return cached ? Date.now() - cachedAt : null;
}
