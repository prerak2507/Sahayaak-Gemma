'use client';

/**
 * Changing a report from the browser.
 *
 * Screens used to call Firestore's updateDoc directly. The rules deny client
 * writes, so those calls rejected, most of the call sites did not await or
 * catch them, and the interface showed a success toast over a change that never
 * happened. An officer would move a ticket, see it move, and find it back where
 * it started after a reload.
 *
 * Everything now goes through the server, which validates the change, applies
 * it, and records who made it. These helpers throw on failure so a caller
 * cannot accidentally report success.
 */

export interface NeedPatch {
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
  /** Who is making the change. Recorded in the report's history. */
  actor?: string;
}

export class NeedUpdateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NeedUpdateError';
  }
}

/**
 * Applies a change and returns the saved report.
 * Throws if the server did not accept it, so the UI can show what went wrong
 * rather than a success message over a discarded edit.
 */
export async function updateNeed(id: string, patch: NeedPatch): Promise<Record<string, unknown>> {
  const res = await fetch(`/api/needs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok || body.ok === false) {
    throw new NeedUpdateError(body.error || `The change was not saved (${res.status})`);
  }

  return body.need;
}

/** Records one upvote. Voting twice is a no-op rather than an error. */
export async function upvoteNeed(
  id: string,
  voter: string
): Promise<{ upvotes: number; alreadyVoted: boolean }> {
  const res = await fetch(`/api/needs/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'upvote', voter }),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok || body.ok === false) {
    throw new NeedUpdateError(body.error || `The vote was not saved (${res.status})`);
  }

  return { upvotes: body.upvotes ?? 0, alreadyVoted: Boolean(body.alreadyVoted) };
}

/** Updates a volunteer's status, skills or ward. */
export async function updateVolunteer(
  id: string,
  patch: { status?: string; skills?: string[]; ward?: string | null }
): Promise<Record<string, unknown>> {
  const res = await fetch('/api/volunteers', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...patch }),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok || body.ok === false) {
    throw new NeedUpdateError(body.error || `The change was not saved (${res.status})`);
  }

  return body.volunteer;
}
