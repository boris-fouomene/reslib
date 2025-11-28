/**
 * Checks if the provided value is a regular expression.
 *
 * A value is considered a regular expression if it is an instance of the RegExp constructor, or if it can be converted to a RegExp.
 *
 * @param {any} regExp The value to check.
 * @returns {boolean} True if the value is a regular expression, false otherwise.
 * @example
 * ```typescript
 * console.log(isRegExp(/hello/)); // Output: true
 * console.log(isRegExp("hello")); // Output: true
 * console.log(isRegExp({})); // Output: false
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isRegExp(regExp: any): regExp is RegExp {
  /**
   * If the value is an instance of the RegExp constructor, it's a regular expression.
   */
  if (regExp instanceof RegExp) {
    return true;
  }
  try {
    new RegExp(regExp);
    return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return false;
  }
}
