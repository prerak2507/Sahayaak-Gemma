import { NextResponse } from 'next/server';
import { analyseSchemeGaps, draftPolicyBrief } from '@/lib/gemma/policy';
import { gemmaErrorResponse } from '@/lib/gemma/route-helpers';

export const dynamic = 'force-dynamic';

/**
 * Scheme gap analysis, and the policy brief drafted from it.
 *
 * Send mode "draft" with a completed gap analysis to get the brief.
 *
 * The previous version fell back to a canned analysis on every failure, which
 * meant an officer could be reading fabricated coverage percentages for real
 * wards without any indication. There is no fallback here: no model, no
 * analysis.
 */
export async function POST(request: Request) {
  let body: {
    mode?: string;
    needsDistribution?: Record<string, number>;
    totalNeeds?: number;
    gap?: Record<string, unknown>;
    context?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  try {
    if (body.mode === 'draft') {
      if (!body.gap) {
        return NextResponse.json(
          { error: 'gap is required when mode is "draft"' },
          { status: 400 }
        );
      }
      return NextResponse.json(await draftPolicyBrief({ gap: body.gap, context: body.context }));
    }

    const distribution = body.needsDistribution ?? {};
    const total = body.totalNeeds ?? 0;

    if (total === 0 || Object.keys(distribution).length === 0) {
      return NextResponse.json(
        {
          error: 'A needs distribution with at least one report is required',
          code: 'no_data',
          userMessage: 'There is nothing reported yet to analyse against scheme coverage.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(await analyseSchemeGaps(distribution, total));
  } catch (error) {
    return gemmaErrorResponse(error, 'ai/scheme-analysis');
  }
}
