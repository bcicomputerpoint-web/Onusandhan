
/**
 * Internationalization Utilities for Onusandhan
 * Handles dynamic content localization for Firestore data structures.
 */

import { Language } from './translations';

/**
 * Higher-order type for translatable Firestore fields
 */
export type LocalizedField<T = string> = {
  en: T;
  bn?: T;
};

/**
 * Gets the localized version of a Firestore field with English fallback.
 * Supports both the new Map structure and legacy String structure.
 * 
 * @param field - The Firestore field (either a string or a LocalizedField map)
 * @param lang - Current active language ('en' | 'bn')
 * @returns The translated string or the English fallback
 */
export function getLocalized<T = string>(field: LocalizedField<T> | T | undefined | null, lang: Language): T | string {
  if (field === undefined || field === null) return "";

  // Handle legacy string data or non-translatable fields
  if (typeof field !== 'object') {
    return field as unknown as string;
  }

  const map = field as LocalizedField<T>;
  
  // Return requested language if exists, otherwise fallback to English
  if (lang === 'bn' && map.bn) return map.bn;
  return map.en || "";
}

/**
 * Utility for generating multilingual search identifiers
 * Useful for building search indexes or slug-like identifiers.
 */
export function getSearchTerms(field: LocalizedField | string): string[] {
  if (typeof field === 'string') return [field.toLowerCase()];
  const terms = [field.en.toLowerCase()];
  if (field.bn) terms.push(field.bn.toLowerCase());
  return terms;
}
