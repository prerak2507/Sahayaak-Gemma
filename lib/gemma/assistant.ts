/**
 * The operations assistant.
 *
 * A ward officer asks a question in Gujarati, Hindi or English and gets an
 * answer grounded in the platform's actual state.
 *
 * The previous version of this had the platform's statistics written into its
 * system prompt as literals: 847 volunteers, 34 partner organisations, 1,240
 * cases closed, a 14 minute average response. Those numbers were true on the
 * day somebody typed them and drifted from reality every day after, while the
 * assistant went on reciting them to officers with total confidence. Worse, the
 * same numbers appeared on the dashboards from a different source, so the two
 * disagreed.
 *
 * Now the caller passes live figures and Gemma is instructed to use those or
 * decline. There is no number in this file.
 */

import { gemmaChat, type GemmaMessage, type GemmaMeta } from './client';
import { RMC_DEPARTMENTS } from './civic';
import { RMC_WARDS } from '@/lib/geo/rajkot';

export interface AssistantContext {
  /** Live counts read from the database by the caller. Absent keys are simply not mentioned. */
  stats?: Record<string, number | string>;
  /** A digest of currently open reports, when the question is about the live load. */
  openNeeds?: Array<{ title: string; category: string; urgency_score: number; ward?: string | null }>;
}

export interface AssistantTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantReply {
  reply: string;
  _meta: GemmaMeta;
}

function buildSystemPrompt(context: AssistantContext): string {
  const stats = context.stats && Object.keys(context.stats).length
    ? Object.entries(context.stats)
        .map(([key, value]) => `- ${key.replace(/_/g, ' ')}: ${value}`)
        .join('\n')
    : null;

  const needs = context.openNeeds?.length
    ? context.openNeeds
        .slice(0, 25)
        .map(
          (n) =>
            `- [${n.category}] ${n.title} | urgency ${n.urgency_score}/10 | ${n.ward || 'ward unknown'}`
        )
        .join('\n')
    : null;

  return `You are the operations assistant for Sahaayak, used by officers of Rajkot Municipal Corporation and by partner NGOs in Rajkot, Gujarat.

You are speaking to a working officer. Be direct and brief. No preamble, no restating their question back at them.

Officers write in Gujarati, Hindi or English, often mixed. Reply in whichever language they used.

WHAT YOU KNOW
${stats ? `Current platform figures:\n${stats}` : 'No live figures were supplied for this question.'}

${needs ? `Currently open reports:\n${needs}` : 'No open reports were supplied for this question.'}

RMC departments:
${Object.entries(RMC_DEPARTMENTS)
  .map(([id, scope]) => `- ${id}: ${scope}`)
  .join('\n')}

RMC wards: ${RMC_WARDS.join(', ')}.

RULES
State a figure only if it appears above. If you are asked something the data above does not answer, say plainly that you do not have it and name the screen where the officer can find it. Never estimate a count, never recall a figure from another conversation, and never present an example as a real record.

Keep answers under 200 words unless asked for detail.`;
}

/** Answers one officer question against live platform state. */
export async function askAssistant(
  question: string,
  history: AssistantTurn[],
  context: AssistantContext
): Promise<AssistantReply> {
  const messages: GemmaMessage[] = [
    { role: 'system', content: buildSystemPrompt(context) },
    // Trim to the recent turns; the officer's current question is what matters.
    ...history.slice(-8).map((turn) => ({
      role: turn.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: turn.content,
    })),
    { role: 'user', content: question },
  ];

  const result = await gemmaChat({ messages, temperature: 0.3, maxTokens: 600, think: false });

  return { reply: result.content.trim(), _meta: result.meta };
}
