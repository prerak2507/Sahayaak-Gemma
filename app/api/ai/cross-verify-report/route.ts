import { NextResponse } from 'next/server';
import { crossVerifyPhoto } from '@/lib/gemma/vision';
import { gemmaErrorResponse } from '@/lib/gemma/route-helpers';

export const dynamic = 'force-dynamic';

/**
 * Checks that the attached photo shows the problem the resident described.
 *
 * This is the fraud check that stops one photograph being filed against six
 * different streets, so it fails closed. An unreachable model returns 503, not
 * a quiet approval.
 */
export async function POST(request: Request) {
  let body: { imageBase64?: string; userDescription?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  if (!body.imageBase64 || !body.userDescription) {
    return NextResponse.json(
      { error: 'imageBase64 and userDescription are both required' },
      { status: 400 }
    );
  }

  try {
    return NextResponse.json(await crossVerifyPhoto(body.imageBase64, body.userDescription));
  } catch (error) {
    return gemmaErrorResponse(error, 'ai/cross-verify-report');
  }
}
