/**
 * The languages this platform offers, defined once.
 *
 * Gujarati is first because this is Rajkot and it is what most residents
 * actually write. Gemma handles languages beyond this list; these are the ones
 * the interface presents and the ones the voice path is tuned for.
 *
 * This file has no imports on purpose, so both the type layer and the model
 * layer can depend on it without a cycle.
 */

export interface SupportedLanguage {
  code: string;
  name: string;
  native: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'en', name: 'English', native: 'English' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
];

export function languageName(code: string): string {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.name ?? code;
}

/** Speech services want a region-qualified tag. */
export function speechTag(code: string): string {
  return `${code}-IN`;
}
