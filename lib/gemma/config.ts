/**
 * Gemma runtime configuration.
 *
 * Sahaayak runs entirely on Gemma 4. There are two places it can run, and both
 * speak the same Ollama wire protocol, so the client code below never branches
 * on which one is active:
 *
 *   local  — an Ollama daemon on the same machine as the app. No auth, no
 *            network egress, no per-token cost. This is the deployment we
 *            actually care about: a ward office with one desktop and a bad
 *            internet connection.
 *   cloud  — Ollama's hosted models, used when no local daemon is reachable so
 *            a public demo still works for someone who has not installed
 *            anything.
 *
 * Local is always tried first. Cloud is a safety net, never the default.
 */

export type GemmaHostKind = 'local' | 'cloud';

export interface GemmaHost {
  kind: GemmaHostKind;
  /** Origin only. The client appends /api/chat or /v1/chat/completions. */
  origin: string;
  model: string;
  apiKey?: string;
}

/** Vision-capable, audio-capable, fits in 6 GB of VRAM at QAT. */
const DEFAULT_LOCAL_MODEL = 'gemma4:e4b-it-qat';

/** Ollama's hosted Gemma 4. Same protocol, 256K context. */
const DEFAULT_CLOUD_MODEL = 'gemma4:cloud';

const DEFAULT_LOCAL_ORIGIN = 'http://localhost:11434';
const DEFAULT_CLOUD_ORIGIN = 'https://ollama.com';

export function localHost(): GemmaHost {
  return {
    kind: 'local',
    origin: (process.env.GEMMA_LOCAL_ORIGIN || DEFAULT_LOCAL_ORIGIN).replace(/\/$/, ''),
    model: process.env.GEMMA_LOCAL_MODEL || DEFAULT_LOCAL_MODEL,
  };
}

/** Null when no API key is configured, which is the expected state for a purely local install. */
export function cloudHost(): GemmaHost | null {
  const apiKey = process.env.OLLAMA_API_KEY;
  if (!apiKey) return null;
  return {
    kind: 'cloud',
    origin: (process.env.GEMMA_CLOUD_ORIGIN || DEFAULT_CLOUD_ORIGIN).replace(/\/$/, ''),
    model: process.env.GEMMA_CLOUD_MODEL || DEFAULT_CLOUD_MODEL,
    apiKey,
  };
}

/**
 * Hosts to attempt, in order. Local first so that a machine with Ollama running
 * never silently sends citizen reports to a third party.
 */
export function hostChain(): GemmaHost[] {
  const chain: GemmaHost[] = [];
  if (process.env.GEMMA_DISABLE_LOCAL !== 'true') chain.push(localHost());
  const cloud = cloudHost();
  if (cloud) chain.push(cloud);
  return chain;
}

/**
 * Audio understanding is gated because Gemma 4 audio through Ollama is not
 * dependable as of v0.30.x: E4B returns empty or hallucinated transcripts even
 * with thinking disabled, and llama.cpp has not implemented the audio path at
 * all. 12B is the variant that behaves. Off by default; when off, speech is
 * transcribed by a dedicated ASR and Gemma still does all the reasoning.
 *
 * See docs/gemma-integration.md for the evidence behind this switch.
 */
export function audioConfig() {
  return {
    enabled: process.env.GEMMA_AUDIO_ENABLED === 'true',
    model: process.env.GEMMA_AUDIO_MODEL || 'gemma4:12b',
  };
}

/** Per-request ceiling. Local inference on a laptop GPU is slower than a cloud API. */
export function timeoutMs(): number {
  const raw = Number(process.env.GEMMA_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : 120_000;
}
