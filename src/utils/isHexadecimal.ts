/**
 * Validates whether a given value is a valid hexadecimal string.
 *
 * A valid hexadecimal string:
 * - Contains only characters 0-9, a-f, or A-F
 * - Can optionally start with "0x" or "0X" prefix
 * - Must have at least one hex digit after any prefix
 * - Can be of any length (after prefix)
 *
 * @param value - The value to check (can be any type)
 * @returns true if the value is a valid hexadecimal string, false otherwise
 *
 * @example
 * isHexadecimal("1a2b3c") // true
 * isHexadecimal("0xFFFF") // true
 * isHexadecimal("GHI") // false
 * isHexadecimal("0x") // false
 * isHexadecimal("") // false
 * isHexadecimal(123) // false
 * @returns true if the value is a valid hexadecimal string, false otherwise
 * @since 1.0.1
 */
export function isHexadecimal(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  if (value.length === 0) {
    return false;
  }

  // Regular expression to match valid hexadecimal strings
  // ^(0[xX])? - Optional "0x" or "0X" prefix at the start
  // [0-9a-fA-F]+ - One or more hexadecimal digits (0-9, a-f, A-F)
  // $ - End of string
  const hexRegex = /^(0[xh])?[0-9a-f]+$/i; /*/^(0x|0h)?[0-9A-F]+$/i*/

  return hexRegex.test(value);
}
