import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { invalidateBoard } from '@/lib/data/board-cache';
import { chooseVolunteer } from '@/lib/gemma/analytics';
import { gemmaErrorResponse } from '@/lib/gemma/route-helpers';

export const dynamic = 'force-dynamic';

/** Below this, the assignment goes to a human coordinator instead of happening by itself. */
const AUTO_ASSIGN_CONFIDENCE = 0.8;

/** Nobody gets auto-assigned an eleventh open task. */
const MAX_OPEN_TASKS = 10;

/**
 * Assigns an urgent need to a volunteer without a coordinator in the loop.
 *
 * This is the only route where a Gemma decision writes to the database on its
 * own, so it is fenced: a workload ceiling, a confidence floor, and a stored
 * reason on every task it creates so the assignment can be explained to the
 * person who received it and reversed if it was wrong.
 */
export async function POST(request: Request) {
  let needId: string | undefined;

  try {
    ({ needId } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  if (!needId) {
    return NextResponse.json({ error: 'needId is required' }, { status: 400 });
  }

  try {
    const need = await store().get('needs', needId);
    if (!need) {
      return NextResponse.json({ error: 'Need not found' }, { status: 404 });
    }

    const roster = await store().list('volunteers');
    const openTasks = await store().list('tasks');

    const available = roster
      .filter((v: any) => v.status === 'available' || v.status === 'busy')
      .map((v: any) => ({
        id: v.id,
        name: v.name,
        skills: v.skills ?? [],
        currentLoad: openTasks.filter(
          (t: any) => t.volunteer_id === v.id && ['assigned', 'in_progress'].includes(t.status)
        ).length,
      }))
      .filter((v) => v.currentLoad < MAX_OPEN_TASKS);

    if (available.length === 0) {
      return NextResponse.json({
        success: false,
        reason: `Every volunteer is already carrying ${MAX_OPEN_TASKS} open tasks. This needs a coordinator.`,
      });
    }

    const decision = await chooseVolunteer(need, available);

    if (decision.confidence < AUTO_ASSIGN_CONFIDENCE) {
      return NextResponse.json({
        success: false,
        reason: 'No match confident enough to assign automatically. Sent to a coordinator.',
        suggestion: decision,
      });
    }

    // Guard against an id the model invented despite the instruction.
    if (!available.some((v) => v.id === decision.volunteer_id)) {
      console.error('[ai/autonomous-dispatch] Gemma returned an unknown volunteer id:', decision.volunteer_id);
      return NextResponse.json({
        success: false,
        reason: 'The suggested volunteer is not in the available pool. Sent to a coordinator.',
      });
    }

    const taskId = await store().add('tasks', {
      need_id: needId,
      volunteer_id: decision.volunteer_id,
      status: 'assigned',
      assigned_at: new Date().toISOString(),
      dispatch_reason: decision.reason,
      dispatch_confidence: decision.confidence,
      dispatch_model: decision._meta.model,
      is_autonomous: true,
    });

    await store().update('needs', needId, {
      status: 'assigned',
      updated_at: new Date().toISOString(),
    });
    invalidateBoard();

    return NextResponse.json({
      success: true,
      taskId,
      volunteerId: decision.volunteer_id,
      reason: decision.reason,
      _meta: decision._meta,
    });
  } catch (error) {
    return gemmaErrorResponse(error, 'ai/autonomous-dispatch');
  }
}
