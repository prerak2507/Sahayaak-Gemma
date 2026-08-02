import { NextResponse } from 'next/server';
import { getBoard } from '@/lib/data/board-cache';
import type { NeedDocument } from '@/lib/data/needs';

export const dynamic = 'force-dynamic';

/**
 * Public read of the reports board.
 *
 * The public map and homepage previously subscribed to Firestore straight from
 * the browser, which meant an anonymous visitor hit the security rules and got
 * permission-denied, so the map rendered empty for exactly the people it exists
 * for. Reading through the server fixes that without loosening any rule: the
 * admin SDK reads, this route decides what is public, and the browser never
 * holds a database credential.
 *
 *   GET /api/needs                      municipal reports, newest first
 *   GET /api/needs?assignment=ngo       NGO referrals instead
 *   GET /api/needs?assignment=all       everything
 *   GET /api/needs?limit=50
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const assignment = params.get('assignment') ?? 'government';
  const limit = Math.min(Number(params.get('limit')) || 200, 500);

  try {
    const rows = await getBoard();

    const needs = rows
      .map((d) => {
        // Only fields the public is allowed to see. Reporter identity and
        // internal routing notes stay server side.
        return {
          id: d.id,
          title: d.title ?? 'Untitled report',
          summary: d.summary ?? '',
          summary_native: d.summary_native ?? '',
          description_lang: d.description_lang ?? 'en',
          category: d.category ?? 'other',
          assignment_type: d.assignment_type ?? 'ngo',
          assigned_department: d.assigned_department ?? null,
          status: d.status ?? 'open',
          urgency_score: d.urgency_score ?? 5,
          city: d.city ?? null,
          ward: d.ward ?? null,
          location_lat: d.location_lat ?? null,
          location_lng: d.location_lng ?? null,
          needs_location_pin: d.needs_location_pin ?? false,
          assigned_worker_name: d.assigned_worker_name ?? null,
          assigned_worker_title: d.assigned_worker_title ?? null,
          ai_validated: d.ai_validated ?? false,
          ai_model: d.ai_model ?? null,
          upvotes: d.upvotes ?? 0,
          photo_urls: d.photo_urls ?? [],
          created_at: d.created_at ?? null,
        };
      })
      .filter((n) => assignment === 'all' || n.assignment_type === assignment)
      .sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')))
      .slice(0, limit);

    return NextResponse.json({ needs, count: needs.length });
  } catch (error) {
    console.error('[api/needs] read failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error), needs: [], count: 0 },
      { status: 503 }
    );
  }
}
