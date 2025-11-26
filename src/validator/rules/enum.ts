import { ValidatorResult } from '../types';
import { Validator } from '../validator';

import type { ValidatorRuleParams } from '../types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type t = ValidatorRuleParams;

import type { ValidatorRuleParamTypes } from '../types';

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
});
declare module '../types' {
  export interface ValidatorRuleParamTypes {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Enum: ValidatorRuleParams<Array<any>>;
  }
}

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
