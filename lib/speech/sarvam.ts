/**
 * The audio edges.
 *
 * This is the only part of Sahaayak that is not Gemma, and it is confined to
 * moving between sound and text: a microphone in, a speaker out. It makes no
 * decisions. It does not classify, route, score or reason. Between the
 * transcript and the spoken reply, everything is Gemma.
 *
 * Why the boundary sits here:
 *
 *  - Speech in: Gemma 4's smaller variants carry an audio encoder and could do
 *    this, but the path is not dependable through Ollama yet. lib/gemma/audio.ts
 *    documents the open bugs and is tried first when enabled.
 *  - Speech out: Gemma is not a speech synthesis model. Reading a municipal
 *    update aloud in Gujarati needs a vocoder, which is a different kind of
 *    system, not a smaller version of the same one.
 *
 * Text-to-speech matters more here than it looks. A resident who cannot read
 * comfortably still needs to hear that their complaint was received and who is
 * coming.
 */

const BASE_URL = 'https://api.sarvam.ai';

export class SpeechServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SpeechServiceError';
  }
}

function requireKey(): string {
  const key = process.env.SARVAM_API_KEY;
  if (!key) {
    throw new SpeechServiceError(
      'No speech service is configured. Set SARVAM_API_KEY, or enable Gemma audio with GEMMA_AUDIO_ENABLED=true for transcription.'
    );
  }
  return key;
}

// ── Speech in ─────────────────────────────────────────────────────────────

export interface TranscriptionResult {
  transcript: string;
  detectedLanguage: string | null;
}

/**
 * Transcribes recorded speech.
 * Throws rather than returning empty text, so the interface can tell the
 * resident to try again instead of showing them silence.
 */
export async function transcribeSpeech(
  audio: Buffer,
  mimeType: string,
  languageCode: string
): Promise<TranscriptionResult> {
  const key = requireKey();

  // Codec suffixes such as "audio/webm;codecs=opus" are rejected upstream.
  const cleanType = mimeType?.split(';')[0] || 'audio/webm';

  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(audio)], { type: cleanType }), 'recording.webm');
  form.append('language_code', languageCode);
  form.append('model', 'saaras:v3');
  form.append('mode', 'transcribe');

  const response = await fetch(`${BASE_URL}/speech-to-text`, {
    method: 'POST',
    headers: { 'api-subscription-key': key },
    body: form,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new SpeechServiceError(`Transcription returned ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = (await response.json()) as { transcript?: string; language_code?: string };
  if (!data.transcript) {
    throw new SpeechServiceError('Transcription returned no text');
  }

  return { transcript: data.transcript, detectedLanguage: data.language_code ?? null };
}

// ── Speech out ────────────────────────────────────────────────────────────

export interface SynthesisOptions {
  /** Defaults to Gujarati, because this is Rajkot. */
  languageCode?: string;
  speaker?: string;
  pitch?: number;
  pace?: number;
  loudness?: number;
}

/** Reads text aloud. Returns base64 audio. Throws when synthesis fails. */
export async function synthesiseSpeech(
  text: string,
  options: SynthesisOptions = {}
): Promise<string> {
  const key = requireKey();

  const response = await fetch(`${BASE_URL}/text-to-speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': key,
    },
    body: JSON.stringify({
      inputs: [text],
      target_language_code: options.languageCode || 'gu-IN',
      speaker: options.speaker || 'meera',
      pitch: options.pitch ?? 0,
      pace: options.pace ?? 1,
      loudness: options.loudness ?? 1,
      model: 'bulbul:v1',
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new SpeechServiceError(`Synthesis returned ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = (await response.json()) as { audios?: string[] };
  const audio = data.audios?.[0];
  if (!audio) {
    throw new SpeechServiceError('Synthesis returned no audio');
  }

  return audio;
}
