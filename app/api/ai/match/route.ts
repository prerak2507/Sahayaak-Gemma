import { NextResponse } from 'next/server';
import { rankNeedsForVolunteer, type NeedDigest } from '@/lib/gemma/analytics';
import { gemmaErrorResponse } from '@/lib/gemma/route-helpers';

export const dynamic = 'force-dynamic';

/** Ranks open needs for one volunteer by skill fit, then urgency. */
export async function POST(request: Request) {
  let body: { volunteerSkills?: string[]; needs?: NeedDigest[] };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  if (!Array.isArray(body.needs) || body.needs.length === 0) {
    return NextResponse.json({ error: 'needs must be a non-empty array' }, { status: 400 });
  }

  try {
    return NextResponse.json(
      await rankNeedsForVolunteer(body.volunteerSkills ?? [], body.needs)
    );
  } catch (error) {
    return gemmaErrorResponse(error, 'ai/match');
  }
}
