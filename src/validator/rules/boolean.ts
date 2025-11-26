import { defaultStr } from '@/utils';
import type { ValidatorRuleParamTypes } from '../types';
import { ValidatorResult, ValidatorValidateOptions } from '../types';
import { Validator } from '../validator';

import type { ValidatorRuleParams } from '../types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type t = ValidatorRuleParams;

/**
 * A validation decorator that ensures a property can be cast as a boolean.
 *
 * This decorator accepts various representations of boolean values, providing flexible
 * validation for boolean-like inputs from different sources (e.g., forms, APIs).
 *
 * @description
 * Validates that the decorated property contains a value that can be interpreted as a boolean.
 * The validation is lenient, accepting multiple formats to handle common input scenarios.
 *
 * @example
 * ```typescript
 * class MyClass {
 *   @IsBoolean()
 *   public isActive: boolean;
 * }
 *
 * const instance = new MyClass();
 * instance.isActive = true; // Valid
 * instance.isActive = 'false'; // Valid (case-insensitive string)
 * instance.isActive = 1; // Valid
 * instance.isActive = 'yes'; // Invalid
 * ```
 *
 * @example
 * ```typescript
 * // Using with validation
 * const validator = new Validator();
 * const result = await validator.validate(instance);
 * ```
 *
 * @returns A property decorator function that can be applied to class properties.
 *
 * @since 1.0.0
 * @public
 */
export const IsBoolean = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['Boolean']
>(function Boolean({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}: ValidatorValidateOptions): ValidatorResult {
  const validBooleans = [true, false, 1, 0, '1', '0'];
  // Handle string Boolean values case-insensitively
  let normalizedValue = value;
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase();
    if (lowerValue === 'true') normalizedValue = true;
    else if (lowerValue === 'false') normalizedValue = false;
    else normalizedValue = value;
  }
  const isValidBoolean = validBooleans.includes(normalizedValue);
  if (isValidBoolean) {
    return true;
  } else {
    const message = i18n.t('validator.Boolean', {
      field: defaultStr(translatedPropertyName, fieldName),
      value,
      ...rest,
    });
    return message;
  }
}, 'Boolean');

declare module '../types' {
  export interface ValidatorRuleParamTypes {
    /**
     * ### Boolean Rule
     *
     * Validates that the field under validation can be cast as a Boolean.
     * This rule accepts true, false, 1, 0, "1", and "0" as valid Boolean values.
     *
     * #### Valid boolean Values
     * - `true` and `false` (Boolean)
     * - `1` and `0` (number)
     * - `"1"` and `"0"` (string)
     * - `"true"` and `"false"` (case-insensitive string)
     *
     * @example
     * ```typescript
     * // Valid boolean values
     * await Validator.validate({
     *   value: true,
     *   rules: ['Boolean']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: 0,
     *   rules: ['Boolean']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: 'false',
     *   rules: ['Boolean']
     * }); // ✓ Valid
     *
     * // Invalid values
     * await Validator.validate({
     *   value: 'maybe',
     *   rules: ['Boolean']
     * }); // ✗ Invalid
     *
     * // With class validation
     * ```
     *
     * @param options - Validation options containing value and context
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     *
     * @public
     */
    Boolean: ValidatorRuleParams<[]>;
  }
}
