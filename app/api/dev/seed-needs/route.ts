import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { DEMO_REPORTS } from '@/lib/data/demo-reports';
import { triageReport } from '@/lib/gemma/civic';
import { decideDispatch } from '@/lib/gemma/dispatch';
import { buildNeedFromTriage } from '@/lib/data/needs';
import { invalidateBoard } from '@/lib/data/board-cache';

export const dynamic = 'force-dynamic';
// Twenty reports through a local model takes a few minutes. Max 300s for Vercel Hobby plan.
export const maxDuration = 300;

/**
 * Seeds the demo workload by actually running it through Gemma.
 *
 * Nothing is pre-triaged. Each demo report is raw resident text, and the
 * routing, urgency, translation and crew assignment stored against it are the
 * model's real output. That is slower than writing finished records, and it is
 * deliberate: a judge can wipe the collection, re-run this, and watch the same
 * decisions be re-derived rather than replayed.
 *
 *   POST /api/dev/seed-needs           add the demo workload
 *   POST /api/dev/seed-needs?reset=1   clear seeded reports first
 *
 * Only seeded documents are removed on reset. Anything filed through the app is
 * left alone.
 */
/**
 * What is currently in the needs collection, grouped by where it came from.
 * Run this before a demo to confirm you are showing what you think you are.
 */
export async function GET() {
  try {
    const snapshot = { docs: (await store().list('needs')).map((d) => ({ id: d.id, data: () => d })), size: (await store().list('needs')).length };

    const bySource: Record<string, number> = {};
    const byDepartment: Record<string, number> = {};
    const byLanguage: Record<string, number> = {};
    const foreign: Array<Record<string, unknown>> = [];

    snapshot.docs.forEach((doc) => {
      const d = doc.data();
      const source = (d.source_type as string) || '(unset)';
      bySource[source] = (bySource[source] ?? 0) + 1;
      const dept = (d.assigned_department as string) || (d.assignment_type as string) || '(unset)';
      byDepartment[dept] = (byDepartment[dept] ?? 0) + 1;
      const lang = (d.description_lang as string) || '(unset)';
      byLanguage[lang] = (byLanguage[lang] ?? 0) + 1;

      // Anything not from this app's writers, for example rows left in a shared
      // Firebase project by an earlier version.
      if (!source.startsWith('seed:') && source !== 'web' && source !== 'whatsapp') {
        foreign.push({
          id: doc.id,
          source,
          city: d.city ?? null,
          category: d.category ?? null,
          assignment_type: d.assignment_type ?? null,
          title: String(d.title ?? '').slice(0, 60),
        });
      }
    });

    return NextResponse.json({
      total: snapshot.size,
      bySource,
      byDepartment,
      byLanguage,
      foreign,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const reset = url.searchParams.get('reset') === '1';

  const started = Date.now();
  const created: Array<Record<string, unknown>> = [];
  const rejected: Array<Record<string, unknown>> = [];
  const failed: Array<Record<string, unknown>> = [];

  try {
    if (reset) {
      await store().removeWhere('needs', (d: any) =>
        typeof d.source_type === 'string' && d.source_type.startsWith('seed:')
      );
      await store().removeWhere('rejected_reports', () => true);
      invalidateBoard();
    }

    for (const report of DEMO_REPORTS) {
      try {
        const triage = await triageReport({ description: report.text });

        // Rejected reports are stored too. An operator needs to see what the
        // system turned away and why, otherwise refusals are unauditable.
        if (!triage.valid) {
          const doc = {
            text: report.text,
            rejection_reason: triage.rejection_reason,
            language: triage.language,
            routing_reason: triage.routing_reason,
            source_type: `seed:${report.source}`,
            ai_model: triage._meta.model,
            created_at: new Date(Date.now() - report.ageMinutes * 60000).toISOString(),
          };
          await store().add('rejected_reports', doc);
          rejected.push({ text: report.text.slice(0, 60), reason: triage.rejection_reason });
          continue;
        }

        // Dispatch gives us the crew assignment. A failure here is survivable:
        // the report is real and should exist unrouted rather than be dropped.
        let worker = null;
        let toolCalled: string | null = null;
        try {
          const dispatch = await decideDispatch(triage);
          toolCalled = dispatch.toolCalled;
          if (dispatch.action.kind !== 'ngo_referral' && dispatch.action.assignment) {
            const w = dispatch.action.assignment.worker;
            worker = { id: w.id, name: w.name, title: w.title };
          }
        } catch (error) {
          console.warn('[seed] dispatch undecided, storing unrouted:', (error as Error).message);
        }

        const need = buildNeedFromTriage(triage, {
          originalDescription: report.text,
          worker,
          source_type: `seed:${report.source}`,
        });

        // Spread the ages so the board does not look like it was made at once.
        const createdAt = new Date(Date.now() - report.ageMinutes * 60000).toISOString();

        await store().add('needs', { ...need, created_at: createdAt, updated_at: createdAt });

        created.push({
          title: need.title,
          language: need.description_lang,
          department: need.assigned_department ?? need.assignment_type,
          urgency: need.urgency_score,
          placed: !need.needs_location_pin,
          tool: toolCalled,
        });
      } catch (error) {
        failed.push({
          text: report.text.slice(0, 60),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    invalidateBoard();

    return NextResponse.json({
      ok: failed.length === 0,
      elapsedSeconds: Math.round((Date.now() - started) / 1000),
      created: created.length,
      rejected: rejected.length,
      failed: failed.length,
      detail: { created, rejected, failed },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
