/**
 * Civic intake on Gemma 4.
 *
 * A citizen writes or speaks one messy sentence, often in Gujarati, often from
 * a phone, often at night. This module turns that into a routed, prioritised,
 * located municipal ticket. It is the core of the product and it runs entirely
 * on a model that fits on the machine under the desk.
 *
 * Two deliberate constraints:
 *
 *  1. Output is schema-constrained, not parsed out of prose. The shape below is
 *     handed to Gemma as a JSON Schema and enforced during decoding.
 *  2. The model never invents coordinates. It names a place; lib/geo resolves
 *     it. An unresolved place asks the citizen for a pin.
 */

import { z } from 'zod';
import { gemmaStructured } from './structured';
import { landmarkVocabulary, resolveLandmark } from '@/lib/geo/rajkot';
import type { GemmaMeta } from './client';

/** Rajkot Municipal Corporation service departments. */
export const RMC_DEPARTMENTS = {
  pwd: 'Roads, potholes, surfacing, dividers, footpaths',
  drainage: 'Sewer lines, manholes, storm drains, waterlogging',
  water_works: 'Water mains, pipeline leaks, valves, supply pressure',
  electricity: 'Street lights, poles, feeder cables, public wiring',
  health_sanitation: 'Garbage collection, dumping, street cleaning, public hygiene',
  encroachment: 'Illegal construction and occupation of public land',
  fire_safety: 'Fire, gas leaks, structural collapse, immediate public hazard',
} as const;

export type RmcDepartment = keyof typeof RMC_DEPARTMENTS;

export const NEED_CATEGORIES = [
  'roads_potholes',
  'drainage_sewerage',
  'water_supply',
  'electricity_streetlights',
  'garbage_sanitation',
  'encroachment',
  'fire_safety',
  'food',
  'medical',
  'water_sanitation',
  'disaster_relief',
  'mental_health',
  'elderly_care',
  'shelter',
  'education',
  'livelihood',
  'child_welfare',
  'other',
] as const;

/**
 * Why a report was refused. An explicit reason beats a bare `valid: false`,
 * because the citizen has to be told something useful and the operator has to
 * be able to audit refusals.
 */
export const REJECTION_REASONS = [
  'none',
  'abusive_or_explicit',
  'spam_or_test',
  'no_issue_described',
  'private_property',
] as const;

export const triageSchema = z.object({
  valid: z
    .boolean()
    .describe('True when this is a genuine request about public infrastructure or community aid'),
  // Tolerant of null and of unexpected wording.
  //
  // A strict enum here failed every report on some model builds, because a
  // valid report is naturally described as having no rejection reason and the
  // model returns null rather than the string "none". One field's phrasing
  // should not throw away an otherwise perfect triage.
  rejection_reason: z
    .preprocess((v) => {
      if (v === null || v === undefined || v === '') return 'none';
      const s = String(v).toLowerCase().replace(/[\s-]+/g, '_');
      return (REJECTION_REASONS as readonly string[]).includes(s) ? s : 'none';
    }, z.enum(REJECTION_REASONS))
    .describe('Why the report was refused, or "none" when it is valid'),
  language: z
    .enum(['gu', 'hi', 'en', 'other'])
    .describe('Language the resident wrote in. Romanized Gujarati is gu, not en'),
  auto_title: z.string().describe('A specific 4 to 8 word title naming the problem and the place'),
  summary: z
    .string()
    .describe(
      'One sentence in ENGLISH ONLY, whatever language the resident used. This is the work order the crew reads. Never write this field in Gujarati or Hindi'
    ),
  summary_native: z
    .string()
    .describe(
      'The same sentence written in the native script of the language field: Gujarati script for gu, Devanagari for hi, English for en. Never copy the resident wording back'
    ),
  category: z
    .enum(NEED_CATEGORIES)
    .describe(
      'Must match assigned_department: pwd is roads_potholes, drainage is drainage_sewerage, water_works is water_supply, electricity is electricity_streetlights, health_sanitation is garbage_sanitation'
    ),
  assignment_type: z
    .enum(['government', 'ngo'])
    .describe('government for municipal infrastructure, ngo for humanitarian and social aid'),
  assigned_department: z
    .enum(['pwd', 'drainage', 'water_works', 'electricity', 'health_sanitation', 'encroachment', 'fire_safety'])
    .nullable()
    .describe('The RMC department that owns this, or null when assignment_type is ngo'),
  urgency_score: z
    .number()
    .min(0)
    .max(10)
    .describe(
      '0 when the report is not valid, otherwise 1 for cosmetic up to 10 for immediate danger to life. Judge by public safety risk'
    ),
  routing_reason: z.string().describe('One sentence justifying the routing and the urgency'),
  detected_location_name: z
    .string()
    .nullable()
    .describe('A place named in the report, copied exactly from the known landmark list, else null'),
  required_crew_size: z
    .number()
    .int()
    .min(0)
    .max(8)
    .describe('People needed on site. 0 when the report is not valid'),
  skills_required: z
    .array(z.string())
    .max(4)
    .describe('Concrete trade skills, lowercase. Empty when the report is not valid'),
});

export type Triage = z.infer<typeof triageSchema>;

export interface TriageResult extends Triage {
  /** Filled from the gazetteer, never from the model. Null when unresolvable. */
  location: { name: string; lat: number; lng: number } | null;
  /** True when the citizen must place a pin because no known landmark was named. */
  needs_location_pin: boolean;
  _meta: GemmaMeta;
}

const SYSTEM_PROMPT = `You are the intake officer for Sahaayak, the civic reporting platform used by Rajkot Municipal Corporation and its partner NGOs in Rajkot, Gujarat.

A resident has reported a problem. Read it and decide what happens to it.

RESIDENTS WRITE IN GUJARATI, HINDI OR ENGLISH, OFTEN MIXED IN ONE SENTENCE.
Understand the report in whatever language it arrives in. Never ask the resident to rewrite it.

Much of it arrives as Gujarati typed in Latin letters. That is Gujarati, so set language to gu, and write summary_native in Gujarati script rather than repeating what they typed.

Common Gujarati words in civic reports, so you do not mistranslate them:
- khado / khada = pothole or pit in the road, never a rock
- pani = water, pani nathi aavtu = no water is coming
- gatar = sewer or drain, ubhrai chhe = it is overflowing
- light / batti band = the light is not working
- kachro = rubbish, rasto = road, nal = tap
- lapsi gai = skidded, futi gai = burst, tuti gai = broken

WHAT IS A VALID REPORT
Valid: public municipal assets (streets, public street lights, water mains, public sewers, public land, municipal garbage) and community aid (food, medical camps, elderly care, shelter, blood donation).
Not valid, set valid to false and give the reason:
- abusive_or_explicit: profanity, abuse, sexual or romantic content, in any language
- spam_or_test: greetings with no issue, keyboard mashing, obvious tests
- no_issue_described: a message that never states a problem
- private_property: a fault entirely inside a private home or business. RMC maintains public assets, not private ones.
  This one is missed often, so be strict. If the fault is inside someone's own house or shop, it is private however politely they ask. A light in a bedroom, a tap in a kitchen, a fan, a switchboard, a leaking pipe under a private sink, wiring inside a flat: all private, all rejected.
  The test is whether RMC owns the thing that is broken. A street light on a pole is RMC's. The light in your bedroom is yours. "mara ghar na bedroom ni light" means the light in my house's bedroom, which is private.
  A fault in shared parts of a housing society, such as a common water tank or a society's main line, is still not RMC's.

WHO IT GOES TO
government: infrastructure RMC owns and repairs.
ngo: humanitarian and social relief delivered by volunteers.

DEPARTMENTS
${Object.entries(RMC_DEPARTMENTS)
  .map(([id, scope]) => `- ${id}: ${scope}`)
  .join('\n')}

URGENCY
Score on danger to the public, not on how upset the resident sounds. Live electrical wire, fire, gas, collapse, or contaminated drinking water is 9 or 10. A pothole on a busy road is 5 to 7. Faded paint is 1 or 2.

WHEN A REPORT DESCRIBES MORE THAN ONE PROBLEM
Pick the one that is most dangerous, route to that department, and set category to match that department. Mention the rest in the summary so the crew knows. Never set a category belonging to one department and assign the work to another.

LANGUAGE OF EACH FIELD
summary is always English, because a crew reads it. summary_native is always the resident's language in its own script, because the resident reads it. auto_title follows the resident's language.

LOCATION
If the report names one of these Rajkot landmarks, copy that name exactly into detected_location_name:
${landmarkVocabulary()
  .map((name) => `- ${name}`)
  .join('\n')}
If it names nowhere, or names somewhere not on that list, return null. Never invent a location and never guess coordinates.

Answer only with the JSON object described by the schema.`;

/**
 * Triages one citizen report.
 * Throws on model or schema failure so the caller decides how to degrade;
 * nothing here silently substitutes a canned answer for a real decision.
 */
export async function triageReport(input: {
  description: string;
  /** Optional photo, base64 without the data: prefix. Gemma reads it alongside the text. */
  imageBase64?: string;
  /** Anything the citizen already told us, for example a pin they dropped. */
  contextNote?: string;
}): Promise<TriageResult> {
  const userContent = [
    `RESIDENT REPORT:\n${input.description.trim()}`,
    input.contextNote ? `\nADDITIONAL CONTEXT:\n${input.contextNote}` : '',
    input.imageBase64 ? '\nA photo from the resident is attached. Use it to judge severity.' : '',
  ]
    .filter(Boolean)
    .join('\n');

  const { data, meta } = await gemmaStructured({
    schema: triageSchema,
    system: SYSTEM_PROMPT,
    user: userContent,
    images: input.imageBase64 ? [input.imageBase64] : undefined,
    // Thinking is off here. The schema and the department definitions already
    // carry the structure that reasoning would have to rediscover, and on a
    // laptop GPU the extra tokens cost more than they buy. Set
    // GEMMA_TRIAGE_THINK=true to compare.
    think: process.env.GEMMA_TRIAGE_THINK === 'true',
  });

  const location = resolveLandmark(data.detected_location_name);

  return {
    ...data,
    // An ngo report has no RMC department, whatever the model said.
    assigned_department: data.assignment_type === 'ngo' ? null : data.assigned_department,
    location,
    needs_location_pin: location === null,
    _meta: meta,
  };
}
