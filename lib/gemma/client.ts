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

async function runHost(host: GemmaHost, req: GemmaRequest, attempts: string[]): Promise<GemmaResult> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= RETRIES_PER_HOST; attempt++) {
    try {
      return await callHost(host, req);
    } catch (error) {
      lastError = error;
      const detail = error instanceof Error ? error.message : String(error);
      attempts.push(`${host.kind} (${host.model}) attempt ${attempt}: ${detail}`);

      if (!isTransient(detail) || attempt === RETRIES_PER_HOST) break;

      // The model has to load back into VRAM after a crash, so give it room.
      const backoffMs = 3000 * attempt;
      console.warn(`[gemma] ${host.kind} transient failure, retrying in ${backoffMs}ms:`, detail);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/**
 * Is the local daemon there at all?
 *
 * Cached briefly, because asking on every call would add a round trip to each
 * one. Two seconds is long enough for a daemon on the same machine and short
 * enough that a missing one costs nothing.
 */
let localReachableUntil = 0;
let localReachable = false;

async function isLocalUp(origin: string): Promise<boolean> {
  if (Date.now() < localReachableUntil) return localReachable;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${origin}/api/tags`, { signal: controller.signal }).finally(() =>
      clearTimeout(timer)
    );
    localReachable = res.ok;
  } catch {
    localReachable = false;
  }

  localReachableUntil = Date.now() + (localReachable ? 30_000 : 10_000);
  return localReachable;
}

/**
 * Runs a completion, preferring the local model.
 *
 * The order matters and so does the timing:
 *
 *  - **Local first, always.** A resident's report should be read on the
 *    corporation's own machine, not sent to somebody else's.
 *  - **Skip local quickly when it is not there.** A two second reachability
 *    check means a machine with no Ollama does not sit waiting for a connection
 *    that will never open.
 *  - **Hedge when local is slow.** The first call after Ollama starts spends
 *    about seventy seconds loading weights into VRAM. Rather than make a
 *    resident wait, the cloud host is started alongside once local has taken
 *    longer than GEMMA_HEDGE_MS, and whichever answers first wins. Local
 *    usually still wins on the second call onward, which is the common case.
 *
 * Throws GemmaUnavailableError when nothing answers, so callers degrade
 * deliberately rather than getting a silent empty string.
 */
export async function gemmaChat(req: GemmaRequest): Promise<GemmaResult> {
  const chain = hostChain();
  const attempts: string[] = [];

  const local = chain.find((h) => h.kind === 'local');
  const cloud = chain.find((h) => h.kind === 'cloud');

  // No local configured, or it is not answering: go straight to the cloud.
  const localUp = local ? await isLocalUp(local.origin) : false;

  if (!localUp) {
    if (local) attempts.push(`local (${local.model}): not reachable, skipped`);
    if (!cloud) throw new GemmaUnavailableError(attempts);
    return runHost(cloud, req, attempts).catch(() => {
      throw new GemmaUnavailableError(attempts);
    });
  }

  // Local only.
  if (!cloud) {
    return runHost(local!, req, attempts).catch(() => {
      throw new GemmaUnavailableError(attempts);
    });
  }

  // Both available: run local, and hedge to cloud if it drags.
  const hedgeMs = Number(process.env.GEMMA_HEDGE_MS) || 20_000;

  const localCall = runHost(local!, req, attempts);
  let localFailed = false;
  localCall.catch(() => {
    localFailed = true;
  });

  const hedged = await Promise.race([
    localCall.then((r) => ({ kind: 'result' as const, r })).catch(() => ({ kind: 'failed' as const })),
    new Promise<{ kind: 'timeout' }>((resolve) =>
      setTimeout(() => resolve({ kind: 'timeout' }), hedgeMs)
    ),
  ]);

  if (hedged.kind === 'result') return hedged.r;

  if (hedged.kind === 'timeout') {
    console.warn(`[gemma] local still working after ${hedgeMs}ms, starting cloud alongside`);
  }

  const cloudCall = runHost(cloud, req, attempts);

  // Whichever finishes first, as long as it finishes. If local already failed,
  // this is simply the cloud call.
  try {
    return await (localFailed
      ? cloudCall
      : Promise.any([localCall, cloudCall]));
  } catch {
    throw new GemmaUnavailableError(attempts);
  }
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
