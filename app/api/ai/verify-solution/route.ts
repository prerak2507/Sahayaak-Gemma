import { NextResponse } from 'next/server';
import { verifySolutionPhoto } from '@/lib/gemma/vision';
import { gemmaErrorResponse } from '@/lib/gemma/route-helpers';

export const dynamic = 'force-dynamic';

/**
 * Checks a crew's completion photo before the ticket closes.
 * Fails closed: if Gemma cannot look at it, the ticket stays open.
 */
export async function POST(request: Request) {
  let body: {
    imageBase64?: string;
    issueTitle?: string;
    issueDescription?: string;
    issueCategory?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  if (!body.imageBase64) {
    return NextResponse.json(
      { error: 'A photo of the completed work is required' },
      { status: 400 }
    );
  }

  try {
    return NextResponse.json(
      await verifySolutionPhoto(body.imageBase64, {
        title: body.issueTitle,
        description: body.issueDescription,
        category: body.issueCategory,
      })
    );
  } catch (error) {
    return gemmaErrorResponse(error, 'ai/verify-solution');
  }
}
