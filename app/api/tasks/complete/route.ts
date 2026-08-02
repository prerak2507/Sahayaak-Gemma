import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { invalidateBoard } from '@/lib/data/board-cache';

export const dynamic = 'force-dynamic';

/**
 * Closes a task and the report behind it.
 *
 * Rewritten to go through the store. This route previously imported the
 * *client* Firebase config from a server handler, which meant the browser SDK
 * was being constructed during the build. When Firebase was not configured that
 * threw at import time and failed the whole production build.
 *
 * It also awards the reporter trust points, which is the only reason the
 * platform asks residents to identify themselves at all: a report that gets
 * fixed should be worth something to the person who filed it.
 */
export async function POST(request: Request) {
  let body: { taskId?: string; needId?: string; note?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  if (!body.needId) {
    return NextResponse.json({ error: 'needId is required' }, { status: 400 });
  }

  try {
    const need = await store().get('needs', body.needId);
    if (!need) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const history = Array.isArray((need as any).history) ? [...(need as any).history] : [];
    history.push({
      at: now,
      action: 'resolution',
      detail: body.note || 'Marked complete by the assigned crew',
      by: (need as any).assigned_worker_name || 'field crew',
    });

    await store().update('needs', body.needId, {
      status: 'completed',
      completed_at: now,
      updated_at: now,
      history,
    });

    if (body.taskId) {
      const task = await store().get('tasks', body.taskId);
      if (task) {
        await store().update('tasks', body.taskId, { status: 'completed', completed_at: now });
      }
    }

    invalidateBoard();

    // Tell the resident, and credit them. Points scale with how serious the
    // problem turned out to be, so reporting a live wire is worth more than
    // reporting faded paint.
    const reporter = (need as any).reported_by;
    let pointsAwarded = 0;

    if (reporter && reporter !== 'anonymous') {
      const severity = (need as any).urgency_score || 5;
      pointsAwarded = Math.floor(severity * 15);

      await store().add('notifications', {
        user_id: reporter,
        title: 'Your report was fixed',
        message: `"${(need as any).title}" has been resolved. Thank you for reporting it.`,
        read: false,
        created_at: now,
        type: 'resolution',
        need_id: body.needId,
        points_awarded: pointsAwarded,
      });
    }

    return NextResponse.json({ ok: true, needId: body.needId, pointsAwarded });
  } catch (error) {
    console.error('[api/tasks/complete] failed:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
