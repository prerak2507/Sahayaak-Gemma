import { NextResponse } from 'next/server';
import { forecastResources } from '@/lib/gemma/ops';
import { gemmaErrorResponse } from '@/lib/gemma/route-helpers';

export const dynamic = 'force-dynamic';

/** Projects relief supplies for the coming week from real usage history. */
export async function POST(request: Request) {
  let body: { history?: Array<Record<string, unknown>>; trend?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  try {
    return NextResponse.json(
      await forecastResources(body.history ?? [], body.trend || 'normal operation')
    );
  } catch (error) {
    return gemmaErrorResponse(error, 'ai/forecast');
  }
}
