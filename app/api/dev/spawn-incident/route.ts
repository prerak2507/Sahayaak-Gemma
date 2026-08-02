import { NextResponse } from 'next/server';
import { z } from 'zod';
import { store } from '@/lib/store';
import { gemmaStructured } from '@/lib/gemma/structured';
import { triageReport } from '@/lib/gemma/civic';
import { decideDispatch } from '@/lib/gemma/dispatch';
import { buildNeedFromTriage } from '@/lib/data/needs';
import { RAJKOT_LANDMARKS } from '@/lib/geo/rajkot';
import { gemmaErrorResponse } from '@/lib/gemma/route-helpers';
import { invalidateBoard } from '@/lib/data/board-cache';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Spawns a new incident, written by Gemma.
 *
 * Two Gemma calls, on purpose. The first invents a resident's sentence: a
 * plausible complaint in Gujarati, romanized Gujarati, Hindi or English, phrased
 * the way somebody actually types on a phone. The second is the ordinary intake
 * pipeline, which has no idea the text was generated and treats it exactly like
 * a real submission.
 *
 * That separation is what makes this honest as a demo control. Nothing is
 * pre-routed: the department, urgency, crew and location you see are decided by
 * the same code path a real report goes through. Pressing the button twice
 * produces two different incidents, because the model is writing them.
 *
 *   POST /api/dev/spawn-incident
 *   POST /api/dev/spawn-incident  { "severity": "emergency" }
 */

const inventedReportSchema = z.object({
  text: z
    .string()
    .describe('The resident report itself, as they would type it. One or two sentences, no quotes'),
  language_used: z.enum(['gu', 'gu-latin', 'hi', 'en']),
  channel: z.enum(['web', 'whatsapp']),
});

const SYSTEM = `You invent realistic civic complaints for Rajkot, Gujarat, for testing a municipal reporting system.

Write as a resident would actually type on a phone. Short. Annoyed or worried, not formal. No greeting, no signature, no quotation marks.

Vary the language. Gujarati script, Gujarati written in Latin letters, Hindi, and English all occur here, and people mix them mid-sentence. Romanized Gujarati is the most common, so use it often.

Name a real Rajkot location, drawn from: ${RAJKOT_LANDMARKS.map((l) => l.name).join(', ')}. Occasionally name a housing society or a landmark that is not on that list, because residents do.

Write about ordinary municipal problems: potholes, sewer overflows, burst water mains, dead street lights, uncollected rubbish, waterlogging, encroachment. Sometimes a humanitarian need instead, such as an elderly resident needing medicine.

Do not write the same complaint twice. Do not describe anything already fixed.`;

export async function POST(request: Request) {
  let body: { severity?: string } = {};
  try {
    body = await request.json();
  } catch {
    // No body is fine; the default is an ordinary incident.
  }

  const severityHint =
    body.severity === 'emergency'
      ? 'Write something genuinely dangerous that is happening right now: a live electrical wire down, fire or smoke, a gas smell, or drinking water that has turned foul.'
      : body.severity === 'minor'
        ? 'Write something small and annoying rather than dangerous.'
        : 'Write an ordinary municipal problem of moderate seriousness.';

  try {
    // 1. Gemma writes the resident's sentence.
    const { data: invented } = await gemmaStructured({
      schema: inventedReportSchema,
      system: SYSTEM,
      user: `${severityHint}\n\nIt is currently ${new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
      })} in Rajkot. Write one new complaint.`,
      // Higher than the rest of the system: this call is meant to vary.
      temperature: 0.9,
      think: false,
    });

    // 2. The ordinary intake pipeline. It does not know the text was generated.
    const triage = await triageReport({ description: invented.text });

    if (!triage.valid) {
      return NextResponse.json({
        ok: false,
        reason: 'The generated report was refused by triage. Try again.',
        text: invented.text,
        rejection_reason: triage.rejection_reason,
      });
    }

    let worker = null;
    let toolCalled: string | null = null;
    try {
      const dispatch = await decideDispatch(triage);
      toolCalled = dispatch.toolCalled;
      if (dispatch.action.kind !== 'ngo_referral' && dispatch.action.assignment) {
        const w = dispatch.action.assignment.worker;
        worker = { id: w.id, name: w.name, title: w.title };
      }
    } catch {
      // Undecided dispatch still produces a real report, just unrouted.
    }

    const need = buildNeedFromTriage(triage, {
      originalDescription: invented.text,
      worker,
      source_type: invented.channel === 'whatsapp' ? 'whatsapp' : 'web',
    });

    const id = await store().add('needs', need);
    invalidateBoard();

    return NextResponse.json({
      ok: true,
      id,
      text: invented.text,
      language: triage.language,
      title: triage.auto_title,
      summary: triage.summary,
      department: triage.assigned_department ?? triage.assignment_type,
      urgency: triage.urgency_score,
      location: triage.location,
      needs_location_pin: triage.needs_location_pin,
      worker,
      toolCalled,
      model: triage._meta.model,
      latencyMs: triage._meta.latencyMs,
    });
  } catch (error) {
    return gemmaErrorResponse(error, 'dev/spawn-incident');
  }
}
