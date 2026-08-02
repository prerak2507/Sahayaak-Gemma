/**
 * The single path every AI call in Sahaayak takes.
 *
 * Nothing else in the codebase talks to a model directly. That matters for two
 * reasons: swapping local for cloud is one env var rather than an audit of 22
 * route handlers, and every response carries provenance saying which model on
 * which host produced it, so the UI can never present a canned fallback as if
 * it were inference.
 */

import { hostChain, timeoutMs, type GemmaHost, type GemmaHostKind } from './config';

export interface GemmaMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  /** Base64 image payloads, no data: prefix. Gemma reads these interleaved with the text. */
  images?: string[];
  tool_name?: string;
}

export interface GemmaTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface GemmaToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

/** Attached to every AI-derived payload the API returns. The UI renders it verbatim. */
export interface GemmaMeta {
  /** 'gemma' for real inference, 'fallback' for deterministic non-model output. */
  source: 'gemma' | 'fallback';
  model: string | null;
  host: GemmaHostKind | null;
  latencyMs: number;
  /** Present on fallbacks: why the model did not answer. */
  reason?: string;
}

export interface GemmaResult {
  content: string;
  toolCalls: GemmaToolCall[];
  meta: GemmaMeta;
}

export interface GemmaRequest {
  messages: GemmaMessage[];
  tools?: GemmaTool[];
  /**
   * Schema-constrained decoding. Pass a JSON Schema object and Gemma is forced
   * to emit conforming JSON, which is why this codebase has no regex-based
   * JSON scraping anywhere.
   */
  format?: Record<string, unknown> | 'json';
  temperature?: number;
  maxTokens?: number;
  /** Gemma 4 reasons before answering by default. Off for extraction work. */
  think?: boolean;
}

export class GemmaUnavailableError extends Error {
  readonly attempts: string[];
  constructor(attempts: string[]) {
    super(
      attempts.length
        ? `No Gemma host answered. Tried: ${attempts.join('; ')}`
        : 'No Gemma host is configured.'
    );
    this.name = 'GemmaUnavailableError';
    this.attempts = attempts;
  }
}

interface OllamaChatResponse {
  model?: string;
  message?: {
    content?: string;
    tool_calls?: Array<{ function?: { name?: string; arguments?: Record<string, unknown> } }>;
  };
  error?: string;
}

async function callHost(host: GemmaHost, req: GemmaRequest): Promise<GemmaResult> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());

  try {
    const response = await fetch(`${host.origin}/api/chat`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(host.apiKey ? { Authorization: `Bearer ${host.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: host.model,
        messages: req.messages.map((m) => ({
          role: m.role,
          content: m.content,
          ...(m.images?.length ? { images: m.images } : {}),
          ...(m.tool_name ? { tool_name: m.tool_name } : {}),
        })),
        ...(req.tools?.length ? { tools: req.tools } : {}),
        ...(req.format ? { format: req.format } : {}),
        ...(req.think === undefined ? {} : { think: req.think }),
        stream: false,
        options: {
          temperature: req.temperature ?? 0.2,
          ...(req.maxTokens ? { num_predict: req.maxTokens } : {}),
          // Gemma 4 E4B carries a 128K window, and Ollama reserves KV cache for
          // whatever it is told to allow. On a 6 GB card that reservation is
          // what pushes llama-server into being killed mid-request. A civic
          // report plus its schema is a few thousand tokens, so capping this
          // costs nothing and keeps the model resident.
          num_ctx: Number(process.env.GEMMA_NUM_CTX) || 8192,
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`${host.kind} host returned ${response.status}: ${body.slice(0, 200)}`);
    }

    const data = (await response.json()) as OllamaChatResponse;
    if (data.error) throw new Error(`${host.kind} host error: ${data.error}`);

    return {
      content: data.message?.content ?? '',
      toolCalls: (data.message?.tool_calls ?? []).flatMap((call) =>
        call.function?.name
          ? [{ name: call.function.name, arguments: call.function.arguments ?? {} }]
          : []
      ),
      meta: {
        source: 'gemma',
        model: data.model || host.model,
        host: host.kind,
        latencyMs: Date.now() - started,
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Runs a completion, trying local Gemma before any hosted one.
 * Throws GemmaUnavailableError when no host answers, so callers make a
 * deliberate choice about degrading rather than getting a silent empty string.
 */
/**
 * Retries within a host before moving on.
 *
 * Running a 6 GB model on a 6 GB card leaves no headroom, and llama-server
 * occasionally gets killed mid-request and returns a 500. It restarts by
 * itself, so the correct response is to wait for it to come back rather than
 * fail the resident's report. Observed once while seeding twenty reports, which
 * is often enough to matter during a live demo.
 */
const RETRIES_PER_HOST = 3;

function isTransient(message: string): boolean {
  return (
    message.includes('500') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('terminated') ||
    message.includes('ECONNREFUSED') ||
    message.includes('fetch failed')
  );
}

export async function gemmaChat(req: GemmaRequest): Promise<GemmaResult> {
  const hosts = hostChain();
  const attempts: string[] = [];

  for (const host of hosts) {
    for (let attempt = 1; attempt <= RETRIES_PER_HOST; attempt++) {
      try {
        return await callHost(host, req);
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        attempts.push(`${host.kind} (${host.model}) attempt ${attempt}: ${detail}`);

        const worthRetrying = isTransient(detail) && attempt < RETRIES_PER_HOST;
        if (!worthRetrying) {
          console.warn(`[gemma] ${host.kind} host failed, falling through:`, detail);
          break;
        }

        // The model has to load back into VRAM after a crash, so give it room.
        const backoffMs = 3000 * attempt;
        console.warn(
          `[gemma] ${host.kind} host returned a transient failure, retrying in ${backoffMs}ms:`,
          detail
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw new GemmaUnavailableError(attempts);
}

/** Marks a deterministic, non-model result so it can never be mistaken for inference. */
export function fallbackMeta(reason: string, startedAt: number): GemmaMeta {
  return {
    source: 'fallback',
    model: null,
    host: null,
    latencyMs: Date.now() - startedAt,
    reason,
  };
}
