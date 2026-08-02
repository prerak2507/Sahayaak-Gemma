/**
 * Runtime probe for the Gemma layer.
 *
 * Exposed at /api/gemma/health so anyone evaluating this project can confirm
 * which model actually served their request instead of taking the README's
 * word for it.
 */

import { hostChain, audioConfig, type GemmaHost } from './config';
import { gemmaChat } from './client';

export interface HostHealth {
  kind: 'local' | 'cloud';
  origin: string;
  model: string;
  reachable: boolean;
  /** True when the configured model is present on a reachable host. */
  modelPresent: boolean;
  availableModels: string[];
  error?: string;
}

export interface GemmaHealth {
  ok: boolean;
  /** The host that would serve the next request. */
  active: 'local' | 'cloud' | null;
  hosts: HostHealth[];
  audio: { enabled: boolean; model: string };
  checkedAt: string;
}

async function probe(host: GemmaHost): Promise<HostHealth> {
  const base: HostHealth = {
    kind: host.kind,
    origin: host.origin,
    model: host.model,
    reachable: false,
    modelPresent: false,
    availableModels: [],
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);
    const response = await fetch(`${host.origin}/api/tags`, {
      signal: controller.signal,
      headers: host.apiKey ? { Authorization: `Bearer ${host.apiKey}` } : {},
    }).finally(() => clearTimeout(timer));

    if (!response.ok) {
      return { ...base, error: `tags endpoint returned ${response.status}` };
    }

    const data = (await response.json()) as { models?: Array<{ name?: string; model?: string }> };
    const names = (data.models ?? []).flatMap((m) => [m.name, m.model].filter(Boolean) as string[]);

    return {
      ...base,
      reachable: true,
      // Cloud tag listings do not always enumerate hosted models, so treat a
      // reachable cloud host as usable and let the real call be the arbiter.
      modelPresent: names.includes(host.model) || host.kind === 'cloud',
      availableModels: names,
    };
  } catch (error) {
    return { ...base, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function checkGemmaHealth(): Promise<GemmaHealth> {
  const hosts = await Promise.all(hostChain().map(probe));
  const active = hosts.find((h) => h.reachable && h.modelPresent) ?? null;

  return {
    ok: Boolean(active),
    active: active?.kind ?? null,
    hosts,
    audio: audioConfig(),
    checkedAt: new Date().toISOString(),
  };
}

/** End-to-end check: does the active host actually complete a prompt? */
export async function checkGemmaInference(): Promise<{
  ok: boolean;
  model: string | null;
  host: string | null;
  latencyMs: number | null;
  error?: string;
}> {
  try {
    const result = await gemmaChat({
      messages: [{ role: 'user', content: 'Reply with the single word: ready' }],
      maxTokens: 8,
      think: false,
    });
    return {
      ok: result.content.toLowerCase().includes('ready'),
      model: result.meta.model,
      host: result.meta.host,
      latencyMs: result.meta.latencyMs,
    };
  } catch (error) {
    return {
      ok: false,
      model: null,
      host: null,
      latencyMs: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
