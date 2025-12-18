import { ClassConstructor } from '@/types';

/**
 * @interface ValidatorRuleName
 * Represents the name of a validation rule as defined in the `ValidatorRuleParamTypes`.
 *
 * The `ValidatorRuleName` type is a union of string literal types that correspond to the keys
 * of the `ValidatorRuleParamTypes` interface. This allows for type-safe access to the names of
 * validation rules, ensuring that only valid rule names can be used in contexts where a rule name
 * is required.
 *
 * ### Structure:
 * - The type is derived from the keys of the `ValidatorRuleParamTypes`, meaning it will include
 *   all the rule names defined in that map.
 *
 * ### Example:
 *
 * ```typescript
 * const ruleName: ValidatorRuleName = "required"; // Valid
 * const anotherRuleName: ValidatorRuleName = "minLength"; // Valid
 *
 * // Usage in a function that accepts a rule name
 * function getValidationRule(ruleName: ValidatorRuleName) {
 *     return validationRules[ruleName];
 * }
 *
 * const rule = getValidationRule("maxLength"); // Valid usage
 * // const invalidRule = getValidationRule("unknownRule"); // TypeScript will throw an error
 * ```
 *
 * This type enhances type safety in your code by ensuring that only valid validation rule names
 * can be used, reducing the risk of runtime errors due to typos or invalid rule names.
 */
export type ValidatorRuleName = keyof ValidatorRuleParamTypes & string;

/**
 * ## Validation Rules Parameter Map
 *
 * Central type definition mapping validation rule names to their parameter signatures.
 * This interface serves as the authoritative source for all built-in validation rules,
 * defining the exact parameter types each rule accepts.
 *
 * ### Purpose
 * Provides compile-time type safety for validation rule parameters across the entire
 * validation system. Each property represents a built-in validation rule and its
 * expected parameter structure. This is a static interface with no generics.
 *
 * ### Type Structure
 * - **Key**: Rule name (string literal from {@link ValidatorRuleName})
 * - **Value**: Parameter array type (extends {@link ValidatorRuleParams})
 *
 * ### Parameter Type Patterns
 * - **Empty Arrays `[]`**: Rules that take no parameters (e.g., "Required", "Email")
 * - **Complex Parameters**: Rules with mixed required/optional parameters
 *
 * ### Usage in Type System
 * This interface is used throughout the validator to:
 * - Type-check rule parameters at compile time
 * - Generate {@link ValidatorRuleName} union type
 * - Create {@link ValidatorRuleFunctionsMap} registry type
 * - Validate rule definitions in rule implementation files
 *
 * ### Rule Categories
 *
 * #### Presence Validation
 * - **Required**: Ensures value is present and not empty
 * - **Nullable**: Allows null/undefined values (skips validation)
 * - **Optional**: Allows undefined values (skips validation)
 * - **Empty**: Allows empty strings (validation skipped if "")
 *
 * #### Type Validation
 * - **String**: Validates value is a string
 * - **Number**: Validates value is a number
 * - **NonNullString**: Validates value is a non-null string
 *
 * #### String Validation
 * - **MinLength**: Minimum character length requirement
 * - **MaxLength**: Maximum character length limit
 * - **Length**: Exact length or length range (min and optional max)
 * - **FileName**: Valid file name format
 *
 * #### Numeric Validation
 * - **NumberGT**: Value must be greater than specified number
 * - **NumberGTE**: Value must be >= specified number
 * - **NumberLT**: Value must be less than specified number
 * - **NumberLTE**: Value must be <= specified number
 * - **NumberEQ**: Value must equal specified number
 * - **NumberNE**: Value must differ from specified number
 *
 * #### Format Validation
 * - **Email**: Valid email address format
 * - **Url**: Valid URL format
 * - **PhoneNumber**: Valid phone number (with optional country code)
 * - **EmailOrPhoneNumber**: Valid email or phone number
 *
 * ### Parameter Examples
 * ```typescript
 * // Rules with no parameters
 * Required: ValidatorRuleParams<[]>;           // "Required"
 * Email: ValidatorRuleParams<[]>;              // "Email"
 *
 * // Rules with single parameters
 * MinLength: ValidatorRuleParams<[number]>;    // {MinLength:[5]}
 * NumberEQ: ValidatorRuleParams<[number]>;  // "NumberEQ[42]"
 *
 * // Rules with optional parameters
 * PhoneNumber: ValidatorRuleParams<[CountryCode?]>; // "PhoneNumber" or "PhoneNumber[US]"
 *
 * // Rules with multiple parameters
 * Length: ValidatorRuleParams<[number, number?]>; // "Length[5]" or "Length[5,10]"
 * ```
 *
 * ### Extending the Rules Map
 * When adding new validation rules:
 * 1. Add the rule name and parameter type to this interface
 * 2. Implement the rule function in the appropriate rule file
 * 3. Register the rule in the validator's rule registry
 * 4. Update rule name unions and type definitions as needed
 *
 * ### Relationship to Validation System
 * - **Foundation**: Base type for all rule definitions
 * - **Type Safety**: Ensures parameter type checking
 * - **Rule Discovery**: Used to generate valid rule names
 * - **Function Signatures**: Defines parameter types for rule functions
 * - **Runtime Validation**: Parameters validated against these types
 *
 * @public
 * @template Context - Type of the optional validation context
 * @see {@link ValidatorRuleName} - Union type derived from this interface's keys
 * @see {@link ValidatorRuleFunctionsMap} - Registry type using this interface
 * @see {@link ValidatorRuleParams} - Base parameter type for all rules
 * @see {@link Validator} - Main validator class that uses these rules
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-object-type
export interface ValidatorRuleParamTypes<Context = unknown> {}

/**
 * ## Validator Target Data
 *
 * Represents a partial data object corresponding to a target class.
 * Used for describing the data involved in validation errors without requiring
 * a full instance of the class.
 *
 * @template Target - The class constructor
 *
 * @public
 */
export type ValidatorTargetData<
  Target extends ClassConstructor = ClassConstructor,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> = Partial<Record<ValidatorTargetKeys<Target>, any>>;

/**
 * ## Validator Target Keys
 *
 * Type alias for extracting the valid property keys from a target class or constructor.
 * Used to ensure type safety when referencing properties of validated objects.
 *
 * @template Target - The class constructor
 *
 * @public
 */
export type ValidatorTargetKeys<Target extends ClassConstructor> =
  keyof InstanceType<Target>;
