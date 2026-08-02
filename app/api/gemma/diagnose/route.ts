import { NextResponse } from 'next/server';
import { gemmaChat } from '@/lib/gemma/client';

export const dynamic = 'force-dynamic';

/**
 * Shows the raw, unparsed model output for a schema-constrained call.
 *
 * Exists because structured calls that work against local Ollama were failing
 * against Ollama Cloud with "not valid JSON", and guessing at the cause from a
 * parse error is a waste of a deployment cycle. This returns exactly what came
 * back so the difference is visible.
 *
 *   GET /api/gemma/diagnose
 */
export async function GET() {
  const schema = {
    type: 'object',
    properties: {
      department: {
        type: 'string',
        enum: ['pwd', 'drainage', 'water_works', 'electricity'],
      },
      urgency: { type: 'integer' },
    },
    required: ['department', 'urgency'],
  };

  const attempts: Array<Record<string, unknown>> = [];

  // 1. Schema-constrained, thinking off. This is what the app does.
  try {
    const r = await gemmaChat({
      messages: [
        { role: 'system', content: 'You route civic complaints for Rajkot.' },
        { role: 'user', content: 'kalavad road par moto khado chhe' },
      ],
      format: schema,
      think: false,
    });
    attempts.push({
      label: 'json-schema, think:false',
      model: r.meta.model,
      host: r.meta.host,
      latencyMs: r.meta.latencyMs,
      rawLength: r.content.length,
      raw: r.content.slice(0, 900),
      parses: (() => {
        try {
          JSON.parse(r.content);
          return true;
        } catch {
          return false;
        }
      })(),
    });
  } catch (e) {
    attempts.push({ label: 'json-schema, think:false', error: (e as Error).message });
  }

  // 2. format:"json" rather than a schema, to see whether the schema itself is
  //    the thing the cloud model does not accept.
  try {
    const r = await gemmaChat({
      messages: [
        {
          role: 'system',
          content:
            'You route civic complaints for Rajkot. Reply with JSON: {"department": "...", "urgency": 0}',
        },
        { role: 'user', content: 'kalavad road par moto khado chhe' },
      ],
      format: 'json',
      think: false,
    });
    attempts.push({
      label: 'format:"json", think:false',
      rawLength: r.content.length,
      raw: r.content.slice(0, 900),
      parses: (() => {
        try {
          JSON.parse(r.content);
          return true;
        } catch {
          return false;
        }
      })(),
    });
  } catch (e) {
    attempts.push({ label: 'format:"json"', error: (e as Error).message });
  }

  // 3. No format at all, to see the model's natural shape.
  try {
    const r = await gemmaChat({
      messages: [
        { role: 'user', content: 'Reply with only this JSON: {"ok": true}' },
      ],
      think: false,
      maxTokens: 60,
    });
    attempts.push({
      label: 'no format',
      rawLength: r.content.length,
      raw: r.content.slice(0, 400),
    });
  } catch (e) {
    attempts.push({ label: 'no format', error: (e as Error).message });
  }

  return NextResponse.json({ attempts });
}
