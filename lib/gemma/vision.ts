/**
 * Photo understanding on Gemma 4.
 *
 * Gemma 4 takes images natively on every variant, so the same local model that
 * routes the text also looks at the picture. Two jobs:
 *
 *   screenPhoto        is this a real photograph of a civic problem
 *   crossVerifyPhoto   does the photo actually show what the resident wrote
 *
 * The second one is the anti-fraud check. It is the reason a resident cannot
 * photograph one pothole and file six tickets about six streets.
 *
 * Both throw on failure. The previous implementation returned `valid: true`
 * whenever the model was unreachable or the response failed to parse, which
 * meant an outage silently approved everything while the interface went on
 * claiming each report had been verified. A verification that cannot fail is
 * not a verification.
 */

import { z } from 'zod';
import { gemmaStructured } from './structured';
import { NEED_CATEGORIES } from './civic';
import type { GemmaMeta } from './client';

/** Browsers send data: URLs; Ollama wants bare base64. */
export function stripImagePrefix(input: string): string {
  const match = input.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
  return match ? match[1] : input;
}

export const photoScreenSchema = z.object({
  valid: z.boolean().describe('True when this is a real photograph of a genuine civic problem'),
  description: z.string().describe('What is actually visible, in one short sentence'),
  confidence: z.number().min(0).max(1),
  reason: z.string().describe('Why it was rejected, or an empty string when accepted'),
  category: z.enum(NEED_CATEGORIES),
  severity_visible: z
    .number()
    .min(0)
    .max(10)
    .describe(
      'Severity judged from the photo alone, ignoring what the resident claimed. 0 when the photo shows no civic problem at all'
    ),
});

export type PhotoScreen = z.infer<typeof photoScreenSchema>;

const SCREEN_PROMPT = `You are the photo desk for Sahaayak, the civic reporting platform used by Rajkot Municipal Corporation.

A resident attached this photo to a report. Decide whether it is usable evidence.

Accept a real photograph of a civic or humanitarian problem: damaged roads, waterlogging, overflowing sewers, leaking pipes, dead street lights, dumped garbage, encroachment, fire or smoke, a flooded street, an animal or person visibly in need.

Reject:
- screenshots of apps, chats or web pages
- illustrations, cartoons, renders or generated images
- photographs with no civic content, such as a selfie in a room
- explicit, intimate or abusive content
- images whose only content is text

Judge severity from what you can see, not from what anyone claims. A hairline crack is not a collapsed road.

Answer only with the JSON object described by the schema.`;

export interface PhotoScreenResult extends PhotoScreen {
  _meta: GemmaMeta;
}

/** Throws GemmaUnavailableError or GemmaSchemaError. Callers must not treat a throw as approval. */
export async function screenPhoto(imageBase64: string): Promise<PhotoScreenResult> {
  const { data, meta } = await gemmaStructured({
    schema: photoScreenSchema,
    system: SCREEN_PROMPT,
    user: 'Assess the attached photograph as evidence for a civic report.',
    images: [stripImagePrefix(imageBase64)],
    think: false,
  });

  return { ...data, _meta: meta };
}

export const crossVerifySchema = z.object({
  matches: z
    .boolean()
    .describe('True when the photograph plausibly shows the problem the resident described'),
  reason: z
    .string()
    .describe('When it does not match, what the photo shows instead. Empty string when it matches'),
  confidence: z.number().min(0).max(1),
});

export type CrossVerify = z.infer<typeof crossVerifySchema>;

const CROSS_VERIFY_PROMPT = `You are the verification desk for Rajkot Municipal Corporation.

You are given a photograph and the words a resident wrote about it. Decide whether the photograph is evidence for that description.

The resident may write in Gujarati, Hindi or English. Understand it in whatever language it arrives in. Do not translate it in your answer.

Match means the photograph plausibly shows the reported problem. Residents describe things loosely and photograph them badly, so allow for a poor angle, bad light and imprecise wording. "Road broken near my house" over a photograph of a cracked street is a match.

Not a match means the photograph shows something unrelated to the description, or shows nothing of the reported problem at all. A photograph of a tree next to a report about a burst water pipe is not a match.

Answer only with the JSON object described by the schema.`;

export interface CrossVerifyResult extends CrossVerify {
  _meta: GemmaMeta;
}

/** Throws on any failure. A throw means "unverified", never "approved". */
export async function crossVerifyPhoto(
  imageBase64: string,
  residentDescription: string
): Promise<CrossVerifyResult> {
  const { data, meta } = await gemmaStructured({
    schema: crossVerifySchema,
    system: CROSS_VERIFY_PROMPT,
    user: `The resident wrote:\n"${residentDescription.trim()}"\n\nDoes the attached photograph show this?`,
    images: [stripImagePrefix(imageBase64)],
    think: false,
  });

  return { ...data, _meta: meta };
}

export const solutionCheckSchema = z.object({
  resolved: z.boolean().describe('True when the photograph shows the reported problem actually fixed'),
  feedback: z
    .string()
    .describe('What the crew should be told: what is done, or what is still outstanding'),
  confidence: z.number().min(0).max(1),
  concerns: z
    .array(z.string())
    .max(3)
    .describe('Anything visibly incomplete or unsafe about the repair. Empty when the work is clean'),
});

export type SolutionCheck = z.infer<typeof solutionCheckSchema>;

const SOLUTION_PROMPT = `You are the completion desk for Rajkot Municipal Corporation.

A crew has photographed work they say is finished. Decide whether the photograph actually shows the reported problem resolved.

Be exacting. This photograph is what closes the ticket, and a ticket closed on a bad photograph means the resident's problem is still there with no way left to report it.

Resolved means the reported fault is visibly gone: the pothole is filled and level, the drain runs, the light is lit, the rubbish is cleared.
Not resolved means work is partial, the photograph shows a different location, the photograph shows the original problem again, or nothing in it establishes that anything was done.

Flag visible safety problems even when the work itself is complete: an unbarricaded excavation, exposed wiring, debris left in a carriageway.

Answer only with the JSON object described by the schema.`;

export interface SolutionCheckResult extends SolutionCheck {
  _meta: GemmaMeta;
}

/**
 * Checks completion evidence before a ticket closes.
 * Throws rather than approving when the model is unreachable: an unverifiable
 * closure has to stay open.
 */
export async function verifySolutionPhoto(
  imageBase64: string,
  issue: { title?: string; description?: string; category?: string }
): Promise<SolutionCheckResult> {
  const { data, meta } = await gemmaStructured({
    schema: solutionCheckSchema,
    system: SOLUTION_PROMPT,
    user: `THE ORIGINAL REPORT
Title: ${issue.title || 'not recorded'}
Category: ${issue.category || 'not recorded'}
Description: ${issue.description || 'not recorded'}

Does the attached photograph show this resolved?`,
    images: [stripImagePrefix(imageBase64)],
    think: true,
  });

  return { ...data, _meta: meta };
}
