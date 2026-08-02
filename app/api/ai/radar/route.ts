import { NextResponse } from 'next/server';
import { analyseCityLoad, type NeedDigest } from '@/lib/gemma/analytics';
import { gemmaErrorResponse } from '@/lib/gemma/route-helpers';

export const dynamic = 'force-dynamic';

/** Reads the live civic load across Rajkot and tells the duty officer what is happening. */
export async function POST(request: Request) {
  let needs: NeedDigest[];

  try {
    ({ needs } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  if (!Array.isArray(needs) || needs.length === 0) {
    return NextResponse.json(
      { error: 'needs must be a non-empty array', code: 'no_data' },
      { status: 400 }
    );
  }

  try {
    return NextResponse.json(await analyseCityLoad(needs));
  } catch (error) {
    return gemmaErrorResponse(error, 'ai/radar');
  }
}
