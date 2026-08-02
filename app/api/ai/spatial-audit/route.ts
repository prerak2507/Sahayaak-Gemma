import { NextResponse } from 'next/server';
import { assessZoneRisk } from '@/lib/gemma/ops';
import type { NeedDigest } from '@/lib/gemma/analytics';
import { gemmaErrorResponse } from '@/lib/gemma/route-helpers';

export const dynamic = 'force-dynamic';

/**
 * Assesses civic risk for a zone.
 *
 * Pass real measurements in `observations` when a remote-sensing or sensor
 * source is available. Without them Gemma reasons from reported civic data
 * alone and returns low confidence, rather than inventing figures it has no
 * instrument to measure.
 */
export async function POST(request: Request) {
  let body: {
    zone?: string;
    lat?: number;
    lng?: number;
    category?: string;
    weather?: Record<string, unknown>;
    observations?: Record<string, unknown>;
    reportedNeeds?: NeedDigest[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  if (!body.zone) {
    return NextResponse.json({ error: 'zone is required' }, { status: 400 });
  }

  try {
    return NextResponse.json(
      await assessZoneRisk({
        zone: body.zone,
        lat: body.lat,
        lng: body.lng,
        category: body.category,
        weather: body.weather,
        observations: body.observations,
        reportedNeeds: body.reportedNeeds,
      })
    );
  } catch (error) {
    return gemmaErrorResponse(error, 'ai/spatial-audit');
  }
}
