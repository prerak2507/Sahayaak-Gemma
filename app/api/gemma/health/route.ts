import { NextResponse } from 'next/server';
import { checkGemmaHealth, checkGemmaInference } from '@/lib/gemma/health';

export const dynamic = 'force-dynamic';

/**
 * Which Gemma is serving this install, and can it actually complete a prompt.
 * Pass ?probe=1 to run a real inference rather than only checking reachability.
 */
export async function GET(request: Request) {
  const wantsInference = new URL(request.url).searchParams.get('probe') === '1';

  const health = await checkGemmaHealth();
  if (!wantsInference) {
    return NextResponse.json(health, { status: health.ok ? 200 : 503 });
  }

  const inference = await checkGemmaInference();
  return NextResponse.json(
    { ...health, inference },
    { status: health.ok && inference.ok ? 200 : 503 }
  );
}
