/**
 * Speech understanding on Gemma 4, behind a flag.
 *
 * Gemma 4's E2B, E4B and 12B variants carry a ~300M audio encoder, so in
 * principle a Gujarati voice report can be understood by the same model that
 * routes it, with no separate ASR vendor. In practice, as of Ollama v0.30.x:
 *
 *   - E4B returns empty or hallucinated transcripts, and `think: false` only
 *     partly mitigates it (ollama/ollama#16584, still open).
 *   - Thinking mode yields empty responses on audio input generally
 *     (ollama/ollama#16583).
 *   - llama.cpp has not implemented Gemma 4 audio at all
 *     (ggml-org/llama.cpp#21334), so non-Ollama backends cannot serve it.
 *   - 12B with thinking disabled is the variant reported to behave.
 *
 * Audio also does not travel on the native /api/chat route. Adding an `audios`
 * field there is silently ignored; the working path is the OpenAI-compatible
 * endpoint with an `input_audio` content block.
 *
 * Because a citizen holding down a mic button is the least forgiving moment in
 * this product, this path is opt-in (GEMMA_AUDIO_ENABLED=true) and callers are
 * expected to fall back to a dedicated ASR. Gemma still does every bit of the
 * reasoning either way.
 */

import { audioConfig, hostChain, timeoutMs } from './config';
import type { GemmaMeta } from './client';

export interface TranscriptionResult {
  transcript: string;
  meta: GemmaMeta;
}

export class GemmaAudioUnavailableError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'GemmaAudioUnavailableError';
  }
}

/** Ollama wants bare base64; browsers hand over a data: URL. */
function stripDataUrl(input: string): string {
  const match = input.match(/^data:[^;]+;base64,(.+)$/);
  return match ? match[1] : input;
}

/**
 * Transcribes speech with Gemma's audio encoder.
 * Throws GemmaAudioUnavailableError when the flag is off or the model declines,
 * which is the caller's cue to use the ASR fallback.
 */
export async function transcribeWithGemma(
  audio: string,
  options: { format?: 'wav' | 'mp3'; languageHint?: string } = {}
): Promise<TranscriptionResult> {
  const { enabled, model } = audioConfig();
  if (!enabled) {
    throw new GemmaAudioUnavailableError('Gemma audio is disabled (GEMMA_AUDIO_ENABLED is not true)');
  }

  const host = hostChain()[0];
  if (!host) throw new GemmaAudioUnavailableError('No Gemma host is configured');

  const language = options.languageHint
    ? `The speaker is most likely speaking ${options.languageHint}.`
    : '';

  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());

  try {
    // OpenAI-compatible surface: /v1, not /api/v1.
    const response = await fetch(`${host.origin}/v1/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(host.apiKey ? { Authorization: `Bearer ${host.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              // Media before text, as Gemma 4's prompting guidance calls for.
              {
                type: 'input_audio',
                input_audio: { data: stripDataUrl(audio), format: options.format ?? 'wav' },
              },
              {
                type: 'text',
                text: `Transcribe this audio exactly as spoken, in the language it was spoken in. ${language} Return only the transcript, with no commentary, translation or formatting.`,
              },
            ],
          },
        ],
        temperature: 0,
        // Thinking must stay off: it is what produces the empty and
        // hallucinated transcripts described above.
        think: false,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new GemmaAudioUnavailableError(
        `Gemma audio endpoint returned ${response.status}: ${body.slice(0, 200)}`
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const transcript = (data.choices?.[0]?.message?.content ?? '').trim();

    // The documented failure mode is a polite refusal rather than an error.
    if (!transcript || /could not transcribe|i'?m sorry/i.test(transcript)) {
      throw new GemmaAudioUnavailableError(
        'Gemma declined to transcribe the audio (known Ollama audio regression)'
      );
    }

    return {
      transcript,
      meta: { source: 'gemma', model, host: host.kind, latencyMs: Date.now() - started },
    };
  } catch (error) {
    if (error instanceof GemmaAudioUnavailableError) throw error;
    throw new GemmaAudioUnavailableError(
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    clearTimeout(timer);
  }
}
