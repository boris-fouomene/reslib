import { I18n } from '@/i18n';
import { InputFormatterResult } from '@/inputFormatter/types';
import { ClassConstructor, Dictionary } from '@/types';
import { ValidatorClassError, ValidatorError } from './errors';
import {
  ValidatorClassInput,
  ValidatorRuleName,
  ValidatorRuleParamTypes,
} from './rules.types';

export * from './rules.types';

/**
 * ## Validator Sync Result
 *
 * Represents the synchronous result returned by a validation rule function.
 *
 * - `true` means the validation rule passed successfully.
 * - `string` means the validation rule failed and the string is the error
 *   message to display to the user.
 *
 * This narrow type is intentionally small to make it easy to return a
 * meaningful result from fast, CPU-only rule functions. If a rule needs to
 * perform asynchronous work, it should return a {@link ValidatorAsyncRuleResult}
 * (i.e. a `Promise<ValidatorSyncRuleResult>`).
 *
 * @example
 * ```ts
 * // Success
 * return true;
 *
 * // Failure with message
 * return 'Must be at least 3 characters.';
 * ```
 *
 * @public
 */
export type ValidatorSyncRuleResult = true | string;

/**
 * ## Validator Async Result
 *
 * A convenience alias for the asynchronous validator result. Asynchronous
 * rules return a Promise that resolves to a {@link ValidatorSyncRuleResult}.
 *
 * Use this type when declaring asynchronous rule implementations so that
 * type-checking and tooling can correctly surface the expected resolved
 * result values (`true` or error `string`).
 *
 * @example
 * ```ts
 * // Asynchronous rule example
 * async function rule(opts) {
 *   const ok = await someAsyncCheck(opts.value);
 *   return ok ? true : 'Async check failed';
 * }
 * ```
 *
 * @public
 */
export type ValidatorAsyncRuleResult = Promise<ValidatorSyncRuleResult>;

/**
 * ## Validator Result
 *
 * Union type that describes the full set of possible return values from a
 * validator rule function (`ValidatorRuleFunction`). The union includes both
 * synchronous and asynchronous outcomes so rule implementations can be either
 * sync or async without requiring the caller to have special handling logic.
 *
 * When consuming a `ValidatorRuleResult` you should `await` it, or treat it as a
 * possible `Promise`, which resolves to a `ValidatorSyncRuleResult`.
 *
 * @example
 * ```ts
 * // Generic rule consumer (supports both sync and async rules)
 * const r = await myRule({ value: 'x' });
 * if (r === true) {
 *   // success
 * } else {
 *   // r is the failure message
 *   console.error(r);
 * }
 * ```
 *
 * @see {@link ValidatorSyncRuleResult}
 * @see {@link ValidatorAsyncRuleResult}
 * @public
 */
export type ValidatorRuleResult =
  | ValidatorSyncRuleResult
  | ValidatorAsyncRuleResult;

/**
 * ## Validation Rule Type
 *
 * The core union type representing all possible ways to specify a validation rule in the validator system.
 * This type provides maximum flexibility by supporting multiple rule specification formats while maintaining
 * type safety and runtime validation capabilities.
 *
 * ### Purpose
 * Defines the complete set of valid rule specifications that can be used in validation operations.
 * Supports three different rule formats to accommodate various use cases and developer preferences.
 *
 * ### Union Members
 *
 * #### 1. Function Rules (`ValidatorRuleFunction`)
 * Custom validation logic defined as functions. Most flexible but requires implementation.
 * ```typescript
 * ({ value, context }) => value.length > 5
 * ```
 *
 * #### 2. Named Rules (`ValidatorRuleName`)
 * Simple string references to built-in validation rules. Most concise format.
 * Only supports rules that don't require parameters (or have optional parameters).
 * ```typescript
 * "Required" | "Email" | "IsNumber"
 * ```
 *
 * #### 3. Object Rules (`ValidatorRuleObject`)
 * Structured object format with type-safe parameters. Most type-safe format.
 * ```typescript
 * { MinLength: [5] } | { Email: [] } | { NumberBetween: [0, 100] }
 * ```
 *
 * ### Type Parameters
 * - **TParams**: Array type for rule parameters (default: `Array<any>`)
 * - **Context**: Type of optional validation context (default: `unknown`)
 *
 * ### Usage Examples
 *
 * #### Mixed Rule Array
 * ```typescript
 * const rules: ValidatorRules = [
 *   "Required",                    // Named rule
 *   { MinLength: [5] },            // Object rule
 *   ({ value }) => value !== "",   // Function rule
 * ];
 * ```
 *
 * #### Type-Safe Rule Creation
 * ```typescript
 * // All these are valid ValidatorRule instances
 * const rule1: ValidatorRule = "Email";
 * const rule3: ValidatorRule = { Required: [] };
 * const rule4: ValidatorRule = ({ value }) => typeof value === 'string';
 * ```
 *
 * #### In Validation Operations
 * ```typescript
 * // Single rule validation
 * const result = await Validator.validate({
 *   value: "test@example.com",
 *   rules: "Email",  // ValidatorRule
 * });
 *
 * // Multiple rules validation
 * const multiResult = await Validator.validate({
 *   value: "hello",
 *   rules: ["Required", { MinLength: [5] }, { MaxLength: [10] }],  // ValidatorRule[]
 * });
 * ```
 *
 * ### Rule Resolution Process
 * When a rule is processed, the system:
 * 1. **Identifies the format** based on the union member
 * 2. **Resolves to a function** using {@link Validator.getRule}
 * 3. **Applies parameters** if specified
 * 4. **Executes validation** with value and context
 *
 * ### Type Safety Benefits
 * - **Compile-time validation** of rule names and parameters
 * - **IDE autocomplete** for built-in rules
 * - **Refactoring safety** - rule signature changes are caught
 * - **Runtime safety** - invalid rules are rejected during parsing
 *
 * ### Performance Considerations
 * - **Function rules**: Fastest (direct execution)
 * - **Named rules**: Fast (lookup table)
 * - **Object rules**: Medium (type mapping required)
 *
 * ### Best Practices
 *
 * #### Choose Rule Format Wisely
 * ```typescript
 * // ✅ Use named rules for simple cases
 * const simpleRules = ["Required", "Email"];
 *
 * // ✅ Use object rules for parameters or type safety
 * const lengthRules = [{ MinLength: [5] }, { MaxLength: [100] }];
 *
 * // ✅ Use function rules for custom logic
 * const customRules = [({ value }) => value % 2 === 0];
 * ```
 *
 * #### Combine Rule Types
 * ```typescript
 * const comprehensiveRules: ValidatorRules = [
 *   "Required",           // Built-in
 *   { MinLength: [5] },   // Object (parameterized)
 *   { Email: [] },        // Object (type-safe)
 *   ({ value, context }) => {  // Custom function
 *     return context?.allowSpecialChars || !/[!@#$%]/.test(value);
 *   },
 * ];
 * ```
 *
 * ### Error Handling
 * Invalid rules are caught during validation:
 * ```typescript
 * // These will throw validation errors:
 * const invalid1 = "UnknownRule";        // Rule doesn't exist
 * const invalid2 = { UnknownRule: [] };  // Unknown rule name
 * ```
 *
 * ### Relationship to Validation System
 * This type is the foundation of the validation system and is used by:
 * - All validation decorators and rule builders
 *
 * @template TParams - Array type for rule parameters, defaults to any array
 * @template Context - Type of optional validation context, defaults to unknown
 *
 * @example
 * ```typescript
 * // Define flexible validation rules
 * type UserRules = ValidatorRule[];
 *
 * const userValidationRules: UserRules = [
 *   "Required",
 *   { MinLength: [3] },
 *   { MaxLength: [50] },
 *   ({ value }) => !/\s/.test(value),  // No spaces
 * ];
 *
 * // Use in validation
 * const result = await Validator.validate({
 *   value: "john_doe",
 *   rules: userValidationRules,
 * });
 * ```
 *
 *
 * @see {@link ValidatorRuleFunction} - Function-based rules
 * @see {@link ValidatorRuleName} - Built-in rule names
 * @see {@link ValidatorRuleObject} - Object-based rules
 * @see {@link ValidatorRuleParamTypes} - Built-in rule definitions
 * @see {@link Validator} - Main validation class
 * @public
 */
export type ValidatorRule<
  TParams extends ValidatorRuleParams = ValidatorRuleParams,
  Context = unknown,
> =
  | ValidatorRuleFunction<TParams, Context>
  | ValidatorOptionalOrEmptyRuleNames
  | ValidatorRuleObject;

/**
 * @typedef {ValidatorOptionalOrEmptyRuleNames}
 * Union of rule names whose **runtime parameter list** is either
 *  - completely empty (`[]`), or
 *  - contains only optional elements (e.g. `[countryCode?: string]`).
 *
 * These are the rules that can be invoked without supplying arguments
 * or whose arguments are truly optional at the call-site.
 *
 * ┌-------------------------------------------------------------------------┐
 * │  EXAMPLES                                                               │
 * │  ----------                                                             │
 * │  ✔  "Email"                // Array<[]>                                │
 * │  ✔  "PhoneNumber"          // Array<[countryCode?: string]>            │
 * │  ✘  "Length"               // Array<[number, number?]>        │
 * │  ✘  "NumberLT"       // Array<[number]>                          │
 * └-------------------------------------------------------------------------┘
 *
 * The type is built in two steps:
 *  1. `ExtractOptionalOrEmptyKeys` keeps the keys whose tuple is empty or
 *     fully optional (see helper below).
 *  2. `& keyof ValidatorRuleParamTypes` is a sanity filter that guarantees we
 *     never leak alien keys should the utility mis-behave.
 */
export type ValidatorOptionalOrEmptyRuleNames =
  ExtractOptionalOrEmptyKeys<ValidatorRuleParamTypes>;

/**
 * ## Tuple Allows Empty Type
 *
 * A conditional type that determines if a tuple type allows empty invocation (no arguments).
 * This type is fundamental to the validator's parameter system, enabling type-safe determination
 * of which validation rules can be called without supplying arguments.
 *
 * ### Purpose
 * Provides compile-time type safety for determining whether validation rule parameter tuples
 * support empty invocation. This is crucial for distinguishing between rules that require
 * parameters (like `MinLength`) and rules that can be called without them (like `Required`).
 *
 * ### Type Logic
 * The type uses conditional type checking to evaluate tuple structures:
 * - **Empty tuples `[]`**: Always allow empty invocation (returns `true`)
 * - **Non-empty tuples**: Check if empty array is assignable using `[] extends T`
 *   - If assignable: All parameters are optional (returns `true`)
 *   - If not assignable: At least one parameter is required (returns `false`)
 *
 * ### Examples
 *
 * #### Empty Parameter Rules (returns `true`)
 * ```typescript
 * // Rules with no parameters - can be called without arguments
 * type EmailParams = [];                                    // true
 * type RequiredParams = [];                                 // true
 * type PhoneParams = [countryCode?: string];               // true (optional param)
 * type NullableParams = [];                                 // true
 * ```
 *
 * #### Required Parameter Rules (returns `false`)
 * ```typescript
 * // Rules with required parameters - must be called with arguments
 * type MinLengthParams = [number];                          // false
 * type MaxLengthParams = [number];                          // false
 * type LengthParams = [number, number?];                   // false (first param required)
 * type NumberBetweenParams = [number, number];             // false
 * ```
 *
 * ### Usage in Validation System
 * This type is used internally by the validator to:
 * - **Generate rule unions**: Create {@link ValidatorOptionalOrEmptyRuleNames}
 * - **Type parameter extraction**: Determine which rules can be called without args
 * - **Rule registry filtering**: Separate parameterless from parameterized rules
 *
 * ### Advanced Type-Level Operations
 * ```typescript
 * // Extract rules that can be called without parameters
 * type ParameterlessRules = {
 *   [K in keyof ValidatorRuleParamTypes]: ValidatorTupleAllowsEmpty<
 *     ValidatorRuleParamTypes[K]
 *   > extends true ? K : never;
 * }[keyof ValidatorRuleParamTypes];
 *
 * // Extract rules that require parameters
 * type ParameterizedRules = {
 *   [K in keyof ValidatorRuleParamTypes]: ValidatorTupleAllowsEmpty<
 *     ValidatorRuleParamTypes[K]
 *   > extends false ? K : never;
 * }[keyof ValidatorRuleParamTypes];
 * ```
 *
 * ### Relationship to Validation System
 * - **Used by**: {@link ExtractOptionalOrEmptyKeys} to filter rule parameter types
 * - **Enables**: {@link ValidatorOptionalOrEmptyRuleNames} union type creation
 * - **Supports**: Type-safe rule invocation without parameters
 * - **Foundation**: Core type for parameter validation logic
 *
 * ### Type Safety Benefits
 * - **Compile-time validation**: Prevents calling parameterized rules without args
 * - **IDE support**: Better autocomplete for parameterless rules
 * - **Refactoring safety**: Changes to rule parameters are caught by TypeScript
 * - **Runtime safety**: Ensures proper parameter handling in rule implementations
 *
 * ### Implementation Details
 * The type uses advanced TypeScript conditional types and assignability checks:
 * - `T extends []`: Direct check for empty tuple literals
 * - `[] extends T`: Covariant assignability check for optional parameters
 * - This correctly handles both mutable and readonly array types
 *
 * ### Best Practices
 *
 * #### When Adding New Rules
 * ```typescript
 * // ✅ Parameterless rules (can be called as "RuleName")
 * Required: [];                    // No parameters needed
 * Email: [];                       // No parameters needed
 * PhoneNumber: [countryCode?: string]; // Optional parameter
 *
 * // ❌ Parameterized rules (must be used as { RuleName: [...] })
 * MinLength: [number];             // Required parameter
 * MaxLength: [number];             // Required parameter
 * Length: [number, number?];       // First parameter required
 * ```
 *
 * #### Type-Level Programming
 * ```typescript
 * // Create union of parameterless rule names
 * type ParameterlessRuleNames = {
 *   [K in keyof ValidatorRuleParamTypes]: ValidatorTupleAllowsEmpty<
 *     ValidatorRuleParamTypes[K]
 *   > extends true ? K : never;
 * }[keyof ValidatorRuleParamTypes];
 * // Result: "Required" | "Email" | "PhoneNumber" | "Empty" | "Nullable" | "Optional"
 * ```
 *
 * @template T - The tuple type to check (must extend Array<any>)
 *
 * @public
 *
 * @see {@link ValidatorOptionalOrEmptyRuleNames} - Union type created using this
 * @see {@link ExtractOptionalOrEmptyKeys} - Helper type that uses this
 * @see {@link ValidatorRuleParamTypes} - Rule parameter definitions checked by this
 * @see {@link ValidatorRuleName} - Rule names validated by this type
 */
export type ValidatorTupleAllowsEmpty<T extends Array<unknown>> = T extends []
  ? true
  : [] extends T
    ? true
    : false;

/**
 * Extracts keys whose rule parameter tuple is empty or fully optional.
 * This correctly captures cases like `[countryCode?: CountryCode]`.
 */
type ExtractOptionalOrEmptyKeys<T> = {
  [K in keyof T]: T[K] extends Array<unknown>
    ? ValidatorTupleAllowsEmpty<T[K]> extends true
      ? K
      : never
    : never;
}[keyof T];

/**
 * ## Validation Rule Object Type
 *
 * Represents a structured object format for specifying validation rules with their parameters.
 * This type creates a mapped type that ensures type safety when defining rules as objects
 * rather than strings or functions.
 *
 * ### Purpose
 * Provides a strongly-typed way to specify validation rules with parameters using object notation.
 * This is particularly useful when you need to ensure type safety for rule parameters at compile time.
 *
 * ### Type Structure
 * This is a mapped type that creates an object where:
 * - **Key**: Must be a valid `ValidatorRuleName` (e.g., "MinLength", "Email", etc.)
 * - **Value**: Must match the parameter type defined in `ValidatorRuleParamTypes` for that rule
 *
 * ### Generated Structure
 * For each rule in `ValidatorRuleParamTypes`, this type generates an object like:
 * ```typescript
 * {
 *   MinLength: [number];        // Requires array with one number
 *   Email: [];                  // Requires empty array
 *   NumberBetween: [number, number]; // Requires array with two numbers
 * }
 * ```
 *
 * ### Usage Examples
 *
 * #### Basic Rule Objects
 * ```typescript
 * // Valid rule objects
 * const minLengthRule: ValidatorRuleObject = {
 *   MinLength: [5]  // Must be array with one number
 * };
 *
 * const emailRule: ValidatorRuleObject = {
 *   Email: []  // Must be empty array
 * };
 *
 * const betweenRule: ValidatorRuleObject = {
 *   NumberBetween: [0, 100]  // Must be array with two numbers
 * };
 * ```
 *
 * #### Rule Objects with Custom Messages
 * ```typescript
 * const customMessageRule: ValidatorRuleObject = {
 *   Required: {
 *     params: [],
 *     message: "This field is absolutely required!"
 *   }
 * };
 *
 * const detailedRule: ValidatorRuleObject = {
 *   MinLength: {
 *     params: [5],
 *     message: "validation.custom.minLength" // Translation key
 *   }
 * };
 * ```
 *
 * #### In Validation Rules Array
 * ```typescript
 * const rules: ValidatorRules = [
 *   "Required",                    // String rule
 *   { MinLength: [5] },           // Object rule (this type)
 *   ({ value }) => value > 0,     // Function rule
 * ];
 * ```
 *
 * #### Type Safety Benefits
 * ```typescript
 * // TypeScript will catch these errors:
 * const invalid1: ValidatorRuleObject = {
 *   MinLength: 5  // ❌ Error: Must be array, not number
 * };
 *
 * const invalid2: ValidatorRuleObject = {
 *   MinLength: [5, 10]  // ❌ Error: MinLength only takes one parameter
 * };
 *
 * const invalid3: ValidatorRuleObject = {
 *   UnknownRule: []  // ❌ Error: UnknownRule not in ValidatorRuleName
 * };
 * ```
 *
 * ### Relationship to Other Rule Types
 * This type is one of four union members in {@link ValidatorRule}:
 * - `ValidatorRuleFunction` - Custom validation functions
 * - `ValidatorRuleName` - Simple rule names (strings)
 * - `ValidatorRuleObject` - Structured rule objects (this type)
 *
 * ### When to Use
 * Use this type when you need:
 * - **Type Safety**: Compile-time validation of rule parameters
 * - **IDE Support**: Better autocomplete and error detection
 * - **Complex Parameters**: Rules with multiple typed parameters
 * - **Refactoring Safety**: Changes to rule signatures are caught by TypeScript
 *

 * @template Context - Type of the optional validation context
 *
 * @example
 * ```typescript
 * // Define rules with full type safety
 * const userRules: ValidatorRules = [
 *   { Required: [] },
 *   { Email: [] },
 *   { MinLength: [3] },
 *   { MaxLength: [50] },
 * ];
 *
 * // TypeScript ensures parameter types match
 * const result = await Validator.validate({
 *   value: "test@example.com",
 *   rules: userRules,
 * });
 * ```
 *
 *
 * @see {@link ValidatorRule} - Union type that includes this
 * @see {@link ValidatorRuleName} - Valid rule names
 * @see {@link ValidatorRuleParamTypes} - Parameter type definitions
 * @see {@link ValidatorRuleFunction} - Function-based rules
 * @public
 */
export type ValidatorRuleObject = Partial<{
  [K in ValidatorRuleName]:
    | ValidatorRuleParamTypes[K]
    | {
        params: ValidatorRuleParamTypes[K];
        message?: string;
      };
}>;

/**
 * Represents an array of validation rules to be applied to a value.
 *
 * This type defines a collection of validation rules that will be executed
 * in sequence against a single value. Each rule in the array can be specified
 * in various formats and will be processed by the validator.
 *
 * @template Context - The type of the optional validation context
 *
 * @example
 * ```typescript
 * // Using rule names
 * const rules1: ValidatorRules = ["Required", "Email"];
 *
 * // Using parameterized rules
 * const rules2: ValidatorRules = ["Required", { MinLength: [5] }, { MaxLength: [100] }];
 *
 * // Using validation functions
 * const rules3: ValidatorRules = [
 *   "Required",
 *   ({ value }) => value.length >= 5 || "Too short"
 * ];
 *
 * // Using rule objects
 * const rules4: ValidatorRules = [
 *   { ruleName: "Required" },
 *   { ruleName: "MinLength", params: [8] }
 * ];
 * ```
 *
 * @public
 *
 * @see {@link ValidatorRule} - Individual rule type
 * @see {@link ValidatorOptions} - Options interface that uses this type
 * @see {@link Validator.validate} - Validation method that accepts these rules
 */
export type ValidatorRules<Context = unknown> = Array<
  ValidatorRule<Array<unknown>, Context>
>;
/**
 * @typedef ValidatorSanitizedRule
 * Represents a sanitized validation rule.
 *
 * This type can either be a validation rule function or an object that contains
 * detailed information about a validation rule, including its name, parameters,
 * and the function that implements the validation logic.
 *
 * @example
 * // Example of a validation rule function
 * const minLengthRule: ValidatorSanitizedRule = ({ value }) => {
 *     return value.length >= 5 || "Minimum length is 5 characters.";
 * };
 *
 * // Example of a sanitized rule object
 * const sanitizedRule: ValidatorSanitizedRule = {
 *     ruleName: "minLength",
 *     params: [5],
 *     ruleFunction: minLengthRule,
 * };
 */
export type ValidatorSanitizedRule<
  TParams extends ValidatorRuleParams = ValidatorRuleParams,
  Context = unknown,
> =
  | ValidatorRuleFunction<TParams, Context>
  | ValidatorSanitizedRuleObject<TParams>;

/**
 * ## Sanitized Rule Object
 *
 * Represents a structured object containing parsed and sanitized validation rule information.
 * This interface defines the shape of objects that contain all the necessary details
 * for executing a validation rule after it has been processed from its raw form.
 *
 * ### Purpose
 * After validation rules are parsed from objects like `{ MinLength: [5] }` or `{ ruleName: "Required" }`, they are converted into this standardized object format
 * `{ ruleName: "Required" }`, they are converted into this standardized object format
 * that contains all the information needed to execute the validation.
 *
 * ### Properties Overview
 * - **ruleName**: The parsed rule identifier (e.g., "MinLength")
 * - **params**: Array of parameters extracted from the rule (e.g., `[5]`)
 * - **ruleFunction**: The actual validation function to execute
 *
 * ### Usage in Validation Pipeline
 * ```typescript
 * // Raw rule input
 * const rawRule = "MinLength";
 *
 * // After parsing/sanitization
 * const sanitizedRule: ValidatorSanitizedRuleObject = {
 *   ruleName: "MinLength",
 *   params: [8],
 *   ruleFunction: minLengthFunction,
 * };
 *
 * // During validation
 * const result = await sanitizedRule.ruleFunction({
 *   value: "password123",
 *   ruleParams: sanitizedRule.params,
 *   // ... other options
 * });
 * ```
 *
 * ### Relationship to ValidatorSanitizedRule
 * This interface is one of the union members of {@link ValidatorSanitizedRule}.
 * The union allows rules to be represented as either:
 * - A direct function (`ValidatorRuleFunction`)
 * - A structured object (`ValidatorSanitizedRuleObject`)
 *
 * @template TParams - The type of parameters that the rule accepts (default: Array<any>)
 * @template Context - The type of the optional validation context
 *
 * @public
 *
 * @see {@link ValidatorSanitizedRule} - Union type that includes this interface
 * @see {@link ValidatorRuleFunction} - The validation function type
 * @see {@link ValidatorRuleName} - Rule name type
 */
export interface ValidatorSanitizedRuleObject<
  TParams extends ValidatorRuleParams = ValidatorRuleParams,
  Context = unknown,
> {
  /**
   * The parsed name of the validation rule
   *
   * This is the rule identifier extracted from the original rule specification.
   * For example, if the raw rule was {MinLength:[5]}, this would be "MinLength".
   * Must be a valid rule name from {@link ValidatorRuleName}.
   *
   * @type {ValidatorRuleName}
   * @example "MinLength"
   * @example "Required"
   * @example "Email"
   *
   * @see {@link ValidatorRuleName}
   */
  ruleName: ValidatorRuleName;

  /**
   * The parameters extracted from the rule specification
   *
   * Array of values that were parsed from the rule's parameter brackets.
   * Empty array for rules that don't take parameters.
   *
   * @type {TParams}
   * @example [] // For "Required" rule
   * @example [5] // For {MinLength:[5]} rule
   * @example [0, 100] // For {NumberBetween:[0,100]} rule
   */
  params: TParams;

  /**
   * The validation function that implements the rule logic
   *
   * The actual executable function that performs the validation.
   * This function receives validation options and returns a result
   * indicating whether the validation passed or failed.
   *
   * @type {ValidatorRuleFunction<TParams>}
   * @see {@link ValidatorRuleFunction}
   */
  ruleFunction: ValidatorRuleFunction<TParams, Context>;

  /**
   * The error message associated with the validation rule
   *
   * This is the error message that will be returned if the validation fails.
   * It can be a translation key or a static string.
   * @type {string}
   * @example "This field is required."
   * @example "Value must be between {min} and {max}."
   * @example "auth.email.required"
   */
  ruleMessage?: string;
}
/**
 * @typedef ValidatorSanitizedRules
 * Represents an array of sanitized validation rules.
 *
 * This type is a collection of sanitized rules, allowing for multiple
 * validation rules to be applied in a structured manner.
 *
 * @template Context The type of the optional validation context.
 *
 * @example
 * const sanitizedRules: ValidatorSanitizedRules = [
 *     {
 *         ruleName: "required",
 *         params: [],
 *         ruleFunction: ({ value }) => !!value || "This field is required.",
 *     },
 *     {
 *         ruleName: "minLength",
 *         params: [5],
 *         ruleFunction: ({ value }) => value.length >= 5 || "Minimum length is 5 characters.",
 *     },
 * ];
 */
export type ValidatorSanitizedRules<Context = unknown> = ValidatorSanitizedRule<
  Array<unknown>,
  Context
>[];

/**
 * ## Validator Rule Function
 *
 * Represents the fundamental unit of logic in the validation system: a function that validates a value.
 *
 * This type definition abstracts both **Synchronous** and **Asynchronous** validation logic into a unified
 * interface, allowing the validator to handle everything from simple checks (regex, length) to complex
 * operations (database lookups, API calls) seamlessly.
 *
 * ### Core Responsibilities
 * 1. **Receive Context**: Accepts a rich options object (`ValidatorOptions`) containing the value, rule parameters, and context.
 * 2. **Execute Logic**: Performs the actual validation check.
 * 3. **Report Result**: Returns `true` for success or an error message (string) for failure.
 *
 * ### Type Parameters
 * - **TParams**: Tightly couples the function to a specific set of parameters (e.g., `[min: number]`).
 * - **Context**: Allows injecting application-specific context (e.g., database connection, user session).
 *
 * ### Return Behavior
 * The return type {@link ValidatorRuleResult} is a union of:
 * - `boolean`: `true` indicates valid.
 * - `string`: A non-empty string indicates invalid (the string is the error message/key).
 * - `Promise<boolean | string>`: For async rules.
 *
 * ### Example Usage
 *
 * #### Synchronous Rule
 * ```typescript
 * const isEven: ValidatorRuleFunction = ({ value }) => {
 *   if (typeof value !== 'number') return "Value must be a number";
 *   return value % 2 === 0 || "Value must be even";
 * };
 * ```
 *
 * #### Asynchronous Rule
 * ```typescript
 * const isUniqueUser: ValidatorRuleFunction = async ({ value, context }) => {
 *   const user = await context.db.users.findByEmail(value);
 *   return !user || "Email already exists";
 * };
 * ```
 *
 * ### Interaction with Registry
 * These functions are typically registered with the `Validator` class using names like "MinLength" or "Email",
 * allowing them to be referenced by string later.
 *
 * @see {@link ValidatorOptions} - The input object received by this function.
 * @see {@link ValidatorRuleResult} - The output produced by this function.
 */
export type ValidatorRuleFunction<
  TParams extends ValidatorRuleParams = ValidatorRuleParams,
  Context = unknown,
> = (options: ValidatorOptions<TParams, Context>) => ValidatorRuleResult;

/**
 * ## Validation Rule Parameters Type
 *
 * A conditional type that defines the parameter structure for validation rules.
 * This type handles both mutable and readonly array parameters, providing flexibility
 * for validation rules that accept different parameter formats.
 *
 * ### Type Behavior
 * - **Empty Arrays**: When `TParams` is an empty array `[]`, resolves to `[]`
 * - **Non-Empty Arrays**: Resolves to either the original `TParams` or its readonly variant `Readonly<TParams>`
 * - **Readonly Support**: Accepts both `Array<any>` and `ReadonlyArray<any>` as input types
 *
 * ### Purpose
 * This type enables validation rules to accept parameters in multiple formats:
 * - Readonly arrays: `readonly [minLength: number]` for const assertions
 * - Empty parameters: `[]` for rules like `Required` that take no parameters
 *
 * ### Generic Parameters
 * - **TParams**: The parameter array type (must extend `Array<any>` or `ReadonlyArray<any>`)
 * - **Context**: Optional context type (defaults to `unknown`)
 *
 * ### Usage in Rule Definitions
 * ```typescript
 * // Rule that takes a single number parameter
 * MinLength: ValidatorRuleParams<[minLength: number]>;
 *
 * // Rule that takes min and max number parameters
 * Length: ValidatorRuleParams<[lengthOrMin: number, maxLength?: number]>;
 *
 * // Rule that takes no parameters
 * Required: ValidatorRuleParams<[]>;
 *
 * // Rule that accepts readonly arrays (e.g., const assertions)
 * IsEnum: ValidatorRuleParams<ReadonlyArray<string>>;
 * ```
 *
 * ### Type Resolution Examples
 * ```typescript
 * // Empty array resolves to empty array
 * type RequiredParams = ValidatorRuleParams<[]>; // []
 *
 * // Single parameter array
 * type MinLengthParams = ValidatorRuleParams<[number]>; // [number] | readonly [number]
 *
 * // Multiple parameters
 * type BetweenParams = ValidatorRuleParams<[number, number]>; // [number, number] | readonly [number, number]
 * ```
 *
 * ### Relationship to Validation System
 * - Used by {@link ValidatorRuleParamTypes} to define parameter types for each rule
 * - Compatible with {@link ValidatorRuleFunction} parameter signatures
 * - Supports both mutable and immutable parameter arrays for flexibility
 *
 * @template TParams - The parameter array type (extends Array<unknown> | ReadonlyArray<unknown>)
 * @template Context - Optional context type for validation (defaults to unknown)
 *
 * @public
 *
 * @see {@link ValidatorRuleParamTypes} - Uses this type for rule parameter definitions
 * @see {@link ValidatorRuleFunction} - Validation function that receives these parameters
 * @see {@link ValidatorRule} - Complete rule definition including this parameter type
 */
export type ValidatorRuleParams<
  TParams extends Array<unknown> | ReadonlyArray<unknown> = Array<unknown>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Context = unknown,
> = TParams extends [] ? [] : TParams;

/**
 * ## Nested Rule Function Options
 *
 * Configuration interface for validating nested objects or complex data structures
 * within the validation system. This interface is specifically designed for rule functions
 * that need to validate class objects (classes with decorators) rather than simple values.
 *
 * ### Purpose
 * Provides a specialized options interface for validation rule functions that operate on
 * nested or complex data structures. Unlike {@link ValidatorOptions} which handles
 * single values, this interface is tailored for scenarios where validation rules need to
 * work with entire class instances or nested object hierarchies.
 *
 * ### Key Differences from ValidatorOptions
 * - **Extends from ValidateClassOptions**: Inherits class-specific properties
 * - **Omits "data" property**: Uses its own `data` property instead
 * - **Optional value property**: Accepts class data instead of single values
 * - **Flexible data property**: Allows any record structure for nested validation
 *
 * ### Inheritance Structure
 * ```
 * ValidatorNestedRuleFunctionOptions
 *   ↳ extends Omit<ValidateClassOptions<TClass, Context, [target: TClass]>, "data">
 *     ↳ extends Omit<ValidatorOptions<TParams, Context>, "data" | "rule" | "value">
 *       ↳ extends Omit<Partial<InputFormatterResult>, "value">
 *         ↳ extends BaseData<Context>
 * ```
 *
 * ### Generic Parameters
 * - **TClass**: The class constructor type being validated (extends `ClassConstructor`)
 * - **Context**: Optional context type for validation (defaults to `unknown`)
 *
 * ### Properties Overview
 *
 * #### Inherited Properties
 * - **rules**: Array of validation rules to apply
 * - **ruleParams**: Parameters for the current rule
 * - **ruleName**: Name of the validation rule
 * - **message**: Custom error message
 * - **fieldName**: Form field identifier
 * - **propertyName**: Object property name
 * - **translatedPropertyName**: Localized property name
 * - **i18n**: Internationalization instance
 * - **sanitizedRules**: Preprocessed rules
 * - **startTime**: Performance tracking timestamp
 * - **errorMessageBuilder**: Custom error message builder
 * - **parentData**: Parent context for nested validations
 *
 * #### Own Properties
 * - **value**: Optional target data to validate
 * - **data**: Flexible data object for nested validation context
 *
 * ### Usage in Nested Validation
 * ```typescript
 * class UserProfile {
 *   @IsRequired()
 *   @IsEmail()
 *   email: string;
 *
 *   @IsRequired()
 *   @ValidateNested
 *   address: Address;
 * }
 *
 * // Custom nested validation rule
 * async function validateNestedProfile(options: ValidatorNestedRuleFunctionOptions<UserProfile, ValidationContext>) {
 *   const { value, data, context } = options;
 *
 *   // Validate the nested profile
 *   if (value && typeof value === 'object') {
 *     // Perform nested validation logic
 *     const result = await Validator.validateClass(UserProfile, value);
 *     return result.success || "Profile validation failed";
 *   }
 *
 *   return true;
 * }
 * ```
 *
 * ### Relationship to Validation System
 * - **Used by**: {@link Validator.validateNestedRule} method
 * - **Complements**: {@link ValidateClassOptions} for target validation
 * - **Extends**: {@link ValidatorOptions} with target-specific modifications
 * - **Supports**: Complex nested object validation scenarios
 *
 * ### Common Use Cases
 *
 * #### 1. Nested Object Validation
 * ```typescript
 * const options: ValidatorNestedRuleFunctionOptions<User, Context> = {
 *   value: userInstance,        // Full user object
 *   data: { parentForm: form }, // Additional context
 *   propertyName: "user",       // Property being validated
 *   context: validationContext, // Typed context
 * };
 * ```
 *
 * #### 2. Array of Objects Validation
 * ```typescript
 * const options: ValidatorNestedRuleFunctionOptions<Item[], Context> = {
 *   value: itemsArray,          // Array of items
 *   data: { index: 0 },         // Current index context
 *   propertyName: "items",      // Array property name
 * };
 * ```
 *
 * #### 3. Conditional Nested Validation
 * ```typescript
 * const options: ValidatorNestedRuleFunctionOptions<Address, Context> = {
 *   value: addressData,         // Address object (if present)
 *   data: { required: true },   // Validation requirements
 *   propertyName: "shippingAddress",
 *   context: { userType: "premium" },
 * };
 * ```
 *
 * ### Type Safety Benefits
 * - **Compile-time validation** of target types
 * - **Type-safe property access** on nested objects
 * - **Context propagation** through validation hierarchy
 * - **Flexible data structures** for complex validation scenarios
 *
 * ### Performance Considerations
 * - **TClass validation overhead**: More expensive than single-value validation
 * - **Parallel processing**: Multiple nested validations can run concurrently
 * - **Memory usage**: Larger data structures require more memory
 * - **Serialization**: Complex objects may need special handling
 *
 * @see {@link ClassConstructor} - Class constructor constraint
 */
export interface ValidatorNestedRuleFunctionOptions<
  TClass extends ClassConstructor = ClassConstructor,
  Context = unknown,
> extends Omit<
  ValidateClassOptions<
    TClass,
    Context,
    [
      target: TClass,
      options?: {
        /**
         * The custom error message to use when validation fails.
         * It can be either a translation key or a custom message.
         */
        message?: string;
      },
    ]
  >,
  'data'
> {
  value?: ValidatorClassInput<TClass>;

  data?: Dictionary;
}

export interface ValidatorOptions<
  TParams extends ValidatorRuleParams = ValidatorRuleParams,
  Context = unknown,
>
  extends Omit<Partial<InputFormatterResult>, 'value'>, BaseData<Context> {
  /**
   * The list of validation rules to apply
   *
   * Array of rules that will be executed in sequence against the value.
   * Each rule can have its own parameters and configuration.
   *
   * @type {ValidatorRule[]}
   * @optional
   *
   * @example
   * ```typescript
   * const options: ValidatorOptions = {
   *   value: "example@test.com",
   *   rules: [
   *     { ruleName: "Required" },
   *     { ruleName: "Email" },
   *     { ruleName: "MaxLength", params: [100] }
   *   ]
   * };
   * ```
   *
   * @see {@link ValidatorRule}
   */
  rules?: ValidatorRules<Context>;

  /**
   * Internal: Sanitized rules after preprocessing
   *
   * This property is used internally by the validator after rules have been
   * parsed and sanitized. Users typically do not need to set this manually.
   *
   * @type {ValidatorSanitizedRules<Context>}
   * @internal
   * @optional
   */
  sanitizedRules?: ValidatorSanitizedRules<Context>;

  /**
   * The current/primary validation rule being applied
   *
   * Specifies the specific rule to apply. Can be used to override or specify
   * a particular rule from the `rules` array, or to apply a single rule directly.
   *
   * @type {ValidatorRule<TParams, Context>}
   * @optional
   *
   * @example
   * ```typescript
   * const options: ValidatorOptions = {
   *   value: "test",
   *   rule: { ruleName: "Required" },
   *   propertyName: "username"
   * };
   * ```
   *
   * @see {@link ValidatorRule}
   */
  rule?: ValidatorRule<TParams, Context>;

  /**
   * Parameters passed to the validation rule
   *
   * Contains the parameters required by the current rule. For example, for a
   * MinLength rule, this would be `[5]` to require minimum 5 characters.
   * These are typically extracted from raw rule names like {MinLength:[5]}.
   *
   * @type {TParams}
   * @optional
   *
   * @example
   * ```typescript
   * // For MinLength rule
   * const options: ValidatorOptions = {
   *   value: "password123",
   *   rule: { ruleName: "MinLength" },
   *   ruleParams: [8],  // Minimum 8 characters
   *   propertyName: "password"
   * };
   *
   * // For NumberBetween rule
   * const options2: ValidatorOptions = {
   *   value: 50,
   *   rule: { ruleName: "NumberBetween" },
   *   ruleParams: [0, 100],  // Between 0 and 100
   *   propertyName: "percentage"
   * };
   * ```
   */
  ruleParams: TParams;

  /**
   * The name of the validation rule
   *
   * Identifies which validation rule is being applied. Examples include:
   * "Required", "Email", "MinLength", "MaxLength", "Regex", "Custom", etc.
   *
   * @type {ValidatorRuleName}
   * @optional
   *
   * @example
   * ```typescript
   * const options: ValidatorOptions = {
   *   value: "user@example.com",
   *   ruleName: "Email",
   *   propertyName: "email"
   * };
   * ```
   *
   * @see {@link ValidatorRuleName}
   */
  ruleName?: ValidatorRuleName;

  /**
   * Custom error message for validation failure
   *
   * Allows specifying a custom error message to display when validation fails.
   * If provided, this message will be used instead of the default rule-generated message.
   * Supports i18n translations and dynamic content.
   *
   * @type {string}
   * @optional
   *
   * @example
   * ```typescript
   * const options: ValidatorOptions = {
   *   value: "invalid-email",
   *   rules: ["Email"],
   *   message: "Please enter a valid email address (e.g., user@example.com)",
   *   propertyName: "email"
   * };
   *
   * // Custom message for specific context
   * const options2: ValidatorOptions = {
   *   value: "short",
   *   rule: { ruleName: "MinLength" },
   *   ruleParams: [8],
   *   message: "Your password must be at least 8 characters for security",
   *   propertyName: "password"
   * };
   * ```
   */
  message?: string;

  /**
   * The form field name/identifier
   *
   * Identifies the field in a form or data structure. Typically used for
   * form attributes like `name="field_name"` or `id="field_id"`.
   * Used to map errors back to UI elements or log error context.
   *
   * @type {string}
   * @optional
   *
   * @example
   * ```typescript
   * const options: ValidatorOptions = {
   *   value: "invalid@",
   *   rules: ["Email"],
   *   fieldName: "email_input",         // HTML form field ID
   *   propertyName: "email",            // JS object property name
   *   message: "Invalid email format"
   * };
   * ```
   */
  fieldName?: string;

  /**
   * The label of the field being validated
   *
   * Identifies the label of the field being validated.
   * This is typically the actual label of your data class.
   * Used for error reporting and mapping validation errors back to properties.
   * This is used to display the field label in the error message.
   * If translatedPropertyName is provided, it will have the same value otherwise it will be the fieldName.
   *
   * @type {string}
   * @optional
   */
  fieldLabel?: string;

  /**
   * The object property name being validated
   *
   * Identifies the property on the object/class being validated.
   * This is typically the actual property name on your data class.
   * Used for error reporting and mapping validation errors back to properties.
   *
   * @type {string}
   * @optional
   *
   * @example
   * ```typescript
   * class UserData {
   *   email: string;
   *   password: string;
   * }
   *
   * const options: ValidatorOptions = {
   *   value: "invalid-email",
   *   rules: ["Email"],
   *   propertyName: "email",  // Maps to UserData.email
   *   fieldName: "email_field", // HTML field identifier
   *   message: "Invalid email"
   * };
   * ```
   */
  propertyName?: string;

  /**
   * The translated/localized property name
   *
   * A user-friendly or localized version of the property name for display in
   * error messages. For example, if `propertyName` is "user_birth_date",
   * `translatedPropertyName` might be "Date of Birth" in English or
   * "Date de Naissance" in French.
   *
   * This property is typically populated by the validator's translation system.
   *
   * @type {string}
   * @optional
   *
   * @example
   * ```typescript
   * // Before translation
   * const options: ValidatorOptions = {
   *   value: "invalid",
   *   rules: ["Required"],
   *   propertyName: "user_phone_number"
   * };
   *
   * // After translation (populated by validator)
   * // options.translatedPropertyName = "Phone Number"
   * // options.message = "[Phone Number]: Must not be empty"
   * ```
   */
  translatedPropertyName?: string;

  /**
   * Internationalization instance for translations
   *
   * Provides access to the i18n system for translating messages and property names.
   */
  i18n: I18n;
}
/**
 * ## OneOf Rule Validation Options
 *
 * Configuration interface for validating a value against an array of alternative validation rules
 * where at least one rule must pass. This interface extends {@link ValidatorOptions}
 * with specialized properties for OneOf rule validation.
 *
 * ### Purpose
 * Used specifically by {@link Validator.validateOneOfRule} to handle the "OneOf" validation logic,
 * which allows validation to succeed if any one of the provided sub-rules passes validation.
 *
 * ### Key Differences from Base Options
 * - **ruleParams**: Overrides base to require an array of rule functions (not mixed rule types)
 * - **rules**: Excluded via `Omit` since OneOf uses `ruleParams` instead
 * - **startTime**: Optional timestamp for performance tracking
 *
 * ### Rule Parameter Structure
 * The `ruleParams` property contains an array of validation rule functions that will be
 * executed in parallel. Each function should follow the {@link ValidatorRuleFunction} signature.
 *
 * ### Usage Context
 * This interface is primarily used internally by the validator when processing "OneOf" rules,
 * but can also be used directly when calling {@link Validator.validateOneOfRule}.
 *
 * ### Examples
 *
 * #### Basic OneOf Validation Setup
 * ```typescript
 * const options: ValidateMultiRuleOptions = {
 *   value: "user@example.com",
 *   ruleParams: [
 *     ({ value }) => value.includes("@") || "Must contain @",
 *     ({ value }) => value.endsWith(".com") || "Must end with .com",
 *     ({ value }) => value.length > 10 || "Must be longer than 10 chars"
 *   ],
 *   fieldName: "contact",
 *   propertyName: "contact",
 *   translatedPropertyName: "Contact Information",
 *   startTime: Date.now()
 * };
 *
 * const result = await Validator.validateOneOfRule(options);
 * ```
 *
 * #### With Context and Additional Options
 * ```typescript
 * interface ValidationContext {
 *   userId: number;
 *   allowedDomains: string[];
 * }
 *
 * const options: ValidateMultiRuleOptions<ValidationContext> = {
 *   value: "admin@company.com",
 *   ruleParams: [
 *     // Email validation
 *     ({ value }) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || "Invalid email",
 *
 *     // Phone validation
 *     ({ value }) => /^\+?[\d\s\-\(\)]+$/.test(value) || "Invalid phone",
 *
 *     // Context-aware validation
 *     ({ value, context }) => {
 *       if (!context) return "Context required";
 *       const domain = value.split("@")[1];
 *       return context.allowedDomains.includes(domain) || "Domain not allowed";
 *     }
 *   ],
 *   context: {
 *     userId: 123,
 *     allowedDomains: ["company.com", "partner.org"]
 *   },
 *   data: { formId: "registration" },
 *   fieldName: "contact_input",
 *   propertyName: "contact",
 *   i18n: defaultI18n,
 *   startTime: Date.now()
 * };
 * ```
 *
 * ### Performance Considerations
 * - All rules in `ruleParams` are executed in parallel using `Promise.all`
 * - Validation stops immediately when the first rule succeeds (early exit optimization)
 * - The `startTime` property enables duration tracking for performance monitoring
 *
 * ### Error Handling
 * When all rules fail, error messages are aggregated with semicolons ("; ") as separators.
 * Each failed rule's error message is collected and joined for comprehensive error reporting.
 *
 * @template Context - Type of the optional validation context object
 *
 * @public
 * @see {@link Validator.validateOneOfRule} - Method that uses this interface
 * @see {@link ValidatorOptions} - Base options interface being extended
 * @see {@link ValidatorRuleFunction} - Type of functions in ruleParams array
 * @see {@link ValidatorResult} - Result type returned by validation
 */
export interface ValidateMultiRuleOptions<
  Context = unknown,
  RulesFunctions extends ValidatorDefaultMultiRule<Context> =
    ValidatorDefaultMultiRule<Context>,
> extends ValidatorOptions<RulesFunctions, Context> {
  startTime?: number;
}
/**
 * ## Default Multi-Rule Type
 *
 * A generic type alias representing an array of validation rules with configurable parameter types.
 * This type serves as the default constraint for multi-rule validation functions that accept
 * arrays of rules with varying parameter signatures.
 *
 * ### Purpose
 * Provides a flexible type for representing collections of validation rules where each rule
 * can have different parameter types. Used as a constraint for {@link ValidatorMultiRuleFunction}
 * and {@link ValidateMultiRuleOptions} to ensure type safety in multi-rule scenarios.
 *
 * ### Type Parameters
 * - **Context**: Optional context type for validation (defaults to `unknown`)
 * - **ParamsTypes**: Parameter types for the rules (defaults to `any` for maximum flexibility)
 *
 * ### Usage in Multi-Rule Validation
 * This type is used internally by the validator for operations that process multiple rules
 * simultaneously, such as "OneOf" and "AllOf" validation patterns.
 *
 * ### Example
 * ```typescript
 * // Array of rules with different parameter types
 * const rules: ValidatorDefaultMultiRule = [
 *   { ruleName: "Required" },                    // No params
 *   { ruleName: "MinLength", params: [5] },      // Number param
 *   { ruleName: "Email" },                       // No params
 * ];
 * ```
 *
 * ### Relationship to Validation System
 * - **Used by**: {@link ValidateMultiRuleOptions} as constraint
 * - **Constrains**: {@link ValidatorMultiRuleFunction} parameter types
 * - **Enables**: Type-safe multi-rule validation operations
 *
 * @template Context - Type of the optional validation context
 * @template ParamsTypes - Type of rule parameters (defaults to any for flexibility)
 *
 * @public
 *
 * @see {@link ValidateMultiRuleOptions} - Uses this as constraint
 * @see {@link ValidatorMultiRuleFunction} - Function type that accepts this
 * @see {@link ValidatorRule} - Individual rule type
 */
export type ValidatorDefaultMultiRule<
  Context = unknown,
  ParamsTypes extends ValidatorRuleParams = ValidatorRuleParams,
> = Array<ValidatorRule<ParamsTypes, Context>>;

/**
 * ## Multi-Rule Validation Function Type
 *
 * A specialized validation function type for operations that process multiple validation rules
 * simultaneously. This type is used for complex validation patterns like "OneOf" and "AllOf"
 * where multiple rules need to be evaluated together.
 *
 * ### Purpose
 * Defines the signature for validation functions that accept arrays of rules as parameters,
 * enabling advanced validation logic that depends on multiple rule outcomes. Used by
 * {@link Validator.validateOneOfRule} and {@link Validator.validateAllOfRule} methods.
 *
 * ### Type Parameters
 * - **Context**: Optional context type for validation (defaults to `unknown`)
 * - **RulesFunctions**: Array type of rules accepted as parameters (constrained by {@link ValidatorDefaultMultiRule})
 *
 * ### Function Signature
 * ```typescript
 * (options: ValidatorOptions<RulesFunctions, Context>) => ValidatorRuleResult
 * ```
 *
 * ### Usage in Validation System
 * This type enables the creation of higher-order validation rules that combine multiple
 * simpler rules with logical operators (AND, OR, etc.).
 *
 * ### Example
 * ```typescript
 * // OneOf validation function
 * const validateOneOf: ValidatorMultiRuleFunction = async (options) => {
 *   const { ruleParams, value } = options;
 *
 *   // ruleParams is an array of validation functions
 *   for (const ruleFunc of ruleParams) {
 *     const result = await ruleFunc({ ...options, rule: undefined });
 *     if (result === true) return true; // At least one rule passed
 *   }
 *
 *   return "None of the rules passed validation";
 * };
 * ```
 *
 * ### Relationship to Validation System
 * - **Used by**: Multi-rule validation methods in {@link Validator}
 * - **Constrained by**: {@link ValidatorDefaultMultiRule} for parameter types
 * - **Returns**: Standard {@link ValidatorRuleResult} for consistency
 * - **Enables**: Complex validation logic with multiple rules
 *
 * @template Context - Type of the optional validation context
 * @template RulesFunctions - Type of the rules array parameter
 *
 * @public
 *
 * @see {@link ValidatorDefaultMultiRule} - Constrains the RulesFunctions parameter
 * @see {@link Validator.validateOneOfRule} - Uses this function type
 * @see {@link Validator.validateAllOfRule} - Uses this function type
 * @see {@link ValidatorRuleResult} - Return type
 */
export type ValidatorMultiRuleFunction<
  Context = unknown,
  RulesFunctions extends Array<ValidatorRule<Array<unknown>, Context>> = Array<
    ValidatorRule<Array<unknown>, Context>
  >,
> = ValidatorRuleFunction<RulesFunctions, Context>;

/**
 * ## Class Validation Data Type
 *
 * A mapped type representing the data structure expected for class-based validation using
 * {@link Validator.validateClass}. This type creates a partial record mapping class properties
 * to their values, enabling type-safe validation of entire class instances.
 *
 * ### Purpose
 * Provides compile-time type safety for data passed to {@link Validator.validateClass} method.
 * Ensures that the data object matches the structure of the target class constructor, allowing
 * validation decorators to be applied to class properties with full type checking.
 *
 * ### Type Construction
 * ```typescript
 * Partial<Record<keyof InstanceType<TClass>, any>>
 * ```
 * - **TClass**: Class constructor type (must extend `ClassConstructor`)
 * - **InstanceType<TClass>**: Properties of the class instance
 * - **Partial**: All properties are optional (validation fills in defaults)
 * - **Record<..., any>**: Values can be any type (validation will check)
 *
 * ### Usage in TClass Validation
 * ```typescript
 * class UserForm {
 *   @IsRequired()
 *   @IsEmail()
 *   email: string;
 *
 *   @IsRequired()
 *   @MinLength(3)
 *   name: string;
 *
 *   @IsOptional()
 *   age?: number;
 * }
 *
 * // Type-safe data object
 * const data: ValidatorClassInput<UserForm> = {
 *   email: "user@example.com",  // ✓ Matches UserForm.email
 *   name: "John",               // ✓ Matches UserForm.name
 *   age: 25,                    // ✓ Matches UserForm.age
 * };
 *
 * const result = await Validator.validateClass(UserForm, data);
 * ```
 *
 * ### Key Features
 * - **Partial Mapping**: Not all class properties need to be provided
 * - **Type Safety**: Property names and types are checked at compile time
 * - **Decorator Integration**: Works with validation decorators on class properties
 * - **Flexible Values**: Accepts any value type (validation rules determine validity)
 *
 * ### Comparison with Single-Value Validation
 * | Aspect | TClass Data | Single Value |
 * |--------|-------------|--------------|
 * | Structure | Object with multiple properties | Single value |
 * | Validation | Multiple fields simultaneously | One value at a time |
 * | Type Safety | Class property mapping | Any value type |
 * | Use Case | Form validation | Field validation |
 *
 * ### Runtime Behavior
 * - **Missing Properties**: Validation decorators determine if properties are required
 * - **Extra Properties**: Ignored (only decorated properties are validated)
 * - **Type Coercion**: Values are validated according to decorator rules, not TypeScript types
 *
 * ### Relationship to Validation System
 * - **Used by**: {@link Validator.validateClass} as input data type
 * - **Mapped from**: Class constructor type via `InstanceType<TClass>`
 * - **Validated by**: Decorator-based rules on class properties
 * - **Returns**: {@link ValidatorClassResult} with validated instance
 *


/**
 * ## Validator Class Options
 *
 * Configuration options for performing class-based validation (`Validator.validateClass`).
 * These options control the behavior of the validation process, including context injection,
 * error handling, and internationalization.
 *
 * ### Inheritance
 * Extends `ValidatorOptions` but excludes single-value specific properties (`value`, `rule`)
  // in favor of class-instance specific properties (`data`).
 */
export interface ValidateClassOptions<
  TClass extends ClassConstructor = ClassConstructor,
  Context = unknown,
  ParamsTypes extends ValidatorRuleParams = ValidatorRuleParams,
> extends Omit<
  ValidatorOptions<ParamsTypes, Context>,
  'data' | 'rule' | 'value'
> {
  data: ValidatorClassInput<TClass>;
  /**
   * The parent data/context for nested validations
   *
   * When validating nested objects, this property holds the parent
   */
  parentData?: Dictionary;
  startTime?: number;
  errorMessageBuilder?: (
    translatedPropertyName: string,
    error: string,
    builderOptions: Omit<ValidatorError, 'message'> & {
      propertyName: keyof InstanceType<TClass> | string;
      translatedPropertyName: string;
      cause: ValidatorError;
      i18n: I18n;
      separators: {
        multiple: string;
        single: string;
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: Partial<Record<keyof InstanceType<TClass>, any>>;
    }
  ) => string;
}

/**
 * ## Validator Bulk Options
 *
 * Configuration for bulk validation operations (validating an array of class instances).
 * Extends `ValidateClassOptions` but accepts an array of data objects instead of a single one.
 */
export interface ValidateBulkOptions<
  TClass extends ClassConstructor = ClassConstructor,
> extends Omit<ValidateClassOptions<TClass>, 'data'> {
  data: ValidatorClassInput<TClass>[];
}

/**
 * ## Multi-Rule Names Union
 *
 * A union type defining the names of validation rules that operate on multiple sub-rules.
 * These rules combine the results of several validation rules using logical operations.
 *
 * ### Purpose
 * Defines the specific rule names that support multi-rule validation patterns.
 * These rules allow combining multiple validation conditions with logical operators
 * like "one of" or "all of", enabling complex validation scenarios.
 *
 * ### Supported Multi-Rules
 * - **'OneOf'**: Passes if at least one of the sub-rules passes (logical OR)
 * - **'AllOf'**: Passes only if all sub-rules pass (logical AND)
 *
 * ### Type Structure
 * Simple string literal union with two possible values:
 * ```typescript
 * 'OneOf' | 'AllOf'
 * ```
 *
 * ### Usage in Validation
 * Multi-rule names are used in {@link ValidatorMultiRuleFunction} to specify
 * which logical operation to apply to a collection of validation rules.
 *
 * ```typescript
 * // Example: Email must be valid OR be empty (optional email field)
 * const rule: ValidatorMultiRuleFunction = (rules, context) => {
 *   return rules.OneOf([
 *     rules.Email([], context),
 *     rules.IsEmpty([], context)
 *   ]);
 * };
 * ```
 *
 * ### Relationship to Validation System
 * - **Used by**: {@link ValidatorMultiRuleFunction} as operation selector
 * - **Implemented in**: Rule registry as special multi-rule handlers
 * - **Combines with**: Regular validation rules via logical operations
 * - **Returns**: Single validation result from multiple rule evaluations
 *
 * ### Key Characteristics
 * - **Logical Operations**: Supports OR ('OneOf') and AND ('AllOf') combinations
 * - **Rule Composition**: Enables building complex validation logic from simple rules
 * - **Type Safety**: Compile-time guarantees for valid multi-rule names
 * - **Extensible**: New logical operations can be added by extending this union
 *
 * ### Comparison with Single Rules
 * | Aspect | Single Rule | Multi-Rule |
 * |--------|-------------|------------|
 * | Operation | One condition | Multiple conditions |
 * | Logic | Direct validation | Logical combination |
 * | Use Case | Basic validation | Complex conditional validation |
 * | Example | "IsEmail" | "OneOf(IsEmail, IsEmpty())" |
 *
 * ### Runtime Behavior
 * - **OneOf**: Returns success if any sub-rule passes, failure if all fail
 * - **AllOf**: Returns success only if all sub-rules pass, failure if any fails
 * - **Short-circuiting**: May stop evaluation early based on logical operation
 * - **Error Aggregation**: Collects errors from all evaluated rules
 *
 * @public
 *
 * @see {@link ValidatorMultiRuleFunction} - Function type that uses these names
 * @see {@link ValidatorDefaultMultiRule} - Default multi-rule configuration
 * @see {@link ValidatorRuleName} - General rule names (includes these)
 */
export type ValidatorMultiRuleNames = 'OneOf' | 'AllOf';
/**
 * ## Validation Result Types (Either Pattern)
 *
 * Uses the Either<L, R> pattern where Left represents failure and Right represents success.
 * This provides strong type safety and prevents accessing wrong properties based on the result state.
 */

// Single value validation (reuse base types directly)
/**
 * ## Single Value Validation Success Result
 *
 * Represents a successful validation result for a single value.
 * This type is used as the success branch of the {@link ValidatorResult} discriminated union.
 *
 * ### Type Guard
 * Can be narrowed using {@link Validator.isSuccess}:
 * ```typescript
 * if (Validator.isSuccess(result)) {
 *   // TypeScript knows: result satisfies ValidatorSuccess
 *   // Can safely access result.value, result.validatedAt, result.duration
 * }
 * ```
 *
 * ### Properties
 * - **success**: Literal `true` for type discrimination
 * - **value**: The original value that passed validation
 * - **validatedAt**: ISO timestamp indicating when validation completed
 * - **duration**: Duration in milliseconds from validation start to completion
 * - **error**: Explicitly `undefined` for success (aids type narrowing)
 * - **failedAt**: Explicitly `undefined` for success (aids type narrowing)
 * - **data**: Optional context data (inherited from BaseData)
 * - **context**: Optional validation context (inherited from BaseData)
 *
 * ### Example
 * ```typescript
 * const result = await Validator.validate({
 *   value: "user@example.com",
 *   rules: ["Required", "Email"],
 * });
 *
 * if (result.success) {
 *   // result is ValidatorSuccess
 *   console.log("Validated:", result.value);
 *   console.log("Took:", result.duration, "ms");
 *   console.log("Completed at:", result.validatedAt.toISOString());
 * }
 * ```
 *
 * @template Context - Type of the optional validation context
 *
 * @public
 *
 * @see {@link ValidatorResult}
 * @see {@link ValidatorError}
 * @see {@link Validator.validate}
 * @see {@link Validator.isSuccess}
 */
export interface ValidatorSuccess<Context = unknown> extends BaseData<Context> {
  /** Discriminant for type narrowing - always `true` for success */
  success: true;

  /**
   * ISO timestamp indicating when validation completed successfully
   * @example "2024-11-08T10:30:45.123Z"
   */
  validatedAt?: Date;

  /**
   * Duration of validation in milliseconds (from start to completion)
   * @example 15 (milliseconds)
   */
  duration?: number;

  /** Always undefined for success results (type narrowing aid) */
  error?: undefined;

  /** Always undefined for success results (type narrowing aid) */
  failedAt?: undefined;

  message?: string | undefined;
}

/**
 * ## Validation Result Type (Discriminated Union)
 *
 * Represents the result of a single-value validation operation.
 * This is a discriminated union that can be narrowed to either success or failure.
 *
 * ### Type Narrowing Strategies
 *
 * #### Approach 1: Check the `success` property
 * ```typescript
 * const result = await Validator.validate({ value: "...", rules: [...] });
 *
 * if (result.success) {
 *   // TypeScript knows: ValidatorSuccess
 *   console.log(result.value);      // ✓ Available
 *   console.log(result.validatedAt); // ✓ Available
 *   console.log(result.error);      // ✗ Type error (undefined for success)
 * } else {
 *   // TypeScript knows: ValidatorError
 *   console.log(result.value);      // ✓ Available
 *   console.log(result.error);      // ✓ Available
 *   console.log(result.validatedAt); // ✗ Type error (undefined for failure)
 * }
 * ```
 *
 * #### Approach 2: Use type guard functions
 * ```typescript
 * const result = await Validator.validate({ value: "...", rules: [...] });
 *
 * if (Validator.isSuccess(result)) {
 *   // result is ValidatorSuccess<Context>
 *   console.log(result.value);
 *   console.log(result.validatedAt);
 * } else if (Validator.isValidatorError(result)) {
 *   // result is ValidatorError
 *   console.log(result.error.message);
 *   console.log(result.error.ruleName);
 * }
 * ```
 *
 * #### Approach 3: Use switch on discriminant
 * ```typescript
 * const result = await Validator.validate({ value: "...", rules: [...] });
 *
 * switch (result.success) {
 *   case true:
 *     console.log("Validated:", result.value);
 *     break;
 *   case false:
 *     console.error("Failed:", result.error.message);
 *     break;
 * }
 * ```
 *
 * ### Union Members
 * - {@link ValidatorSuccess} - When validation passes (success: true)
 * - {@link ValidatorError} - When validation fails (success: false)
 *
 * @template Context - Type of the optional validation context
 *
 * @example
 * ```typescript
 * interface MyContext {
 *   userId: number;
 * }
 *
 * const result: ValidatorResult<MyContext> = await Validator.validate({
 *   value: "test@example.com",
 *   rules: ["Required", "Email"],
 *   context: { userId: 123 },
 * });
 * ```
 *
 * @public
 *
 * @see {@link ValidatorSuccess} - Success variant
 * @see {@link ValidatorError} - Failure variant
 * @see {@link Validator.validate} - Main validation method
 * @see {@link Validator.isSuccess} - Type guard for success
 * @see {@link Validator.isFailure} - Type guard for failure
 */
export type ValidatorResult<Context = unknown> =
  | ValidatorSuccess<Context>
  | ValidatorError;

/**
 * ## Class Validation Success Result
 *
 * Represents a successful multi-field validation result when using {@link Validator.validateClass}.
 * All decorated fields passed their respective validation rules.
 *
 * ### Type Guard
 * Can be narrowed by checking the `success` property:
 * ```typescript
 * const result = await Validator.validateClass(UserForm, data);
 *
 * if (result.success) {
 *   // result is ValidatorClassSuccess
 *   console.log(result.data);        // Validated instance of T
 *   console.log(result.validatedAt); // Timestamp of validation
 * }
 * ```
 *
 * ### Properties vs Single-Value Success
 * Unlike {@link ValidatorSuccess}, target success uses:
 * - **data**: The validated class instance (not `value`)
 * - **value**: Always `undefined` (type narrowing aid)
 * - **errors**: Always `undefined` (type narrowing aid)
 *
 * ### Data Property
 * The `data` property contains the fully validated class instance with type `T`.
 * This is the instance you pass after decoration is complete.
 *
 * ```typescript
 * class UserForm {
 *   @IsRequired()
 *   @IsEmail()
 *   email: string;
 *
 *   @IsRequired()
 *   @MinLength(3)
 *   name: string;
 * }
 *
 * const result = await Validator.validateClass(UserForm, {
 *   email: "user@example.com",
 *   name: "John",
 * });
 *
 * if (result.success) {
 *   // result.data is UserForm instance
 *   console.log(result.data.email); // "user@example.com"
 *   console.log(result.data.name);  // "John"
 *
 *   // Timing information
 *   console.log(result.validatedAt); // ISO timestamp
 *   console.log(result.duration);    // Milliseconds (approximately)
 * }
 * ```
 *
 * ### Comparison with Single-Value Success
 * | Aspect | Single-Value | TClass |
 * |--------|-------------|--------|
 * | Property | `value` | `data` |
 * | Validates | One value | Multiple fields |
 * | Returns | Original value | Class instance |
 * | Error accumulation | Not applicable | Multiple errors collected |
 * | Use case | Single field | Entire form/object |
 *
 * ### Practical Usage
 * ```typescript
 * const form = new UserForm();
 * form.email = "user@example.com";
 * form.name = "John";
 *
 * const result = await Validator.validateClass(UserForm, form);
 *
 * if (result.success) {
 *   // Safe to use result.data
 *   await saveUser(result.data);
 *   console.log(`Validation took ${result.duration}ms`);
 * }
 * ```
 *
 * @template Context - Type of the optional validation context
 *
 * @public
 *
 * @see {@link ValidatorClassResult}
 * @see {@link ValidatorSuccess} - Single-value equivalent
 */
export interface ValidatorClassSuccess<
  TClass extends ClassConstructor = ClassConstructor,
  Context = unknown,
> extends Omit<BaseData<Context>, 'data'> {
  /** Discriminant for type narrowing - always `true` for success */
  success: true;

  message?: undefined;

  /**
   * Status indicator for this result
   *
   * Always "success" for successful validations. Provided for consistency with HTTP
   * and API conventions.
   *
   * @type {"success"}
   */
  status: 'success';

  /**
   * ISO timestamp of when validation succeeded
   *
   * Indicates the exact time validation completed successfully.
   *
   * @type {Date | undefined}
   * @example new Date("2024-11-08T10:30:45.123Z")
   */
  validatedAt?: Date;

  /**
   * Duration of validation in milliseconds
   *
   * Measures time from validation start until all fields completed validation.
   * Note: All fields are validated in parallel, so this is not the sum of individual field times.
   *
   * @type {number | undefined}
   * @example 23 (milliseconds)
   */
  duration?: number;

  data: ValidatorClassInput<TClass>;
}

/**
 * ## Class Validation Result Type (Discriminated Union)
 *
 * Discriminated union type representing the result of a {@link Validator.validateClass} operation.
 * Can be either {@link ValidatorClassSuccess} or {@link ValidatorClassError}.
 *
 * ### Type Narrowing Strategies
 *
 * **Strategy 1: Check `success` property**
 * ```typescript
 * const result = await Validator.validateClass(UserForm, data);
 *
 * if (result.success) {
 *   // result is ValidatorClassSuccess<T>
 *   console.log(result.data);        // Class instance with all fields valid
 *   console.log(result.validatedAt); // Validation timestamp
 * } else {
 *   // result is ValidatorClassError
 *   console.log(result.errors);      // Array of field-level errors
 *   console.log(result.failureCount); // Number of failed fields
 * }
 * ```
 *
 * **Strategy 2: Use switch statement**
 * ```typescript
 * switch (result.status) {
 *   case "success":
 *     // result is ValidatorClassSuccess
 *     await saveToDatabase(result.data);
 *     break;
 *   case "error":
 *     // result is ValidatorClassError
 *     logErrors(result.errors);
 *     break;
 * }
 * ```
 *
 * **Strategy 3: Use type guard helper**
 * ```typescript
 * if (Validator.isSuccess(result)) {
 *   // result is ValidatorClassSuccess
 *   return result.data;
 * }
 * // result is ValidatorClassError
 * throw new Error(result.message);
 * ```
 *
 * ### Comparison with Single-Value Result
 * | Aspect | Single-Value | TClass |
 * |--------|-------------|--------|
 * | Success Property | `value` | `data` |
 * | On Failure | Single error | Array of errors |
 * | Type Param | One generic | Two generics (T, Context) |
 * | Use Case | Single field validation | Multiple field validation |
 *
 * ### Real-World Example
 * ```typescript
 * class RegistrationForm {
 *   @IsRequired()
 *   @IsEmail()
 *   email: string;
 *
 *   @IsRequired()
 *   @MinLength(8)
 *   password: string;
 *
 *   @IsRequired()
 *   @Equals([{{ value: "password" }}])
 *   confirmPassword: string;
 * }
 *
 * const result = await Validator.validateClass(RegistrationForm, {
 *   email: "user@example.com",
 *   password: "SecurePass123",
 *   confirmPassword: "SecurePass123",
 * });
 *
 * if (result.success) {
 *   // All validations passed
 *   console.log("Ready to register:", result.data);
 * } else {
 *   // Display field-level errors to user
 *   result.errors.forEach(error => {
 *     console.error(`[${error.propertyName}]: ${error.message}`);
 *   });
 * }
 * ```
 *
 * ### Union Members
 * - {@link ValidatorClassSuccess} - When all fields pass (success: true)
 * - {@link ValidatorClassError} - When one or more fields fail (success: false)
 *
 * @template Context - Type of the optional validation context
 *
 * @public
 *
 * @see {@link ValidatorClassSuccess} - Success variant
 * @see {@link ValidatorClassError} - Failure variant
 * @see {@link Validator.validateClass} - Main class validation method
 * @see {@link Validator.isSuccess} - Type guard for success
 * @see {@link Validator.isFailure} - Type guard for failure
 * @see {@link ValidatorResult} - Single-value equivalent
 */
export type ValidatorClassResult<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TClass extends ClassConstructor = any,
  Context = unknown,
> = ValidatorClassSuccess<TClass, Context> | ValidatorClassError<TClass>;

/**
 * ## Validator Rule Functions Map
 *
 * A type-safe mapped type that creates a lookup table of validation rule names to their corresponding validation functions.
 * This mapped type provides compile-time guarantees that only valid rule names can be used as keys
 * to access their associated validation functions, preventing runtime errors from invalid rule lookups.
 *
 * ### Purpose
 * Serves as the central type definition for the validation rule function lookup table in the validator system.
 * Enables type-safe retrieval and execution of validation functions by their string names,
 * ensuring that each validation rule has a properly typed function with correct parameters and context.
 *
 * ### Type Structure
 * - **Key**: `ValidatorRuleName` - Valid rule names from {@link ValidatorRuleParamTypes}
 * - **Value**: `ValidatorRuleFunction<Params, Context>` - Corresponding validation function with proper typing
 * - **Mapped Type**: `[K in ValidatorRuleName]` ensures every rule name maps to its function
 *
 * ### Type Safety Benefits
 * - **Compile-time Validation**: Only valid rule names can be used as keys
 * - **Parameter Type Safety**: Each rule function has correctly typed parameters based on the rule
 * - **Context Propagation**: Context types are properly maintained throughout the validation pipeline
 * - **Function Signature Consistency**: Ensures all rule functions follow the same signature pattern
 *
 * ### Usage in Validator Class
 * This type is primarily used internally by the {@link Validator} class:
 * - {@link Validator.getRules} returns an instance of this mapped type
 * - {@link Validator.validateClass} uses it to retrieve rule functions by name
 * - Rule execution methods access functions through this type-safe lookup table
 *
 * ### Example Structure
 * ```typescript
 * const rules: ValidatorRuleFunctionsMap = {
 *   Required: (params, context) => {
 *     // validation logic here
 *   },
 *   Email: (params, context) => {
 *     // email validation logic
 *   },
 *   MinLength: ([minLen], context) => {
 *     // length validation logic
 *   },
 *   // ... all other built-in rules
 * };
 * ```
 *
 * ### Relationship to Other Types
 * - **Source of Keys**: Keys come from {@link ValidatorRuleName} (derived from {@link ValidatorRuleParamTypes})
 * - **Function Signatures**: Values are {@link ValidatorRuleFunction} instances with proper generic parameters
 * - **Parameter Types**: Parameters typed via {@link ValidatorRuleParamTypes} lookups for each specific rule
 * - **Context**: Context type propagated from generic parameter throughout the validation system
 *
 * ### Runtime Usage
 * ```typescript
 * // Type-safe rule retrieval
 * const rules = Validator.getRules();
 * const emailRule = rules.Email;        // ✓ Type-safe access
 * const unknownRule = rules.Unknown;    // ✗ TypeScript error
 *
 * // Parameter type safety
 * const minLengthRule = rules.MinLength; // Function<[number], Context>
 * minLengthRule([5], context);           // ✓ Correct parameter types
 * minLengthRule("5", context);          // ✗ Type error
 * ```
 *
 * @template Context - Type of the optional validation context object
 *
 * @public
 *
 * @see {@link ValidatorRuleName} - Valid rule names (keys of this map)
 * @see {@link ValidatorRuleParamTypes} - Rule parameter definitions
 * @see {@link ValidatorRuleFunction} - Validation function signature
 * @see {@link Validator.getRules} - Method that returns this map
 * @see {@link Validator.validateClass} - Method that uses this map
 */
export type ValidatorRuleFunctionsMap<Context = unknown> = {
  [K in ValidatorRuleName]: ValidatorRuleFunction<
    ValidatorRuleParamTypes<Context>[K],
    Context
  >;
};

interface BaseData<Context = unknown> {
  /**
   * The value to use for performing the validation.
   * This is the actual data that will be validated against the specified rules.
   *
   * @type {any}
   *
   * @example
   * ```typescript
   * const result = await Validator.validate({
   *   value: "user@example.com",  // This is the value being validated
   *   rules: ["Required", "Email"],
   * });
   * ```
   *
   * @remarks
   * - This is the core data being validated
   * - Type can be any JavaScript value: string, number, object, array, etc.
   * - Available in both success and failure results
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;

  /**
   * Optional data object providing contextual information for validation rules.
   *
   * This property is used to provide additional context for the validation rule.
   * It can be used to pass any additional data that might be needed for validation,
   * such as form data, related field values, or other contextual information.
   *
   * @type {Dictionary | undefined}
   *
   * @example
   * ```typescript
   * const result = await Validator.validate({
   *   value: "test@example.com",
   *   rules: ["Required", "Email"],
   *   data: {
   *     userId: 123,
   *     formId: "user_form",
   *   },
   * });
   * ```
   *
   * @remarks
   * - Optional property (not required)
   * - Passed to validation rule functions via options.data
   * - Useful for multi-field validation scenarios
   * - Commonly used for form data context in validateClass
   */
  data?: Dictionary;

  /**
   * Optional typed context object for validation.
   *
   * Provides a typed context that can be passed to validation rules for
   * advanced validation scenarios requiring external data or permissions.
   *
   * @template Context - Type of the context object
   *
   * @example
   * ```typescript
   * interface UserContext {
   *   userId: number;
   *   permissions: string[];
   *   isAdmin: boolean;
   * }
   *
   * const result = await Validator.validate<UserContext>({
   *   value: "admin_action",
   *   rules: ["Required"],
   *   context: {
   *     userId: 123,
   *     permissions: ["read", "write", "admin"],
   *     isAdmin: true,
   *   },
   * });
   * ```
   *
   * @remarks
   * - Optional property (not required)
   * - Type is defined by the Context generic parameter
   * - Passed to all validation rule functions
   * - Enables context-aware validation rules
   * - Commonly used for permission-based or user-specific validations
   */
  context?: Context;
}
