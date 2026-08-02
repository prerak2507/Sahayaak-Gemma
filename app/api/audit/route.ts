import { NextResponse } from 'next/server';
import { getBoard } from '@/lib/data/board-cache';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * The audit feed.
 *
 * Every change to a report appends to that report's own history. This flattens
 * those across the whole board into one chronological trail, which is what an
 * audit screen actually needs: who changed what, when, and on which ticket.
 *
 * Refusals are included. A system that turns reports away has to be able to
 * show which ones and why, otherwise the refusals are unaccountable.
 */
export async function GET(request: Request) {
  const limit = Math.min(Number(new URL(request.url).searchParams.get('limit')) || 100, 500);

  try {
    const board = await getBoard();

    const entries = board.flatMap((need) => {
      const history = Array.isArray((need as any).history) ? (need as any).history : [];

      const changes = history.map((h: any) => ({
        at: h.at,
        kind: h.action,
        actor: h.by,
        detail: h.detail,
        subject: need.title ?? 'Untitled report',
        subjectId: need.id,
      }));

      // Filing is itself an event, and for most reports the only one.
      changes.push({
        at: need.created_at ?? new Date(0).toISOString(),
        kind: 'filed',
        actor: (need as any).source_type?.startsWith('seed') ? 'seed' : (need as any).source_type ?? 'web',
        detail: `Triaged to ${need.assigned_department ?? need.assignment_type} at urgency ${need.urgency_score}${
          (need as any).ai_model ? ` by ${(need as any).ai_model}` : ''
        }`,
        subject: need.title ?? 'Untitled report',
        subjectId: need.id,
      });

      return changes;
    });

    // Refused reports, so turning something away is on the record too.
    let refusals: any[] = [];
    try {
      refusals = (await store().list('rejected_reports')).map((r: any) => ({
        at: r.created_at,
        kind: 'refused',
        actor: r.ai_model ?? 'gemma',
        detail: `${r.rejection_reason}: ${String(r.text ?? '').slice(0, 70)}`,
        subject: 'Report refused at intake',
        subjectId: r.id,
      }));
    } catch {
      // The collection may not exist yet.
    }

    const feed = [...entries, ...refusals]
      .filter((e) => e.at)
      .sort((a, b) => String(b.at).localeCompare(String(a.at)))
      .slice(0, limit);

    return NextResponse.json({ entries: feed, count: feed.length });
  } catch (error) {
    console.error('[api/audit] read failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error), entries: [], count: 0 },
      { status: 503 }
    );
  }
}
