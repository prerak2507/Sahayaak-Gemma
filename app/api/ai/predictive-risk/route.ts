import { NextResponse } from 'next/server';
import { predictCascadingRisks } from '@/lib/gemma/ops';
import type { NeedDigest } from '@/lib/gemma/analytics';
import { gemmaErrorResponse } from '@/lib/gemma/route-helpers';

export const dynamic = 'force-dynamic';

/** Predicts what today's unresolved reports turn into if they are left alone. */
export async function POST(request: Request) {
  let body: {
    needs?: NeedDigest[];
    conditions?: Record<string, unknown>;
    weather?: Record<string, unknown>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  const needs = Array.isArray(body.needs) ? body.needs : [];
  if (needs.length === 0) {
    return NextResponse.json(
      { error: 'needs must be a non-empty array', code: 'no_data' },
      { status: 400 }
    );
  }

  try {
    return NextResponse.json(
      await predictCascadingRisks(needs, body.conditions ?? body.weather ?? {})
    );
  } catch (error) {
    return gemmaErrorResponse(error, 'ai/predictive-risk');
  }
}
