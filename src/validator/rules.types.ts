import { ClassConstructor } from '@/types';

/**
 * ## Validator Rule Name
 *
 * Represents a valid reference key for any registered validation rule.
 *
 * This type acts as the central vocabulary for the validation system, generated
 * directly from the keys of `ValidatorRuleParamTypes`. It ensures that any rule
 * name used in your code (whether as a string literal or object key) corresponds
 * to a known, well-defined validation rule.
 *
 * ### Usage
 * You encounter `ValidatorRuleName` in two primary contexts:
 * 1. **String Rules**: When using "Named Rules" for parameterless validation.
 * 2. **Object Rules**: As the key in a rule object to specify which rule to apply.
 *
 * ### Examples
 * ```typescript
 * // As a type annotation:
 * const myRules: ValidatorRuleName[] = ["Required", "Email"];
 *
 * // In object rules:
 * const ruleObj = {
 *   MinLength: [5],  // "MinLength" is a ValidatorRuleName
 *   Required: []     // "Required" is a ValidatorRuleName
 * };
 *
 * // In custom lookups (e.g., getting a rule function):
 * const ruleFn = Validator.getRule("Email");
 * ```
 *
 * ### Type Safety
 * Because this is a string union type derived from the keys of the parameter map,
 * TypeScript will produce an error if you try to use a misspelled or non-existent rule definition.
 *
 * ```typescript
 * const valid: ValidatorRuleName = "Required";    // ✅
 * const invalid: ValidatorRuleName = "Reguired";  // ❌ Type error: '"Reguired"' is not assignable...
 * ```
 *
 * @public
 * @see {@link ValidatorRuleParamTypes} - The source definition map.
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
 * ## Validator Class Input
 *
 * Represents a partial data object corresponding to a target class structure.
 * Used for describing the input data for class-based validation without requiring
 * a full instance of the class.
 *
 * @template TClass - The class constructor
 *
 * @public
 */
export type ValidatorClassInput<
  TClass extends ClassConstructor = ClassConstructor,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> = Partial<Record<ValidatorClassKeys<TClass>, any>>;

/**
 * ## Validator Class Keys
 *
 * Type alias for extracting the valid property keys from a target class or constructor.
 * Used to ensure type safety when referencing properties of validated class instances.
 *
 * @template TClass - The class constructor
 *
 * @public
 */
export type ValidatorClassKeys<TClass extends ClassConstructor> =
  keyof InstanceType<TClass>;
