/**
 * The one place a need document is shaped.
 *
 * Around twenty surfaces read the `needs` collection, and each filters on a
 * different field: the officer dashboards on `assignment_type`, the ward map on
 * `city` and `assigned_department`, the telemetry panel on `status`, the
 * cockpit on `urgency_score`. A report that is missing any one of them simply
 * does not appear on that screen, silently.
 *
 * So nothing constructs a need by hand. Gemma triage, the seed script, the
 * WhatsApp bot and manual entry all call buildNeed, which means a seeded report
 * and a live one are the same shape and behave identically everywhere. Add a
 * field here and every writer gets it at once.
 */

import type { TriageResult } from '@/lib/gemma/civic';
import { RAJKOT_CENTRE } from '@/lib/geo/rajkot';

/**
 * How a need is split between the municipal corporation and partner NGOs.
 *
 * Note for anyone reading the git history: the dashboards used to filter on
 * `category === 'government'`, overloading the category field as a routing
 * discriminator while the type system used it for the service taxonomy
 * (roads_potholes, water_supply, ...). Both meanings could not hold at once, so
 * a Gemma-triaged report carrying a real taxonomy value was invisible on every
 * officer dashboard. `assignment_type` is now the only discriminator and
 * `category` is only ever the taxonomy.
 */
export type AssignmentType = 'government' | 'ngo';

export interface NeedDocument {
  title: string;
  description: string;
  description_lang: string;
  summary: string;
  summary_native: string;

  // Routing. assignment_type is the discriminator every dashboard filters on.
  assignment_type: AssignmentType;
  assigned_department: string | null;
  category: string;

  status: string;
  urgency_score: number;
  required_crew_size: number;
  skills_required: string[];
  routing_reason: string;

  // Placement. Coordinates come from the gazetteer, never from the model.
  city: string;
  state: string;
  ward: string | null;
  location_address: string;
  location_lat: number;
  location_lng: number;
  needs_location_pin: boolean;

  // Crew. Filled by the deterministic assigner, not by Gemma.
  assigned_worker_id: string | null;
  assigned_worker_name: string | null;
  assigned_worker_title: string | null;

  // Provenance, so a screen can always say where a decision came from.
  source_type: string;
  ai_validated: boolean;
  ai_flags: string[];
  ai_model: string | null;

  photo_urls: string[];
  upvotes: number;
  reported_by: string | null;

  created_at: string;
  updated_at: string;
}

/** Departments own a taxonomy category. Keeps the two fields from contradicting. */
const DEPARTMENT_CATEGORY: Record<string, string> = {
  pwd: 'roads_potholes',
  drainage: 'drainage_sewerage',
  water_works: 'water_supply',
  electricity: 'electricity_streetlights',
  health_sanitation: 'garbage_sanitation',
  encroachment: 'encroachment',
  fire_safety: 'fire_safety',
};

export interface BuildNeedInput {
  title: string;
  description: string;
  assignment_type: AssignmentType;
  assigned_department?: string | null;
  category?: string;
  urgency_score: number;

  summary?: string;
  summary_native?: string;
  description_lang?: string;
  routing_reason?: string;
  required_crew_size?: number;
  skills_required?: string[];

  ward?: string | null;
  location?: { name: string; lat: number; lng: number } | null;

  worker?: { id: string; name: string; title: string } | null;

  source_type?: string;
  ai_validated?: boolean;
  ai_model?: string | null;
  reported_by?: string | null;
  photo_urls?: string[];
  status?: string;
  created_at?: string;
}

/**
 * Produces a complete need document.
 *
 * Every field every consumer reads is present, so a need built here shows up on
 * the map, the cockpit, telemetry, scheme gaps and the citizen feed without any
 * of them needing to know where it came from.
 */
export function buildNeed(input: BuildNeedInput): NeedDocument {
  const now = new Date().toISOString();
  const createdAt = input.created_at ?? now;

  const department = input.assignment_type === 'ngo' ? null : input.assigned_department ?? null;

  // Keep category and department consistent. An explicit category is honoured
  // only when it does not contradict the department that owns the work.
  const departmentCategory = department ? DEPARTMENT_CATEGORY[department] : undefined;
  const category = departmentCategory ?? input.category ?? 'other';

  // No location means no coordinates invented: fall back to the city centre and
  // flag it, so the UI can ask for a pin instead of pretending to know.
  const placed = input.location ?? null;

  return {
    title: input.title,
    description: input.description,
    description_lang: input.description_lang ?? 'en',
    summary: input.summary ?? input.description,
    summary_native: input.summary_native ?? '',

    assignment_type: input.assignment_type,
    assigned_department: department,
    category,

    status: input.status ?? 'open',
    urgency_score: input.urgency_score,
    required_crew_size: input.required_crew_size ?? 2,
    skills_required: input.skills_required ?? [],
    routing_reason: input.routing_reason ?? '',

    city: 'Rajkot',
    state: 'Gujarat',
    ward: input.ward ?? null,
    location_address: placed ? `${placed.name}, Rajkot` : 'Rajkot',
    location_lat: placed?.lat ?? RAJKOT_CENTRE.lat,
    location_lng: placed?.lng ?? RAJKOT_CENTRE.lng,
    needs_location_pin: placed === null,

    assigned_worker_id: input.worker?.id ?? null,
    assigned_worker_name: input.worker?.name ?? null,
    assigned_worker_title: input.worker?.title ?? null,

    source_type: input.source_type ?? 'web',
    ai_validated: input.ai_validated ?? false,
    ai_flags: [],
    ai_model: input.ai_model ?? null,

    photo_urls: input.photo_urls ?? [],
    upvotes: 0,
    reported_by: input.reported_by ?? null,

    created_at: createdAt,
    updated_at: createdAt,
  };
}

/**
 * Builds a need from a Gemma triage, and the crew assignment if dispatch ran.
 * This is the path a real resident report takes.
 */
export function buildNeedFromTriage(
  triage: TriageResult,
  options: {
    originalDescription: string;
    worker?: { id: string; name: string; title: string } | null;
    ward?: string | null;
    location?: { name: string; lat: number; lng: number } | null;
    source_type?: string;
    reported_by?: string | null;
    photo_urls?: string[];
  }
): NeedDocument {
  return buildNeed({
    title: triage.auto_title,
    description: options.originalDescription,
    description_lang: triage.language,
    summary: triage.summary,
    summary_native: triage.summary_native,

    assignment_type: triage.assignment_type,
    assigned_department: triage.assigned_department,
    category: triage.category,
    urgency_score: triage.urgency_score,
    routing_reason: triage.routing_reason,
    required_crew_size: triage.required_crew_size,
    skills_required: triage.skills_required,

    ward: options.ward ?? options.location?.name ?? triage.location?.name ?? null,
    location: options.location ?? triage.location,

    worker: options.worker ?? null,

    source_type: options.source_type ?? 'web',
    // True because Gemma actually looked at this one.
    ai_validated: true,
    ai_model: triage._meta.model,
    reported_by: options.reported_by ?? null,
    photo_urls: options.photo_urls ?? [],
  });
}

// ── Scoping ───────────────────────────────────────────────────────────────

/** The city this deployment serves. Everything written by buildNeed carries it. */
export const SERVED_CITY = 'Rajkot';

/**
 * Whether a record belongs to this deployment.
 *
 * The Firebase project is shared with an earlier version of this platform that
 * operated in Delhi, and its rows are still in the collection. Rather than
 * delete another application's data, every read is scoped: a record counts only
 * if it is explicitly for the city we serve. A record with no city is excluded,
 * because an unlabelled row is exactly the kind of thing that turns out to
 * belong to someone else.
 */
export function isServedCity(need: unknown): boolean {
  const city = (need as { city?: unknown } | null)?.city;
  return typeof city === 'string' && city.trim().toLowerCase() === SERVED_CITY.toLowerCase();
}

/**
 * Filters a list of needs down to this deployment's city.
 * Deliberately loose in its type: callers pass raw Firestore DocumentData,
 * which carries no compile-time shape.
 */
export function scopeToCity<T>(needs: T[]): T[] {
  return needs.filter(isServedCity);
}

// ── Derived statistics ────────────────────────────────────────────────────

export interface PlatformStats {
  total_needs: number;
  open_needs: number;
  needs_resolved: number;
  critical_open: number;
  departments_engaged: number;
  wards_covered: number;
  ai_triaged: number;
  avg_urgency: number;
}

/**
 * Computes the headline figures from the needs themselves.
 *
 * These used to live in a hand-maintained `platform_stats/global` document that
 * nothing updated, so the homepage counters stayed frozen while the database
 * changed underneath them. A count that can disagree with the thing it counts
 * will eventually disagree with it. Deriving costs a read and is always true.
 */
export function computeStats(needs: Array<Partial<NeedDocument>>): PlatformStats {
  const closed = new Set(['completed', 'closed', 'resolved']);
  const open = needs.filter((n) => !closed.has(n.status ?? 'open'));

  const urgencies = needs.map((n) => n.urgency_score ?? 0).filter((u) => u > 0);

  return {
    total_needs: needs.length,
    open_needs: open.length,
    needs_resolved: needs.length - open.length,
    critical_open: open.filter((n) => (n.urgency_score ?? 0) >= 8).length,
    departments_engaged: new Set(needs.map((n) => n.assigned_department).filter(Boolean)).size,
    wards_covered: new Set(needs.map((n) => n.ward).filter(Boolean)).size,
    ai_triaged: needs.filter((n) => n.ai_validated).length,
    avg_urgency: urgencies.length
      ? Math.round((urgencies.reduce((a, b) => a + b, 0) / urgencies.length) * 10) / 10
      : 0,
  };
}
