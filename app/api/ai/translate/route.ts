import { NextResponse } from 'next/server';
import { translateText } from '@/lib/gemma/language';
import { gemmaErrorResponse } from '@/lib/gemma/route-helpers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let body: {
    text?: string;
    target_language?: string;
    source_language?: string;
    register?: 'plain' | 'official';
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
  }

  const text = (body.text || '').trim();
  if (!text || !body.target_language) {
    return NextResponse.json(
      { error: 'text and target_language are both required' },
      { status: 400 }
    );
  }

  try {
    const result = await translateText(text, body.target_language, {
      sourceLanguage: body.source_language,
      register: body.register,
    });
    return NextResponse.json(result);
  } catch (error) {
    return gemmaErrorResponse(error, 'ai/translate');
  }
}
