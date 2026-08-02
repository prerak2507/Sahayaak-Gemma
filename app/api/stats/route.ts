import { NextResponse } from 'next/server';
import { getBoard } from '@/lib/data/board-cache';
import { computeStats } from '@/lib/data/needs';

export const dynamic = 'force-dynamic';

/**
 * Platform figures, derived from the needs collection on every request.
 *
 * There is no stored counter. The previous build kept the headline numbers in a
 * `platform_stats/global` document that nothing ever updated, so the homepage
 * showed the same figures no matter what happened in the database, and the
 * assistant quoted a third set baked into its prompt. Three sources, three
 * answers, all of them confidently wrong.
 *
 * Counting on read costs one query and cannot drift. When a report is added
 * anywhere, by anyone, these move.
 */
export async function GET() {
  try {
    // Scoped and cached. See lib/data/board-cache.ts: reading the whole
    // collection on every poll is what exhausted the Firestore quota.
    const needs = await getBoard();

    return NextResponse.json({
      ...computeStats(needs),
      derived_at: new Date().toISOString(),
    });
  } catch (error) {
    // No invented figures on failure. The caller shows an empty state.
    console.error('[api/stats] could not derive statistics:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        code: 'stats_unavailable',
      },
      { status: 503 }
    );
  }
}
