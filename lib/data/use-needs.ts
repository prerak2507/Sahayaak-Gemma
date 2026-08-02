'use client';

/**
 * The client-side read of the reports board.
 *
 * Every dashboard used to open its own Firestore subscription from the browser.
 * That fails: the project's security rules deny client reads, so every screen
 * rendered zeroes while the database was full. The demo sign-in is a local
 * profile rather than a real Firebase session, so being "logged in" does not
 * help either.
 *
 * Reading through the server fixes it without weakening any rule. The admin SDK
 * reads, /api/needs decides what is exposed, and the browser never holds a
 * database credential. Polling replaces the live subscription, which is a fair
 * trade for a board that changes a few times a minute.
 *
 * A repo-level firestore.rules is provided if you would rather grant client
 * reads directly. This hook keeps working either way.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface BoardNeed {
  id: string;
  title: string;
  summary: string;
  summary_native: string;
  description_lang: string;
  category: string;
  assignment_type: 'government' | 'ngo';
  assigned_department: string | null;
  status: string;
  urgency_score: number;
  city: string | null;
  ward: string | null;
  location_lat: number | null;
  location_lng: number | null;
  needs_location_pin: boolean;
  assigned_worker_name: string | null;
  assigned_worker_title: string | null;
  ai_validated: boolean;
  ai_model: string | null;
  upvotes: number;
  photo_urls: string[];
  created_at: string | null;
}

export interface UseNeedsOptions {
  /** 'government', 'ngo' or 'all'. Defaults to everything. */
  assignment?: 'government' | 'ngo' | 'all';
  limit?: number;
  /** Poll interval in ms. Set 0 to fetch once. */
  refreshMs?: number;
}

export interface UseNeedsResult {
  needs: BoardNeed[];
  isLoading: boolean;
  /** Set when the board could not be read. Screens should say so, not show zero. */
  error: string | null;
  refresh: () => void;
}

/**
 * Loads the reports board.
 *
 * `error` is deliberately distinct from an empty list. A screen that cannot
 * reach the server must say so rather than draw an empty state, because "no
 * reports" and "we could not check" mean very different things to an officer.
 */
export function useNeeds(options: UseNeedsOptions = {}): UseNeedsResult {
  const { assignment = 'all', limit = 300, refreshMs = 60000 } = options;

  const [needs, setNeeds] = useState<BoardNeed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelled = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/needs?assignment=${assignment}&limit=${limit}`);
      if (!res.ok) throw new Error(`The reports board returned ${res.status}`);
      const body = await res.json();
      if (cancelled.current) return;
      setNeeds(body.needs ?? []);
      setError(null);
    } catch (err) {
      if (cancelled.current) return;
      const message = err instanceof Error ? err.message : String(err);
      console.error('[useNeeds] could not load the board:', message);
      setError(message);
    } finally {
      if (!cancelled.current) setIsLoading(false);
    }
  }, [assignment, limit]);

  useEffect(() => {
    cancelled.current = false;
    load();

    if (!refreshMs) return () => { cancelled.current = true; };

    const timer = setInterval(load, refreshMs);
    return () => {
      cancelled.current = true;
      clearInterval(timer);
    };
  }, [load, refreshMs]);

  return { needs, isLoading, error, refresh: load };
}

/** Counts a board the same way /api/stats does, for screens that already hold the list. */
export function summariseBoard(needs: BoardNeed[]) {
  const closed = new Set(['completed', 'closed', 'resolved']);
  const open = needs.filter((n) => !closed.has(n.status));

  return {
    total: needs.length,
    open: open.length,
    resolved: needs.length - open.length,
    critical: open.filter((n) => n.urgency_score >= 8).length,
    departments: new Set(needs.map((n) => n.assigned_department).filter(Boolean)).size,
    wards: new Set(needs.map((n) => n.ward).filter(Boolean)).size,
    aiTriaged: needs.filter((n) => n.ai_validated).length,
  };
}
