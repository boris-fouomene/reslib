import { VALIDATOR_RULE_MARKERS } from '../rulesMarkers';
import { Validator } from '../validator';

/**
 * ## If Validation Decorator
 *
 * A conditional validation decorator that applies rules based on a resolver function.
 * This decorator enables dynamic, context-aware validation logic directly on class properties.
 *
 * ### If Validation Concept
 * The `@If` decorator allows you to define validation rules that depend on runtime conditions.
 * Instead of static rules that always apply, you provide a resolver function that determines
 * which rules (if any) should be applied based on the validation context.
 *
 * ### Key Features
 * - **Dynamic Rules**: Apply different rules based on value, data, context, or i18n
 * - **Sync & Async**: Supports both synchronous checks and asynchronous lookups (API/DB)
 * - **Custom Messages**: Resolver can return custom error messages per condition
 * - **Type Safe**: Full Generic support for typed Context
 * - **Clean Syntax**: Simple function-based definition
 *
 * ### Function Signature
 * The resolver function receives:
 * - `value`: The property value
 * - `data`: The object containing the property
 * - `context`: Validation context
 * - `i18n`: Internationalization service
 *
 * It returns:
 * - `ValidatorRules[]`: Rules to apply
 * - `{ rules, message }`: Rules + custom error message
 * - `[]` or `null`: Skip validation
 *
 * @example
 * ```typescript
 * class User {
 *   // Only validate email if subscribed
 *   @If(({ data }) => data.isSubscribed ? ['Required', 'Email'] : [])
 *   email?: string;
 *
 *   // Different rules based on role
 *   @If(({ data }) => {
 *     if (data.role === 'admin') return ['Required', 'StrongPassword'];
 *     return ['Required', { MinLength: [6] }];
 *   })
 *   password: string;
 * }
 * ```
 *
 * ```
 *
 * @example
 * ```typescript
 * // Custom error message
 * class Profile {
 *   @If(({ data }) => ({
 *     rules: ['Required', { MinLength: [5] }],
 *     message: 'A detailed bio is required for public profiles'
 *   }))
 *   bio: string;
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Async validation (e.g., check feature flag)
 * class Feature {
 *   @If(async ({ context }) => {
 *     const enabled = await checkFeatureFlag(context.tenantId);
 *     return enabled ? ['Required'] : [];
 *   })
 *   code: string;
 * }
 * ```
 *
 * @param resolver - Function that returns rules to apply (sync or async)
 * @returns Property decorator
 */
export const If = Validator.buildIfRuleDecorator(function IfRuleFunction({
  ruleParams,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  rule,
  ...options
}) {
  return Validator.validateIfRule({
    ...options,
    resolver: ruleParams[0],
  });
}, VALIDATOR_RULE_MARKERS.if);
