// Languages live in one place so the type layer and the model layer cannot drift.
export { SUPPORTED_LANGUAGES, languageName, type SupportedLanguage } from '@/lib/i18n/languages';

// ━━━ ENUMS ━━━

export type UserRole =
  | 'citizen'
  | 'volunteer'
  | 'ngo_admin'
  | 'ngo_coordinator'
  | 'ngo_reporter'
  | 'platform_admin'
  | 'govt_officer'
  | 'govt_worker'
  | 'govt_employee'
  | 'super_admin';

export type NeedCategory =
  | 'food'
  | 'medical'
  | 'education'
  | 'shelter'
  | 'water_sanitation'
  | 'livelihood'
  | 'elderly_care'
  | 'disaster_relief'
  | 'mental_health'
  | 'child_welfare'
  | 'roads_potholes'
  | 'drainage_sewerage'
  | 'water_supply'
  | 'electricity_streetlights'
  | 'garbage_sanitation'
  | 'encroachment'
  | 'fire_safety';

export type NeedStatus =
  | 'reported'
  | 'verified'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'closed'
  | 'escalated';

export type TaskStatus =
  | 'open'
  | 'matched'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'reassigned';

export type VolunteerStatus = 'available' | 'busy' | 'on_break' | 'offline';

export type NgoVerification =
  | 'pending'
  | 'under_review'
  | 'verified'
  | 'rejected'
  | 'suspended';

// ━━━ DATABASE MODELS ━━━

export interface Profile {
  id: string;
  phone: string | null;
  email?: string | null;
  full_name: string;
  avatar_url: string | null;
  profile_image?: string;
  role: UserRole;
  skills?: string[];
  preferred_lang: string;
  is_active: boolean;
  department?: string;
  title?: string;
  trust_points?: number;
  false_reports_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Volunteer {
  id: string;
  user_id: string;
  bio: string | null;
  skills: string[];
  languages: string[];
  location_lat: number;
  location_lng: number;
  location_area: string;
  radius_km: number;
  status: VolunteerStatus;
  is_verified: boolean;
  availability: Record<string, boolean>;
  weekly_task_count: number;
  monthly_hours: number;
  wellness_score: number;
  is_on_break: boolean;
  total_tasks_done: number;
  total_hours: number;
  streak_days: number;
  city_rank: number | null;
  national_rank: number | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  profile?: Profile;
}

export interface NGO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  registration_no: string | null;
  fcra_number: string | null;
  verification_status: NgoVerification;
  verified_at: string | null;
  focus_areas: NeedCategory[];
  sdg_goals: string[];
  operating_cities: string[];
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  headquarters_city: string | null;
  headquarters_state: string | null;
  est_year: number | null;
  created_at: string;
  updated_at: string;
}

export interface NGOMember {
  id: string;
  user_id: string;
  ngo_id: string;
  role: UserRole;
  joined_at: string;
  profile?: Profile;
  ngo?: NGO;
}

export interface Need {
  id: string;
  title: string;
  description: string;
  description_lang: string;
  description_original: string | null;
  category: NeedCategory;
  status: NeedStatus;
  sdg_tags: string[];
  location_lat: number;
  location_lng: number;
  location_address: string;
  ward: string | null;
  district: string;
  city: string;
  state: string;
  urgency_score: number;
  upvotes?: number;
  upvoted_by?: string[];
  downvoted_by?: string[];
  severity_rating: number;
  population_count: number;
  is_time_sensitive: boolean;
  deadline_at: string | null;
  volunteers_needed: number;
  volunteers_assigned: number;
  required_skills: string[];
  estimated_hours: number;
  source_type: string;
  reported_by: string | null;
  ngo_id: string | null;
  photo_urls: string[];
  verified_at: string | null;
  /** Set when Gemma triaged this report rather than a person filing it directly. */
  ai_validated: boolean;
  ai_flags: string[];
  /** Which model and host produced the triage, for the audit trail. */
  ai_model: string | null;
  assignment_type?: 'ngo' | 'government';
  assigned_department?: 'pwd' | 'drainage' | 'water_works' | 'electricity' | 'health_sanitation' | 'encroachment' | 'fire_safety';
  created_at: string;
  updated_at: string;
  // Joined
  ngo?: NGO;
  reporter?: Profile;
}

export interface Task {
  id: string;
  need_id: string;
  ngo_id: string | null;
  volunteer_id: string | null;
  status: TaskStatus;
  match_score: number | null;
  match_breakdown: MatchBreakdown | null;
  scheduled_at: string | null;
  accepted_at: string | null;
  assigned_at?: string | null;
  started_at: string | null;
  completed_at: string | null;
  estimated_hours: number;
  actual_hours: number | null;
  check_in_lat: number | null;
  check_in_lng: number | null;
  check_in_at: string | null;
  completion_photos: string[];
  completion_note: string | null;
  beneficiary_rating: number | null;
  volunteer_note: string | null;
  reassign_count: number;
  created_at: string;
  updated_at: string;
  // Joined
  need?: Need;
  volunteer?: Volunteer;
}

export interface SkillBadge {
  id: string;
  volunteer_id: string;
  skill: string;
  issued_by: string;
  ngo_id: string | null;
  issued_at: string;
  cert_url: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  channel: string;
  is_read: boolean;
  sent_at: string;
  read_at: string | null;
  metadata: Record<string, unknown>;
}

export interface GovtOfficer {
  id: string;
  user_id: string;
  designation: string | null;
  district: string | null;
  state: string | null;
  department: string | null;
  profile?: Profile;
}

export interface PlatformStats {
  id: number;
  total_volunteers: number;
  active_today: number;
  needs_resolved: number;
  ngos_registered: number;
  cities_covered: number;
  avg_response_minutes: number;
  people_helped: number;
  volunteer_hours: number;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  is_impersonation: boolean;
  created_at: string;
}

// ━━━ ALGORITHM TYPES ━━━

export interface UrgencyBreakdown {
  severity: number;
  reach: number;
  time: number;
  gap: number;
}

export interface UrgencyResult {
  score: number;
  label: 'Critical' | 'High' | 'Medium' | 'Low';
  breakdown: UrgencyBreakdown;
}

export interface MatchBreakdown {
  skillFit: number;
  proximity: number;
  availability: number;
  performance: number;
}

export interface VolunteerMatch {
  volunteer: Volunteer;
  totalScore: number;
  breakdown: MatchBreakdown;
  distanceKm: number;
}

// ━━━ API TYPES ━━━

/**
 * Model-facing result types now live with the code that produces them, so a
 * schema and its type cannot drift apart:
 *   lib/gemma/civic.ts      triage
 *   lib/gemma/vision.ts     photo screening and cross-verification
 *   lib/gemma/dispatch.ts   routing decisions
 *   lib/gemma/analytics.ts  city load, search, deployment
 */

export interface TranslationResult {
  translatedText: string;
}

// ━━━ UI TYPES ━━━

export interface SidebarLink {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}

export interface CityData {
  name: string;
  state: string;
  lat: number;
  lng: number;
  needCount?: number;
}

/**
 * Rajkot and its landmarks. Coordinates are the surveyed points already used
 * across this platform; see lib/geo/rajkot.ts, which is the resolver Gemma's
 * extracted place names are matched against.
 */
export const CITIES: CityData[] = [
  { name: 'Rajkot', state: 'Gujarat', lat: 22.3039, lng: 70.8022 },
  { name: 'Kalavad Road', state: 'Gujarat', lat: 22.2904, lng: 70.7749 },
  { name: 'University Road', state: 'Gujarat', lat: 22.2982, lng: 70.7766 },
  { name: 'Yagnik Road', state: 'Gujarat', lat: 22.2996, lng: 70.7974 },
  { name: 'Gondal Road', state: 'Gujarat', lat: 22.2848, lng: 70.8038 },
  { name: 'Madhapar', state: 'Gujarat', lat: 22.3278, lng: 70.7831 },
  { name: '150ft Ring Road', state: 'Gujarat', lat: 22.2858, lng: 70.7816 },
];

export const CATEGORY_COLORS: Record<NeedCategory, string> = {
  food: '#F59E0B',
  medical: '#EF4444',
  education: '#3B82F6',
  shelter: '#8B5CF6',
  water_sanitation: '#06B6D4',
  livelihood: '#10B981',
  elderly_care: '#F97316',
  disaster_relief: '#DC2626',
  mental_health: '#EC4899',
  child_welfare: '#F59E0B',
  roads_potholes: '#4B5563',
  drainage_sewerage: '#78350F',
  water_supply: '#2563EB',
  electricity_streetlights: '#EAB308',
  garbage_sanitation: '#16A34A',
  encroachment: '#DC2626',
  fire_safety: '#EF4444',
};

export const CATEGORY_LABELS: Record<NeedCategory, string> = {
  food: 'Food',
  medical: 'Medical',
  education: 'Education',
  shelter: 'Shelter',
  water_sanitation: 'Water & Sanitation',
  livelihood: 'Livelihood',
  elderly_care: 'Elderly Care',
  disaster_relief: 'Disaster Relief',
  mental_health: 'Mental Health',
  child_welfare: 'Child Welfare',
  roads_potholes: 'Roads & Potholes (PWD)',
  drainage_sewerage: 'Sewerage & Drainage',
  water_supply: 'Water Supply & Leakage',
  electricity_streetlights: 'Power & Street Lights',
  garbage_sanitation: 'Garbage & Sanitation',
  encroachment: 'Illegal Encroachment',
  fire_safety: 'Fire & Public Safety',
};

export const SDG_COLORS: Record<string, string> = {
  'SDG2': '#DDA63A',
  'SDG3': '#4C9F38',
  'SDG4': '#C5192D',
  'SDG6': '#26BDE2',
  'SDG10': '#DD1367',
  'SDG11': '#FD9D24',
};

export const SDG_NAMES: Record<string, string> = {
  'SDG2': 'Zero Hunger',
  'SDG3': 'Good Health',
  'SDG4': 'Quality Education',
  'SDG6': 'Clean Water',
  'SDG10': 'Reduced Inequalities',
  'SDG11': 'Sustainable Cities',
};


export const SKILLS_LIST = [
  'first_aid', 'teaching', 'driving', 'cooking', 'counseling',
  'construction', 'carpentry', 'nursing', 'documentation',
  'water_testing', 'nutrition', 'tailoring', 'food_distribution',
  'elderly_care', 'photography', 'translation', 'legal_aid', 'it_support',
];
