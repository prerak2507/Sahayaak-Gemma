import { NextResponse } from 'next/server';
import { interpretWeatherRisk } from '@/lib/gemma/ops';
import { gemmaErrorResponse } from '@/lib/gemma/route-helpers';

export const dynamic = 'force-dynamic';

/**
 * Turns a weather reading into expected civic load.
 * The reading comes from the caller's weather source. Gemma interprets it and
 * does not forecast the weather itself.
 */
export async function POST(request: Request) {
  let reading: {
    city?: string;
    temperature?: number;
    precipitation_probability?: number;
    wind_speed?: number;
    current_condition?: string;
  };

  try {
    reading = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  if (reading.temperature === undefined && reading.current_condition === undefined) {
    return NextResponse.json(
      { error: 'A weather reading is required', code: 'no_data' },
      { status: 400 }
    );
  }

  try {
    return NextResponse.json(await interpretWeatherRisk({ city: 'Rajkot', ...reading }));
  } catch (error) {
    return gemmaErrorResponse(error, 'ai/predictive-weather');
  }
}
