/**
 * Operational analysis on Gemma 4.
 *
 * These are the reads: what is going wrong across the city, who should be sent
 * where, what a search box meant, what a month of work added up to. Each is a
 * schema-constrained call, so the dashboards consume typed objects rather than
 * whatever prose the model felt like producing.
 *
 * Every function throws on failure. Dashboards render an error state; they do
 * not render invented numbers. A fabricated hotspot is worse than a blank
 * panel, because someone will act on it.
 */

import { z } from 'zod';
import { gemmaStructured } from './structured';
import { NEED_CATEGORIES } from './civic';
import { RMC_WARDS } from '@/lib/geo/rajkot';
import type { GemmaMeta } from './client';

/** The slice of a need that analysis actually reads. Keeps prompts small and PII out. */
export interface NeedDigest {
  id?: string;
  title: string;
  category: string;
  urgency_score: number;
  ward?: string | null;
  city?: string | null;
  status?: string;
  created_at?: string;
}

function digestLines(needs: NeedDigest[], limit = 40): string {
  return needs
    .slice(0, limit)
    .map(
      (n) =>
        `- [${n.category}] ${n.title} | urgency ${n.urgency_score}/10 | ${n.ward || n.city || 'location unknown'}${
          n.status ? ` | ${n.status}` : ''
        }`
    )
    .join('\n');
}

// ── City-wide situational read ────────────────────────────────────────────

export const radarSchema = z.object({
  hotspot: z.string().describe('The ward or corridor carrying the most severe load right now'),
  patterns: z
    .array(z.string())
    .min(2)
    .max(4)
    .describe('Patterns across reports that a single ticket would not reveal'),
  recommendations: z
    .array(z.string())
    .min(2)
    .max(4)
    .describe('Concrete actions RMC or an NGO could take this week'),
  risks: z
    .array(z.string())
    .min(2)
    .max(4)
    .describe('What gets worse if these are left as they are'),
  positiveSignal: z.string().describe('Something genuinely under control, to keep the read honest'),
});

export type RadarInsights = z.infer<typeof radarSchema> & { _meta: GemmaMeta };

export async function analyseCityLoad(needs: NeedDigest[]): Promise<RadarInsights> {
  const { data, meta } = await gemmaStructured({
    schema: radarSchema,
    system: `You read the live civic load for Rajkot Municipal Corporation and tell the duty officer what is actually happening.

RMC wards: ${RMC_WARDS.join(', ')}.

Work only from the reports given. Do not state a number that is not derivable from them, and do not name a ward that does not appear. If the reports are too few to support a claim, say the signal is thin rather than inventing a trend.

A pattern is something no single ticket shows: several water complaints on one road suggesting one broken main, medical reports clustering in a week, drainage reports rising before the monsoon.`,
    user: `${needs.length} open reports:\n\n${digestLines(needs)}`,
    think: true,
  });

  return { ...data, _meta: meta };
}

// ── Search ────────────────────────────────────────────────────────────────

export const searchFilterSchema = z.object({
  ward: z.string().nullable().describe('An RMC ward named in the query, else null'),
  category: z.enum(NEED_CATEGORIES).nullable(),
  min_urgency: z.number().min(0).max(10).nullable(),
  is_urgent: z.boolean().describe('True when the wording implies immediacy'),
  free_text: z.string().nullable().describe('Whatever the filters above do not capture'),
});

export type SearchFilter = z.infer<typeof searchFilterSchema> & { _meta: GemmaMeta };

/** Turns a search box into a filter. Accepts Gujarati, Hindi and English queries. */
export async function parseSearch(query: string): Promise<SearchFilter> {
  const { data, meta } = await gemmaStructured({
    schema: searchFilterSchema,
    system: `You convert search queries into filters for the Sahaayak civic dashboard in Rajkot, Gujarat.

Queries arrive in Gujarati, Hindi or English. Understand any of them.

RMC wards: ${RMC_WARDS.join(', ')}.
Categories: ${NEED_CATEGORIES.join(', ')}.

Only fill a field the query actually implies. "urgent water problems in Mavdi" sets ward, category and urgency. "potholes" sets category alone and leaves the rest null.`,
    user: query.trim().slice(0, 300),
    think: false,
  });

  return { ...data, _meta: meta };
}

// ── Volunteer deployment ──────────────────────────────────────────────────

export interface VolunteerDigest {
  name: string;
  skills: string[];
  rating?: number;
  status?: string;
}

export const deploymentSchema = z.object({
  strategy: z.string().describe('Two sentences on how to deploy the people available'),
  matches: z
    .array(
      z.object({
        volunteerName: z.string(),
        needTitle: z.string(),
        reason: z.string().describe('The specific skill or circumstance that makes this the right pairing'),
      })
    )
    .max(8),
  gaps: z
    .array(z.string())
    .max(5)
    .describe('Skills the open needs require that nobody in the pool has'),
});

export type Deployment = z.infer<typeof deploymentSchema> & { _meta: GemmaMeta };

export async function planDeployment(
  volunteers: VolunteerDigest[],
  needs: NeedDigest[]
): Promise<Deployment> {
  const { data, meta } = await gemmaStructured({
    schema: deploymentSchema,
    system: `You assign volunteers to open community needs for an NGO working in Rajkot.

Only pair a volunteer with a need their listed skills actually support, and only use names and titles exactly as given. If no one in the pool fits a need, that is a gap, not a stretch assignment. Volunteers who are unavailable are not matched.`,
    user: `VOLUNTEERS:\n${volunteers
      .map(
        (v) =>
          `- ${v.name} | skills: ${v.skills.join(', ') || 'none listed'}${
            v.rating ? ` | rating ${v.rating}` : ''
          }${v.status ? ` | ${v.status}` : ''}`
      )
      .join('\n')}\n\nOPEN NEEDS:\n${digestLines(needs, 20)}`,
    think: true,
  });

  return { ...data, _meta: meta };
}

// ── Volunteer-side ranking ────────────────────────────────────────────────

export const rankedNeedsSchema = z.object({
  ranked_need_ids: z
    .array(z.string())
    .max(5)
    .describe('Need ids in priority order, copied exactly from the input'),
  reasoning: z.string().describe('One sentence on why the first is first'),
});

export type RankedNeeds = z.infer<typeof rankedNeedsSchema> & { _meta: GemmaMeta };

/** Ranks open needs for one volunteer. Ids are echoed back so the caller can validate them. */
export async function rankNeedsForVolunteer(
  skills: string[],
  needs: NeedDigest[]
): Promise<RankedNeeds> {
  const { data, meta } = await gemmaStructured({
    schema: rankedNeedsSchema,
    system:
      'You choose which open civic needs a volunteer should take next. Weigh their skills first, then urgency. Return only ids that appear in the list you were given, at most five, best first.',
    user: `VOLUNTEER SKILLS: ${skills.join(', ') || 'none listed'}\n\nOPEN NEEDS:\n${needs
      .slice(0, 30)
      .map((n) => `- id=${n.id} | ${n.title} | ${n.category} | urgency ${n.urgency_score}/10`)
      .join('\n')}`,
    think: false,
  });

  // The model may still echo an id that is not in the list; drop anything unknown.
  const known = new Set(needs.map((n) => n.id).filter(Boolean) as string[]);
  return {
    ...data,
    ranked_need_ids: data.ranked_need_ids.filter((id) => known.has(id)),
    _meta: meta,
  };
}

// ── Autonomous dispatch ───────────────────────────────────────────────────

export const volunteerChoiceSchema = z.object({
  volunteer_id: z.string().describe('The id of the chosen volunteer, copied exactly from the list'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('How sure you are. Below 0.8 the assignment goes to a human coordinator instead'),
  reason: z.string().describe('Why this person, in one sentence they could be shown'),
});

export type VolunteerChoice = z.infer<typeof volunteerChoiceSchema> & { _meta: GemmaMeta };

/**
 * Picks one volunteer for an urgent need.
 *
 * The caller enforces a confidence floor before acting. Auto-assigning someone
 * to a life-safety task on a weak match is worse than waiting for a
 * coordinator, so an unsure answer is a useful answer here.
 */
export async function chooseVolunteer(
  need: Record<string, unknown>,
  volunteers: Array<{ id: string; name?: string; skills?: string[]; currentLoad?: number }>
): Promise<VolunteerChoice> {
  const { data, meta } = await gemmaStructured({
    schema: volunteerChoiceSchema,
    system: `You choose which volunteer to send to an urgent need in Rajkot.

Weigh skills against what the task actually requires, then current workload. Someone already carrying several open tasks is a worse choice than an equally qualified person who is free.

Return an id from the list and nothing else. If nobody in the list is a good fit, still return the closest and set confidence below 0.8, which routes the decision to a human coordinator.`,
    user: `NEED:\n${JSON.stringify(need).slice(0, 1500)}\n\nAVAILABLE VOLUNTEERS:\n${volunteers
      .map(
        (v) =>
          `- id=${v.id} | ${v.name || 'unnamed'} | skills: ${
            v.skills?.join(', ') || 'none listed'
          } | open tasks: ${v.currentLoad ?? 'unknown'}`
      )
      .join('\n')}`,
    think: true,
  });

  return { ...data, _meta: meta };
}

// ── Impact writing ────────────────────────────────────────────────────────

export const narrativeSchema = z.object({
  narrative: z.string().describe('Three short paragraphs: the situation, the work, the result'),
});

export type Narrative = z.infer<typeof narrativeSchema> & { _meta: GemmaMeta };

/**
 * Writes an impact summary from real counts.
 * The figures are passed in and must be used as given: this exists to phrase
 * numbers, not to produce them.
 */
export async function writeImpactNarrative(
  organisationName: string,
  stats: Record<string, unknown>
): Promise<Narrative> {
  const { data, meta } = await gemmaStructured({
    schema: narrativeSchema,
    system: `You write the impact summary for an organisation working in Rajkot, for a report its funders and the municipal corporation will read.

Use only the figures given. Never round them up, never add a statistic that is not there, and never describe impact the numbers do not show. If the numbers are modest, say so plainly. Write like a person who was there. Avoid promotional language.`,
    user: `ORGANISATION: ${organisationName}\nFIGURES: ${JSON.stringify(stats)}`,
    think: false,
    temperature: 0.4,
  });

  return { ...data, _meta: meta };
}
