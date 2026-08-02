/**
 * Volunteers, as real records.
 *
 * Three screens used to render a hardcoded roster merged into whatever the
 * database returned. That roster could not be edited, could not be assigned to,
 * and disappeared the moment anyone looked at the underlying collection. It was
 * also the same five people on both the municipal and the NGO screens.
 *
 * Volunteers are now seeded into Firestore like any other record, so they can be
 * read, assigned, edited and persisted. The list below is the seed content, not
 * the runtime source.
 */

export interface VolunteerDocument {
  name: string;
  phone: string;
  email: string;
  skills: string[];
  languages: string[];
  /** Which organisation they volunteer with, or 'RMC' for municipal volunteers. */
  organisation: string;
  ward: string | null;
  status: 'available' | 'busy' | 'on_break' | 'offline';
  /** Cumulative, updated when a task closes. */
  hours: number;
  tasks_completed: number;
  /** 0 to 5, from beneficiary feedback. Null until they have any. */
  rating: number | null;
  city: string;
  created_at: string;
  updated_at: string;
}

/**
 * Seed roster for Rajkot.
 *
 * Names, languages and skills are drawn to look like an actual Saurashtra
 * volunteer pool rather than a stock list. Hours and completion counts start at
 * plausible historic values because these people are meant to have been active
 * before today; ratings are null for the newest two, since somebody with no
 * closed tasks has nothing to be rated on.
 */
export const DEMO_VOLUNTEERS: Array<Omit<VolunteerDocument, 'created_at' | 'updated_at' | 'city'>> = [
  {
    name: 'Arjun Mehta',
    phone: '+91 98250 41102',
    email: 'arjun.mehta@example.org',
    skills: ['first_aid', 'logistics', 'driving'],
    languages: ['gu', 'hi', 'en'],
    organisation: 'Disha Foundation',
    ward: 'Kalavad Road',
    status: 'available',
    hours: 142,
    tasks_completed: 38,
    rating: 4.9,
  },
  {
    name: 'Priya Trivedi',
    phone: '+91 98795 22841',
    email: 'priya.trivedi@example.org',
    skills: ['nursing', 'elderly_care', 'counseling'],
    languages: ['gu', 'hi'],
    organisation: 'Disha Foundation',
    ward: 'Madhapar',
    status: 'available',
    hours: 96,
    tasks_completed: 24,
    rating: 4.7,
  },
  {
    name: 'Kiran Joshi',
    phone: '+91 99745 60318',
    email: 'kiran.joshi@example.org',
    skills: ['food_distribution', 'driving', 'documentation'],
    languages: ['gu', 'en'],
    organisation: 'Asha Relief',
    ward: 'Gondal Road',
    status: 'busy',
    hours: 210,
    tasks_completed: 61,
    rating: 4.8,
  },
  {
    name: 'Nikita Rathod',
    phone: '+91 90999 17734',
    email: 'nikita.rathod@example.org',
    skills: ['teaching', 'translation', 'child_welfare'],
    languages: ['gu', 'hi', 'en'],
    organisation: 'Asha Relief',
    ward: 'University Road',
    status: 'available',
    hours: 74,
    tasks_completed: 19,
    rating: 4.6,
  },
  {
    name: 'Hardik Solanki',
    phone: '+91 94263 88052',
    email: 'hardik.solanki@example.org',
    skills: ['water_testing', 'construction', 'first_aid'],
    languages: ['gu', 'hi'],
    organisation: 'RMC',
    ward: 'Mavdi',
    status: 'available',
    hours: 168,
    tasks_completed: 45,
    rating: 4.9,
  },
  {
    name: 'Meera Bhatt',
    phone: '+91 97129 40556',
    email: 'meera.bhatt@example.org',
    skills: ['counseling', 'documentation', 'legal_aid'],
    languages: ['gu', 'en'],
    organisation: 'RMC',
    ward: 'Yagnik Road',
    status: 'on_break',
    hours: 52,
    tasks_completed: 12,
    rating: 4.4,
  },
  {
    name: 'Sagar Vaghela',
    phone: '+91 96876 21149',
    email: 'sagar.vaghela@example.org',
    skills: ['logistics', 'photography', 'it_support'],
    languages: ['gu', 'hi', 'en'],
    organisation: 'Disha Foundation',
    ward: 'Nana Mava',
    status: 'available',
    hours: 8,
    tasks_completed: 2,
    rating: null,
  },
  {
    name: 'Ishita Dave',
    phone: '+91 93135 70924',
    email: 'ishita.dave@example.org',
    skills: ['nutrition', 'cooking', 'food_distribution'],
    languages: ['gu'],
    organisation: 'Asha Relief',
    ward: 'Kotecha Chowk',
    status: 'available',
    hours: 0,
    tasks_completed: 0,
    rating: null,
  },
];

export function buildVolunteer(
  input: Omit<VolunteerDocument, 'created_at' | 'updated_at' | 'city'>
): VolunteerDocument {
  const now = new Date().toISOString();
  return { ...input, city: 'Rajkot', created_at: now, updated_at: now };
}
