import { ValidatorResult } from '../types';
import { Validator } from '../validator';

import type { ValidatorRuleParams, ValidatorRuleParamTypes } from '../types';
/* eslint-disable @typescript-eslint/no-unused-vars */
type t = ValidatorRuleParams;

/**
 * @summary A validation decorator that ensures a property value is within a specified set of allowed values.
 * @description
 * Validates that the decorated property contains a value (or array of values) that matches one of the
 * allowed enum values. Supports both strict equality and string-based comparison for flexibility.
 * Useful for restricting input to predefined options like status codes, categories, or selections.
 *
 * @param allowedValues - Array of allowed values for the enum. Can be mixed types (strings, numbers, etc.).
 *
 * @example
 * ```typescript
 * enum Status {
 *   ACTIVE = 'active',
 *   INACTIVE = 'inactive',
 *   PENDING = 'pending'
 * }
 *
 * class User {
 *   @IsEnum(Status.ACTIVE, Status.INACTIVE, Status.PENDING)
 *   status: string;
 * }
 *
 * const user = new User();
 * user.status = 'active'; // ✓ Valid
 * user.status = Status.ACTIVE; // ✓ Valid
 * user.status = 'unknown'; // ✗ Invalid
 * ```
 *
 * @example
 * ```typescript
 * // Multiple selection (array input)
 * class Survey {
 *   @IsEnum('yes', 'no', 'maybe')
 *   responses: string[];
 * }
 *
 * const survey = new Survey();
 * survey.responses = ['yes', 'no']; // ✓ Valid
 * survey.responses = ['yes', 'invalid']; // ✗ Invalid
 * ```
 *
 * @returns A property decorator function for enum validation.
 *
 * @public
 */
export const IsEnum = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['Enum']
>(function Enum({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}): ValidatorResult {
  if (!ruleParams || !ruleParams.length) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'Enum',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exists = allInRules(value, ruleParams as any);
  if (!exists) {
    return i18n.t('validator.invalidEnumValue', {
      field: translatedPropertyName || fieldName,
      value,
      expectedValues: ruleParams.map((r) => String(r)).join('|'),
      ...rest,
    });
  }
  return true;
}, 'Enum');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const allInRules = (value: any, ruleParams: any[]): boolean => {
  // Normalize input to array for uniform processing
  const values = Array.isArray(value) ? value : [value];

  // Set for strict equality checks
  const strictSet = new Set(ruleParams);

  // Set for string-based comparison (filters out null/undefined first)
  const stringSet = new Set(ruleParams.filter((v) => v != null).map(String));

  // Verify every value exists in either set
  return values.every((v) => strictSet.has(v) || stringSet.has(String(v)));
};

declare module '../types' {
  export interface ValidatorRuleParamTypes {
    /**
     * ### Enum Rule
     *
     * Validates that the field under validation contains a value (or array of values) that matches
     * one of the specified allowed enum values. This rule supports both strict equality and
     * string-based comparison for maximum flexibility, making it ideal for restricting input
     * to predefined options like status codes, categories, or multiple selections.
     *
     * #### Parameters
     * - `allowedValues` - Array of allowed values for the enum. Can contain mixed types
     *   (strings, numbers, booleans, etc.) for versatile validation scenarios.
     *
     * #### Validation Logic
     * 1. **Input Normalization**: Converts single values to arrays for uniform processing
     * 2. **Strict Equality Check**: Uses Set-based lookup for exact matches (preserves types)
     * 3. **String Comparison Fallback**: Converts values to strings for flexible matching
     * 4. **Array Support**: Validates all elements in arrays (e.g., multiple selections)
     * 5. **Result**: Passes if all values are in the allowed set, fails otherwise
     *
     * #### Use Cases
     * - Status validation (active/inactive/pending)
     * - Category restrictions (premium/basic/free)
     * - Multiple choice selections (checkbox arrays)
     * - Dropdown options validation
     * - API response code validation
     *
     * @example
     * ```typescript
     * // Single value validation
     * await Validator.validate({
     *   value: 'active',
     *   rules: [{Enum: ['active', 'inactive', 'pending']}]
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: 'unknown',
     *   rules: [{Enum: ['active', 'inactive', 'pending']}]
     * }); // ✗ Invalid
     *
     * // Mixed types validation
     * await Validator.validate({
     *   value: 42,
     *   rules: [{Enum: [42, 'forty-two', true]}]
     * }); // ✓ Valid (strict match)
     *
     * await Validator.validate({
     *   value: '42',
     *   rules: [{Enum: [42, 'forty-two', true]}]
     * }); // ✓ Valid (string conversion match)
     *
     * // Array validation (multiple selections)
     * await Validator.validate({
     *   value: ['yes', 'no'],
     *   rules: [{Enum: ['yes', 'no', 'maybe']}]
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: ['yes', 'invalid'],
     *   rules: [{Enum: ['yes', 'no', 'maybe']}]
     * }); // ✗ Invalid (one element not allowed)
     *
     * // Class validation
     * enum UserStatus {
     *   ACTIVE = 'active',
     *   INACTIVE = 'inactive',
     *   PENDING = 'pending'
     * }
     *
     * class User {
     *   @IsEnum(UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.PENDING)
     *   status: string;
     * }
     *
     * class Survey {
     *   @IsEnum('excellent', 'good', 'average', 'poor')
     *   ratings: string[];
     * }
     * ```
     *
     * #### Error Messages
     * Uses i18n translation key: `validator.invalidEnumValue`
     * Default format: "The {field} must be one of: {expectedValues}"
     *
     * #### Type Safety
     * - Strongly typed with TypeScript generics
     * - Parameter validation at runtime
     * - Supports mixed-type enums for complex scenarios
     *
     * #### Performance Notes
     * - Efficient Set-based lookups (O(1) average case)
     * - Minimal memory allocation
     * - Early termination on validation failure
     *
     * #### Related Rules
     * - {@link IsIn}: Similar to Enum but with different implementation
     * - {@link IsOneOf}: For single-value selection from options
     * - {@link ArrayContains}: For array content validation
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array containing the allowed enum values
     * @returns Promise resolving to true if value(s) are in enum, rejecting with error message if invalid
     *
     * @public
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Enum: ValidatorRuleParams<Array<any>>;
  }
}
