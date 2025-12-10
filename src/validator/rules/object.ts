/* eslint-disable @typescript-eslint/no-unused-vars */
import { isObj } from '@utils/object';
import type { ValidatorRuleParams } from '../types';
import { ValidatorRuleParamTypes } from '../types';
import { Validator } from '../validator';

type t = ValidatorRuleParams;

/**
 * ## Object Decorator
 *
 * Property decorator that validates a property value is a plain object.
 * This is a fundamental object validation decorator that ensures the value
 * is actually a plain object before applying other object-specific validations.
 *
 * ### Usage
 * ```typescript
 * class UserProfile {
 *   @IsObject()
 *   metadata: Record<string, any>;
 * }
 * ```
 *
 * ### Validation Behavior
 * - **Passes**: When value is a plain object (including empty objects)
 * - **Fails**: When value is not a plain object (null, undefined, array, string, number, class instances, etc.)
 *
 * ### Error Messages
 * - Default: `"[PropertyName]: Must be an object"`
 * - I18n key: `"validator.object"`
 *
 * ### Related Decorators
 * - Often used as prerequisite for: `@ValidateNested`, `@ObjectKeys`, `@ObjectValues`, etc.
 *
 * @returns A property decorator function
 * @public
 */
export const IsObject = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['Object']
>(function IsObject({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}) {
  if (isObj(value)) {
    return true;
  } else {
    const message = i18n.t('validator.isObject', {
      field: translatedPropertyName || fieldName,
      fieldName,
      translatedPropertyName,
      value,
      ...rest,
    });
    return message;
  }
}, 'Object');

// Module augmentation to add object-related rules to ValidatorRuleParamTypes
declare module '../types' {
  interface ValidatorRuleParamTypes<Context = unknown> {
    /**
     * ## Object Rule Parameters
     *
     * Validates that a value is a plain object.
     * This rule takes no parameters and checks if the input value is a plain JavaScript object.
     *
     * ### Type Definition
     * ```typescript
     * Object: [];
     * ```
     *
     * ### Usage
     * ```typescript
     * // As a decorator
     * class MyClass {
     *   @IsObject()
     *   config: Record<string, any>;
     * }
     *
     * // As a validation rule
     * const result = await Validator.validate({
     *   value: { key: 'value' },
     *   rules: ['Object']
     * });
     * ```
     *
     * ### Validation Behavior
     * - **Valid objects**: `{}`, `{key: 'value'}`, `Object.create(null)`
     * - **Invalid values**: `null`, `undefined`, `[]`, `'string'`, `42`, class instances
     *
     * ### Error Messages
     * - I18n key: `"validator.object"`
     * - Default: `"This field must be an object"`
     *
     * @public
     */
    Object: [];
  }
}
