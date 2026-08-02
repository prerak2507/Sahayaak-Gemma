/**
 * Policy analysis on Gemma 4.
 *
 * Two related jobs for a ward officer or a commissioner:
 *
 *   analyseSchemeGaps   where the reports coming in are not covered by any
 *                       scheme that exists
 *   draftPolicyBrief    turn that into something that can go up the chain
 *
 * Both are advisory and say so. This is analysis a human signs, not a decision
 * the platform makes.
 */

import { z } from 'zod';
import { gemmaStructured } from './structured';
import { EXISTING_SCHEMES } from '@/lib/data/govt-data';
import type { GemmaMeta } from './client';

function schemeReference(): string {
  return Object.entries(EXISTING_SCHEMES)
    .map(([category, scheme]) => `- ${scheme.name} (${category}): ${scheme.description}. Coverage: ${scheme.coverage}`)
    .join('\n');
}

export const schemeGapSchema = z.object({
  overall_coverage_score: z
    .number()
    .min(0)
    .max(100)
    .describe(
      'How much of the reported need is plausibly addressed by a scheme that already exists. HIGHER MEANS BETTER COVERED. 100 means every reported problem has a scheme that funds fixing it, 0 means none do'
    ),
  scheme_coverage: z
    .array(
      z.object({
        scheme_name: z.string(),
        description: z.string(),
        coverage_percent: z
          .number()
          .min(0)
          .max(100)
          .describe(
            'How much of the need in this scheme\'s own area it actually covers. HIGHER MEANS BETTER. This is not the share of total reports'
          ),
        needs_addressed: z
          .number()
          .int()
          .min(0)
          .describe('How many of the reports given fall within this scheme, as a count'),
        weakness: z.string(),
      })
    )
    .max(4),
  gaps: z
    .array(
      z.object({
        category: z.string(),
        gap_percent: z
          .number()
          .min(0)
          .max(100)
          .describe('How much of this category goes unaddressed by any scheme. HIGHER MEANS WORSE'),
        existing_scheme: z.string().describe('The nearest scheme, or "none" when nothing covers this'),
        scheme_weakness: z.string(),
        severity: z.enum(['critical', 'warning', 'info']),
      })
    )
    .max(5),
  priority_actions: z
    .array(z.object({ action: z.string(), impact: z.string(), timeline: z.string() }))
    .max(3),
  policy_recommendation: z.string(),
  data_summary: z
    .string()
    .describe('What this analysis rests on, including how thin the data is if it is thin'),
});

export type SchemeStatus = 'adequate' | 'strained' | 'critical';

/**
 * Status is derived, not asked for.
 *
 * The model kept labelling a scheme at 0 percent coverage as "adequate" no
 * matter how the threshold was worded in the prompt. A label that contradicts
 * the number beside it destroys trust in the whole page, and this particular
 * label is a comparison against two constants, which is arithmetic rather than
 * judgement. So Gemma estimates the coverage and this function names it.
 */
export function schemeStatus(coveragePercent: number): SchemeStatus {
  if (coveragePercent > 60) return 'adequate';
  if (coveragePercent >= 30) return 'strained';
  return 'critical';
}

export type SchemeGapAnalysis = Omit<z.infer<typeof schemeGapSchema>, 'scheme_coverage'> & {
  scheme_coverage: Array<z.infer<typeof schemeGapSchema>['scheme_coverage'][number] & { status: SchemeStatus }>;
  _meta: GemmaMeta;
};

/**
 * Cross-references live reported need against the schemes that already exist.
 * Percentages are the model's estimates from the distribution it was given and
 * are labelled as such wherever they are displayed.
 */
export async function analyseSchemeGaps(
  needsDistribution: Record<string, number>,
  totalNeeds: number
): Promise<SchemeGapAnalysis> {
  const { data, meta } = await gemmaStructured({
    schema: schemeGapSchema,
    system: `You audit scheme coverage for Rajkot Municipal Corporation: where the problems residents actually report are not addressed by any scheme currently running.

Schemes operating in this area:
${schemeReference()}

Also relevant nationally: PM Gram Sadak Yojana for road connectivity, AMRUT 2.0 for urban water and sewerage, Swachh Bharat Mission 2.0 for solid waste, Jal Jeevan Mission for household water, Ayushman Bharat for health cover.

Work from the distribution given. Your percentages are estimates from that distribution, not measurements, and data_summary must say how much or how little the analysis rests on. If the sample is small, say so rather than producing confident-looking coverage figures.

Name a scheme as covering something only if it genuinely does. "none" is the correct answer for a real gap.

DIRECTION OF THE NUMBERS, which is easy to get backwards:
coverage_percent and overall_coverage_score go UP when things are well covered. A scheme that funds most of what residents report scores high. A scheme that exists but does not fund this kind of work scores low.
gap_percent goes UP when things are badly covered. It is the opposite direction.
Do not simply restate the share of total reports as a coverage figure; that is a measure of what was reported, not of what is funded.`,
    user: `REPORTED NEED DISTRIBUTION:\n${JSON.stringify(needsDistribution, null, 2)}\n\nTOTAL ACTIVE REPORTS: ${totalNeeds}`,
    think: true,
  });

  return {
    ...data,
    scheme_coverage: data.scheme_coverage.map((s) => ({
      ...s,
      status: schemeStatus(s.coverage_percent),
    })),
    _meta: meta,
  };
}

export const policyBriefSchema = z.object({
  title: z.string(),
  executive_summary: z.string().describe('What a commissioner reads if they read nothing else'),
  problem_statement: z.string(),
  proposed_intervention: z.string(),
  estimated_beneficiaries: z
    .string()
    .describe('Expressed as a range with its basis, never as a single invented figure'),
  implementation_steps: z.array(z.string()).min(2).max(6),
  risks: z.array(z.string()).max(4),
  caveat: z
    .string()
    .describe('What this brief does not establish and what must be verified before acting'),
});

export type PolicyBrief = z.infer<typeof policyBriefSchema> & { _meta: GemmaMeta };

/** Drafts a brief from a gap analysis. Advisory: a human owns whatever is submitted. */
export async function draftPolicyBrief(input: {
  gap: Record<string, unknown>;
  context?: string;
}): Promise<PolicyBrief> {
  const { data, meta } = await gemmaStructured({
    schema: policyBriefSchema,
    system: `You draft a short policy brief for Rajkot Municipal Corporation, for an officer to review, edit and sign. You are not writing final policy.

Write plainly, the way a competent municipal officer writes: specific, unadorned, no salesmanship.

Never invent a budget figure, a beneficiary count or a statistic. Where a number is needed, give a range and state what it is derived from. The caveat field must be honest about what this brief does not establish.`,
    user: `GAP ANALYSIS:\n${JSON.stringify(input.gap).slice(0, 4000)}${
      input.context ? `\n\nADDITIONAL CONTEXT:\n${input.context}` : ''
    }`,
    think: true,
    temperature: 0.3,
  });

  return { ...data, _meta: meta };
}
