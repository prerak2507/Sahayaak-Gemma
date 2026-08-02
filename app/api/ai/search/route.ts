import { NextResponse } from 'next/server';
import { parseSearch } from '@/lib/gemma/analytics';
import { gemmaErrorResponse } from '@/lib/gemma/route-helpers';

export const dynamic = 'force-dynamic';

/** Turns a Gujarati, Hindi or English search box into a structured filter. */
export async function POST(request: Request) {
  let query: string | undefined;

  try {
    ({ query } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  if (!query?.trim()) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  try {
    return NextResponse.json(await parseSearch(query));
  } catch (error) {
    return gemmaErrorResponse(error, 'ai/search');
  }
}
