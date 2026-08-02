/**
 * Forward-looking operational calls on Gemma 4.
 *
 * Forecasting, weather risk, cascade prediction and document review. These are
 * the calls where a model is most tempting to over-trust, so each one is shaped
 * to produce something a human acts on rather than something the system acts on
 * by itself.
 */

import { z } from 'zod';
import { gemmaStructured } from './structured';
import { RMC_WARDS } from '@/lib/geo/rajkot';
import type { NeedDigest } from './analytics';
import type { GemmaMeta } from './client';

// ── NGO daily read ────────────────────────────────────────────────────────

export const ngoInsightSchema = z.object({
  summary: z.string().describe('Two sentences on where this organisation should put its people today'),
  priorities: z
    .array(z.object({ title: z.string(), reason: z.string() }))
    .max(3)
    .describe('The needs to take first, each with why. Empty when there is nothing pressing'),
});

export type NgoInsight = z.infer<typeof ngoInsightSchema> & { _meta: GemmaMeta };

export async function summariseForNgo(needs: NeedDigest[]): Promise<NgoInsight> {
  const { data, meta } = await gemmaStructured({
    schema: ngoInsightSchema,
    system: `You brief the coordinator of an NGO working in Rajkot at the start of their day.

Work only from the reports given. A quiet day is a real answer: if there is little open, say so and leave priorities empty rather than manufacturing urgency. Name only needs that appear in the list.`,
    user: needs.length
      ? `OPEN NEEDS:\n${needs
          .slice(0, 25)
          .map((n) => `- ${n.title} | ${n.category} | urgency ${n.urgency_score}/10`)
          .join('\n')}`
      : 'No needs are currently open.',
    think: false,
  });

  return { ...data, _meta: meta };
}

// ── Resource forecasting ──────────────────────────────────────────────────

export const forecastSchema = z.object({
  food_kits: z.number().int().min(0),
  medical_packs: z.number().int().min(0),
  water_litres: z.number().int().min(0),
  reasoning: z.string().describe('What in the history drives these figures'),
  confidence: z
    .enum(['low', 'medium', 'high'])
    .describe('low when the history is too short or too erratic to extrapolate from'),
});

export type ResourceForecast = z.infer<typeof forecastSchema> & { _meta: GemmaMeta };

/**
 * Projects relief supplies for the coming week.
 * Confidence is a required field so a thin history produces a flagged guess
 * rather than a confident-looking number somebody procures against.
 */
export async function forecastResources(
  history: Array<Record<string, unknown>>,
  trend: string
): Promise<ResourceForecast> {
  const { data, meta } = await gemmaStructured({
    schema: forecastSchema,
    system: `You project relief supply requirements for the coming seven days in Rajkot.

Extrapolate from the usage history given and nothing else. If the history is short, erratic or absent, return your best estimate and set confidence to low. Do not present a guess as a projection.`,
    user: `USAGE HISTORY:\n${JSON.stringify(history).slice(0, 4000)}\n\nCURRENT CONDITIONS: ${trend}`,
    think: true,
  });

  return { ...data, _meta: meta };
}

// ── Cascade risk ──────────────────────────────────────────────────────────

export const cascadeRiskSchema = z.object({
  risks: z
    .array(
      z.object({
        title: z.string(),
        probability: z.number().min(0).max(1),
        window_hours: z.number().int().min(1).max(168).describe('When this would materialise'),
        prevention: z.string().describe('The specific action that would stop it'),
      })
    )
    .min(1)
    .max(4),
});

export type CascadeRisks = z.infer<typeof cascadeRiskSchema> & { _meta: GemmaMeta };

/** Predicts second-order failures: what the current open load turns into if left alone. */
export async function predictCascadingRisks(
  needs: NeedDigest[],
  conditions: Record<string, unknown>
): Promise<CascadeRisks> {
  const { data, meta } = await gemmaStructured({
    schema: cascadeRiskSchema,
    system: `You anticipate second-order civic failures in Rajkot: what today's unresolved reports turn into over the next few days.

Rajkot specifics worth reasoning about: monsoon rain over blocked storm drains floods low-lying wards; a sewer overflow near a water main is a contamination route; standing water becomes a mosquito-borne health load within about two weeks; a failed street light on a damaged road compounds night-time accident risk.

Ground every risk in reports that are actually open. Set probability honestly. Do not list a risk the current load does not support.`,
    user: `OPEN REPORTS:\n${needs
      .slice(0, 25)
      .map((n) => `- ${n.title} | ${n.category} | urgency ${n.urgency_score}/10 | ${n.ward || 'ward unknown'}`)
      .join('\n')}\n\nCONDITIONS: ${JSON.stringify(conditions)}`,
    think: true,
  });

  return { ...data, _meta: meta };
}

// ── Weather-driven civic risk ─────────────────────────────────────────────

export const weatherRiskSchema = z.object({
  headline: z.string().describe('One line the duty officer reads first'),
  civic_risk_level: z.enum(['low', 'moderate', 'high', 'severe']),
  expected_load: z
    .array(z.string())
    .min(1)
    .max(4)
    .describe('The kinds of report likely to rise, and in which wards'),
  preparation: z.array(z.string()).min(1).max(4).describe('What to stage before it arrives'),
});

export type WeatherRisk = z.infer<typeof weatherRiskSchema> & { _meta: GemmaMeta };

/**
 * Translates a weather reading into expected civic load.
 * The reading is supplied by the caller from a real weather source. Gemma
 * interprets it; it does not invent the forecast.
 */
export async function interpretWeatherRisk(reading: {
  city?: string;
  temperature?: number;
  precipitation_probability?: number;
  wind_speed?: number;
  current_condition?: string;
}): Promise<WeatherRisk> {
  const { data, meta } = await gemmaStructured({
    schema: weatherRiskSchema,
    system: `You tell the Rajkot Municipal Corporation duty officer what a weather reading means for tomorrow's civic workload.

RMC wards: ${RMC_WARDS.join(', ')}.

Rajkot runs hot and dry for most of the year and takes heavy, concentrated monsoon rain. Heavy rain produces waterlogging, sewer overflow and pothole collapse. Extended heat produces water supply complaints and heat-related medical need. High wind brings down branches and street light fittings.

Reason only from the reading given. Do not forecast weather yourself.`,
    user: JSON.stringify(reading),
    think: true,
  });

  return { ...data, _meta: meta };
}

// ── Zone risk assessment ──────────────────────────────────────────────────

export const zoneAssessmentSchema = z.object({
  zone_status: z.enum(['stable', 'watch', 'strained', 'critical']),
  primary_observation: z.string().describe('The single most important thing about this zone'),
  contributing_factors: z.array(z.string()).min(1).max(4),
  recommended_action: z.string().describe('What RMC should do, specifically'),
  confidence: z
    .enum(['low', 'medium', 'high'])
    .describe('low when the supplied observations are sparse'),
});

export type ZoneAssessment = z.infer<typeof zoneAssessmentSchema> & { _meta: GemmaMeta };

/**
 * Assesses a zone from observations the caller supplies.
 *
 * Deliberately does not estimate remote-sensing quantities. The version this
 * replaces asked the model for a green cover percentage given nothing but a
 * latitude and a longitude. A language model has no imagery, so that figure was
 * invented every single time and then displayed to officers on a satellite
 * dashboard as though it had been measured.
 *
 * If real remote-sensing metrics are available, pass them in `observations` and
 * Gemma will interpret them. If they are not, it reasons from reported civic
 * data alone and says its confidence is low.
 */
export async function assessZoneRisk(input: {
  zone: string;
  lat?: number;
  lng?: number;
  category?: string;
  weather?: Record<string, unknown>;
  /** Real measurements from a remote-sensing or sensor source, when available. */
  observations?: Record<string, unknown>;
  reportedNeeds?: NeedDigest[];
}): Promise<ZoneAssessment> {
  const { data, meta } = await gemmaStructured({
    schema: zoneAssessmentSchema,
    system: `You assess civic risk for a zone of Rajkot for the municipal corporation.

Reason only from what you are given: supplied measurements, weather, and reports residents have filed.

You cannot see satellite imagery. Never state a land cover figure, a vegetation index, a population count or any other quantity that would require an instrument, unless that exact figure appears in the observations you were given. If the inputs are thin, set confidence to low and say what is missing in primary_observation.`,
    user: [
      `ZONE: ${input.zone}`,
      input.lat && input.lng ? `COORDINATES: ${input.lat}, ${input.lng}` : null,
      input.category ? `FOCUS: ${input.category}` : null,
      input.weather ? `WEATHER: ${JSON.stringify(input.weather)}` : null,
      input.observations
        ? `MEASUREMENTS SUPPLIED: ${JSON.stringify(input.observations)}`
        : 'MEASUREMENTS SUPPLIED: none',
      input.reportedNeeds?.length
        ? `REPORTS IN THIS ZONE:\n${input.reportedNeeds
            .slice(0, 20)
            .map((n) => `- ${n.title} | ${n.category} | urgency ${n.urgency_score}/10`)
            .join('\n')}`
        : 'REPORTS IN THIS ZONE: none',
    ]
      .filter(Boolean)
      .join('\n'),
    think: true,
  });

  return { ...data, _meta: meta };
}

// ── Partner documentation review ──────────────────────────────────────────

export const documentReviewSchema = z.object({
  gaps: z
    .array(z.string())
    .describe('Documents or fields that are missing or inconsistent. Empty when nothing is missing'),
  questions_for_reviewer: z
    .array(z.string())
    .max(5)
    .describe('What a human reviewer should ask this organisation'),
  notes: z.string().describe('What the submitted material does and does not establish'),
});

export type DocumentReview = z.infer<typeof documentReviewSchema> & { _meta: GemmaMeta };

/**
 * Reviews a partner organisation's submitted paperwork.
 *
 * Deliberately not a compliance verdict. The version of this that returned
 * `{ compliant: true, score: 85 }` was a language model issuing a regulatory
 * judgement on an organisation from a list of filenames, which is not a
 * decision a model is entitled to make and not one anybody should act on. This
 * prepares a human reviewer's worklist instead.
 */
export async function reviewPartnerDocuments(
  organisation: Record<string, unknown>,
  documents: string[]
): Promise<DocumentReview> {
  const { data, meta } = await gemmaStructured({
    schema: documentReviewSchema,
    system: `You prepare the worklist for a human reviewer assessing an organisation applying to partner with Rajkot Municipal Corporation.

You do not approve, reject or score anyone. You identify what is missing, what is internally inconsistent, and what the reviewer should ask about.

Indian NGO paperwork typically includes a registration certificate, a PAN, 12A and 80G certificates, FCRA registration where foreign funding is involved, audited accounts, and a governing body list. Note absences without assuming bad faith: small organisations are often genuinely disorganised.`,
    user: `ORGANISATION:\n${JSON.stringify(organisation).slice(0, 2000)}\n\nDOCUMENTS SUBMITTED:\n${
      documents.length ? documents.join('\n') : 'None submitted.'
    }`,
    think: true,
  });

  return { ...data, _meta: meta };
}
