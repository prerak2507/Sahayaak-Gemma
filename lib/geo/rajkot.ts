/**
 * Rajkot gazetteer.
 *
 * The model is never asked to produce a latitude and longitude. A language
 * model that is confidently wrong about a decimal place sends a crew to the
 * wrong ward, and there is no way to tell a hallucinated coordinate from a real
 * one by looking at it. So Gemma extracts a place *name* from what the citizen
 * wrote, and that name is resolved here against a fixed table. A name that does
 * not resolve produces no coordinates at all, and the citizen is asked to drop
 * a pin instead of being silently misplaced.
 *
 * Every coordinate below is one that already existed in this platform's data.
 * Adding a landmark means adding a surveyed point, not guessing one.
 */

export interface Landmark {
  /** Canonical display name. */
  name: string;
  lat: number;
  lng: number;
  /** Lowercase strings that should resolve to this landmark. */
  aliases: string[];
}

export const RAJKOT_CENTRE = { name: 'Rajkot', lat: 22.3039, lng: 70.8022 } as const;

export const RAJKOT_LANDMARKS: Landmark[] = [
  {
    name: 'Kalavad Road',
    lat: 22.2904,
    lng: 70.7749,
    aliases: ['kalavad road', 'kalawad road', 'kalavad', 'kalawad', 'કાલાવડ રોડ', 'कालावड रोड'],
  },
  {
    name: 'University Road',
    lat: 22.2982,
    lng: 70.7766,
    aliases: ['university road', 'university rd', 'યુનિવર્સિટી રોડ', 'यूनिवर्सिटी रोड'],
  },
  {
    name: 'Yagnik Road',
    lat: 22.2996,
    lng: 70.7974,
    aliases: ['yagnik road', 'yagnik', 'યાજ્ઞિક રોડ', 'याज्ञिक रोड'],
  },
  {
    name: 'Gondal Road',
    lat: 22.2848,
    lng: 70.8038,
    aliases: ['gondal road', 'gondal', 'ગોંડલ રોડ', 'गोंडल रोड'],
  },
  {
    name: 'Madhapar',
    lat: 22.3278,
    lng: 70.7831,
    aliases: ['madhapar', 'madhapar chowk', 'મધાપર', 'मधापर'],
  },
  {
    name: '150ft Ring Road',
    lat: 22.2858,
    lng: 70.7816,
    aliases: ['150ft ring road', '150 ft ring road', 'ring road', '150 feet ring road', 'રિંગ રોડ'],
  },
];

/**
 * Rajkot Municipal Corporation wards, for routing and filtering.
 * Ward centroids are deliberately absent: RMC ward boundaries are not encoded
 * in this project, and an approximate centroid would be indistinguishable from
 * a real one downstream.
 */
export const RMC_WARDS = [
  'Mavdi',
  'Amin Marg',
  'Kalavad Road',
  'Yagnik Road',
  'Kotecha Chowk',
  'Nana Mava',
] as const;

export type RmcWard = (typeof RMC_WARDS)[number];

export interface ResolvedPlace {
  name: string;
  lat: number;
  lng: number;
}

/**
 * Resolves a place name Gemma extracted into real coordinates.
 * Returns null when the name is unknown, which the caller must surface as
 * "we could not place this" rather than defaulting to the city centre.
 */
export function resolveLandmark(placeName: string | null | undefined): ResolvedPlace | null {
  if (!placeName) return null;
  const needle = placeName.trim().toLowerCase();
  if (!needle) return null;

  const match = RAJKOT_LANDMARKS.find(
    (landmark) =>
      landmark.name.toLowerCase() === needle ||
      landmark.aliases.some((alias) => needle === alias || needle.includes(alias))
  );

  return match ? { name: match.name, lat: match.lat, lng: match.lng } : null;
}

/** The names Gemma is shown, so extraction stays inside the gazetteer's vocabulary. */
export function landmarkVocabulary(): string[] {
  return RAJKOT_LANDMARKS.map((l) => l.name);
}
