import { NextResponse } from 'next/server';
import { synthesiseSpeech, SpeechServiceError } from '@/lib/speech/sarvam';

export const dynamic = 'force-dynamic';

/**
 * Reads text aloud, in Gujarati by default.
 *
 * Speech synthesis is not something Gemma does, so this is one of the two audio
 * edges handled elsewhere. It matters: a resident who does not read comfortably
 * still needs to hear that their complaint was received and who is coming.
 */
export async function POST(request: Request) {
  let body: { text?: string; language_code?: string; speaker?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  const text = (body.text || '').trim();
  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  try {
    const audio = await synthesiseSpeech(text, {
      languageCode: body.language_code,
      speaker: body.speaker,
    });
    return NextResponse.json({ audio });
  } catch (error) {
    const isServiceError = error instanceof SpeechServiceError;
    const message = error instanceof Error ? error.message : String(error);
    console.error('[ai/tts] synthesis failed:', message);

    return NextResponse.json(
      {
        error: message,
        code: 'synthesis_failed',
        userMessage: 'Audio is not available right now. The text is still on screen.',
      },
      { status: isServiceError ? 503 : 500 }
    );
  }
}
