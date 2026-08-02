import { NextResponse } from 'next/server';
import { crossVerifyPhoto } from '@/lib/gemma/vision';
import { gemmaErrorResponse } from '@/lib/gemma/route-helpers';

export const dynamic = 'force-dynamic';

/**
 * Re-checks a photo against a description the resident edited after submitting.
 * Same check as cross-verify: editing the words must not become a way around it.
 */
export async function POST(request: Request) {
  let body: { imageBase64?: string; editedDescription?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  if (!body.imageBase64 || !body.editedDescription) {
    return NextResponse.json(
      { error: 'imageBase64 and editedDescription are both required' },
      { status: 400 }
    );
  }

  try {
    return NextResponse.json(await crossVerifyPhoto(body.imageBase64, body.editedDescription));
  } catch (error) {
    return gemmaErrorResponse(error, 'ai/re-verify');
  }
}
