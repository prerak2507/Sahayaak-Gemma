import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { assignCrew, RMC_WORKER_REGISTRY } from '@/lib/data/rmc-workers';
import { invalidateBoard } from '@/lib/data/board-cache';

export const dynamic = 'force-dynamic';

/**
 * Changing a report.
 *
 * Firestore rules deny client writes, so every mutation the interface offered
 * was silently discarded: an officer could move a ticket across the board,
 * reassign a crew or close a job, see the optimistic update, and find it gone
 * on reload. Nothing was saved and nothing said so.
 *
 * All changes now go through here. Each one is validated, applied server side,
 * and appended to the report's own history so a ticket can be explained after
 * the fact.
 *
 *   GET    /api/needs/:id     one report with its history
 *   PATCH  /api/needs/:id     status, department, crew, note, resolution
 *   POST   /api/needs/:id     { action: 'upvote' }
 */

const STATUSES = ['open', 'reported', 'verified', 'assigned', 'in_progress', 'completed', 'closed', 'escalated'];

interface HistoryEntry {
  at: string;
  action: string;
  detail: string;
  by: string;
}

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  try {
    const need = await store().get('needs', id);
    if (!need) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    return NextResponse.json({ need });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 503 }
    );
  }
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  let body: {
    status?: string;
    assigned_department?: string;
    assigned_worker_id?: string;
    assigned_worker_name?: string;
    assigned_worker_title?: string;
    note?: string;
    resolution_note?: string;
    resolution_photo?: string;
    ward?: string;
    location_lat?: number;
    location_lng?: number;
    /** Who made the change. Shown in the history. */
    actor?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  if (body.status && !STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: `status must be one of ${STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const current = await store().get('needs', id);
    if (!current) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    const now = new Date().toISOString();
    const actor = body.actor || 'operator';
    const patch: Record<string, unknown> = { updated_at: now };
    const history: HistoryEntry[] = Array.isArray(current.history) ? [...current.history] : [];

    if (body.status && body.status !== current.status) {
      patch.status = body.status;
      history.push({
        at: now,
        action: 'status',
        detail: `${current.status ?? 'open'} to ${body.status}`,
        by: actor,
      });
      if (body.status === 'completed' || body.status === 'closed') {
        patch.completed_at = now;
      }
    }

    // Changing department re-runs crew assignment, because the previous crew
    // belongs to the previous department.
    if (body.assigned_department && body.assigned_department !== current.assigned_department) {
      patch.assigned_department = body.assigned_department;
      const skills: string[] = Array.isArray(current.skills_required) ? current.skills_required : [];
      const reassigned = assignCrew(body.assigned_department, skills);
      patch.assigned_worker_id = reassigned?.worker.id ?? null;
      patch.assigned_worker_name = reassigned?.worker.name ?? null;
      patch.assigned_worker_title = reassigned?.worker.title ?? null;
      history.push({
        at: now,
        action: 'department',
        detail: `${current.assigned_department ?? 'unassigned'} to ${body.assigned_department}${
          reassigned ? `, crew ${reassigned.worker.name}` : ''
        }`,
        by: actor,
      });
    }

    // Explicit crew override, when a supervisor knows better than the scorer.
    //
    // Accepts either a registry id or an explicit name and title. The
    // per-city rosters in lib/data/govt-data.tsx use their own id namespace
    // (emp-delhi-pwd-1) which does not match the RMC registry (emp-pwd-1), so
    // rejecting anything not in the registry would refuse valid assignments
    // made from the officer dashboard.
    if (body.assigned_worker_id || body.assigned_worker_name) {
      const known = RMC_WORKER_REGISTRY.find((w) => w.id === body.assigned_worker_id);

      if (known) {
        patch.assigned_worker_id = known.id;
        patch.assigned_worker_name = known.name;
        patch.assigned_worker_title = known.title;
      } else if (body.assigned_worker_name) {
        patch.assigned_worker_id = body.assigned_worker_id ?? null;
        patch.assigned_worker_name = body.assigned_worker_name;
        patch.assigned_worker_title = body.assigned_worker_title ?? null;
      } else {
        return NextResponse.json(
          { error: 'Unknown worker id, and no worker name supplied' },
          { status: 400 }
        );
      }

      history.push({
        at: now,
        action: 'crew',
        detail: `assigned to ${patch.assigned_worker_name}`,
        by: actor,
      });
    }

    if (body.note) {
      history.push({ at: now, action: 'note', detail: body.note, by: actor });
    }

    if (body.resolution_note) {
      patch.resolution_note = body.resolution_note;
      history.push({ at: now, action: 'resolution', detail: body.resolution_note, by: actor });
    }

    if (body.resolution_photo) {
      patch.resolution_photo = body.resolution_photo;
    }

    // A resident placing a pin for a report Gemma could not locate.
    if (typeof body.location_lat === 'number' && typeof body.location_lng === 'number') {
      patch.location_lat = body.location_lat;
      patch.location_lng = body.location_lng;
      patch.needs_location_pin = false;
      if (body.ward) patch.ward = body.ward;
      history.push({ at: now, action: 'location', detail: 'pin placed by hand', by: actor });
    }

    patch.history = history;
    await store().update('needs', id, patch);
    invalidateBoard();

    const updated = await store().get('needs', id);
    return NextResponse.json({ ok: true, need: updated });
  } catch (error) {
    console.error('[api/needs/:id] update failed:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/** Resident-side actions. Upvoting is how a report gains weight from neighbours. */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  let body: { action?: string; voter?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  if (body.action !== 'upvote') {
    return NextResponse.json({ error: 'action must be "upvote"' }, { status: 400 });
  }

  try {
    const current = await store().get('needs', id);
    if (!current) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    const voters: string[] = Array.isArray(current.upvoted_by) ? current.upvoted_by : [];
    const voter = body.voter || 'anonymous';

    // One vote each. Counting the same person twice is how a board gets gamed.
    if (voters.includes(voter)) {
      return NextResponse.json({ ok: true, upvotes: voters.length, alreadyVoted: true });
    }

    voters.push(voter);
    await store().update('needs', id, {
      upvoted_by: voters,
      upvotes: voters.length,
      updated_at: new Date().toISOString(),
    });
    invalidateBoard();

    return NextResponse.json({ ok: true, upvotes: voters.length });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
