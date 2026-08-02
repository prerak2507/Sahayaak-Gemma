/**
 * Shared failure handling for the AI routes.
 *
 * One rule: a route never invents a result. When Gemma cannot answer, the
 * response says so with a status code that means it, and the client decides
 * what to show. Degrading to a canned object with a 200 is how the previous
 * build ended up approving reports it had never looked at.
 */

import { NextResponse } from 'next/server';
import { GemmaUnavailableError } from './client';
import { GemmaSchemaError } from './structured';

export interface GemmaErrorBody {
  error: string;
  /** Machine-readable so the UI can tell "model is down" from "model misbehaved". */
  code: 'gemma_unavailable' | 'gemma_schema_error' | 'internal_error';
  /** What the user should be told. Written for a resident, not an operator. */
  userMessage: string;
  detail?: string;
}

export function gemmaErrorResponse(error: unknown, context: string): NextResponse<GemmaErrorBody> {
  if (error instanceof GemmaUnavailableError) {
    console.error(`[${context}] no Gemma host answered:`, error.attempts);
    return NextResponse.json(
      {
        error: error.message,
        code: 'gemma_unavailable',
        userMessage:
          'The reporting assistant is offline right now. Your report has not been lost. Try again in a moment, or submit it and a person will review it.',
        detail: error.attempts.join('; '),
      },
      { status: 503 }
    );
  }

  if (error instanceof GemmaSchemaError) {
    console.error(`[${context}] schema violation. Raw output:`, error.raw.slice(0, 400));
    return NextResponse.json(
      {
        error: error.message,
        code: 'gemma_schema_error',
        userMessage:
          'The assistant could not read that clearly. Try rewording your report, or send it as it is for a person to review.',
      },
      { status: 502 }
    );
  }

  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${context}] unexpected failure:`, message);
  return NextResponse.json(
    {
      error: message,
      code: 'internal_error',
      userMessage: 'Something went wrong on our side. Your report has not been lost.',
    },
    { status: 500 }
  );
}
