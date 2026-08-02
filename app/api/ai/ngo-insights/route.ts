import { NextResponse } from 'next/server';
import { summariseForNgo } from '@/lib/gemma/ops';
import type { NeedDigest } from '@/lib/gemma/analytics';
import { gemmaErrorResponse } from '@/lib/gemma/route-helpers';

export const dynamic = 'force-dynamic';

/** The morning brief for an NGO coordinator. */
export async function POST(request: Request) {
  let needs: NeedDigest[] | undefined;

  try {
    ({ needs } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  try {
    return NextResponse.json(await summariseForNgo(Array.isArray(needs) ? needs : []));
  } catch (error) {
    return gemmaErrorResponse(error, 'ai/ngo-insights');
  }
}
