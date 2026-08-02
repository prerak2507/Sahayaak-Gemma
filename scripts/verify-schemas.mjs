#!/usr/bin/env node
/**
 * Verifies that every schema the app hands to Gemma serialises to JSON Schema
 * that Ollama will accept.
 *
 * This runs without a model, which is the point: a schema that fails to
 * serialise breaks every call that uses it, and finding that out during a demo
 * is too late.
 *
 *   node scripts/verify-schemas.mjs
 */

import { z } from 'zod';

// Rebuilt here rather than imported, because the app modules are TypeScript and
// pull in Next.js server context. Kept deliberately in step with lib/gemma/*;
// verify-schemas is a smoke test of the Zod-to-JSON-Schema path, not of the
// prompts themselves.
const NEED_CATEGORIES = [
  'roads_potholes', 'drainage_sewerage', 'water_supply', 'electricity_streetlights',
  'garbage_sanitation', 'encroachment', 'fire_safety', 'food', 'medical',
  'water_sanitation', 'disaster_relief', 'mental_health', 'elderly_care',
  'shelter', 'education', 'livelihood', 'child_welfare', 'other',
];

const schemas = {
  triage: z.object({
    valid: z.boolean(),
    rejection_reason: z.enum(['none', 'abusive_or_explicit', 'spam_or_test', 'no_issue_described', 'private_property']),
    language: z.string(),
    auto_title: z.string(),
    summary: z.string(),
    summary_native: z.string(),
    category: z.enum(NEED_CATEGORIES),
    assignment_type: z.enum(['government', 'ngo']),
    assigned_department: z
      .enum(['pwd', 'drainage', 'water_works', 'electricity', 'health_sanitation', 'encroachment', 'fire_safety'])
      .nullable(),
    urgency_score: z.number().min(1).max(10),
    routing_reason: z.string(),
    detected_location_name: z.string().nullable(),
    required_crew_size: z.number().int().min(1).max(8),
    skills_required: z.array(z.string()).min(1).max(4),
  }),

  photoScreen: z.object({
    valid: z.boolean(),
    description: z.string(),
    confidence: z.number().min(0).max(1),
    reason: z.string(),
    category: z.enum(NEED_CATEGORIES),
    severity_visible: z.number().min(1).max(10),
  }),

  crossVerify: z.object({
    matches: z.boolean(),
    reason: z.string(),
    confidence: z.number().min(0).max(1),
  }),

  radar: z.object({
    hotspot: z.string(),
    patterns: z.array(z.string()).min(2).max(4),
    recommendations: z.array(z.string()).min(2).max(4),
    risks: z.array(z.string()).min(2).max(4),
    positiveSignal: z.string(),
  }),

  cascadeRisk: z.object({
    risks: z.array(z.object({
      title: z.string(),
      probability: z.number().min(0).max(1),
      window_hours: z.number().int().min(1).max(168),
      prevention: z.string(),
    })).min(1).max(4),
  }),

  languageDetect: z.object({
    language_code: z.string(),
    script: z.enum(['gujarati', 'devanagari', 'latin', 'other']),
    romanized: z.boolean(),
    confidence: z.number().min(0).max(1),
  }),
};

let failures = 0;

for (const [name, schema] of Object.entries(schemas)) {
  try {
    const json = z.toJSONSchema(schema, { target: 'draft-7' });

    if (json.type !== 'object') throw new Error(`root type is "${json.type}", expected "object"`);
    if (!json.properties || Object.keys(json.properties).length === 0) {
      throw new Error('no properties emitted');
    }

    // Must survive a round trip; Ollama sends this over the wire.
    JSON.parse(JSON.stringify(json));

    const fields = Object.keys(json.properties).length;
    const required = (json.required ?? []).length;
    console.log(`[  ok  ] ${name.padEnd(16)} ${fields} fields, ${required} required`);
  } catch (error) {
    failures++;
    console.log(`[ FAIL ] ${name.padEnd(16)} ${error.message}`);
  }
}

console.log(
  failures === 0
    ? `\nAll ${Object.keys(schemas).length} schemas serialise cleanly.`
    : `\n${failures} schema${failures === 1 ? '' : 's'} failed to serialise.`
);

process.exit(failures === 0 ? 0 : 1);
