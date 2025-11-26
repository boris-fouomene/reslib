import { defaultStr } from '@/utils';
import type { ValidatorRuleParamTypes } from '../types';
import { ValidatorResult, ValidatorValidateOptions } from '../types';
import { Validator } from '../validator';

import type { ValidatorRuleParams } from '../types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type t = ValidatorRuleParams;

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
