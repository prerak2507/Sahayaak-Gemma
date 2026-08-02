import { NextResponse } from 'next/server';
import { transcribeWithGemma, GemmaAudioUnavailableError } from '@/lib/gemma/audio';
import { transcribeSpeech } from '@/lib/speech/sarvam';

export const dynamic = 'force-dynamic';

/**
 * Turns a held-down mic button into text.
 *
 * Gemma 4 carries an audio encoder and can do this itself, which would put the
 * whole pipeline on one local model. It is not dependable yet through Ollama
 * (lib/gemma/audio.ts documents the open bugs), so the order is:
 *
 *   1. Gemma audio, when GEMMA_AUDIO_ENABLED is on
 *   2. a dedicated ASR
 *
 * Whichever answers, the response names it. The interface shows the resident
 * which engine heard them, because a wrong transcript of a Gujarati sentence is
 * something they need to be able to catch and correct.
 *
 * Everything after this point, including understanding the Gujarati, is Gemma.
 */
export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Request must be multipart form data' }, { status: 400 });
  }

  const audioFile = formData.get('audio');
  if (!(audioFile instanceof Blob)) {
    return NextResponse.json({ error: 'An audio file is required' }, { status: 400 });
  }

  // Gujarati is the default because this is Rajkot.
  const languageCode = (formData.get('language_code') as string) || 'gu-IN';
  const attempts: string[] = [];

  try {
    const buffer = Buffer.from(await audioFile.arrayBuffer());

    try {
      const result = await transcribeWithGemma(buffer.toString('base64'), {
        format: audioFile.type.includes('mp3') ? 'mp3' : 'wav',
        languageHint: languageCode.split('-')[0],
      });
      return NextResponse.json({
        transcript: result.transcript,
        engine: 'gemma',
        _meta: result.meta,
      });
    } catch (error) {
      if (!(error instanceof GemmaAudioUnavailableError)) throw error;
      attempts.push(`gemma: ${error.message}`);
    }

    const fallback = await transcribeSpeech(buffer, audioFile.type, languageCode);
    return NextResponse.json({
      transcript: fallback.transcript,
      detectedLanguage: fallback.detectedLanguage,
      engine: 'asr',
      note: 'Speech was transcribed by a dedicated ASR. Everything after this point runs on Gemma.',
      attempts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[ai/stt] every transcription path failed:', [...attempts, message]);
    return NextResponse.json(
      {
        error: message,
        code: 'transcription_failed',
        userMessage:
          'We could not hear that clearly. Try recording again, or type your report instead.',
        attempts: [...attempts, message],
      },
      { status: 503 }
    );
  }
}
