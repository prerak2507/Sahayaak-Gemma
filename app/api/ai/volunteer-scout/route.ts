import { NextResponse } from 'next/server';
import { planDeployment, type NeedDigest, type VolunteerDigest } from '@/lib/gemma/analytics';
import { gemmaErrorResponse } from '@/lib/gemma/route-helpers';

export const dynamic = 'force-dynamic';

/** Plans how to deploy the volunteers an NGO actually has against its open needs. */
export async function POST(request: Request) {
  let body: { volunteers?: VolunteerDigest[]; activeNeeds?: NeedDigest[] };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  if (!Array.isArray(body.volunteers) || !Array.isArray(body.activeNeeds)) {
    return NextResponse.json(
      { error: 'volunteers and activeNeeds must both be arrays' },
      { status: 400 }
    );
  }

  try {
    return NextResponse.json(await planDeployment(body.volunteers, body.activeNeeds));
  } catch (error) {
    return gemmaErrorResponse(error, 'ai/volunteer-scout');
  }
}
