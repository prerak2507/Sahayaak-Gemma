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
 * Renders a JSON Schema as an instruction the model will actually follow.
 *
 * Enum fields are spelled out explicitly, because that is where the hosted
 * model drifts most: told a department is one of seven ids, it will otherwise
 * answer with a department's English name.
 */
function schemaContract(schema: Record<string, unknown>): string {
  const props = (schema.properties ?? {}) as Record<string, any>;
  const required = new Set((schema.required as string[]) ?? []);

  /**
   * Recurses into arrays and nested objects.
   *
   * Describing only the top level is not enough. Told that `priorities` is an
   * "array of object", the hosted model returns an array of objects with
   * whatever keys it likes, and every nested field then arrives undefined. Five
   * routes failed on exactly that until the item shape was spelled out.
   */
  const describe = (name: string, spec: any, indent: string, isRequired: boolean): string[] => {
    const bits: string[] = [];
    const lines: string[] = [];

    const enumOf = (s: any): string[] | null => {
      if (Array.isArray(s?.enum)) return s.enum.map((v: unknown) => JSON.stringify(v));
      if (Array.isArray(s?.anyOf)) {
        const opts = s.anyOf.flatMap((o: any) =>
          Array.isArray(o.enum) ? o.enum.map((v: unknown) => JSON.stringify(v)) : []
        );
        return opts.length ? opts : null;
      }
      return null;
    };

    const options = enumOf(spec);

    if (options) {
      bits.push(`exactly one of: ${options.join(', ')}`);
    } else if (spec.type === 'array') {
      const itemOptions = enumOf(spec.items);
      if (itemOptions) {
        bits.push(`array, each entry exactly one of: ${itemOptions.join(', ')}`);
      } else if (spec.items?.type === 'object' || spec.items?.properties) {
        const count =
          typeof spec.minItems === 'number' ? `at least ${spec.minItems} ` : '';
        bits.push(`${count}array of objects, each with these exact keys:`);
      } else {
        bits.push(`array of ${spec.items?.type ?? 'string'}`);
      }
    } else if (spec.type === 'object' || spec.properties) {
      bits.push('object with these exact keys:');
    } else if (Array.isArray(spec.type)) {
      bits.push(spec.type.filter((t: string) => t !== 'null').join(' or ') + ', or null');
    } else if (spec.type) {
      bits.push(spec.type);
    }

    if (typeof spec.minimum === 'number' || typeof spec.maximum === 'number') {
      bits.push(`between ${spec.minimum ?? '-inf'} and ${spec.maximum ?? 'inf'}`);
    }
    if (typeof spec.minItems === 'number' && spec.items?.type !== 'object') {
      bits.push(`at least ${spec.minItems} entries`);
    }
    if (spec.description) bits.push(spec.description);
    if (!isRequired) bits.push('optional');

    lines.push(`${indent}- "${name}": ${bits.join('; ')}`);

    // Nested shapes.
    const nested = spec.items?.properties ?? spec.properties;
    if (nested) {
      const nestedRequired = new Set<string>(
        (spec.items?.required ?? spec.required ?? []) as string[]
      );
      for (const [k, v] of Object.entries(nested as Record<string, any>)) {
        lines.push(...describe(k, v, `${indent}    `, nestedRequired.has(k)));
      }
    }

    return lines;
  };

  return [
    'REPLY WITH ONE JSON OBJECT AND NOTHING ELSE.',
    'No greeting, no explanation, no markdown fences, no follow-up questions.',
    '',
    'Fields:',
    ...Object.entries(props).flatMap(([name, spec]) => describe(name, spec, '', required.has(name))),
    '',
    'Where a field lists allowed values, copy one of those values exactly. Do not substitute a description, a translation or a longer name.',
    'Where a field is an array of objects, every object must contain every key listed beneath it, spelled exactly as shown.',
  ].join('\n');
}

/**
 * Pulls the JSON object out of a completion.
 *
 * A direct JSON.parse is tried first and succeeds for local Ollama, which
 * honours the schema strictly. Hosted Gemma does not always: it can prefix a
 * reasoning preamble, or wrap the object in a markdown fence, and a bare parse
 * then fails. That took the entire AI layer down on the first deployment while
 * working perfectly on the same code locally.
 *
 * This is not a return to scraping JSON out of prose. The schema is still what
 * decides whether the result is acceptable; safeParse runs on whatever comes
 * back and rejects anything that does not conform. All this does is find where
 * the object starts and ends when the model has padded around it.
 *
 * Returns undefined when there is no parseable object.
 */
function extractObject(content: string): unknown {
  const text = content.trim();
  if (!text) return undefined;

  try {
    return JSON.parse(text);
  } catch {
    // Padded. Keep going.
  }

  // Strip a reasoning block if the model emitted one inline.
  let body = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Strip markdown fences, with or without a language tag.
  const fenced = body.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      body = fenced[1].trim();
    }
  }

  // Take the outermost balanced object, ignoring braces inside strings.
  const start = body.indexOf('{');
  if (start === -1) return undefined;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < body.length; i++) {
    const ch = body[i];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(body.slice(start, i + 1));
        } catch {
          return undefined;
        }
      }
    }
  }

  return undefined;
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
    // The schema goes in the prompt as well as in the request.
    //
    // Local Ollama constrains decoding to the schema, so this is redundant
    // there. Ollama Cloud does not: given the same `format` object it happily
    // replies with conversational prose, or with JSON whose enum fields contain
    // free text like "Roads and Buildings" instead of "pwd". Every structured
    // call failed on the first deployment for exactly this reason, while
    // passing locally.
    //
    // Stating the contract in the prompt is what makes the hosted model comply.
    // The schema still decides what is acceptable: safeParse runs either way.
    { role: 'system', content: `${req.system}\n\n${schemaContract(jsonSchema)}` },
    // Images go before text: Gemma 4 grounds better when the media leads.
    { role: 'user', content: req.user, ...(req.images?.length ? { images: req.images } : {}) },
  ];

  const result = await gemmaChat({
    messages,
    format: jsonSchema,
    temperature: req.temperature ?? 0.1,
    think: req.think ?? false,
  });

  const parsed = extractObject(result.content);
  if (parsed === undefined) {
    throw new GemmaSchemaError(
      `Gemma returned output that was not valid JSON: ${result.content.slice(0, 200)}`,
      result.content
    );
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
