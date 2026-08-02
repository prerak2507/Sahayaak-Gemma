import { NextResponse } from 'next/server';
import { screenPhoto } from '@/lib/gemma/vision';
import { gemmaErrorResponse } from '@/lib/gemma/route-helpers';

export const dynamic = 'force-dynamic';

/**
 * Screens an attached photo before a report is accepted.
 *
 * A failure here is not an approval. If Gemma cannot look at the photo, the
 * caller gets a 5xx and the interface must say the photo is unverified rather
 * than claiming it passed.
 */
export async function POST(request: Request) {
  let imageBase64: string | undefined;

  try {
    ({ imageBase64 } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  if (!imageBase64) {
    return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 });
  }

  try {
    return NextResponse.json(await screenPhoto(imageBase64));
  } catch (error) {
    return gemmaErrorResponse(error, 'ai/verify-image');
  }
}
