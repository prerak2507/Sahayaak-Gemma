import { NextResponse } from 'next/server';
import { reviewPartnerDocuments } from '@/lib/gemma/ops';
import { gemmaErrorResponse } from '@/lib/gemma/route-helpers';

export const dynamic = 'force-dynamic';

/**
 * Prepares a human reviewer's worklist for a partner application.
 *
 * This route no longer returns a compliance verdict or a score. Deciding
 * whether an organisation is compliant is a regulatory judgement about a real
 * body of people, and a language model reading a list of filenames is not
 * entitled to make it. Gemma flags gaps and drafts questions; a person decides.
 */
export async function POST(request: Request) {
  let body: {
    organisation?: Record<string, unknown>;
    ngoData?: Record<string, unknown>;
    docs?: string[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  const organisation = body.organisation ?? body.ngoData;
  if (!organisation) {
    return NextResponse.json({ error: 'organisation is required' }, { status: 400 });
  }

  try {
    return NextResponse.json(await reviewPartnerDocuments(organisation, body.docs ?? []));
  } catch (error) {
    return gemmaErrorResponse(error, 'ai/compliance-audit');
  }
}
