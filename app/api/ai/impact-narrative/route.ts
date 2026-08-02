import { NextResponse } from 'next/server';
import { writeImpactNarrative } from '@/lib/gemma/analytics';
import { gemmaErrorResponse } from '@/lib/gemma/route-helpers';

export const dynamic = 'force-dynamic';

/** Phrases real impact figures as prose. The figures come from the caller, never from the model. */
export async function POST(request: Request) {
  let body: { organisationName?: string; ngoName?: string; stats?: Record<string, unknown> };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  const name = body.organisationName || body.ngoName;
  if (!name || !body.stats) {
    return NextResponse.json(
      { error: 'organisationName and stats are both required' },
      { status: 400 }
    );
  }

  try {
    return NextResponse.json(await writeImpactNarrative(name, body.stats));
  } catch (error) {
    return gemmaErrorResponse(error, 'ai/impact-narrative');
  }
}
