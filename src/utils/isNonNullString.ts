/**
 * Checks if the provided value is a non-empty string.
 *
 * A value is considered a non-empty string if it is not null and is a string.
 *
 * @param {unknown} val The value to check.
 * @returns {boolean} True if the value is a non-empty string, false otherwise.
 * @example
 * ```typescript
 * console.log(isNonNullString('hello')); // Output: true
 * console.log(isNonNullString('')); // Output: false
 * console.log(isNonNullString(null)); // Output: false
 * console.log(isNonNullString(undefined)); // Output: false
 * console.log(isNonNullString(123)); // Output: false
 * ```
 */

export function isNonNullString<T = unknown>(val: T): val is T & string {
  return val && typeof val === 'string' ? true : false;
}
