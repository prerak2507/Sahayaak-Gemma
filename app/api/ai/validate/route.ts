import { NextResponse } from 'next/server';
import { triageReport } from '@/lib/gemma/civic';
import { decideDispatch, DispatchUndecidedError } from '@/lib/gemma/dispatch';
import { stripImagePrefix } from '@/lib/gemma/vision';
import { gemmaErrorResponse } from '@/lib/gemma/route-helpers';
import { buildNeedFromTriage } from '@/lib/data/needs';
import { store } from '@/lib/store';
import { invalidateBoard } from '@/lib/data/board-cache';

export const dynamic = 'force-dynamic';

/**
 * Citizen report intake.
 *
 * Two Gemma calls: triage decides what the report is, dispatch decides what
 * happens to it. Dispatch is skipped for reports triage rejected, since there
 * is nothing to dispatch.
 */
export async function POST(request: Request) {
  let body: {
    description?: string;
    title?: string;
    imageBase64?: string;
    contextNote?: string;
    /** Write the triaged report to the database. Off by default so previewing is free. */
    persist?: boolean;
    source_type?: string;
    reported_by?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  // Title is optional now: Gemma writes one. Older clients may still send it.
  const description = (body.description || '').trim();
  if (!description) {
    return NextResponse.json({ error: 'A description is required' }, { status: 400 });
  }

  try {
    const triage = await triageReport({
      description: body.title ? `${body.title}\n\n${description}` : description,
      imageBase64: body.imageBase64 ? stripImagePrefix(body.imageBase64) : undefined,
      contextNote: body.contextNote,
    });

    if (!triage.valid) {
      return NextResponse.json({ triage, dispatch: null, needId: null });
    }

    let dispatch = null;
    let dispatchError = null;

    try {
      dispatch = await decideDispatch(triage);
    } catch (error) {
      // Triage succeeded, so the report is real and must not be thrown away.
      // Accept it unrouted and let a human at the control room assign it.
      if (!(error instanceof DispatchUndecidedError)) throw error;
      console.warn('[ai/validate] dispatch undecided, queueing for manual routing:', error.message);
      dispatchError = {
        code: 'dispatch_undecided',
        message: 'Routed to the control room for manual assignment.',
      };
    }

    // Persisting goes through buildNeedFromTriage, the same builder the seeder
    // and the WhatsApp bot use, so a report filed here is indistinguishable in
    // shape from every other one and appears on every surface that reads needs.
    let needId: string | null = null;
    if (body.persist) {
      const worker =
        dispatch && dispatch.action.kind !== 'ngo_referral' && dispatch.action.assignment
          ? {
              id: dispatch.action.assignment.worker.id,
              name: dispatch.action.assignment.worker.name,
              title: dispatch.action.assignment.worker.title,
            }
          : null;

      const need = buildNeedFromTriage(triage, {
        originalDescription: description,
        worker,
        source_type: body.source_type ?? 'web',
        reported_by: body.reported_by ?? null,
        photo_urls: body.imageBase64 ? ['pending-upload'] : [],
      });

      needId = await store().add('needs', need);
      invalidateBoard();
    }

    return NextResponse.json({ triage, dispatch, dispatchError, needId });
  } catch (error) {
    return gemmaErrorResponse(error, 'ai/validate');
  }
}
