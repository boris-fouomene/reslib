import { Dictionary } from '@/types';
import { defaultStr } from './defaultStr';
import { isPrimitive } from './isPrimitive';
import { isRegExp } from './isRegex';
import { isObj } from './object';

/**
 * Options for the interpolate function.
 */
export interface InterpolateOptions {
  /**
   * Custom regex pattern to match placeholders.
   * Defaults to `\%\{([^}]+)\}` for `%{key}` format.
   * The regex should have a capturing group for the key.
   */
  tagRegex?: RegExp;
  /**
   * Custom function to format values before interpolation.
   * If not provided, a default formatter will be used.
   * @param value - The value to format
   * @param tagName - The name of the tag being replaced
   * @param defaultFormatter - The default value formatter function
   * @returns The formatted string representation
   */
  valueFormatter?: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
    tagName: string,
    defaultFormatter: typeof defaultValueFormatter
  ) => string;
}

/**
 * Interpolates placeholders in a string with values from a parameters object.
 *
 * This function is particularly useful for internationalization (i18n) and dynamic string formatting,
 * where text templates contain placeholders that need to be replaced with actual values.
 * By default, placeholders are in the format `%{key}`, where `key` can be a simple string or a dotted path.
 *
 * If a placeholder's key is not found in the params object or the value is empty,
 * the placeholder is replaced with an empty string.
 *
 * @param text - The template string containing placeholders.
 * @param params - An object containing key-value pairs for interpolation.
 * @param options - Optional configuration object for interpolation behavior.
 * @returns The interpolated string with placeholders replaced by their corresponding values.
 *
 * @example
 * // Basic interpolation with default %{key} format
 * const result = interpolate("Hello, %{name}!", { name: "World" });
 * // Result: "Hello, World!"
 *
 * @example
 * // Multiple placeholders
 * const result = interpolate("User %{firstName} %{lastName} is %{age} years old.", {
 *   firstName: "John",
 *   lastName: "Doe",
 *   age: 30
 * });
 * // Result: "User John Doe is 30 years old."
 *
 * @example
 * // Missing or empty parameters - placeholders are removed
 * const result = interpolate("Welcome %{user} to %{location}.", {
 *   user: "Alice"
 * });
 * // Result: "Welcome Alice to ."
 *
 * @example
 * // Dotted keys (treated as flat keys)
 * const result = interpolate("Contact: %{user.email}", {
 *   "user.email": "alice@example.com"
 * });
 * // Result: "Contact: alice@example.com"
 *
 * @example
 * // Custom regex for double braces {{key}}
 * const result = interpolate("Hello, {{name}}!", { name: "World" }, { tagRegex: /\{\{([^}]+)\}\}/g });
 * // Result: "Hello, World!"
 *
 * @example
 * // Custom value formatter for uppercase strings
 * const result = interpolate("Hello %{name}!", { name: "world" }, {
 *   valueFormatter: (value, tagName) => typeof value === 'string' ? value.toUpperCase() : String(value)
 * });
 * // Result: "Hello WORLD!"
 *
 * @example
 * // Custom value formatter for numbers with currency
 * const result = interpolate("Price: %{amount}", { amount: 99.99 }, {
 *   valueFormatter: (value, tagName) => typeof value === 'number' ? `$${value.toFixed(2)}` : String(value)
 * });
 * // Result: "Price: $99.99"
 *
 * @example
 * // Custom value formatter based on tag name
 * const result = interpolate("User: %{name}, Age: %{age}", { name: "John", age: 25 }, {
 *   valueFormatter: (value, tagName) => {
 *     if (tagName === 'age') return `${value} years old`;
 *     return String(value);
 *   }
 * });
 * // Result: "User: John, Age: 25 years old"
 *
 * @example
 * // No params provided - returns original string
 * const result = interpolate("No placeholders here.");
 * // Result: "No placeholders here."
 *
/**
 * Default value formatter for interpolation.
 * Handles all common JavaScript value types, including:
 * - Primitives (string, number, boolean, null, undefined)
 * - Dates (uses .toFormat() if available/Moment.js, else .toISOString())
 * - Errors (returns "Error: message")
 * - Regular Expressions (returns string representation)
 * - Arrays (returns JSON string)
 * - Objects (uses custom .toString(), or JSON string fallback)
 * 
 * @param value - The value to format.
 * @param tagName - The name of the placeholder tag (unused in default formatter but available for custom ones).
 * @returns The formatted string representation of the value.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
function defaultValueFormatter(value: any, tagName: string): string {
  // Handle null/undefined checks early
  if (value === null || value === undefined) {
    return '';
  }

  // Return strings as-is
  if (typeof value === 'string') {
    return value;
  }

  // Handle numbers, checking for custom formatNumber method
  if (
    typeof value === 'number' ||
    (typeof value === 'object' && value instanceof Number)
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (value as any).formatNumber === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (value as any).formatNumber();
    }
  }

  // Handle Dates, preferring toFormat method (e.g. from Moment.js/Luxon)
  if (
    value instanceof Date ||
    (typeof value === 'object' && value !== null && value.constructor === Date)
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (value as any).toFormat === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (value as any).toFormat();
    }
    return (value as Date).toISOString();
  }

  // Handle Errors
  if (value instanceof Error) {
    return `Error: ${value.message}`;
  }

  // Handle RegExp
  if (isRegExp(value)) {
    return value.toString();
  }

  // Handle other primitives (boolean, symbol)
  if (isPrimitive(value)) {
    return String(value);
  }

  // Handle Arrays via JSON serialization
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }

  // Handle Objects
  if (typeof value === 'object' && value !== null) {
    // Check for custom toString implementation (that isn't Object.prototype.toString)
    if (
      typeof value.toString === 'function' &&
      value.toString !== Object.prototype.toString
    ) {
      return value.toString();
    }
    // For other objects (like Map, Set), try generic toString first
    if (typeof value.toString === 'function') {
      const str = value.toString();
      // If result is generic [object Object], fall back to JSON
      if (str !== '[object Object]') {
        return str;
      }
    }
    // Fallback to JSON stringification for plain objects
    return JSON.stringify(value);
  }

  // Handle edge cases like functions or weird objects with toString
  if (typeof value?.toString === 'function') {
    return value.toString();
  }

  // Final fallback
  return String(value);
}

/**
 * Interpolates placeholders in a string with values from a parameters object.
 *
 * This function is the core of the library's dynamic string replacement.
 * It identifies placeholders in the format `%{key}` (or custom format), looks up matching values
 * in the provided `params` object, formats them using a value formatter, and replaces
 * the placeholders in the original text.
 *
 * Key features:
 * - Supports default `%{key}` syntax.
 * - Supports custom regex via `options.tagRegex`.
 * - Supports custom value formatting via `options.valueFormatter`.
 * - Handles missing values gracefully (defaults to empty string).
 * - Safe replacement logic to avoid regex injection issues from value strings.
 *
 * @param text - The template string containing placeholders.
 * @param params - An object containing key-value pairs for interpolation.
 * @param options - Optional configuration object for interpolation behavior.
 * @returns The interpolated string with placeholders replaced by their corresponding values.
 */
export function interpolate(
  text?: string,
  params?: Dictionary,
  options?: InterpolateOptions
): string {
  // Determine the formatter to use: custom or default
  const valueFormatter = options?.valueFormatter || defaultValueFormatter;

  // Ensure input text is a valid string
  let processedContent = defaultStr(text);

  // Quick exit if no params provided
  if (!isObj(params) || !params) {
    return processedContent;
  }

  // Determine the regex to use for identifying placeholders.
  // Defaults to the pattern %{key} if no custom regex is provided in options.
  const tagRegex = options?.tagRegex || /%\{([^}]+)\}/g;

  // Track unique tags found in the content to iterate over them.
  // This allows processing each unique placeholder type once.
  const usedTags = new Set<string>();
  let match;

  // Scan the original content for matches
  const content = defaultStr(text);
  while ((match = tagRegex.exec(content)) !== null) {
    const tagPath = match[1];
    // Only add if the regex has a capture group (tagPath is not undefined)
    if (tagPath !== undefined) {
      usedTags.add(tagPath);
    }
  }

  // Iterate over each found unique tag to perform replacement
  usedTags.forEach((tagPath) => {
    // If a custom regex was provided, we use a specialized replacement logic
    if (options?.tagRegex) {
      // Re-create the regex to ensure we have a fresh state for global matching if needed
      // Note: This block runs for every tag found, which is redundant but functional.
      // Ideally this logic handles all replacements in one go, but the structure iterates 'usedTags'.
      // We process all matches of the custom regex here.
      const customRegex = new RegExp(
        options.tagRegex.source,
        options.tagRegex.flags
      );

      const matches = [...content.matchAll(customRegex)];
      matches.forEach((match) => {
        const fullMatch = match[0]; // The full placeholder string, e.g. {{key}}

        // Ensure capture group exists
        if (!match[1]) {
          return;
        }

        const key = match[1]; // The extracted key, e.g. "key"

        // Lookup value in params
        const value = Object.prototype.hasOwnProperty.call(params, key)
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (params as any)[key]
          : undefined;

        // Format the value
        const stringValue =
          value === undefined
            ? ''
            : (() => {
                try {
                  return valueFormatter(value, key, defaultValueFormatter);
                } catch {
                  // Fallback to default formatter if custom one fails
                  return defaultValueFormatter(value, key);
                }
              })();

        // Escape special regex characters in the matched string to safely use it in replacement RegExp
        const escapedMatch = fullMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Perform replacement in the working content string
        processedContent = processedContent.replace(
          new RegExp(escapedMatch, 'g'),
          stringValue
        );
      });
      return; // Skip the default replacement logic below
    }

    // Default logic for standard %{key} syntax
    // Reconstruct the full placeholder tag string
    const tag = `%{${tagPath}}`;

    // Look up value in params using the path
    const value = Object.prototype.hasOwnProperty.call(params, tagPath)
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (params as any)[tagPath]
      : undefined;

    // Format the value
    const stringValue =
      value === undefined
        ? ''
        : (() => {
            try {
              return valueFormatter(value, tagPath, defaultValueFormatter);
            } catch {
              return defaultValueFormatter(value, tagPath);
            }
          })();

    // Escape special regex characters in the tag for safe replacement construction
    const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Replace all occurrences of this tag in the content
    processedContent = processedContent.replace(
      new RegExp(escapedTag, 'g'),
      stringValue
    );
  });

  return processedContent;
}
