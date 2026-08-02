/**
 * Schema-constrained extraction.
 *
 * The version of this platform that ran on a hosted API asked the model for
 * JSON in prose, then went hunting for it: strip markdown fences, try a parse,
 * fall back to indexOf('{') and lastIndexOf('}'), then give up and serve a
 * canned object. That scraper was the single largest source of wrong answers.
 *
 * Gemma 4 accepts a JSON Schema and is constrained to emit conforming output,
 * so the schema below is both the prompt contract and the parse target. One
 * definition, no drift, no scraping.
 */

import { z } from 'zod';
import { gemmaChat, type GemmaMessage, type GemmaMeta, type GemmaTool, type GemmaToolCall } from './client';

export interface StructuredRequest<T extends z.ZodType> {
  schema: T;
  /** Who the model is and what it is deciding. Kept separate from the data. */
  system: string;
  /** The case to reason about. */
  user: string;
  /** Base64 image payloads without the data: prefix, for multimodal calls. */
  images?: string[];
  temperature?: number;
  /** Gemma 4 reasons before answering. Left off for extraction, on for judgement calls. */
  think?: boolean;
}

export interface StructuredResult<T> {
  data: T;
  meta: GemmaMeta;
}

export class GemmaSchemaError extends Error {
  readonly raw: string;
  constructor(message: string, raw: string) {
    super(message);
    this.name = 'GemmaSchemaError';
    this.raw = raw;
  }
}

/**
 * Asks Gemma for exactly one object matching `schema`.
 * Throws GemmaUnavailableError if no host answers, GemmaSchemaError if the
 * output does not satisfy the schema. Callers decide how to degrade.
 */
export async function gemmaStructured<T extends z.ZodType>(
  req: StructuredRequest<T>
): Promise<StructuredResult<z.infer<T>>> {
  const jsonSchema = z.toJSONSchema(req.schema, { target: 'draft-7' }) as Record<string, unknown>;

  const messages: GemmaMessage[] = [
    { role: 'system', content: req.system },
    // Images go before text: Gemma 4 grounds better when the media leads.
    { role: 'user', content: req.user, ...(req.images?.length ? { images: req.images } : {}) },
  ];

  const result = await gemmaChat({
    messages,
    format: jsonSchema,
    temperature: req.temperature ?? 0.1,
    think: req.think ?? false,
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(result.content);
  } catch {
    throw new GemmaSchemaError('Gemma returned output that was not valid JSON', result.content);
  }

  const validated = req.schema.safeParse(parsed);
  if (!validated.success) {
    throw new GemmaSchemaError(
      `Gemma output did not match the schema: ${validated.error.issues
        .map((i) => `${i.path.join('.')} ${i.message}`)
        .join(', ')}`,
      result.content
    );
  }

  return { data: validated.data, meta: result.meta };
}

export interface ToolChoiceResult {
  call: GemmaToolCall | null;
  /** Anything the model said alongside the call. */
  content: string;
  meta: GemmaMeta;
}

/**
 * Lets Gemma pick and invoke a tool rather than describing one in prose.
 * Used for dispatch, where the decision is "which department owns this and
 * with what arguments" and we want the model's choice to arrive already typed.
 */
export async function gemmaToolChoice(req: {
  system: string;
  user: string;
  tools: GemmaTool[];
  images?: string[];
  think?: boolean;
}): Promise<ToolChoiceResult> {
  const messages: GemmaMessage[] = [
    { role: 'system', content: req.system },
    { role: 'user', content: req.user, ...(req.images?.length ? { images: req.images } : {}) },
  ];

  const result = await gemmaChat({
    messages,
    tools: req.tools,
    temperature: 0.1,
    think: req.think ?? true,
  });

  return {
    call: result.toolCalls[0] ?? null,
    content: result.content,
    meta: result.meta,
  };
}
