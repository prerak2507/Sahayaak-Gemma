/**
 * Gujarati, Hindi and English on Gemma 4.
 *
 * This platform's users are in Rajkot. A large share of them write Gujarati, a
 * larger share write Gujarati words in Latin script, and plenty mix all three
 * languages in one sentence. The previous build sent that to a paid Indic
 * translation API and then reasoned about the English that came back, which
 * cost a round trip, a vendor dependency, and whatever nuance was lost in the
 * middle.
 *
 * Gemma 4 is multilingual, so the model that routes the report also reads it in
 * the language it was written in. Nothing is translated before it is
 * understood. Translation here exists only to show a resident their own report
 * back, and to give a crew an English work order.
 *
 * The one thing that does not run on Gemma is the microphone. See lib/gemma/audio.ts.
 */

import { z } from 'zod';
import { gemmaStructured } from './structured';
import { languageName } from '@/lib/i18n/languages';
import type { GemmaMeta } from './client';

export { SUPPORTED_LANGUAGES, languageName } from '@/lib/i18n/languages';

const detectSchema = z.object({
  language_code: z
    .string()
    .describe('ISO 639-1 code of the dominant language, for example gu, hi or en'),
  script: z
    .enum(['gujarati', 'devanagari', 'latin', 'other'])
    .describe('The script it was actually written in, which may not match the language'),
  romanized: z
    .boolean()
    .describe('True when an Indic language is written in Latin letters, such as "pani nathi aavtu"'),
  confidence: z.number().min(0).max(1),
});

export type LanguageDetection = z.infer<typeof detectSchema> & { _meta: GemmaMeta };

/**
 * Identifies the language and script of a message.
 *
 * Script matters separately from language because romanized Gujarati is the
 * single most common way people type here, and it is neither Gujarati script
 * nor English.
 */
export async function detectLanguage(text: string): Promise<LanguageDetection> {
  const { data, meta } = await gemmaStructured({
    schema: detectSchema,
    system:
      'You identify the language and script of short civic messages from Rajkot, Gujarat. Residents commonly write Gujarati or Hindi using Latin letters. Report the language they are speaking and, separately, the script they typed it in.',
    user: text.trim().slice(0, 1000),
    think: false,
  });

  return { ...data, _meta: meta };
}

const translateSchema = z.object({
  translated_text: z.string(),
});

export interface TranslationResult {
  translatedText: string;
  _meta: GemmaMeta;
}

/**
 * Translates text between the languages this platform serves.
 *
 * Register is set deliberately: a municipal notice read by a resident should
 * sound like a person from the corporation wrote it, not like a machine.
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  options: { sourceLanguage?: string; register?: 'plain' | 'official' } = {}
): Promise<TranslationResult> {
  const target = languageName(targetLanguage);
  const source = options.sourceLanguage ? languageName(options.sourceLanguage) : null;
  const register =
    options.register === 'official'
      ? 'Use the register of a municipal notice: correct, courteous and impersonal.'
      : 'Use plain everyday speech that an ordinary resident reads without effort.';

  const { data, meta } = await gemmaStructured({
    schema: translateSchema,
    system: `You translate civic and municipal text for residents of Rajkot, Gujarat.

${register}

Keep place names, ward names, department names and people's names exactly as they are. Keep numbers, dates and reference codes unchanged. Translate the meaning rather than the words. If the text is already in the target language, return it unchanged.

Return only the translation.`,
    user: `Translate into ${target}${source ? ` from ${source}` : ''}:\n\n${text}`,
    think: false,
    temperature: 0.2,
  });

  return { translatedText: data.translated_text, _meta: meta };
}
