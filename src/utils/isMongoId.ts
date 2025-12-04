/**
 * Validates whether a given value is a valid MongoDB ObjectId.
 *
 * A valid MongoDB ObjectId:
 * - Must be exactly 24 characters long
 * - Must contain only hexadecimal characters (0-9, a-f, A-F)
 * - Does NOT accept the "0x" prefix (unlike general hex validation)
 *
 * MongoDB ObjectIds are 12-byte values typically represented as
 * 24-character hexadecimal strings:
 * - 4 bytes: timestamp (seconds since Unix epoch)
 * - 5 bytes: random value
 * - 3 bytes: incrementing counter
 *
 * @param value - The value to check (can be any type)
 * @returns true if the value is a valid MongoDB ObjectId string, false otherwise
 *
 * @example
 * isMongoId("507f1f77bcf86cd799439011") // true
 * isMongoId("507f1f77bcf86cd79943901") // false (too short)
 * isMongoId("507f1f77bcf86cd799439011a") // false (too long)
 * @since 1.0.1
 * @returns true if the value is a valid MongoDB ObjectId string, false otherwise
 */
export function isMongoId(value: unknown): boolean {
  // Check if value is a string - MongoDB ObjectIds are string representations
  if (typeof value !== 'string') {
    return false;
  }

  // MongoDB ObjectIds must be exactly 24 characters
  if (value.length !== 24) {
    return false;
  }

  // Regular expression to match exactly 24 hexadecimal characters
  // ^ - Start of string
  // [0-9a-fA-F]{24} - Exactly 24 hexadecimal characters
  // $ - End of string
  const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

  return mongoIdRegex.test(value);
}
