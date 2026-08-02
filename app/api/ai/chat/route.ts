import { NextResponse } from 'next/server';
import { askAssistant, type AssistantContext, type AssistantTurn } from '@/lib/gemma/assistant';
import { gemmaErrorResponse } from '@/lib/gemma/route-helpers';

export const dynamic = 'force-dynamic';

/**
 * The operations assistant.
 *
 * Callers pass live figures in `context`. Anything not passed, the assistant
 * says it does not know rather than reciting a number baked into a prompt.
 */
export async function POST(request: Request) {
  let body: { message?: string; history?: AssistantTurn[]; context?: AssistantContext };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  const message = (body.message || '').trim();
  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  try {
    const result = await askAssistant(
      message,
      Array.isArray(body.history) ? body.history : [],
      body.context ?? {}
    );
    return NextResponse.json(result);
  } catch (error) {
    return gemmaErrorResponse(error, 'ai/chat');
  }
}
