/**
 * @interface I18nTranslations
 * Represents a dictionary for internationalization (i18n) strings.
 *
 * This interface defines a structure for storing localized strings
 * for different locales. Each locale can have multiple keys, each
 * associated with a string or another dictionary for nested translations.
 *
 * @example
 * const translations: I18nTranslations = {
 *     en: {
 *         greeting: "Hello",
 *         farewell: "Goodbye",
 *         nested: {
 *                 example: "This is a nested translation.",
 *         }
 *     },
 *     es: {
 *         greeting: "Hola",
 *         farewell: "Adiós"
 *     }
 * };
 */

import { Dictionary } from '@/types';

export type I18nTranslations = {
  [Locale in string]: Dictionary;
};

/**
 * A formatter function for internationalization (i18n) strings.
 *
 * This type defines a function that takes a string value and optional
 * parameters to format the string according to specific rules or
 * requirements. The formatted string is then returned.
 *
 * @param {string} value - The string value to format.
 * @param {Record<string, any>} [params] - Optional parameters to customize the formatting.
 * @returns {string} The formatted string.
 *
 * @example
 * const formatter: I18nFormatter = (value, params) => {
 *     return value.replace(/{(\w+)}/g, (_, key) => params[key] || '');
 * };
 *
 * const greeting = formatter("Hello, {name}!", { name: "John" }); // "Hello, John!"
 */
export type I18nFormatter = (
  value: string,

  params?: Dictionary
) => string;

/**
 * Type defining the scope of a translation.
 * Can be a dot-separated string or an array of keys.
 */
export type I18nScope = string | string[];

/**
 * Options for translation.
 */
export interface I18nTranslateOptions extends Dictionary {
  /**
   * Locale to use for this translation.
   */
  locale?: string;
  /**
   * Default value if translation is missing.
   */
  defaultValue?: string;
  /**
   * Count for pluralization.
   */
  count?: number;
}
