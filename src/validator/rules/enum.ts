import { ValidatorResult } from '../types';
import { Validator } from '../validator';

import type { ValidatorRuleParams } from '../types';

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
 *   @IsEnum([Status.ACTIVE, Status.INACTIVE, Status.PENDING])
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
 *   @IsEnum(['yes', 'no', 'maybe'])
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ValidatorRuleParams<Array<any>>
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
});

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
