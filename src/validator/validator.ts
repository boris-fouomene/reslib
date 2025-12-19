import {
  buildPropertyDecorator,
  getDecoratedProperties,
} from '@/resources/decorators';
import { ClassConstructor, Dictionary, MakeOptional } from '@/types';
import { Logger } from '@logger';
import {
  defaultStr,
  isEmpty,
  isNonNullString,
  isNumber,
  isObj,
  lowerFirst,
  stringify,
} from '@utils/index';
import { I18n, i18n as defaultI18n } from '../i18n';
import {
  ValidatorBaseError,
  ValidatorBulkError,
  ValidatorBulkErrorItem,
  ValidatorClassError,
  ValidatorClassItemError,
  ValidatorCreateBulkErrorPayload,
  ValidatorCreateClassErrorPayload,
  ValidatorCreateErrorPayload,
  ValidatorError,
} from './errors';
import { VALIDATOR_RULE_MARKERS } from './rulesMarkers';
import {
  ValidatorAsyncRuleResult,
  ValidatorBulkOptions,
  ValidatorBulkResult,
  ValidatorClassOptions,
  ValidatorClassResult,
  ValidatorDefaultMultiRule,
  ValidatorMultiRuleFunction,
  ValidatorMultiRuleNames,
  ValidatorMultiRuleOptions,
  ValidatorNestedRuleFunctionOptions,
  ValidatorObjectOptions,
  ValidatorObjectResult,
  ValidatorObjectRules,
  ValidatorObjectSchema,
  ValidatorOptions,
  ValidatorResult,
  ValidatorRule,
  ValidatorRuleConfigMessage,
  ValidatorRuleFunction,
  ValidatorRuleFunctionsMap,
  ValidatorRuleName,
  ValidatorRuleObject,
  ValidatorRuleParams,
  ValidatorRuleResult,
  ValidatorRules,
  ValidatorSanitizedRuleObject,
  ValidatorSanitizedRules,
  ValidatorSuccess,
} from './types';

export class Validator {
  private static readonly RULES_METADATA_KEY = Symbol.for('validationRules');

  /**
   * ## Register Validation Rule
   *
   * Registers a new custom validation rule that can be used throughout the application.
   * This method provides type-safe registration of validation functions with proper
   * error handling and validation of input parameters.
   *
   * ### Type Parameters
   * - `TParams` - Array type defining the parameters the rule function accepts
   * - `Context` - Type of the validation context object passed to the rule
   *
   * ### Rule Function Signature
   * ```typescript
   * type RuleFunction<TParams, Context> = (options: {
   *   value: any;
   *   ruleParams: TParams;
   *   context?: Context;
   *   fieldName?: string;
   *   translatedPropertyName?: string;
   * }) => ValidatorRuleResult
   * ```
   *
   * ### Rule Return Values
   * - `true` - Validation passed
   * - `false` - Validation failed (uses default error message)
   * - `string` - Validation failed with custom error message
   * - `ValidatorAsyncRuleResult` - Async validation
   *
   * @example
   * ```typescript
   * // Simple synchronous rule
   * Validator.registerRule('MinValue', ({ value, ruleParams }) => {
   *   const [minValue] = ruleParams;
   *   return value >= minValue || `Value must be at least ${minValue}`;
   * });
   *
   * // Async rule with database check
   * Validator.registerRule('UniqueEmail', async ({ value, context }) => {
   *   const exists = await database.user.findByEmail(value);
   *   return !exists || 'Email address is already taken';
   * });
   *
   * // Rule with multiple parameters
   * Validator.registerRule('Between', ({ value, ruleParams }) => {
   *   const [min, max] = ruleParams;
   *   return (value >= min && value <= max) ||
   *          `Value must be between ${min} and ${max}`;
   * });
   *
   * // Rule with context
   * Validator.registerRule('DifferentFrom', ({ value, ruleParams, context }) => {
   *   const [fieldName] = ruleParams;
   *   const otherValue = context?.data?.[fieldName];
   *   return value !== otherValue ||
   *          `Must be different from ${fieldName}`;
   * });
   * ```
   *
   * @template TParams - Array type for rule parameters
   * @template Context - Type for validation context
   *
   * @param {ValidatorOptionalOrEmptyRuleNames} ruleName - Unique identifier for the validation rule (must be non-empty string). This type constrains registration to rules with optional or empty parameters only (e.g., Required[], Email[], PhoneNumber[countryCode?]) but not rules with required parameters (e.g., MinLength[number]).
   * @param ruleHandler - Function that performs the validation logic
   *
   * @throws {Error} When ruleName is not a non-empty string
   * @throws {Error} When ruleHandler is not a function
   *
   *
   * @see {@link getRule} - Find a registered rule
   * @see {@link getRules} - Get all registered rules
   * @public
   */
  static registerRule<
    TParams extends ValidatorDefaultArray = ValidatorDefaultArray,
    Context = unknown,
  >(
    ruleName: ValidatorRuleName,
    ruleHandler: ValidatorRuleFunction<TParams, Context>
  ): void {
    if (!isNonNullString(ruleName)) {
      throw new Error('Rule name must be a non-empty string');
    }

    if (typeof ruleHandler !== 'function') {
      throw new Error('Rule handler must be a function');
    }
    const existingRules = Validator.getRules();
    const updatedRules = { ...existingRules, [ruleName]: ruleHandler };
    Reflect.defineMetadata(
      Validator.RULES_METADATA_KEY,
      updatedRules,
      Validator
    );
  }

  /**
   * ## Get All Registered Rules
   *
   * Retrieves an immutable copy of all currently registered validation rules.
   * This method provides access to the internal rules registry that contains
   * all custom validation rules registered via {@link registerRule}.
   *
   * ### Rule Registry
   * The Validator maintains a centralized registry of validation rules using
   * TypeScript's Reflect Metadata API. This registry stores rule functions
   * that can be used throughout the validation system.
   *
   * ### Return Value
   * Returns a shallow copy of the rules registry to prevent external modification
   * while allowing inspection of available rules. The returned object maps
   * rule names to their corresponding validation functions.
   *
   * ### Rule Types
   * The registry contains rules registered through {@link registerRule}, which
   * are constrained by {@link ValidatorOptionalOrEmptyRuleNames} to only include
   * rules with optional or empty parameters (e.g., Required[], Email[], PhoneNumber[countryCode?]).
   *
   * ### Use Cases
   * - **Rule Discovery**: List all available validation rules for documentation
   * - **Debugging**: Inspect the current state of the rules registry
   * - **Testing**: Verify rule registration in unit tests
   * - **Introspection**: Build dynamic validation UIs or rule explorers
   * - **Rule Analysis**: Examine rule implementations programmatically
   *
   * ### Performance
   * This method performs a shallow copy of the rules object, ensuring that
   * external modifications cannot affect the internal registry while providing
   * efficient access to rule functions.
   *
   * @example
   * ```typescript
   * // Get all registered rules
   * const allRules = Validator.getRules();
   * console.log('Available rules:', Object.keys(allRules));
   * console.log('Total rules registered:', Object.keys(allRules).length);
   *
   * // Check if specific rules exist
   * const hasEmailRule = 'Email' in Validator.getRules();
   * const hasRequiredRule = 'Required' in Validator.getRules();
   *
   * // Access rule functions directly (not recommended for normal use)
   * const rules = Validator.getRules();
   * const emailRule = rules['Email'];
   * if (emailRule) {
   *   // Use rule directly (bypasses normal validation pipeline)
   *   const result = await emailRule({
   *     value: 'test@example.com',
   *     ruleParams: []
   *   });
   * }
   *
   * // Iterate through all rules for analysis
   * const rulesRegistry = Validator.getRules();
   * for (const [ruleName, ruleFunction] of Object.entries(rulesRegistry)) {
   *   console.log(`Rule: ${ruleName}, Type: ${typeof ruleFunction}`);
   * }
   *
   * // Use in testing to verify rule registration
   * describe('Rule Registration', () => {
   *   test('should register custom rules', () => {
   *     const rulesBefore = Object.keys(Validator.getRules());
   *     Validator.registerRule('CustomRule', ({ value }) => value === 'valid');
   *     const rulesAfter = Object.keys(Validator.getRules());
   *     expect(rulesAfter.length).toBe(rulesBefore.length + 1);
   *     expect(rulesAfter).toContain('CustomRule');
   *   });
   * });
   * ```
   *
   * @template Context - Optional type for validation context (passed through to rule functions)
   *
   * @returns A shallow copy of all registered validation rules as ValidatorRuleFunctionsMap<Context>
   *          - Keys: Rule names (ValidatorRuleName strings)
   *          - Values: Rule validation functions (ValidatorRuleFunction)
   *          - Empty object if no rules are registered
   *          - Immutable copy prevents external modification
   *
   * @remarks
   * - Returns a new object each time to prevent external mutations
   * - Rules are stored using Reflect Metadata API on the Validator class
   * - Only includes rules registered via registerRule (not built-in decorator rules)
   * - Rule functions maintain their original type signatures and context requirements
   * - Useful for debugging, testing, and building rule management interfaces
   *
   * @see {@link registerRule} - Register a new validation rule
   * @see {@link getRule} - Get a specific rule by name
   * @see {@link hasRule} - Check if a rule exists (type guard)
   * @see {@link ValidatorRuleFunctionsMap} - Type definition for the returned map
   * @see {@link ValidatorOptionalOrEmptyRuleNames} - Type constraint for registered rules
   * @public
   */
  static getRules<Context = unknown>(): ValidatorRuleFunctionsMap<Context> {
    const rules = Reflect.getMetadata(Validator.RULES_METADATA_KEY, Validator);
    return isObj(rules)
      ? { ...rules }
      : ({} as ValidatorRuleFunctionsMap<Context>);
  }
  /**
   * ## Get Registered Rule
   *
   * Retrieves a specific validation rule function by its registered name. This method
   * provides direct access to individual validation functions that have been registered
   * with the Validator system through {@link registerRule}.
   *
   * ### Rule Retrieval
   * This method looks up a single rule in the internal rules registry by name. It serves
   * as a convenience method that delegates to {@link getRules} but returns only the
   * requested rule function, or `undefined` if the rule doesn't exist.
   *
   * ### Registry Lookup
   * The method performs a direct key lookup in the rules registry maintained by
   * {@link getRules}. This registry contains only rules registered via {@link registerRule},
   * which are constrained by {@link ValidatorOptionalOrEmptyRuleNames}.
   *
   * ### Return Value
   * - Returns the validation rule function if found
   * - Returns `undefined` if no rule with the given name exists
   * - The returned function has the signature `ValidatorRuleFunction<TParams, Context>`
   *
   * ### Use Cases
   * - **Direct Rule Access**: Get a specific rule function for programmatic use
   * - **Rule Inspection**: Examine the implementation of a particular validation rule
   * - **Dynamic Validation**: Access rules by name at runtime
   * - **Rule Testing**: Verify rule registration and functionality in tests
   * - **Custom Validation Logic**: Build custom validation workflows using existing rules
   *
   * ### Performance
   * This method performs a single hash map lookup in the rules registry, making it
   * very efficient for retrieving individual rules. The underlying registry is
   * maintained as a shallow copy to prevent external mutations.
   *
   * @example
   * ```typescript
   * // Get a specific rule function
   * const emailRule = Validator.getRule('Email');
   * if (emailRule) {
   *   // Use the rule directly (bypasses normal validation pipeline)
   *   const result = await emailRule({
   *     value: 'test@example.com',
   *     ruleParams: []
   *   });
   *   console.log('Direct email validation result:', result);
   * }
   *
   * // Safe rule access with existence check
   * const customRule = Validator.getRule('CustomRule');
   * if (customRule) {
   *   console.log('CustomRule is available for use');
   *   // Rule exists and is ready to use
   * } else {
   *   console.log('CustomRule is not registered');
   *   // Handle missing rule case
   * }
   *
   * // Get rule for custom validation logic
   * const minLengthRule = Validator.getRule('MinLength');
   * if (minLengthRule) {
   *   const customValidator = async (value: string, minLen: number) => {
   *     const result = await minLengthRule({
   *       value,
   *       ruleParams: [minLen]
   *     });
   *     return result === true ? 'Valid' : 'Invalid';
   *   };
   *
   *   console.log(await customValidator('hello', 3)); // 'Valid'
   *   console.log(await customValidator('hi', 5));    // 'Invalid'
   * }
   *
   * // Rule inspection and analysis
   * const allRules = Validator.getRules();
   * for (const ruleName of Object.keys(allRules)) {
   *   const rule = Validator.getRule(ruleName);
   *   console.log(`Rule: ${ruleName}, Function: ${rule?.name || 'anonymous'}`);
   * }
   *
   * // Testing rule registration
   * describe('Rule Registration', () => {
   *   test('should register and retrieve custom rule', () => {
   *     Validator.registerRule('TestRule', ({ value }) => value === 'test');
   *     const retrievedRule = Validator.getRule('TestRule');
   *     expect(retrievedRule).toBeDefined();
   *     expect(typeof retrievedRule).toBe('function');
   *   });
   * });
   * ```
   *
   * @template Context - Optional type for validation context (passed through to rule functions)
   *
   * @param ruleName - The name of the validation rule to retrieve (must be a valid ValidatorRuleName)
   *
   * @returns The validation rule function if found, undefined otherwise
   *          - Function signature: `ValidatorRuleFunction<TParams, Context>`
   *          - Returns `undefined` if rule doesn't exist in registry
   *          - Rule function maintains its original type signatures and behavior
   *
   * @remarks
   * - This method delegates to `getRules()` internally for registry access
   * - Only returns rules registered via `registerRule()` (not built-in decorator rules)
   * - Rules are constrained by `ValidatorOptionalOrEmptyRuleNames` type constraints
   * - Direct rule function calls bypass the normal validation pipeline
   * - Always check for `undefined` return value before using the rule
   * - Useful for building custom validation logic and rule introspection
   * - Rule functions expect the standard `ValidatorRuleFunction` parameter structure
   *
   * @see {@link getRules} - Get all registered rules as a map
   * @see {@link registerRule} - Register a new validation rule
   * @see {@link getRule} - Type-safe rule retrieval with generics
   * @see {@link hasRule} - Check if a rule exists (type guard)
   * @see {@link ValidatorRuleFunction} - Type definition for rule functions
   * @see {@link ValidatorOptionalOrEmptyRuleNames} - Type constraint for registered rules
   * @public
   */
  static getRule<Context = unknown>(ruleName: ValidatorRuleName) {
    return this.getRules<Context>()[ruleName];
  }
  /**
   * ## Check Rule Existence (Type Guard)
   *
   * Type guard method that checks whether a validation rule with the given name
   * is registered in the Validator system. This method provides both existence
   * checking and TypeScript type narrowing for rule names.
   *
   * ### Type Guard Behavior
   * - **Input Validation**: First checks if the input is a non-null string
   * - **Rule Lookup**: Uses `getRule` to check if the rule exists in the registry
   * - **Type Narrowing**: Narrows `ruleName` to `ValidatorRuleName` if it returns true
   *
   * ### Use Cases
   * - **Safe Rule Access**: Verify rule existence before using `getRule`
   * - **Dynamic Validation**: Check rules at runtime before applying them
   * - **Type Safety**: Enable TypeScript to narrow types based on rule existence
   * - **Error Prevention**: Avoid undefined access when working with rule names
   *
   * @example
   * ```typescript
   * // Basic existence check
   * if (Validator.hasRule('Email')) {
   *   console.log('Email rule is available');
   * }
   *
   * // Type narrowing with type guard
   * function processRule(ruleName: string) {
   *   if (Validator.hasRule(ruleName)) {
   *     // TypeScript now knows ruleName is ValidatorRuleName
   *     const rule = Validator.getRule(ruleName); // Type safe
     return rule;
   *   } else {
   *     console.log(`${ruleName} is not a valid rule`);
     return null;
   *   }
   * }
   *
   * // Safe rule processing
   * const ruleNames = ['Email', 'Required', 'InvalidRule'];
   * const validRules = ruleNames.filter(Validator.hasRule);
   * console.log('Valid rules:', validRules); // ['Email', 'Required']
   *
   * // Dynamic rule application
   * function applyRuleIfExists(value: any, ruleName: string) {
   *   if (Validator.hasRule(ruleName)) {
   *     const rule = Validator.getRule(ruleName);
   *     return rule?.({ value, ruleParams: [] });
   *   }
   *   return 'Rule not found';
   * }
   * ```
   *
   * @param ruleName - The name to check for rule existence (any type, validated internally)
   *
   * @returns `true` if the rule exists and ruleName is a valid ValidatorRuleName, `false` otherwise
   *
   * 
   * @see {@link getRule} - Get the actual rule function
   * @see {@link getRules} - Get all registered rules
   * @see {@link registerRule} - Register a new validation rule
   * @public
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static hasRule(ruleName: any): ruleName is ValidatorRuleName {
    if (!isNonNullString(ruleName)) {
      return false;
    }
    return !!this.getRule(ruleName);
  }

  private static getI18n(options?: { i18n?: I18n }): I18n {
    if (I18n.isI18nInstance(options?.i18n)) {
      return options.i18n;
    }
    return defaultI18n;
  }

  /**
   * ## Get Error Message Separators
   *
   * Retrieves the configured separators used for formatting validation error messages.
   * This method provides centralized access to internationalized separator strings that
   * ensure consistent error message formatting across different languages and locales.
   *
   * ### Purpose
   * Error message separators are crucial for creating readable, localized error messages
   * when multiple validation failures occur. Different languages use different punctuation
   * conventions (commas, semicolons, periods) for joining error messages, and this method
   * ensures proper internationalization support.
   *
   * ### Separator Types
   * - **`multiple`** - Primary separator for joining multiple error messages
   *   - Default: `", "` (comma + space)
   *   - Used when combining multiple validation errors
   *   - Examples: `"Field is required, Must be email, Too short"`
   * - **`single`** - Secondary separator for single error message formatting
   *   - Default: `", "` (comma + space)
   *   - Used for complex single error messages with multiple parts
   *   - Examples: `"Must be between 5 and 10, but received 15"`
   *
   * ### Internationalization Behavior
   * - Loads separators from i18n translation key: `validator.separators`
   * - Falls back to English defaults (`", "`) if translations unavailable
   * - Supports custom I18n instances for testing or specialized formatting
   * - Automatically adapts to language-specific punctuation conventions
   *
   * ### Use Cases
   * - **Custom Error Builders**: Create consistent error message formatting
   * - **Multi-Field Validation**: Join errors from multiple field validations
   * - **Complex Rules**: Format errors from rules with multiple conditions
   * - **UI Integration**: Ensure error messages match application locale
   * - **Testing**: Verify error message formatting in different languages
   *
   * @example
   * ```typescript
   * // Basic separator retrieval
   * const separators = Validator.getErrorMessageSeparators();
   * console.log(separators); // { multiple: ", ", single: ", " }
   *
   * // Custom error message formatting
   * function formatValidatorErrors(fieldName: string, errors: string[]) {
   *   const seps = Validator.getErrorMessageSeparators();
   *   if (errors.length === 0) return null;
   *   if (errors.length === 1) return `${fieldName}: ${errors[0]}`;
   *   return `${fieldName}: ${errors.join(seps.multiple)}`;
   * }
   *
   * const errors = ['Field is required', 'Must be email', 'Too short'];
   * console.log(formatValidatorErrors('email', errors));
   * // Output: "email: Field is required, Must be email, Too short"
   *
   * // Using separators in validation result processing
   * const result = await Validator.validate({
   *   value: '',
   *   rules: ['Required', 'Email'],
   *   fieldName: 'userEmail'
   * });
   *
   * if (!result.success) {
   *   // This would normally be done internally, but for demonstration:
   *   const seps = Validator.getErrorMessageSeparators();
   *   const customMessage = `Validation failed: ${result.error.message}`;
   *   console.log(customMessage);
   * }
   *
   * // Custom I18n instance for testing
   * const customI18n = new I18n({
   *   validator: {
   *     separators: {
   *       multiple: '; ',
   *       single: ' - '
   *     }
   *   }
   * });
   *
   * const customSeparators = Validator.getErrorMessageSeparators(customI18n);
   * console.log(customSeparators); // { multiple: "; ", single: " - " }
   *
   * // Language-specific formatting example
   * // French: "Champ requis, Doit être email, Trop court"
   * // German: "Feld erforderlich, Muss E-Mail sein, Zu kurz"
   * // Japanese: "フィールドは必須です、メールアドレスである必要があります、短すぎます"
   * ```
   *
   * @param customI18n - Optional custom I18n instance to override default translations
   *                     Useful for testing, custom formatting, or specialized locales
   *
   * @returns Object containing separator strings for error message formatting
   * @returns returns.multiple - Separator string for joining multiple error messages (default: `", "`)
   * @returns returns.single - Separator string for single error message formatting (default: `", "`)
   *
   * @remarks
   * - Separators are loaded from i18n key `validator.separators` with fallback defaults
   * - Method is used internally by `validate()` and `validateClass()` for filtering error formatting
   * - Supports both built-in i18n and custom I18n instances
   * - Thread-safe and stateless - can be called multiple times without side effects
   * - Default separators ensure English-compatible formatting when i18n unavailable
   * - Note: This deals specifically with flat lists of errors (e.g. multiple failed rules on one field).
   *   Nested error structure formatting (e.g. nested objects) is handled separately via `translateNestedErrorResult`.
   *
   * @see {@link validate} - Uses these separators for formatting validation error messages
   * @see {@link validateClass} - Uses these separators for multi-field validation errors
   * @see {@link validateMultiRule} - Uses separators for OneOf/AllOf error aggregation
   * @see {@link validateArrayOfRule} - Uses separators for array item error formatting
   * @see {@link I18n} - Internationalization system for custom separator configuration
   * @public
   */
  static getErrorMessageSeparators(customI18n?: I18n): {
    multiple: string;
    single: string;
  } {
    const i18n = this.getI18n({ i18n: customI18n });
    const translatedSeparator: Dictionary = Object.assign(
      {},
      i18n.getNestedTranslation('validator.separators')
    ) as Dictionary;
    return {
      multiple: defaultStr(translatedSeparator.multiple, ', '),
      single: defaultStr(translatedSeparator.single, ', '),
    };
  }

  /**
   * ## Parse and Validate Rules
   *
   * The primary entry point for rule preprocessing in the validation pipeline.
   * This method bridges the gap between user-friendly rule specification and the internal validation engine.
   *
   * It transforms rules from multiple formats (strings, objects, functions) into a uniform structure
   * that the validation engine can execute. Crucially, it isolates invalid rules (e.g., misspelled names)
   * so they can be reported separately without crashing the validation process.
   *
   * ### Supported Input Formats
   *
   * #### 1. Function Rules (Direct Logic)
   * The most flexible format. Functions are preserved as-is.
   * ```typescript
   * // Synchronous
   * const isEven = ({ value }) => value % 2 === 0 || 'Must be even';
   *
   * // Asynchronous
   * const isUnique = async ({ value, context }) => {
   *   return await checkDb(value) || 'Already exists';
   * };
   * ```
   *
   * #### 2. String Rules (Simple Names)
   * Useful for built-in rules that don't require parameters (or where parameters are optional).
   * ```typescript
   * 'Required'
   * 'Email'
   * 'IsNumber'
   * ```
   *
   * #### 3. Object Rules (Type-Safe & Configurable)
   * The most robust format, supporting parameters and custom messages.
   *
   * **Standard Format:**
   * ```typescript
   * { MinLength: [5] }           // Rule with parameters
   * { Required: [] }             // Rule without parameters
   * ```
   *
   * **Extended Format (with Custom Message):**
   * ```typescript
   * {
   *   Required: {
   *     params: [],
   *     message: "This specific field is mandatory!"
   *   }
   * }
   * ```
   *
   * ### Processing Logic
   * 1. **Normalization**: Iterates through the input array.
   * 2. **Function Preservation**: Function rules are added directly to `sanitizedRules`.
   * 3. **String Parsing**: String rules are looked up in the registry.
   * 4. **Object Parsing**: Object rules are converted to `ValidatorSanitizedRuleObject`s.
   * 5. **Validation**: Rules that are not found in the registry are moved to `invalidRules`.
   *
   * ### Return Value Structure
   * Returns an object `{ sanitizedRules, invalidRules }`.
   *
   * - **sanitizedRules**: Array of `ValidatorSanitizedRule` (Union of functions and objects).
   *   - Functions are untouched.
   *   - Objects are normalized to `{ ruleName, params, ruleFunction, message? }`.
   *
   * - **invalidRules**: Array of rules that failed parsing or lookup. kept in original format for error reporting.
   *
   * @example
   * ```typescript
   * const mixedRules = [
   *   'Required',                                  // String rule
   *   { MaxLength: [50] },                        // Object rule
   *   { MinLength: { params: [3], message: "Too short!" } }, // Custom message
   *   ({ value }) => value.includes('@'),         // Function rule
   *   'InvalidRule'                               // Will be invalid
   * ];
   *
   * const { sanitizedRules, invalidRules } = Validator.parseAndValidateRules(mixedRules);
   *
   * console.log(sanitizedRules.length); // 4
   * console.log(invalidRules.length);   // 1
   * ```
   *
   * @template Context - Type of the validation context
   * @param inputRules - Array of rules (or undefined)
   * @returns Object containing valid sanitized rules and a list of invalid rules
   *
   * @public
   * @see {@link parseStringRule}
   * @see {@link parseObjectRule}
   */
  static parseAndValidateRules<Context = unknown>(
    inputRules?: ValidatorOptions<ValidatorDefaultArray, Context>['rules']
  ): {
    sanitizedRules: ValidatorSanitizedRules<Context>;
    invalidRules: ValidatorRules<Context>[];
  } {
    const parsedRules: ValidatorSanitizedRules<Context> = [];
    const registeredRules = this.getRules<Context>();
    const invalidRules: ValidatorRules<Context>[] = [];

    const rulesToProcess = Array.isArray(inputRules) ? inputRules : [];

    for (const rule of rulesToProcess) {
      if (typeof rule === 'function') {
        parsedRules.push(rule);
      } else if (isNonNullString(rule)) {
        const parsedRule = this.parseStringRule<Context>(rule, registeredRules);
        if (parsedRule) {
          parsedRules.push(parsedRule);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          invalidRules.push(rule as any);
        }
      } else if (isObj(rule) && typeof rule === 'object') {
        const parsedObject = this.parseObjectRule<Context>(
          rule,
          registeredRules
        );
        if (parsedObject.length) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          parsedRules.push(...(parsedObject as any));
        }
      }
    }
    return { sanitizedRules: parsedRules, invalidRules };
  }

  /**
   * ## Parse String-Based Validation Rules
   *
   * Internal helper method that parses string-format validation rules into standardized
   * rule objects. Currently handles simple rule names without parameter parsing.
   * This method is part of the rule preprocessing pipeline that converts various
   * rule formats into a consistent internal representation.
   *
   * ### Current Supported String Formats
   * - `"ruleName"` - Simple rule without parameters (e.g., `"Required"`, `"Email"`)
   *

   * ### Processing Logic
   * 1. **Input Validation**: Accepts any value, converts to trimmed string
   * 2. **Rule Lookup**: Searches registered rules map using the string as rule name
   * 3. **Function Retrieval**: Extracts the validation function if rule exists
   * 4. **Object Construction**: Creates standardized rule object with metadata
   * 5. **Error Handling**: Returns null if rule is not found in registry
   *
   * ### Parameter Handling
   * - String rules **do not** support parameters.
   * - Rules needing parameters must use object notation: `{ RuleName: [params] }`
   *
   * ### Return Value Structure
   * When successful, returns a complete rule object:
   * ```typescript
   * {
   *   ruleName: "Required",           // The rule identifier
   *   params: [],                     // Empty array (no parsing yet)
   *   ruleFunction: Function,         // The actual validation function
   * }
   * ```
   *
   * ### Error Cases
   * - **Unknown Rule**: Returns `null` if rule name not found in registry
   * - **Invalid Input**: Any input is accepted (converted to string)
   * - **Empty String**: Empty/whitespace strings return `null`
   *
   * ### Examples
   *
   * #### Basic Rule Parsing
   * ```typescript
   * // Simple rule lookup
   * const rule = Validator.parseStringRule("Required", registeredRules);
   * // Returns: { ruleName: "Required", params: [], ruleFunction: fn }
   *
   * const emailRule = Validator.parseStringRule("Email", registeredRules);
   * // Returns: { ruleName: "Email", params: [], ruleFunction: fn }
   * ```
   *
   * #### Unknown Rule Handling
   * ```typescript
   * const unknownRule = Validator.parseStringRule("UnknownRule", registeredRules);
   * // Returns: null (rule not found)
   * ```
   *
   * #### Current Limitations
   *
   * #### Integration with Validation Pipeline
   * ```typescript
   * // Used internally by parseAndValidateRules
   * const mixedRules = ["Required", "Email", { MinLength: [3] }];
   * const { sanitizedRules, invalidRules } = Validator.parseAndValidateRules(mixedRules);
   *
   * // String rules are processed by this method
   * // Object rules are processed by parseObjectRule
   * // Function rules are used directly
   * ```
   *
   * ### Performance Characteristics
   * - **Fast Lookup**: O(1) hash map lookup in registered rules
   * - **Minimal Processing**: Only string trimming and function lookup
   * - **Memory Efficient**: Creates minimal rule objects
   * - **Synchronous**: No async operations or I/O
   *

   * @template Context - Optional validation context type for rule functions
   *
   * @param ruleString - The string representation of the rule to parse
   *                     Currently only supports simple rule names without parameters
   * @param registeredRules - Map of all currently registered validation rules
   *                          Used to lookup the validation function by rule name
   *
   * @returns ValidatorSanitizedRuleObject with standardized structure, or null if rule not found
   * @returns returns.ruleName - The rule identifier (same as input string)
   * @returns returns.params - Empty array (parameter parsing not implemented)
   * @returns returns.ruleFunction - The actual validation function from registry
   *
   * @throws {Never} This method never throws errors; returns null for invalid rules
   *
   * @remarks
   * - This is an internal method used by `parseAndValidateRules`
   * - For rules with parameters, use object notation: `{ RuleName: [param1, param2] }`
   * - Rule registry lookup ensures only registered rules are accepted
   * - Maintains type safety through TypeScript generics for context propagation
   * - Processing is synchronous and performant for large rule sets
   *
   * @see {@link parseAndValidateRules} - Public method that orchestrates rule parsing
   * @see {@link parseObjectRule} - Handles object notation rules with parameters
   * @see {@link registerRule} - Method for registering rules in the system
   * @see {@link getRules} - Method to retrieve all registered rules
   * @see {@link ValidatorSanitizedRuleObject} - Type definition for parsed rules
   */
  static parseStringRule<Context = unknown>(
    ruleString: string,
    registeredRules: ValidatorRuleFunctionsMap<Context>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    let ruleName = String(ruleString).trim();
    const ruleParameters: string[] = [];
    const ruleFunction = registeredRules[ruleName as ValidatorRuleName];
    if (typeof ruleFunction === 'function') {
      return {
        ruleName: ruleName as ValidatorRuleName,
        params: ruleParameters,
        ruleFunction: ruleFunction as ValidatorRuleFunction,
      };
    }
    return null;
  }
  /**
   * ## Parse Function Rule
   *
   * Transforms a raw validation function into a standardized rule object.
   * This is a critical normalization step that ensures even ad-hoc, anonymous functions
   * conform to the system's uniform `ValidatorSanitizedRuleObject` structure.
   *
   * ### Logic
   * 1. **Rule Name resolution**: Attempts to identify the rule name in this order:
   *    - Checks for a marked rule name (metadata attached via decorators)
   *    - Falls back to the function's innate `.name` property
   *    - Defaults to "anonymous" (implicit in most cases if un-named)
   * 2. **Structure Creation**: Wraps the function in a standard object with:
   *    - `ruleFunction`: The original function itself
   *    - `ruleName`: The resolved identifier
   *    - `params`: Empty array `[]` (Function rules carry their logic internally)
   *
   * @template Context - Validation context type
   * @param rule - The raw validation function to process
   * @returns A sanitized rule object containing the function and metadata
   */
  static parseFunctionRule<Context = unknown>(
    rule: ValidatorRuleFunction<ValidatorDefaultArray, Context>
  ): ValidatorSanitizedRuleObject<ValidatorDefaultArray, Context> {
    const ruleName =
      getMarkedRuleName(rule) ?? (rule.name as ValidatorRuleName);
    return {
      ruleFunction: rule as ValidatorRuleFunction<
        ValidatorDefaultArray,
        Context
      >,
      ruleName,
      params: [],
    };
  }

  /**
   * ## Parse Object Rule
   *
   * Parses object notation validation rules into standardized rule objects. This method handles
   * rules specified as key-value pairs where the key is the rule name and the value is either
   * an array of parameters or a structured configuration object.
   *
   * ### Object Rule Formats
   * 1. **Simple Format**: Key is rule name, value is parameter array
   *    ```typescript
   *    { MinLength: [5] }
   *    ```
   * 2. **Detailed Format**: Key is rule name, value is object with `params` and `message`
   *    ```typescript
   *    {
   *      Required: {
   *        params: [],
   *        message: "This field is mandatory"
   *      }
   *    }
   *    ```
   *
   * ### Processing Logic
   * 1. **Input Validation**: Ensures `rulesObject` is a valid object
   * 2. **Sanitized Check**: Pass-through if object is already sanitized
   * 3. **Iteration**: Loops through keys in the object
   * 4. **Lookup**: Verifies rule existence in registry
   * 5. **Extraction**: Handles both array and object value formats
   * 6. **Construction**: Creates standardized rule objects with function references
   *
   * @param rulesObject - The rule configuration object
   * @param registeredRules - Map of registered validation functions
   * @returns Array of sanitized rule objects ready for execution
   */
  static parseObjectRule<Context = unknown>(
    rulesObject: ValidatorRuleObject,
    registeredRules: ValidatorRuleFunctionsMap<Context>
  ): ValidatorSanitizedRuleObject<ValidatorDefaultArray, Context>[] {
    const result: ValidatorSanitizedRuleObject<
      ValidatorDefaultArray,
      Context
    >[] = [];
    if (!isObj(rulesObject)) {
      return result;
    }
    if (this.isSanitizedRuleObject(rulesObject)) {
      result.push(rulesObject);
      return result;
    }
    for (const propertyKey in rulesObject) {
      if (Object.hasOwnProperty.call(rulesObject, propertyKey)) {
        const ruleName: ValidatorRuleName = propertyKey as ValidatorRuleName;
        if (typeof registeredRules[ruleName] !== 'function') {
          continue;
        }
        const ruleFunction = registeredRules[ruleName] as ValidatorRuleFunction<
          ValidatorDefaultArray,
          Context
        >;

        const ruleParameters = rulesObject[ruleName];
        if (Array.isArray(ruleParameters)) {
          result.push({
            ruleName,
            ruleFunction,
            params: ruleParameters,
          });
        } else {
          if (
            isObj(ruleParameters) &&
            ruleParameters?.params &&
            Array.isArray(ruleParameters.params)
          ) {
            result.push({
              ...ruleParameters,
              ruleName,
              ruleFunction,
            });
          }
        }
      }
    }
    return result;
  }
  /**
   * ## Check if Object is Sanitized Rule
   *
   * Type guard that determines whether a given value matches the structure of a
   * `ValidatorSanitizedRuleObject`. This ensures that the object has all the necessary
   * properties (ruleName, ruleFunction, params) to be safely used by the validation engine.
   *
   * ### Type Guard Checks
   * 1. **Is Object**: The value must be a non-null object.
   * 2. **Has Function**: `ruleFunction` must be a callable function.
   * 3. **Has Name**: `ruleName` must be a string.
   * 4. **Has Parameters**: `params` must be an array.
   *
   * @template TRuleParams - Parameter types for the rule
   * @template Context - Validation context type
   *
   * @param rule - The value to check
   * @returns `true` if the value matches the sanitized rule structure, `false` otherwise
   */
  static isSanitizedRuleObject<
    TRuleParams extends ValidatorDefaultArray = ValidatorDefaultArray,
    Context = unknown,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  >(rule: any): rule is ValidatorSanitizedRuleObject<TRuleParams, Context> {
    if (!isObj(rule)) {
      return false;
    }
    const sanitizedRule = rule as ValidatorSanitizedRuleObject<
      TRuleParams,
      Context
    >;
    return (
      typeof sanitizedRule.ruleFunction == 'function' &&
      typeof sanitizedRule.ruleName == 'string' &&
      Array.isArray(sanitizedRule.params)
    );
  }

  static async validate<Context = unknown>({
    rules,
    ...extra
  }: MakeOptional<
    ValidatorOptions<ValidatorDefaultArray, Context>,
    'i18n' | 'ruleParams'
  >): Promise<ValidatorResult<Context>> {
    const i18n = this.getI18n(extra);
    const startTime = Date.now();
    const { sanitizedRules, invalidRules } =
      Validator.parseAndValidateRules<Context>(rules);
    const separators = Validator.getErrorMessageSeparators(i18n);
    const { value, context, data } = extra;

    const translateOptions = this.getI18nTranslateOptions(extra);
    const successOrErrorData = {
      ...translateOptions,
      context,
      value,
      data,
    };
    // Handle invalid rules - return failure result instead of rejecting
    if (invalidRules.length) {
      const message = invalidRules
        .map((rule) =>
          i18n.t('validator.invalidRule', {
            ...translateOptions,
            rule: isNonNullString(rule) ? rule : 'unnamed rule',
          })
        )
        .join(separators.multiple);
      return Validator.createError(message, {
        value,
        startTime,
        fieldName: extra.fieldName,
        propertyName: extra.propertyName,
        translatedPropertyName: extra.translatedPropertyName,
        ruleParams: [],
        ruleName: 'N/A',
      });
    }

    // No rules to validate - return success
    if (!sanitizedRules.length) {
      return createSuccessResult<Context>(successOrErrorData, startTime);
    }

    if (
      this.shouldSkipValidation({
        value,
        rules: sanitizedRules as unknown as ValidatorSanitizedRules<Context>,
      })
    ) {
      // Value meets nullable conditions - validation succeeds
      return createSuccessResult<Context>(successOrErrorData, startTime);
    }

    extra.fieldName = extra.propertyName = defaultStr(
      extra.fieldName,
      extra.propertyName
    );
    return new Promise((resolve) => {
      let index = -1;
      const rulesLength = sanitizedRules.length;
      const next = async function (): Promise<void> {
        index++;
        if (index >= rulesLength) {
          return resolve(createSuccessResult(successOrErrorData, startTime));
        }
        const rule = sanitizedRules[index];
        let ruleName = undefined;
        let ruleParams: ValidatorRuleParams<Array<unknown>, Context>[] = [];
        let ruleMessage: ValidatorRuleConfigMessage | undefined;
        let ruleFunc:
          | ValidatorRuleFunction<ValidatorDefaultArray, Context>
          | undefined = typeof rule === 'function' ? rule : undefined;
        if (Validator.isSanitizedRuleObject(rule)) {
          ruleFunc = rule.ruleFunction;
          ruleParams = (
            Array.isArray(rule.params) ? rule.params : []
          ) as ValidatorRuleParams<Array<unknown>, Context>[];
          ruleName = rule.ruleName;
          ruleMessage = rule.message;
        } else if (typeof rule == 'function') {
          const parsedRuleFunc = Validator.parseFunctionRule<Context>(rule);
          if (parsedRuleFunc) {
            ruleName = parsedRuleFunc.ruleName;
          } else {
            ruleName = rule.name as ValidatorRuleName;
          }
        }

        const i18nRuleOptions = {
          //...extra,
          value,
          rules,
          ...translateOptions,
          rule: defaultStr(ruleName),
          ruleName,
          ruleParams,
        };
        const errorDetails: ValidatorCreateErrorPayload = {
          value,
          startTime,
          fieldName: extra.fieldName,
          propertyName: extra.propertyName,
          translatedPropertyName: extra.translatedPropertyName,
          ruleParams,
          ruleName: defaultStr(ruleName),
        };
        const validateOptions = {
          ...extra,
          data: data ?? Object.assign({}, data),
          startTime,
          ...i18nRuleOptions,
          ruleName: defaultStr(ruleName) as ValidatorRuleName,
          value,
          i18n,
        };
        const handleResult = (result: unknown) => {
          if (Validator.isError(result)) {
            return resolve(result);
          }
          let translatedRuleMessage: string = '';
          if (result !== true && ruleMessage) {
            if (isNonNullString(ruleMessage)) {
              translatedRuleMessage = i18n.has(ruleMessage)
                ? i18n.t(ruleMessage, i18nRuleOptions)
                : ruleMessage;
            } else if (typeof ruleMessage === 'function') {
              try {
                translatedRuleMessage = ruleMessage({
                  ...validateOptions,
                });
              } catch (e) {
                // Custom message function failed; ignore and use default message
                Logger.log(
                  Validator.name,
                  ' Error generated when runing custom translate rule message ',
                  ruleName,
                  ruleParams,
                  e
                );
                translatedRuleMessage = '';
              }
            }
          }
          if (isNonNullString(translatedRuleMessage)) {
            return resolve(
              Validator.createError(translatedRuleMessage, errorDetails)
            );
          }
          result =
            typeof result === 'string'
              ? isNonNullString(result)
                ? result
                : i18n.t('validator.invalidMessage', i18nRuleOptions)
              : result;
          if (result === false) {
            const message = i18n.t('validator.invalidMessage', i18nRuleOptions);
            return resolve(Validator.createError(message, errorDetails));
          } else if (isNonNullString(result)) {
            return resolve(Validator.createError(result, errorDetails));
          } else if (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (result as any) instanceof Error ||
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            isNonNullString((result as any)?.message) ||
            isNonNullString(result)
          ) {
            const message = stringify(result, { escapeString: false });
            return resolve(Validator.createError(message, errorDetails));
          }
          return next();
        };

        if (typeof ruleFunc !== 'function') {
          const message = i18n.t('validator.invalidRule', i18nRuleOptions);
          return resolve(Validator.createError(message, errorDetails));
        }
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await ruleFunc(validateOptions as any);
          return handleResult(result);
        } catch (e) {
          return handleResult(
            typeof e === 'string'
              ? e
              : (e as Error)?.message ||
                  e?.toString() ||
                  stringify(e, { escapeString: false })
          );
        }
      };
      return next();
    });
  }

  /**
   * ## Should Skip Validation
   *
   * Determines whether validation should be skipped based on the presence of nullable rules
   * and the current value. This method checks if the value meets the conditions for
   * skipping validation when nullable rules like Empty, Nullable, or Optional are present
   * in the rules array.
   *
   * ### Nullable Rules and Conditions
   * - **Empty**: Skips validation if value is an empty string ""
   * - **Nullable**: Skips validation if value is null or undefined
   * - **Optional**: Skips validation if value is undefined
   *
   * ### Logic
   * 1. Only checks when the value is considered "empty" (using isEmpty utility)
   * 2. Iterates through the rules array to find matching nullable rule names
   * 3. Supports both string rules ("Empty") and object rules ({ Empty: [] })
   * 4. Returns true if any matching nullable rule condition is met
   * 5. Function rules are ignored in this check
   *
   * @param options - The options object containing value and rules
   * @param options.value - The value to check for nullable conditions
   * @param options.rules - The array of validation rules to inspect for nullable rules
   *
   * @returns `true` if validation should be skipped due to nullable conditions, `false` otherwise
   *
   *
   * @see {@link validate} - Uses this method to conditionally skip validation
   * @see {@link validateClass} - Also uses this method for class-based validation
   * @public
   */
  static shouldSkipValidation<Context = unknown>({
    value,
    rules,
  }: {
    rules: Array<ValidatorRuleName> | ValidatorSanitizedRules<Context>;
    value: unknown;
  }) {
    // Check for nullable rules - if value meets nullable conditions, skip validation
    if (isEmpty(value) && Array.isArray(rules)) {
      const nullableConditions = {
        /**
         * Empty rule
         */
        IsEmpty: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          validate: (value: any) => value === '',
          symbol: VALIDATOR_RULE_MARKERS.empty,
        },
        Nullable: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          validate: (value: any) => value === null || value === undefined,
          symbol: VALIDATOR_RULE_MARKERS.nullable,
        },
        Optional: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          validate: (value: any) => value === undefined,

          symbol: VALIDATOR_RULE_MARKERS.optional,
        },
      } as const;
      for (const rule of rules) {
        const ruleF =
          typeof rule == 'object' && rule
            ? rule.ruleFunction
            : typeof rule == 'function'
              ? rule
              : undefined;
        if (typeof ruleF !== 'function') {
          continue;
        }
        for (const key in nullableConditions) {
          const nullableRule =
            nullableConditions[key as keyof typeof nullableConditions];

          const hasMarker = hasRuleMarker(ruleF, nullableRule.symbol);
          if (hasMarker && nullableRule.validate(value)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * ## Validate OneOf Rule
   *
   * Wrapper that applies OR logic across multiple sub-rules. Delegates to
   * {@link validateMultiRule} with `"OneOf"`. Succeeds on the first passing
   * sub-rule (early exit). If all sub-rules fail, returns a single error string
   * aggregating each sub-rule’s message joined by `; `.
   *
   * @template Context - Optional type for validation context
   * @template RulesFunctions - Array of sub-rules to evaluate
   * @param options - Multi-rule validation options
   * @returns `ValidatorRuleResult` (`ValidatorAsyncRuleResult`)
   * @example
   * const res = await Validator.validateOneOfRule({
   *   value: "user@example.com",
   *   ruleParams: ["Email", "PhoneNumber"],
   * });
   * // res === true when any sub-rule succeeds
   *
   * @see {@link validateMultiRule}
   */
  static validateOneOfRule<
    Context = unknown,
    RulesFunctions extends ValidatorDefaultMultiRule<Context> =
      ValidatorDefaultMultiRule<Context>,
  >(
    options: ValidatorMultiRuleOptions<Context, RulesFunctions>
  ): ValidatorRuleResult {
    return this.validateMultiRule<Context, RulesFunctions>('OneOf', options);
  }

  /**
   * ## Validate AllOf Rule
   *
   * Wrapper that applies AND logic across multiple sub-rules. Delegates to
   * {@link validateMultiRule} with `"AllOf"`. Succeeds only if all sub-rules
   * pass. When any sub-rule fails, returns a single aggregated error string
   * joining messages with `; `.
   *
   * @template Context - Optional type for validation context
   * @template RulesFunctions - Array of sub-rules to evaluate
   * @param options - Multi-rule validation options
   * @returns `ValidatorRuleResult` (`ValidatorAsyncRuleResult`)
   * @example
   * const res = await Validator.validateAllOfRule({
   *   value: "hello",
   *   ruleParams: ["String", { MinLength: [5] }],
   * });
   * // res === true only if all sub-rules succeed
   *
   * @see {@link validateMultiRule}
   */
  static validateAllOfRule<
    Context = unknown,
    RulesFunctions extends ValidatorDefaultMultiRule<Context> =
      ValidatorDefaultMultiRule<Context>,
  >(
    options: ValidatorMultiRuleOptions<Context, RulesFunctions>
  ): ValidatorRuleResult {
    return this.validateMultiRule<Context, RulesFunctions>('AllOf', options);
  }

  /**
   * ## Validate ArrayOf Rule
   *
   * Validates that a value is an array and that each item in the array
   * satisfies all of the provided sub-rules (AND logic per item).
   *
   * - Ensures `value` is an array; otherwise returns the localized `array` error.
   * - Applies {@link validateMultiRule} with `"AllOf"` to each item using the provided `ruleParams`.
   * - Aggregates failing item messages; returns `true` when all items pass.
   * - When any items fail, returns a localized summary using `arrayValidationFailed`
   *   with indices of failed items, followed by detailed error messages for each item.
   *
   * @template Context - Optional type for validation context
   * @template RulesFunctions - Array of sub-rules applied to each item
   * @param options - Multi-rule validation options
   * @returns `ValidatorRuleResult` (`ValidatorAsyncRuleResult`) - `true` if all items pass; otherwise an aggregated error string
   * @example
   * const res = await Validator.validateArrayOfRule({
   *   value: ["user@example.com", "admin@example.com"],
   *   ruleParams: ["Email"],
   * });
   * // res === true when every item is a valid email
   *
   */
  static async validateArrayOfRule<
    Context = unknown,
    RulesFunctions extends ValidatorDefaultMultiRule<Context> =
      ValidatorDefaultMultiRule<Context>,
  >(
    options: ValidatorMultiRuleOptions<Context, RulesFunctions>
  ): ValidatorAsyncRuleResult {
    let { value, ruleParams, startTime, ...extra } = options;
    startTime = isNumber(startTime) ? startTime : Date.now();
    const subRules = (
      Array.isArray(ruleParams) ? ruleParams : []
    ) as RulesFunctions;
    const i18n = this.getI18n(extra);

    // Must be an array
    if (!Array.isArray(value)) {
      return i18n.t('validator.array', {
        field: extra.translatedPropertyName || extra.fieldName,
        value,
        ...extra,
        context: undefined,
      });
    }

    // No sub-rules means trivially valid
    if (subRules.length === 0 || value.length === 0) {
      return true;
    }

    const { multiple, single } = this.getErrorMessageSeparators(i18n);
    const failures: Array<{ index: number; message: string }> = [];

    for (let index = 0; index < value.length; index++) {
      const item = value[index];
      const res = await Validator.validateMultiRule<Context, RulesFunctions>(
        'AllOf',
        {
          value: item,
          ruleParams: subRules,
          startTime,
          ...extra,
        }
      );
      if (res !== true) {
        failures.push({ index, message: String(res) });
      }
    }

    if (failures.length === 0) return true;

    // Build list of failed item indices using i18n
    const failedIndices = failures.map((f) => f.index);
    const itemCount = failures.length;

    let itemList: string;
    const separator = i18n.t('validator.separators.multiple');

    if (itemCount <= 3) {
      itemList = failedIndices.join(separator);
    } else {
      const visibleIndices = failedIndices.slice(0, 3);
      const remainingCount = itemCount - 3;
      const moreText = i18n.t('validator.itemListOverflow', {
        count: remainingCount,
      });
      itemList = `${visibleIndices.join(separator)}${separator}${moreText}`;
    }

    const header = i18n.t('validator.arrayValidationFailed', {
      count: failures.length,
      itemCount,
      items: itemList,
      totalCount: value.length,
    });

    // Include detailed error messages for each failed item
    const details = failures
      .map((f) =>
        i18n.t('validator.arrayItemError', {
          index: f.index,
          message: f.message,
        })
      )
      .join(multiple);

    return `${header}${single}${details}`;
  }
  static getI18nTranslateOptions<Context = unknown>({
    fieldName,
    propertyName,
    fieldLabel,
    translatedPropertyName,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context,
    ...rest
  }: Partial<ValidatorOptions<ValidatorDefaultArray, Context>>) {
    fieldName = defaultStr(fieldName, propertyName);
    fieldLabel = defaultStr(fieldLabel, translatedPropertyName, fieldName);
    const r: Partial<ValidatorOptions<ValidatorDefaultArray, Context>> = {
      fieldLabel,
      translatedPropertyName: defaultStr(translatedPropertyName, fieldLabel),
      propertyName: defaultStr(propertyName, fieldName),
      fieldName,
    };
    /* if ('data' in rest && rest.data !== undefined) {
      r.data = rest.data;
    } */
    if ('value' in rest) {
      r.value = rest.value;
    }
    return r;
  }
  /**
   * ## Validate Nested Rule (Core Nested Validation Executor)
   *
   * Internal rule function that validates a nested object against a class constructor with
   * validation decorators. This method is the workhorse for nested class validation, delegating
   * to {@link validateClass} for the actual multi-field validation logic.
   *
   * ### Purpose
   * This method implements the core logic for the `ValidateNested` rule, enabling validation of
   * complex hierarchical object structures where a property value must itself be validated against
   * a decorated class schema. It acts as the bridge between single-value rule validation and
   * multi-field class-based validation.
   *
   * ### Validation Flow
   * 1. **Parameter Extraction**: Extracts the target class constructor from `ruleParams[0]`
   * 2. **Validation**: Calls `validateClass()` to validate the nested object against the class
   * 3. **Error Aggregation**: Collects nested validation errors with property path information
   * 4. **Result Formatting**: Returns either `true` (success) or error message string (failure)
   *
   * ### Error Handling Strategy
   * - **Missing Class Constructor**: Returns invalidRule error if no target class provided
   * - **Invalid Data Type**: Returns validateNested error if data is not an object
   * - **Nested Validation Failures**: Aggregates all nested field errors with property names in format:
   *   `"[propertyName]: error message; [propertyName]: error message"`
   * - **Successful Validation**: Returns `true` without modification
   *
   * ### Type Parameters
   * - `TClass` - Class constructor extending ClassConstructor with validation decorators
   * - `Context` - Optional validation context type passed through nested validations
   *
   * ### Return Values
   * - `true` - Nested object validation succeeded
   * - `string` - Validation failed; returns i18n-formatted error message with nested error details
   *
   * ### Usage Context
   * This method is primarily used as:
   * - The internal handler for the `validateNested` factory function
   * - A sub-rule within multi-rule validators (OneOf, AllOf)
   * - Direct validator for nested object properties in class-based validation
   *
   * ### Example
   * ```typescript
   * class Address {
   *   @IsRequired()
   *   @MinLength(5)
   *   street: string;
   *
   *   @IsRequired()
   *   @IsPostalCode
   *   postalCode: string;
   * }
   *
   * class User {
   *   @IsRequired()
   *   name: string;
   *
   *   @ValidateNested(Address)
   *   address: Address;
   * }
   *
   * // When validating a User instance with an Address property,
   * // validateNestedRule is called to validate the address against the Address class
   * const result = await Validator.validateClass(User, {
   * data : {
   *   name: "John",
   *   address: { street: "123 Main St", postalCode: "12345" }
   * }});
   * ```
   *
   * ### Key Features
   * - **DRY Principle**: Reuses existing `validateClass` logic to avoid code duplication
   * - **Error Context**: Preserves field hierarchy information in error messages
   * - **i18n Integration**: Uses translation system for localized error messages
   * - **Context Propagation**: Passes validation context through to nested validators
   * - **Timing Tracking**: Maintains duration tracking across nested validations
   *
   * @template TClass - Class constructor type (must extend ClassConstructor)
   * @template Context - Optional validation context type
   *
   * @param options - Validation rule function options (ValidatorNestedRuleFunctionOptions<TClass, Context>)
   * @param options.ruleParams - Array containing the nested class constructor at index [0]
   * @param options.value - The nested object value to validate (extracted to data property)
   * @param options.data - The nested object data to validate against the target class
   * @param options.context - Optional validation context passed to all validation rules
   * @param options.fieldName - Optional field identifier for error messages
   * @param options.propertyName - Optional property identifier for error messages
   * @param options.translatedPropertyName - Optional i18n property name for error messages
   * @param options.startTime - Optional timestamp for duration tracking
   * @param options.i18n - Optional i18n instance for error message translation
   *
   * @returns {ValidatorAsyncRuleResult}
   * - Resolves to `true` if nested object validation succeeds
   * - Resolves to error message string if validation fails
   * - Never rejects; all errors are returned as resolution values
   * - Error messages include nested field paths: `"[fieldName]: error; [fieldName]: error"`
   *
   * @throws {Never} This method never throws errors; all failures are returned as strings
   *
   * @remarks
   * - This is an internal method primarily used by the `validateNested` factory
   * - Accepts ValidatorNestedRuleFunctionOptions which omits validateClass's i18n parameter
   * - Delegates directly to validateClass(target, options) maintaining all context
   * - Nested validation errors include property names for clear error tracing
   * - The method integrates seamlessly with the multi-rule validation system
   * - Supports recursive nesting of arbitrarily deep object structures
   * - Performance: Delegates to validateClass which validates fields in parallel
   * - Error aggregation uses nested field paths for hierarchical clarity
   *
   *
   * @see {@link validateNested} - Factory function that creates rule functions using this method
   * @see {@link validateClass} - The underlying class-based validation method (accepts options with data)
   * @see {@link ValidateNested} - Decorator that uses this method via the factory
   * @see {@link ValidatorNestedRuleFunctionOptions} - Options interface for this method
   * @see {@link buildMultiRuleDecorator} - Decorator builder for complex multi-rule scenarios
   * @internal
   * @async
   */
  static async validateNestedRule<
    TClass extends ClassConstructor = ClassConstructor,
    Context = unknown,
  >({
    ruleParams,
    ...options
  }: ValidatorNestedRuleFunctionOptions<
    TClass,
    Context
  >): ValidatorAsyncRuleResult {
    let { startTime, value, ...extra } = options;
    startTime = isNumber(startTime) ? startTime : Date.now();
    const i18n = this.getI18n(extra);
    const ruleParamsArray = Array.isArray(ruleParams) ? ruleParams : [];
    const target = ruleParamsArray[0] as TClass | undefined;
    const translateProperties = {
      rule: 'ValidateNested',
      ...this.getI18nTranslateOptions(extra),
      startTime,
      value,
    };
    // Validate that a nested class was provided
    if (!target) {
      return i18n.t('validator.invalidRule', translateProperties);
    }

    // Validate value is an object
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      const receivedType = Array.isArray(value)
        ? 'array'
        : value === undefined
          ? 'undefined'
          : value === null
            ? 'null'
            : typeof value;
      return i18n.t('validator.validateNestedInvalidType', {
        ...translateProperties,
        receivedType: receivedType,
      });
    }

    //extra.data = extra.data ?? Object.assign({}, extra.data);

    // Delegate to validateClass for nested class validation
    const nestedResult = await this.validateClass<TClass, Context>(target, {
      ...options,
      data: value,
      parentData: extra.data,
      startTime,
    });

    // If validation succeeded, return true
    if (nestedResult.success) {
      return true;
    }
    const nestedErrors = this.translateNestedErrorResult(nestedResult, i18n);
    // Aggregate nested errors with field path information
    const nestedOptions = Object.assign({}, ruleParamsArray[1]);
    const message = defaultStr(nestedOptions.message);
    if (message) {
      if (i18n.has(message)) {
        return defaultStr(
          i18n.t(message, {
            ...translateProperties,
            nestedErrors,
          })
        );
      }
      return message;
    }
    return i18n.t('validator.validateNested', {
      nestedErrors,
      ...translateProperties,
    });
  }
  static translateNestedErrorResult(
    nestedErrorResult: ValidatorClassError,
    customI18n?: I18n
  ) {
    const nestedErrors = nestedErrorResult.errors || [];
    const i18n = this.getI18n({ i18n: customI18n });
    const nestedErrorConfig: Dictionary = Object.assign(
      { separator: '; ', prefix: '', suffix: '' },
      i18n.getNestedTranslation('validator.nestedErrors')
    ) as Dictionary;
    const separator = defaultStr(nestedErrorConfig.separator, '; ');
    const prefix = defaultStr(nestedErrorConfig.prefix, '');
    const suffix = defaultStr(nestedErrorConfig.suffix, '');

    return `${prefix}${nestedErrors
      .map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err: any) =>
          `[${err.translatedPropertyName ?? err.propertyName}]: ${err.message}`
      )
      .join(separator)}${suffix}`;
  }
  /**
   * ## Validate Multi-Rule (OneOf / AllOf)
   *
   * Evaluates multiple sub-rules against a single value using either OR logic (`OneOf`) or
   * AND logic (`AllOf`). Each sub-rule is validated in sequence via {@link Validator.validate},
   * with early exit on success for `OneOf` and full aggregation of errors for `AllOf`.
   *
   * ### Behavior
   * - `OneOf`: Returns `true` as soon as any sub-rule succeeds (early exit). If all sub-rules fail,
   *   returns a concatenated error message string summarizing each failure.
   * - `AllOf`: Requires every sub-rule to succeed. If any sub-rule fails, returns a concatenated
   *   error message string summarizing all failures; otherwise returns `true`.
   * - Empty `ruleParams`: If no sub-rules are provided, returns `true`.
   *
   * ### Execution Notes
   * - Sub-rules are evaluated sequentially (not in parallel) to allow early exit optimization for `OneOf`.
   * - Error messages from failed sub-rules are collected and joined using `; ` as a separator.
   * - Internationalization: Uses `i18n` (if provided) to prefix the aggregated error message
   *   with the localized rule label (`validator.OneOf` or `validator.AllOf`).
   * - Timing: Initializes `startTime` when absent to enable duration tracking downstream.
   *
   * @template Context - Optional type for the validation context object
   * @template RulesFunctions - Array type of sub-rules; each sub-rule can be a named rule,
   *   parameterized rule object, or a rule function
   *
   * @param ruleName - Multi-rule mode to apply: `"OneOf"` or `"AllOf"`
   * @param options - Validation options extending {@link ValidatorMultiRuleOptions}
   * @param options.value - The value to validate against the sub-rules
   * @param options.ruleParams - Array of sub-rules to evaluate (functions or named/object rules)
   * @param options.context - Optional context passed through to each sub-rule
   * @param options.data - Optional auxiliary data passed through to each sub-rule
   * @param options.startTime - Optional start timestamp used for duration tracking
   * @param options.fieldName - Optional field identifier used in error construction
   * @param options.propertyName - Optional property identifier used in error construction
   * @param options.translatedPropertyName - Optional localized property name for error messages
   * @param options.i18n - Optional i18n instance used to localize the error label
   *
   * @returns ValidatorRuleResult
   * - `true` when validation succeeds (any sub-rule for `OneOf`, all sub-rules for `AllOf`)
   * - `string` containing aggregated error messages when validation fails
   *
   * @example
   * // OneOf: either email or phone must be valid
   * const resultOneOf = await Validator.validateOneOfRule({
   *   value: "user@example.com",
   *   ruleParams: ["Email", "PhoneNumber"],
   * });
   * // resultOneOf === true
   *
   * @example
   * // AllOf: must be a string and minimum length 5
   * const resultAllOf = await Validator.validateAllOfRule({
   *   value: "hello",
   *   ruleParams: ["String", { MinLength: [5] }],
   * });
   * // resultAllOf === true
   *
   *
   * @see {@link validateOneOfRule} - Convenience wrapper applying `OneOf` logic
   * @see {@link validateAllOfRule} - Convenience wrapper applying `AllOf` logic
   * @see {@link oneOf} - Factory to build a reusable `OneOf` rule function
   * @see {@link allOf} - Factory to build a reusable `AllOf` rule function
   * @see {@link validate} - Underlying validator used for each sub-rule
   * @public
   * @async
   */
  static async validateMultiRule<
    Context = unknown,
    RulesFunctions extends ValidatorDefaultMultiRule<Context> =
      ValidatorDefaultMultiRule<Context>,
  >(
    ruleName: ValidatorMultiRuleNames,
    {
      value,
      ruleParams,
      startTime,
      ...extra
    }: ValidatorMultiRuleOptions<Context, RulesFunctions>
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    startTime = isNumber(startTime) ? startTime : Date.now();
    // Special handling for OneOf: validate against each sub-rule in parallel
    const subRules = (
      Array.isArray(ruleParams) ? ruleParams : []
    ) as RulesFunctions;
    const i18n = this.getI18n(extra);
    const isAllOfRule = ruleName === 'AllOf';
    if (subRules.length === 0) {
      return true;
    }
    const errors: string[] = [];
    const allErrors: ValidatorError[] = [];
    let firstSuccess: ValidatorSuccess<Context> | null = null;
    for (const subRule of subRules) {
      const res = await Validator.validate<Context>({
        value,
        ...extra,
        rules: [subRule],
        i18n,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      //console.log(res, " is rest about validating ", value, "and rule name ", subRule);
      if (res.success) {
        if (!isAllOfRule) return true; // OneOf: first hit wins
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        firstSuccess ??= res as any; // AllOf: keep first success
      } else {
        allErrors.push(res);
        if (isNonNullString(res.message)) {
          errors.push(res.message);
        }
      }
    }
    if (!isAllOfRule && firstSuccess) {
      return true;
    }
    if (allErrors.length === 0) return true;
    return i18n.t(`validator.${lowerFirst(ruleName)}`, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...this.getI18nTranslateOptions(extra as any),
      value,
      ruleName,
      rules: [ruleName],
      rule: ruleName,
      ruleParams: [],
      failedRulesErrors: errors.join('; '),
    });
  }
  /**
   * ## Create OneOf Validation Rule
   *
   * Factory method that creates a OneOf validation rule function. This method provides
   * a programmatic way to create validation rules that implement OR logic, where
   * validation succeeds if at least one of the specified sub-rules passes.
   *
   * ### OneOf Validation Concept
   * OneOf validation allows flexible validation scenarios where multiple validation
   * paths are acceptable. Instead of requiring all rules to pass (AND logic),
   * OneOf requires only one rule to pass (OR logic), making it ideal for:
   * - Alternative input formats (email OR phone number)
   * - Flexible validation requirements
   * - Multiple acceptable validation criteria
   *
   * ### Method Behavior
   * This factory method returns a validation rule function that can be used directly
   * in validation calls or registered as a named rule. The returned function delegates
   * to `validateOneOfRule` for the actual validation logic.
   *
   * ### Parallel Execution
   * When the returned rule function is executed, all sub-rules are validated in parallel
   * using `Promise.all()` for optimal performance. The method returns immediately upon
   * the first successful validation, avoiding unnecessary processing of remaining rules.
   *
   * ### Error Aggregation
   * When all sub-rules fail, error messages are collected and joined with semicolons
   * to provide comprehensive feedback about all validation failures.
   *
   * ### Examples
   *
   * #### Basic OneOf Rule Creation
   * ```typescript
   * // Create a OneOf rule that accepts either email or phone number
   * const contactRule = Validator.oneOf(['Email', 'PhoneNumber']);
   *
   * // Use the rule directly
   * const result = await contactRule({
   *   value: 'user@example.com',
   *   ruleParams: ['Email', 'PhoneNumber'],
   *   fieldName: 'contact'
   * });
   *
   * if (result === true) {
   *   console.log('Contact validation passed');
   * } else {
   *   console.log('Contact validation failed:', result);
   * }
   * ```
   *
   * #### Complex OneOf with Mixed Rule Types
   * ```typescript
   * // Create a rule that accepts UUID, custom format, or admin format
   * const identifierRule = Validator.oneOf([
   *   'UUID',                                    // Built-in UUID validation
   *   { MinLength: [5] },                       // Object rule with parameters
   *   ({ value }) => value.startsWith('ADMIN-') // Custom function rule
   * ]);
   *
   * const result = await identifierRule({
   *   value: '550e8400-e29b-41d4-a716-446655440000',
   *   ruleParams: ['UUID', { MinLength: [5] }, ({ value }) => value.startsWith('ADMIN-')],
   *   fieldName: 'identifier'
   * });
   * ```
   *
   * #### Registering as Named Rule
   * ```typescript
   * // Create and register a reusable OneOf rule
   * const contactValidator = Validator.oneOf(['Email', 'PhoneNumber']);
   * Validator.registerRule('Contact', contactValidator);
   *
   * // Now use it in validation
   * const result = await Validator.validate({
   *   value: '+1234567890',
   *   rules: ['Contact']
   * });
   * ```
   *
   * #### Context-Aware OneOf Rules
   * ```typescript
   * interface UserContext {
   *   userType: 'admin' | 'user';
   *   permissions: string[];
   * }
   *
   * const flexibleIdRule = Validator.oneOf<UserContext>([
   *   'UUID',
   *   ({ value, context }) => {
   *     if (context?.userType === 'admin') {
   *       return value.startsWith('ADMIN-') || 'Admin IDs must start with ADMIN-';
   *     }
   *     return false; // Skip for non-admins
   *   }
   * ]);
   *
   * const result = await flexibleIdRule({
   *   value: 'ADMIN-12345',
   *   ruleParams: ['UUID', 'customValidationFunction'],
   *   context: { userType: 'admin', permissions: ['manage'] },
   *   fieldName: 'identifier'
   * });
   * ```
   *
   * #### Error Aggregation Example
   * ```typescript
   * // When all rules fail, errors are aggregated
   * const strictRule = Validator.oneOf(['Email', 'PhoneNumber', { MinLength: [10] }]);
   *
   * const result = await strictRule({
   *   value: 'invalid',  // Fails all rules
   *   ruleParams: ['Email', 'PhoneNumber', { MinLength: [10] }],
   *   fieldName: 'contact'
   * });
   *
   * // result will be: "Invalid email format; Invalid phone number; Must be at least 10 characters"
   * ```
   *
   * ### Performance Characteristics
   * - **Parallel Execution**: All rules execute simultaneously
   * - **Early Success**: Returns immediately on first success
   * - **Full Error Collection**: Waits for all failures before rejecting
   * - **Memory Efficient**: No unnecessary rule processing after success
   *
   * ### Internationalization Support
   * Error messages are automatically translated using the provided i18n instance.
   * Custom error messages can be provided through rule functions.
   *
   * @template Context - Type of the validation context object passed to rules
   * @template RulesFunctions - Array type defining the structure of validation rules
   *
   * @param ruleParams - Array of sub-rules to validate against (required)
   *                     Can include strings, objects, or functions
   *
   * @returns Validation rule function that implements OneOf logic
   *          Returns `true` if validation passes, error message string if fails
   *
   * @throws {string} Aggregated error messages when all sub-rules fail
   *
   * @remarks
   * - Rules are executed in parallel for optimal performance
   * - Method returns immediately upon first successful validation
   * - Error messages from failed rules are joined with semicolons
   * - Empty ruleParams array results in immediate failure
   * - Supports both built-in rules and custom validation functions
   * - Context is passed through to all sub-rule validations
   *
   *
   * @see {@link validateOneOfRule} - The underlying validation method
   * @see {@link buildMultiRuleDecorator} - Creates decorators using this method
   * @see {@link registerRule} - Register the returned function as a named rule
   * @public
   */
  static oneOf<Context = unknown>(
    ruleParams: ValidatorDefaultMultiRule<Context>
  ): ValidatorRuleFunction<ValidatorDefaultArray, Context> {
    return function OneOf(options) {
      return Validator.validateOneOfRule<
        Context,
        ValidatorDefaultMultiRule<Context>
      >({
        ...(options as unknown as ValidatorMultiRuleOptions<
          Context,
          ValidatorDefaultMultiRule<Context>
        >),
        ruleParams,
      });
    };
  }
  /**
   * ## Create AllOf Validation Rule
   *
   * Factory that returns a rule function implementing AND logic across multiple
   * sub-rules. The returned function delegates to {@link validateAllOfRule} and
   * succeeds only when every sub-rule passes; otherwise it returns a single
   * aggregated error string (messages joined with `; `).
   *
   * @template Context - Optional type for validation context
   * @template RulesFunctions - Array of sub-rules to combine
   * @param ruleParams - Array of sub-rules evaluated with AND logic
   * @returns `ValidatorRuleFunction` to use in `Validator.validate` or decorators
   * @example
   * const strongStringRule = Validator.allOf(["String", { MinLength: [5] }]);
   * const res = await strongStringRule({ value: "hello" });
   * // res === true
   *
   * @see {@link validateAllOfRule}
   * @see {@link buildMultiRuleDecorator}
   * @see {@link registerRule}
   * @public
   */
  static allOf<Context = unknown>(
    ruleParams: ValidatorDefaultMultiRule<Context>
  ): ValidatorRuleFunction<ValidatorDefaultArray, Context> {
    return function AllOf(
      options: ValidatorOptions<ValidatorDefaultArray, Context>
    ) {
      return Validator.validateAllOfRule<
        Context,
        ValidatorDefaultMultiRule<Context>
      >({
        ...(options as unknown as ValidatorMultiRuleOptions<
          Context,
          ValidatorDefaultMultiRule<Context>
        >),
        ruleParams,
      });
    };
  }

  /**
   * ## Create ArrayOf Validation Rule
   *
   * Factory that returns a rule function applying AND logic across provided sub-rules
   * to every item of an array value. Delegates to {@link validateArrayOfRule}.
   *
   * @template Context - Optional type for validation context
   * @template RulesFunctions - Array of sub-rules applied to each item
   * @param ruleParams - Sub-rules to apply to each array item
   * @returns `ValidatorRuleFunction` usable in `Validator.validate` or decorators
   * @example
   * const emails = Validator.arrayOf(["Email"]);
   * const res = await emails({ value: ["a@b.com", "c@d.com"] }); // true
   *
   */
  static arrayOf<Context = unknown>(
    ruleParams: ValidatorDefaultMultiRule<Context>
  ): ValidatorRuleFunction<ValidatorDefaultArray, Context> {
    return function ArrayOf(
      options: ValidatorOptions<ValidatorDefaultArray, Context>
    ) {
      return Validator.validateArrayOfRule<
        Context,
        ValidatorDefaultMultiRule<Context>
      >({
        ...(options as unknown as ValidatorMultiRuleOptions<
          Context,
          ValidatorDefaultMultiRule<Context>
        >),
        ruleParams,
      });
    };
  }

  /**
   * ## Create Nested Validation Rule Factory
   *
   * Factory function that creates a validation rule function for validating nested objects
   * against a decorated class schema. This method follows the factory pattern established by
   * {@link oneOf}, {@link allOf}, and {@link arrayOf} for consistency across complex validation rules.
   *
   * ### Purpose
   * The `validateNested` factory enables validation of hierarchical data structures by creating
   * a reusable rule function that validates object properties against class-based validation schemas.
   * It bridges the gap between single-value rules and multi-field class validation.
   *
   * ### How It Works
   * 1. **Factory Invocation**: Called with a class constructor `[target]` parameter
   * 2. **Returns Rule Function**: Returns a rule function that validates nested objects
   * 3. **Rule Execution**: When the rule is executed, it delegates to `validateNestedRule`
   * 4. **Result**: Returns `true` on success or error message string on failure
   *
   * ### Factory Pattern Consistency
   * Like `oneOf`, `allOf`, and `arrayOf`, this factory:
   * - Accepts rule parameters during factory creation
   * - Returns an `ValidatorRuleFunction` for use in validators
   * - Supports generic typing for Context
   * - Follows the nested function closure pattern
   * - Can be registered as a named rule via `Validator.registerRule()`
   *
   * ### Key Characteristics
   * - **Lazy Evaluation**: Rule parameters are captured at factory creation time
   * - **Composability**: Can be combined with other rules using OneOf, AllOf, ArrayOf
   * - **Type Safety**: Full TypeScript support with generic TClass class type
   * - **Contextual Validation**: Supports optional validation context propagation
   * - **i18n Support**: Automatically uses i18n system for error messages
   *
   * ### Usage Patterns
   *
   * #### Direct Factory Usage
   * ```typescript
   * class Address {
   *   @IsRequired()
   *   street: string;
   *
   *   @IsRequired()
   *   postalCode: string;
   * }
   *
   * class UserForm {
   *   @IsRequired()
   *   @IsEmail()
   *   email: string;
   *
   *   @ValidateNested(Address)
   *   address: Address;
   * }
   *
   * // Validator.validateNested is called internally by the @ValidateNested decorator
   * ```
   *
   * #### Programmatic Rule Creation
   * ```typescript
   * const nestedAddressRule = Validator.validateNested([Address]);
   *
   * const result = await nestedAddressRule({
   *   data: { street: "123 Main St", postalCode: "12345" },
   *   fieldName: "address"
   * });
   * ```
   *
   * #### Registration as Named Rule
   * ```typescript
   * const addressValidator = Validator.validateNested([Address]);
   * Validator.registerRule('AddressValidator', addressValidator);
   *
   * // Now can be used by name in validation rules
   * class User {
   *   @ValidateNested(Address)
   *   address: Address;
   * }
   * ```
   *
   * #### Composition with MultiRule Validators
   * ```typescript
   * // Using ValidateNested within OneOf (e.g., either Address or simplified Location)
   * class Location {
   *   @IsRequired()
   *   coordinates: string; // e.g., "40.7128,-74.0060"
   * }
   *
   * const addressOrLocation = Validator.oneOf([
   *   Validator.validateNested(Address),
   *   Validator.validateNested(Location)
   * ]);
   * ```
   *
   * #### Nested Validation with Context
   * ```typescript
   * interface UserContext {
   *   userId: number;
   *   isAdmin: boolean;
   * }
   *
   * class AdminProfile {
   *   @IsRequired()
   *   role: string;
   *
   *   @IsRequired()
   *   permissions: string[];
   * }
   *
   * // When context is provided during validation
   * const result = await Validator.validateClass(User, {
   *  data: userData,
   *   context: { userId: 1, isAdmin: true }
   * });
   * ```
   *
   * ### Type Parameters
   * - `TClass` - Class constructor type (extends ClassConstructor) that the nested object must satisfy
   * - `Context` - Optional validation context type passed through nested validations
   *
   * ### Parameters
   * @param TClass - The nested class constructor.
   *                     Must be a class decorated with validation rules.
   *
   * ### Returns
   * `ValidatorRuleFunction<[target: TClass], Context>` - A rule function that:
   * - Accepts validation options with nested object data (ValidatorOptions)
   * - Delegates to `validateNestedRule` for actual validation
   * - Returns `true` on successful nested object validation
   * - Returns error message string if any nested field validation fails
   * - Propagates context and i18n through nested validations
   *
   * ### Implementation Details
   * The returned rule function:
   * 1. Extracts the data property from validation options
   * 2. Creates a shallow copy of the data using `Object.assign`
   * 3. Calls `validateNestedRule` with the combined parameters
   * 4. Properly types the data as `ValidatorClassInput<TClass>`
   * 5. Delegates to validateClass via validateNestedRule which expects options.data
   *
   * ### Error Message Format
   * When nested validation fails, error messages include field-level details:
   * ```
   * "Validation failed: [fieldName]: error message; [fieldName]: error message"
   * ```
   *
   * ### Performance Characteristics
   * - **Lazy Evaluation**: Parameters are captured but not executed until rule runs
   * - **Efficient Nesting**: Reuses validateClass's parallel field validation
   * - **Memory Efficient**: Shallow copy of data prevents unnecessary object duplication
   * - **Async Optimized**: Properly awaits nested async validation rules
   *
   * ### Internationalization
   * - Error messages are automatically localized using the i18n system
   * - Supports translation keys: `validator.validateNested`, `validator.invalidRule`
   * - Property names can be translated based on i18n configuration
   *
   * ### Integration with Decorator System
   * This factory is the foundation for the `@ValidateNested` decorator:
   * ```typescript
   * const ValidateNested = buildMultiRuleDecorator(function ValidateNested(options) {
   *   return { validateNested: Validator.validateNested(options.nested) };
   * });
   * ```
   *
   * @template TClass - Class constructor for the nested object schema
   * @template Context - Optional context type for validations
   *
   * @param ruleParams - Tuple `[target]` where target is the class constructor
   *
   * @returns ValidatorRuleFunction - Rule function for nested object validation
   *          - Accepts options with nested object data
   *          - Returns true on success, error string on failure
   *          - Supports context propagation
   *          - Integrates with validation pipeline
   *
   * @throws {Never} The returned rule function never throws; errors are returned as strings
   *
   * @remarks
   * - This factory closely parallels the `oneOf`, `allOf`, and `arrayOf` factory pattern
   * - The class constructor in ruleParams must have validation decorators
   * - Nested validation errors include property names for traceability
   * - Supports recursive nesting (nested class can have ValidateNested properties)
   * - Data is shallow-copied to prevent external modifications
   * - Fully compatible with TypeScript's strict type checking
   *
   * @example
   * ```typescript
   * // Simple nested validation
   * class Contact {
   *   @IsRequired() @IsEmail() email: string;
   *   @IsRequired() @IsPhoneNumber phone: string;
   * }
   *
   * class Person {
   *   @IsRequired() @MinLength(2) name: string;
   *   @ValidateNested([Contact]) contact: Contact;
   * }
   *
   * const person = {
   *   name: "Alice",
   *   contact: {
   *     email: "alice@example.com",
   *     phone: "+1234567890"
   *   }
   * };
   *
   * const result = await Validator.validateClass(Person, {data:person});
   * if (result.success) {
   *   console.log("Valid person with contact", result.data);
   * } else {
   *   console.error("Validation errors", result.errors);
   * }
   * ```
   *
   *
   * @see {@link validateNestedRule} - The underlying validation executor that delegates to validateClass
   * @see {@link ValidateNested} - Decorator using this factory
   * @see {@link validateClass} - Multi-field class validation (signature: validateClass<T, Context>(target, options))
   * @see {@link ValidatorOptions} - Validation options interface for rule functions
   * @see {@link ValidatorClassOptions} - TClass validation options interface
   * @see {@link oneOf} - Similar factory for OneOf rule creation
   * @see {@link allOf} - Similar factory for AllOf rule creation
   * @see {@link arrayOf} - Similar factory for ArrayOf rule creation
   * @see {@link buildMultiRuleDecorator} - Decorator builder for complex rules
   * @public
   */
  static validateNested<
    TClass extends ClassConstructor<unknown> = ClassConstructor<unknown>,
    Context = unknown,
  >(target: TClass): ValidatorRuleFunction<Array<unknown>, Context> {
    return function ValidateNested(
      options: ValidatorOptions<Array<unknown>, Context>
    ) {
      return Validator.validateNestedRule<TClass, Context>({
        ...options,
        ruleParams: [target],
      });
    };
  }

  static async validateClass<
    TClass extends ClassConstructor = ClassConstructor,
    Context = unknown,
  >(
    target: TClass,
    options: Omit<
      ValidatorClassOptions<TClass, Context>,
      'i18n' | 'ruleParams'
    > & {
      i18n?: I18n;
    }
  ): Promise<ValidatorClassResult<TClass, Context>> {
    const startTime = Date.now();
    const targetRules = Validator.getClassRules<TClass>(target);
    const { context, errorMessageBuilder, ...restOptions } = Object.assign(
      {},
      Validator.getValidatorClassOptions(target),
      options
    );
    const data = Object.assign({}, options.data);
    const i18n = this.getI18n(options);
    const messageSeparators = Validator.getErrorMessageSeparators(i18n);
    const buildErrorMessage =
      typeof errorMessageBuilder === 'function'
        ? errorMessageBuilder
        : (translatedPropertyName: string, error: string) =>
            `[${String(translatedPropertyName)}] : ${error}`;

    const validationErrors: ValidatorClassItemError[] = [];
    const fieldErrors: Partial<Record<string, string>> = {};
    const validationPromises: Promise<ValidatorResult<Context>>[] = [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let validatedFieldCount = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const translatedPropertyNames = i18n.translateClass(target as any, {
      data,
    });
    for (const propertyKey in targetRules) {
      const rules = targetRules[propertyKey];
      const { sanitizedRules } = this.parseAndValidateRules(rules);
      const value = data[propertyKey as keyof typeof data];
      // Skip validation for Optional fields that are not present in data
      if (this.shouldSkipValidation({ value, rules: sanitizedRules })) {
        continue;
      }
      const translatedPropertyName: string = defaultStr(
        translatedPropertyNames[propertyKey],
        propertyKey
      );
      validationPromises.push(
        Validator.validate<Context>({
          context,
          ...restOptions,
          i18n,
          value,
          data,
          translatedPropertyName,
          fieldName: propertyKey,
          propertyName: propertyKey,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rules: sanitizedRules as any,
          fieldLabel: translatedPropertyName,
        }).then((validationResult) => {
          if (validationResult.success) {
            validatedFieldCount++;
          } else {
            const errorMessage = defaultStr(validationResult.message);
            const error = Validator.createError(errorMessage, {
              propertyName: propertyKey,
              translatedPropertyName: translatedPropertyName,
              ruleParams: [],
              ruleName: 'validateClass',
              startTime,
              value,
            });

            const formattedMessage = buildErrorMessage(
              translatedPropertyName,
              errorMessage,
              {
                ...error,
                propertyName: String(propertyKey),
                separators: messageSeparators,
                data,
                translatedPropertyName: translatedPropertyName,
                i18n,
                cause: validationResult,
              }
            );
            fieldErrors[propertyKey] = formattedMessage;
            validationErrors.push({
              ...error,
              cause: validationResult,
            });
          }
          return validationResult;
        })
      );
    }

    return new Promise<ValidatorClassResult<TClass, Context>>((resolve) => {
      return Promise.all(validationPromises).then(() => {
        const isValidationSuccessful = !validationErrors.length;
        if (isValidationSuccessful) {
          resolve({
            ...createSuccessResult<Context>(
              {
                data,
                value: undefined,
                context,
              },
              startTime
            ),
            message: undefined,
            status: 'success',

            data: data,
          });
        } else {
          // Get the list of failed fields with their translated names
          const failedFieldsMap = new Map<string, string>();

          validationErrors.forEach((error) => {
            const displayName =
              error.translatedPropertyName ||
              error.fieldName ||
              error.propertyName ||
              'unknown';
            failedFieldsMap.set(
              error.propertyName || error.fieldName || 'unknown',
              displayName
            );
          });

          const failedFields = Array.from(failedFieldsMap.values());
          const fieldCount = failedFields.length;

          // Build field list using i18n for separators and overflow text
          let fieldList: string;
          const separator = i18n.t('validator.separators.multiple');

          if (fieldCount <= 3) {
            fieldList = failedFields.join(separator);
          } else {
            const visibleFields = failedFields.slice(0, 3);
            const remainingCount = fieldCount - 3;
            const moreText = i18n.t('validator.fieldListOverflow', {
              count: remainingCount,
            });
            fieldList = `${visibleFields.join(separator)}${separator}${moreText}`;
          }

          const message = i18n.translate('validator.classValidationFailed', {
            count: validationErrors.length,
            fieldCount,
            fields: fieldList,
          });

          resolve(
            Validator.createClassError(message, {
              startTime,
              errors: validationErrors,
              fieldErrors,
              failureCount: validationErrors.length,
              duration: Date.now() - startTime,
              data,
            })
          );
        }
      });
    });
  }

  /**
   * ## Validate Object
   *
   * Validates a plain object against a set of rules without requiring a class definition.
   * This provides a functional alternative to class-based validation, similar to libraries like Zod.
   *
   * @template T - The type of data to validate
   * @template Context - Optional validation context type
   *
   * @param data - The data object to validate
   * @param rules - A map where keys are property names and values are rule definitions
   * @param options - Optional validation configuration
   * @returns Promise resolving to a structured validation result
   *
   * @example
   * ```typescript
   * const result = await Validator.validateObject(
   *   { name: 'John', age: 25 },
   *   { name: ['Required'], age: ['Required', 'Number'] }
   * );
   * ```
   *
   * @public
   */
  static async validateObject<T extends object, Context = unknown>(
    data: T,
    rules: ValidatorObjectRules<T>,
    options?: Omit<ValidatorObjectOptions<ClassConstructor, Context>, 'data'>
  ): Promise<ValidatorObjectResult<T, Context>> {
    const schema = {};
    Reflect.defineMetadata(VALIDATOR_TARGET_RULES_METADATA_KEY, rules, schema);
    const r = await this.validateClass<ClassConstructor, Context>(
      schema as ClassConstructor,
      {
        ...options,
        data,
      } as ValidatorObjectOptions<T, Context>
    );
    return {
      ...r,
      data,
    };
  }

  /**
   * ## Create Object Schema
   *
   * Factory method that creates a reusable object schema for validation.
   * This enables a Zod-like validation pattern: `const schema = Validator.object({...}); schema.validate(data);`
   *
   * @template T - The type of data to validate
   * @template Context - Optional validation context type
   *
   * @param rules - A map where keys are property names and values are rule definitions
   * @returns A `ValidatorObjectSchema` instance
   *
   * @example
   * ```typescript
   * const UserSchema = Validator.object({
   *   email: ['Required', 'Email'],
   *   age: ['NumberGTE[18]']
   * });
   *
   * const result = await UserSchema.validate({ email: 'test@example.com', age: 20 });
   * ```
   *
   * @public
   */
  static object<T extends object, Context = unknown>(
    rules: Record<keyof T | string, ValidatorRules>
  ): ValidatorObjectSchema<T, Context> {
    const schemaTarget = {};
    Reflect.defineMetadata(
      VALIDATOR_TARGET_RULES_METADATA_KEY,
      rules,
      schemaTarget
    );

    return {
      schema: schemaTarget,
      validate: (data: T, options?: ValidatorObjectOptions<T, Context>) =>
        this.validateObject(data, rules, options),
    } as ValidatorObjectSchema<T, Context>;
  }

  /**
   * ## Validate Bulk
   *
   * Validates an array of class instances in a single batch operation, providing detailed
   * feedback on which items passed or failed validation. This method is optimized for
   * bulk data processing scenarios like CSV imports, batch API requests, or mass data migrations.
   *
   * ### Purpose
   * Enables efficient validation of multiple data items against a class schema, with:
   * - **Parallel validation**: All items are validated concurrently for performance
   * - **Detailed failure tracking**: Each failed item includes its index and specific errors
   * - **Contextual error messages**: Different messages for partial vs complete failures
   * - **Type-safe results**: Discriminated union for success/failure handling
   *
   * ### Validation Behavior
   * - **All items pass**: Returns {@link ValidatorBulkSuccess} with validated data array
   * - **Some items fail**: Returns {@link ValidatorBulkError} with failure details
   * - **All items fail**: Returns {@link ValidatorBulkError} with specialized message
   * - **Invalid input**: Returns {@link ValidatorBulkError} if data is not an array
   *
   * ### Performance Characteristics
   * - **Concurrent validation**: Uses `Promise.all()` for parallel processing
   * - **Memory efficient**: Collects only failures, not all results
   * - **Early validation**: Input type checking before processing
   * - **Optimized for large datasets**: Suitable for thousands of items
   *
   * @template TClass - The class constructor type to validate against
   * @template Context - Optional context type for validation rules
   *
   * @param target - The class constructor containing validation decorators
   * @param options - Bulk validation options
   * @param options.data - Array of data objects to validate
   * @param options.startTime - Optional start timestamp (defaults to Date.now())
   * @param options.context - Optional context passed to validation rules
   * @param options.i18n - Optional i18n instance for custom translations
   *
   * @returns Promise resolving to {@link ValidatorBulkResult}
   *
   * @throws Never throws - Always returns a result object (success or error)
   *
   * @example
   * ```typescript
   * // Basic usage - User registration batch
   * class User {
   *   @IsRequired()
   *   @IsEmail()
   *   email: string;
   *
   *   @IsRequired()
   *   @MinLength(3)
   *   name: string;
   *
   *   @IsOptional()
   *   @NumberGTE(18)
   *   age?: number;
   * }
   *
   * const users = [
   *   { email: 'alice@example.com', name: 'Alice', age: 25 },
   *   { email: 'invalid-email', name: 'Bob', age: 30 },
   *   { email: 'charlie@example.com', name: 'C', age: 17 }, // Too short, too young
   * ];
   *
   * const result = await Validator.validateBulk(User, { data: users });
   *
   * if (result.success) {
   *   console.log(`All ${result.data.length} users are valid`);
   *   // Process valid users
   *   await db.users.insertMany(result.data);
   * } else {
   *   console.error(result.message);
   *   // "Bulk validation failed: 2 of 3 items failed"
   *
   *   result.failures.forEach(failure => {
   *     console.log(`Item ${failure.index}:`, failure.errors);
   *     // Item 2: [{ field: 'email', message: '...' }]
   *     // Item 3: [{ field: 'name', message: '...' }, { field: 'age', message: '...' }]
   *   });
   * }
   * ```
   *
   * @example
   * ```typescript
   * // CSV Import with context
   * class Product {
   *   @IsRequired()
   *   name: string;
   *
   *   @IsNumber()
   *   @NumberGTE(0)
   *   price: number;
   *
   *   @IsRequired()
   *   @CustomRule((value, { context }) => {
   *     // Validate against organization's catalog
   *     return context.catalog.includes(value) || 'Invalid category';
   *   })
   *   category: string;
   * }
   *
   * interface ValidationContext {
   *   catalog: string[];
   *   organizationId: string;
   * }
   *
   * const csvData = [
   *   { name: 'Widget', price: 10, category: 'Tools' },
   *   { name: 'Gadget', price: -5, category: 'Electronics' }, // Invalid price
   * ];
   *
   * const result = await Validator.validateBulk<typeof Product, ValidationContext>(
   *   Product,
   *   {
   *     data: csvData,
   *     context: {
   *       catalog: ['Tools', 'Electronics', 'Home'],
   *       organizationId: 'org-123'
   *     }
   *   }
   * );
   * ```
   *
   * @example
   * ```typescript
   * // API endpoint - Batch user creation
   * app.post('/api/users/batch', async (req, res) => {
   *   const result = await Validator.validateBulk(User, {
   *     data: req.body.users
   *   });
   *
   *   if (result.success) {
   *     const created = await db.users.insertMany(result.data);
   *     res.json({
   *       success: true,
   *       count: created.length,
   *       message: `Successfully created ${created.length} users`
   *     });
   *   } else {
   *     res.status(400).json({
   *       success: false,
   *       message: result.message,
   *       failureCount: result.failureCount,
   *       totalCount: result.totalCount,
   *       failures: result.failures.map(f => ({
   *         index: f.index,
   *         errors: f.errors.map(e => ({
   *           field: e.field,
   *           message: e.message
   *         }))
   *       }))
   *     });
   *   }
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Error handling patterns
   * const result = await Validator.validateBulk(User, { data: users });
   *
   * // Pattern 1: Type narrowing with if/else
   * if (result.success) {
   *   // TypeScript knows: result is ValidatorBulkSuccess
   *   result.data.forEach(user => processUser(user));
   * } else {
   *   // TypeScript knows: result is ValidatorBulkError
   *   logErrors(result.failures);
   * }
   *
   * // Pattern 2: Using type guards
   * if (Validator.isSuccess(result)) {
   *   return result.data;
   * }
   *
   * // Pattern 3: Extracting valid items
   * const validIndices = new Set(
   *   result.success ?
   *     result.data.map((_, i) => i) :
   *     users.map((_, i) => i).filter(i =>
   *       !result.failures.some(f => f.index === i + 1)
   *     )
   * );
   * ```
   *
   * @example
   * ```typescript
   * // Handling different failure scenarios
   * const result = await Validator.validateBulk(User, { data: users });
   *
   * if (!result.success) {
   *   const { failureCount, totalCount } = result;
   *
   *   if (failureCount === totalCount) {
   *     // All items failed
   *     console.error('Complete validation failure');
   *     // Message: "All 10 items failed validation"
   *   } else if (failureCount === 1) {
   *     // Single item failed
   *     console.warn('One item failed validation');
   *     // Message: "Bulk validation failed: 1 of 10 items failed"
   *   } else {
   *     // Partial failure
   *     const successRate = ((totalCount - failureCount) / totalCount * 100).toFixed(1);
   *     console.warn(`${successRate}% success rate`);
   *     // Message: "Bulk validation failed: 3 of 10 items failed"
   *   }
   * }
   * ```
   *
   * ### Common Use Cases
   * - **CSV/Excel imports**: Validate uploaded file data before insertion
   * - **Batch API endpoints**: Validate multiple items in a single request
   * - **Data migrations**: Validate data before moving between systems
   * - **Form arrays**: Validate dynamic form fields (e.g., multiple addresses)
   * - **Bulk updates**: Validate changes before applying to database
   *
   * ### Error Message Localization
   * The method uses contextual i18n keys for different scenarios:
   * - `validator.invalidBulkData`: When input is not an array
   * - `validator.bulkValidationFailed`: When some items fail (with pluralization)
   * - `validator.bulkValidationAllFailed`: When all items fail (with pluralization)
   *
   * ### Performance Tips
   * - **Large datasets**: Consider chunking (e.g., 1000 items per batch)
   * - **Complex validations**: Use context to cache expensive lookups
   * - **Memory constraints**: Process results incrementally, don't accumulate all
   * - **Progress tracking**: Wrap in a progress indicator for user feedback
   *
   * @see {@link ValidatorBulkResult} - Return type documentation
   * @see {@link ValidatorBulkSuccess} - Success result structure
   * @see {@link ValidatorBulkError} - Error result structure
   * @see {@link ValidatorBulkOptions} - Options interface
   * @see {@link validateClass} - Single-item validation method
   * @public
   * @since 1.2.0
   */
  static async validateBulk<
    TClass extends ClassConstructor = ClassConstructor,
    Context = unknown,
  >(
    target: TClass,
    { data, startTime, ...options }: ValidatorBulkOptions<TClass, Context>
  ): Promise<ValidatorBulkResult<TClass, Context>> {
    const i18n = this.getI18n(options);
    startTime = isNumber(startTime) ? startTime : Date.now();
    const failures: ValidatorBulkErrorItem<TClass>[] = [];
    if (!Array.isArray(data)) {
      return this.createBulkError<TClass>(i18n.t('validator.invalidBulkData'), {
        startTime,
        failures,
        totalCount: 0,
      });
    }
    const promises = data.map(async (item, index) => {
      const result = await Validator.validateClass<TClass, Context>(target, {
        ...options,
        data: item,
        startTime,
      });
      if (result.success !== true) {
        failures.push({ ...result, index: index + 1 });
      }
      return result;
    });

    await Promise.all(promises);

    if (failures.length > 0) {
      const failureCount = failures.length;
      const totalCount = data.length;

      // Choose appropriate message based on failure ratio
      const messageKey =
        failureCount === totalCount
          ? 'validator.bulkValidationAllFailed'
          : 'validator.bulkValidationFailed';

      return Validator.createBulkError(
        i18n.t(messageKey, {
          count: failureCount, // Used for pluralization (one/other)
          failureCount,
          totalCount,
        }),
        {
          failures,
          startTime,
          totalCount,
        }
      );
    }
    return {
      name: 'ValidatorSuccessResult',
      duration: Date.now() - startTime,
      validatedAt: new Date(),
      data,
      status: 'success',
      success: true,
    };
  }

  /**
   * ## Extract Validation Rules from Class
   *
   * Retrieves all validation rules that have been applied to a class through property
   * decorators. This method introspects the class metadata to extract the complete
   * validation schema defined by decorators.
   *
   * ### Metadata Introspection
   * This method uses reflection to access metadata that was stored when validation
   * decorators were applied to class properties. It provides a programmatic way to
   * inspect the validation schema of any decorated class.
   *
   * ### Use Cases
   * - **Schema Inspection**: Understand what validation rules apply to a class
   * - **Dynamic Validation**: Build validation logic based on class structure
   * - **Documentation**: Generate validation documentation from code
   * - **Testing**: Verify that proper decorators are applied
   *
   * @example
   * ```typescript
   * class User {
   *   @IsRequired()
   *   @IsEmail()
   *   email: string;
   *
   *   @IsRequired()
   *   @MinLength(3)
   *   @MaxLength(50)
   *   name: string;
   *
   *   @IsOptional()
   *   @IsNumber()
   *   age?: number;
   * }
   *
   * // Extract validation rules
   * const rules = Validator.getClassRules(User);
   * console.log(rules);
   * // Output:
   * // {
   * //   email: ['required', 'email'],
   * //   name: ['required', 'minLength', 'maxLength'],
   * //   age: ['number']  // IsOptional doesn't add a rule
   * // }
   *
   * // Check if a property has specific rules
   * const emailRules = rules.email;
   * const hasEmailValidation = emailRules.includes('email');
   *
   * // Programmatic rule inspection
   * function analyzeClass(targetClass: any) {
   *   const rules = Validator.getClassRules(targetClass);
   *   const analysis = {
   *     totalProperties: Object.keys(rules).length,
   *     requiredProperties: [],
   *     optionalProperties: []
   *   };
   *
   *   for (const [property, propertyRules] of Object.entries(rules)) {
   *     if (propertyRules.includes('required')) {
   *       analysis.requiredProperties.push(property);
   *     } else {
   *       analysis.optionalProperties.push(property);
   *     }
   *   }
   *
   *   return analysis;
   * }
   * ```
   *
   * @template T - The class constructor type to extract rules from
   *
   * @param target - Class constructor with validation decorators
   *
   * @returns Record mapping property names to their validation rules
   *
   *
   * @see {@link validateClass} - Uses this method to get validation rules
   * @see {@link buildPropertyDecorator} - How rules are attached to properties
   * @public
   */
  static getClassRules<T = unknown>(
    target: T
  ): Record<string, ValidatorRule[]> {
    if (typeof target === 'function') {
      return getDecoratedProperties(
        target as unknown as ClassConstructor,
        VALIDATOR_TARGET_RULES_METADATA_KEY
      ) as Record<string, ValidatorRule[]>;
    }
    return Object.assign(
      {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Reflect.getMetadata(VALIDATOR_TARGET_RULES_METADATA_KEY, target as any)
    );
  }

  /**
   * ## Get TClass Validation Options
   *
   * Retrieves validation options that have been configured for a specific class
   * through the `@ValidationClassOptions` decorator. These options control how
   * validation behaves when `validateClass` is called on the class.
   *
   * ### Configuration Options
   * Options can include custom error message builders, validation contexts,
   * and other class-level validation behaviors that should be applied consistently
   * whenever the class is validated.
   *
   * @example
   * ```typescript
   * // Class with custom validation options
   * @ValidationClassOptions({
   *   errorMessageBuilder: (translatedName, error) => {
   *     return `❌ ${translatedName}: ${error}`;
   *   }
   * })
   * class CustomUser {
   *   @IsRequired()
   *   @IsEmail()
   *   email: string;
   * }
   *
   * // Get the configured options
   * const options = Validator.getValidatorClassOptions(CustomUser);
   * console.log(typeof options.errorMessageBuilder); // 'function'
   *
   * // These options will be automatically used when validating
   * const result = await Validator.validateClass(CustomUser, userData);
   * // Error messages will use the custom format
   * ```
   *
   * @template T - The class constructor type to get options for
   *
   * @param target - Class constructor that may have validation options
   *
   * @returns Validation options object, or empty object if none configured
   *
   *
   * @see {@link validateClass} - Uses these options during validation
   * @see {@link ValidationClassOptions} - Decorator to set these options
   * @public
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static getValidatorClassOptions<T = any>(
    target: T
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): ValidatorClassOptions<any, any> {
    return Object.assign(
      {},
      Reflect.getMetadata(
        VALIDATOR_TARGET_OPTIONS_METADATA_KEY,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        target as any
      ) || {}
    );
  }

  /**
   * ## Build Rule Decorator Factory
   *
   * **Core Method**: Creates parameterized decorator factories for validation rules.
   *
   * This is the primary factory method for building reusable validation decorators
   * that can accept configuration parameters. It transforms simple validation functions
   * into TypeScript decorators with full type safety, parameter validation, and
   * metadata management.
   *
   * ### Architecture Overview
   *
   * The decorator factory pattern implemented here enables clean, type-safe validation
   * decorators while maintaining runtime flexibility. The method creates a three-level
   * function chain:
   *
   * 1. **Factory Function** (`buildRuleDecorator(ruleFunction)`)
   *    - Takes a validation rule function
   *    - Returns a parameter-accepting function
   *
   * 2. **Parameter Function** (`factory(ruleParameters)`)
   *    - Accepts rule parameters (conditionally optional)
   *    - Returns a property decorator
   *
   * 3. **Property Decorator** (`@Decorator(parameters)`)
   *    - Attaches validation metadata to class properties
   *    - Executed at class definition time
   *
   * ### Type System Deep Dive
   *
   * #### Parameter Handling
   * The method uses rest parameters (`...ruleParameters: TRuleParams`) to accept
   * variable numbers of arguments. This allows decorators to be called with zero
   * or more parameters:
   *
   * ```typescript
   * @MinLength(5)        // Single parameter
   * @Range(0, 100)       // Multiple parameters
   * @IsRequired()        // No parameters (empty rest args)
   * ```
   *
   * #### Rule Name Registration
   * The optional `ruleName` parameter enables automatic rule registration for rules
   * that can be called without parameters. This is restricted to rules where
   * `ValidatorTupleAllowsEmpty<TRuleParams>` is true, ensuring type safety.
   *
   * ### Implementation Flow
   *
   * #### Phase 1: Rule Registration (Optional)
   * ```typescript
   * if (isNonNullString(ruleName)) {
   *   Validator.registerRule(ruleName, ruleFunction);
   * }
   * ```
   * - Registers the rule function under the provided name
   * - Enables string-based rule references in validation configurations
   * - Only available for rules that support empty parameter calls
   *
   * #### Phase 2: Decorator Factory Creation
   * ```typescript
   * return function (...ruleParameters: TRuleParams) {
   *   const finalRuleParameters = ruleParameters;
   * ```
   * - Returns a function accepting rest parameters
   * - Captures the exact parameters passed to the decorator
   * - No default value assignment - parameters are used as-is
   * ```typescript
   * const enhancedValidatorFunction = function(validationOptions) {
   *   const enhancedOptions = Object.assign({}, validationOptions);
   *   enhancedOptions.ruleParams = Validator.normalizeRuleParams(finalRuleParameters);
   *   return ruleFunction(enhancedOptions);
   * };
   * ```
   * - Creates wrapper function that injects normalized parameters
   * - Preserves original validation options structure
   * - Maintains function identity for debugging
   *
   * #### Phase 3: Symbol Marker Preservation
   * ```typescript
   * if (hasRuleMarker(ruleFunction, VALIDATOR_NESTED_RULE_MARKER)) {
   *   (enhancedValidatorFunction as any)[VALIDATOR_NESTED_RULE_MARKER] = true;
   *   (enhancedValidatorFunction as any)[VALIDATOR_NESTED_RULE_PARAMS] = normalizedParams;
   * }
   * ```
   * - Preserves special markers for nested validation rules
   * - Stores parameters for inspection by advanced validation features
   * - Essential for `ValidateNested` and similar target-based rules
   *
   * #### Phase 4: Decorator Creation
   * ```typescript
   * return Validator.buildPropertyDecorator<TRuleParams, Context>(enhancedValidatorFunction);
   * ```
   * - Delegates to lower-level decorator creation
   * - Attaches validation metadata to class properties
   * - Enables rule accumulation and execution
   *
   * ### Rule Function Interface
   *
   * Rule functions receive a comprehensive validation context:
   *
   * ```typescript
   * interface ValidationOptions<TRuleParams, Context> {
   *   value: any;                          // The property value being validated
   *   ruleParams: TRuleParams;             // Normalized parameter array
   *   context?: Context;                   // Optional validation context
   *   fieldName: string;                   // Raw property name
   *   translatedPropertyName: string;      // Localized property name
   *   i18n?: II18nService;                 // Internationalization service
   *   // ... additional validation metadata
   * }
   * ```
   *
   * **Return Values:**
   * - `string | false | undefined`: Validation error message or falsy for success
   * - `Promise<string | false | undefined>`: For async validation rules
   * - `ValidationResult`: Structured validation result object
   *
   * ### Usage Patterns
   *
   * #### Basic Parameterized Rules
   * ```typescript
   * // Rule function with single parameter
   * const minLengthRule = ({ value, ruleParams }: ValidationOptions) => {
   *   const [minLength] = ruleParams;
   *   return value.length >= minLength || `Must be at least ${minLength} characters`;
   * };
   *
   * // Create decorator factory
   * const MinLength = Validator.buildRuleDecorator(minLengthRule);
   *
   * // Usage with different parameters
   * class User {
   *   @MinLength(3)      // Requires 3+ characters
   *   username: string;
   *
   *   @MinLength(8)      // Requires 8+ characters
   *   password: string;
   * }
   * ```
   *
   * #### Multi-Parameter Rules
   * ```typescript
   * const rangeRule = ({ value, ruleParams }) => {
   *   const [min, max] = ruleParams;
   *   if (typeof value !== 'number') return 'Must be a number';
   *   return (value >= min && value <= max) || `Must be between ${min} and ${max}`;
   * };
   *
   * const InRange = Validator.buildRuleDecorator(rangeRule);
   *
   * class Product {
   *   @InRange(0, 100)     // Percentage: 0-100
   *   discount: number;
   *
   *   @InRange(-90, 90)    // Latitude: -90 to 90
   *   latitude: number;
   * }
   * ```
   *
   * #### Context-Aware Rules
   * ```typescript
   * interface SecurityContext {
   *   userRole: 'admin' | 'user' | 'guest';
   *   permissions: string[];
   *   organizationId: string;
   * }
   *
   * const requiresPermissionRule = ({ value, ruleParams, context }) => {
   *   const [requiredPermission] = ruleParams;
   *   const securityContext = context as SecurityContext;
   *
   *   if (!securityContext) return 'Security context required';
   *   return securityContext.permissions.includes(requiredPermission) ||
   *          `Requires '${requiredPermission}' permission`;
   * };
   *
   * const RequiresPermission = Validator.buildRuleDecorator<SecurityContext>(requiresPermissionRule);
   *
   * class SecureResource {
   *   @RequiresPermission('read')
   *   publicData: string;
   *
   *   @RequiresPermission('admin')
   *   adminData: string;
   * }
   * ```
   *
   * #### Optional Parameter Rules
   * ```typescript
   * // Rule that works with or without parameters
   * const patternRule = ({ value, ruleParams }) => {
   *   const [regex, flags] = ruleParams;
   *
   *   // Default email pattern if no parameters provided
   *   const defaultRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   *   const pattern = regex || defaultRegex;
   *   const regexFlags = flags || 'i';
   *
   *   const testRegex = new RegExp(pattern, regexFlags);
   *   return testRegex.test(value) || 'Invalid format';
   * };
   *
   * const MatchesPattern = Validator.buildRuleDecorator(patternRule);
   *
   * class Data {
   *   @MatchesPattern()                    // Uses default email pattern
   *   email: string;
   *
   *   @MatchesPattern(/^\d{3}-\d{2}-\d{4}$/)  // SSN pattern
   *   ssn: string;
   * }
   * ```
   *
   * #### Async Validation Rules
   * ```typescript
   * const uniqueEmailRule = async ({ value, context }) => {
   *   if (!value) return true; // Skip if empty
   *
   *   const db = context?.database;
   *   if (!db) return 'Database context required for uniqueness validation';
   *
   *   try {
   *     const existing = await db.query(
   *       `SELECT 1 FROM users WHERE email = $1 LIMIT 1`,
   *       [value]
   *     );
   *
   *     return !existing.rows.length || 'Email address already registered';
   *   } catch (error) {
   *     return 'Unable to validate email uniqueness';
   *   }
   * };
   *
   * const IsUniqueEmail = Validator.buildRuleDecorator(uniqueEmailRule);
   *
   * class Registration {
   *   @IsRequired()
   *   @IsEmail()
   *   @IsUniqueEmail()  // Empty parameters since no config needed
   *   email: string;
   * }
   * ```
   *
   * ### Advanced Features
   *
   * #### Custom Validation Results
   * ```typescript
   * const complexRule = ({ value, ruleParams, fieldName }) => {
   *   const [config] = ruleParams;
   *
   *   // Return structured validation result
   *   return {
   *     success: false,
   *     error: {
   *       message: `Custom validation failed for ${fieldName}`,
   *       code: 'CUSTOM_VALIDATION_ERROR',
   *       details: { config, value }
   *     }
   *   };
   * };
   * ```
   *
   * #### Rule Composition
   * ```typescript
   * const notEmptyRule = ({ value }) =>
   *   value != null && value !== '' || 'Field cannot be empty';
   *
   * const emailRule = ({ value }) =>
   *   /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Invalid email format';
   *
   * // Combine rules in a single decorator
   * const IsRequiredEmail = Validator.buildRuleDecorator(({ value }) => {
   *   const notEmpty = notEmptyRule({ value });
   *   if (notEmpty !== true) return notEmpty;
   *
   *   return emailRule({ value });
   * });
   *
   * class Contact {
   *   @IsRequiredEmail()  // Combines required + email validation
   *   primaryEmail: string;
   * }
   * ```
   *
   * ### Performance Considerations
   *
   * #### Memory Efficiency
   * - Factory functions are created once per rule type, not per usage
   * - Parameter normalization happens at decoration time, not validation time
   * - Rule functions are reused across multiple property applications
   *
   * #### Runtime Performance
   * - Validation execution is deferred until `validateClass()` is called
   * - Parameter binding happens during decoration, not validation
   * - No reflection overhead during actual validation
   *
   * #### Bundle Size Impact
   * - Rule functions are tree-shakeable when not used
   * - Decorator factories have minimal runtime footprint
   * - Type-only parameters don't affect bundle size
   *
   * ### Error Handling & Debugging
   *
   * #### Common Issues
   * ```typescript
   * // ❌ Wrong: Single value instead of array
   * @MinLength(5)  // TypeScript error: expected array
   *
   * // ✅ Correct: Array parameter
   * @MinLength(5)
   * ```
   *
   * ```typescript
   * // ❌ Wrong: Missing parameters for required rule
   * const RequiredRule = ({ value }) => !!value || 'Required';
   * const IsRequired = Validator.buildRuleDecorator(RequiredRule);
   * @IsRequired()  // Runtime error: undefined parameters
   *
   * ```
   *
   * #### Debugging Tips
   * - Use `console.log(ruleParams)` in rule functions to inspect parameters
   * - Check `hasRuleMarker()` for nested rule identification
   * - Validate parameter types at rule function entry
   * - Use meaningful error messages for easier debugging
   *
   * ### Integration with Validation System
   *
   * #### Rule Accumulation
   * Multiple decorators on the same property are accumulated:
   * ```typescript
   * class RobustField {
   *   @IsRequired()      // Rule 1: Required check
   *   @MinLength(3)      // Rule 2: Length check
   *   @IsAlphanumeric()  // Rule 3: Content check
   *   username: string;
   * }
   * ```
   *
   * #### Validation Execution Order
   * - Rules execute in decoration order (top to bottom)
   * - First failing rule stops validation (unless configured otherwise)
   * - All rules receive the same validation context
   *
   * #### Context Propagation
   * ```typescript
   * const result = await Validator.validateClass(UserClass, {
   *   data: userData,
   *   context: { userId: 123, permissions: ['read'] },
   *   errorMessageBuilder: (field, error) => `${field}: ${error}`
   * });
   * ```
   *
   * ### Migration Guide
   *
   * #### From Manual Decorators
   * ```typescript
   * // Before: Manual decorator creation
   * function MinLength(minLength: number) {
   *   return function(target: any, propertyKey: string) {
   *     // Manual metadata attachment...
   *   };
   * }
   *
   * // After: Using buildRuleDecorator
   * const minLengthRule = ({ value, ruleParams }) => {
   *   const [min] = ruleParams;
   *   return value.length >= min || `Too short`;
   * };
   * const MinLength = Validator.buildRuleDecorator(minLengthRule);
   * ```
   *
   * #### From Class-Based Validators
   * ```typescript
   * // Before: Class-based approach
   * class MinLengthValidator {
   *   constructor(private minLength: number) {}
   *   validate(value: any): string | null {
   *     return value.length >= this.minLength ? null : 'Too short';
   *   }
   * }
   *
   * // After: Function-based with buildRuleDecorator
   * const MinLength = Validator.buildRuleDecorator(
   *   ({ value, ruleParams }) => {
   *     const [min] = ruleParams;
   *     return value.length >= min || 'Too short';
   *   }
   * );
   * ```
   *
   * ### Best Practices
   *
   * #### Rule Function Design
   * - Keep rule functions pure and testable
   * - Use descriptive error messages
   * - Handle edge cases (null, undefined, empty strings)
   * - Validate parameter types at function entry
   * - Return consistent result types
   *
   * #### Parameter Design
   * - Use array parameters for consistency
   * - Provide sensible defaults for optional parameters
   * - Document parameter order and types
   * - Consider parameter validation in rule functions
   *
   * #### Performance Optimization
   * - Avoid expensive operations in frequently-used rules
   * - Use async rules only when necessary
   * - Cache expensive computations when possible
   * - Profile validation performance in production
   *
   * #### Type Safety
   * - Leverage TypeScript's type system fully
   * - Use strict null checks in rule functions
   * - Provide accurate type annotations
   * - Test with strict TypeScript settings
   *
   * ### Troubleshooting
   *
   * #### "Property 'ruleParams' does not exist"
   * - Ensure rule function accepts `ValidationOptions` parameter
   * - Check that parameters are destructured correctly
   *
   * #### "Cannot read property '0' of undefined"
   * - Rule expects parameters but none provided
   * - Use empty call `()` for rules that don't need parameters
   * - Check that decorator is called with correct syntax
   *
   * #### "Type 'string' is not assignable to type 'TRuleParams'"
   * - Parameters must be arrays, not single values
   * - Wrap single parameters: `[value]` instead of `value`
   *
   * #### Async rule not working
   * - Ensure `validateClass()` is called with `await`
   * - Check that validation context includes required services
   * - Verify async rule returns Promise<string | false | undefined>
   *
   * ### Related Methods
   *
   * - {@link buildClassRuleDecorator} - Specialized for nested class validation
   * - {@link buildPropertyDecorator} - Low-level decorator creation
   * - {@link buildMultiRuleDecorator} - For rules with multiple validation functions
   *
   * ### See Also
   *
   * - {@link ValidatorTupleAllowsEmpty} - Type for conditional parameter optionality
   * - {@link ValidatorRuleFunction} - Rule function interface
   * - {@link validateClass} - Main validation execution method
   * - {@link ValidationOptions} - Complete validation context interface
   *
   * @template TRuleParams - Tuple type defining the exact parameter structure for the rule.
   *   Must extend `ValidatorRuleParams` (array of unknown). Examples:
   *   - `[min: number]` - Single numeric parameter
   *   - `[min: number, max: number]` - Two numeric parameters
   *   - `[pattern: RegExp, flags?: string]` - Regex with optional flags
   *   - `[]` - No parameters required
   *
   * @template Context - Type of the validation context object passed through the validation chain.
   *   Defaults to `unknown` if not specified. Common patterns:
   *   - `SecurityContext` - User permissions and roles
   *   - `DatabaseContext` - Database connections and transactions
   *   - `LocalizationContext` - I18n and locale information
   *   - `{ userId: string; permissions: string[] }` - Inline context type
   *
   * @param ruleFunction - The validation rule function to be wrapped in a decorator factory.
   * @param ruleName - Optional rule name for automatic registration with `Validator.registerRule()`.
   *   This parameter is typed as `ValidatorOptionalOrEmptyRuleNames`, which is a union of rule names
   *   where `ValidatorTupleAllowsEmpty<TRuleParams>` extends `true`. This includes rules like:
   *   - `"Required"` - No parameters needed
   *   - `"Email"` - No parameters needed
   *   - `"PhoneNumber"` - Optional country code parameter
   *   - `"Nullable"`, `"Optional"`, `"Empty"` - No parameters needed
   *
   *   When provided, the rule function will be automatically registered under this name,
   *   enabling programmatic rule discovery and string-based rule references in validation configurations.
   *   This is particularly useful for built-in validation rules that need to be accessible by name
   *   without requiring function references. Rules with required parameters cannot be registered
   *   this way since they must always be called with arguments (e.g., `MinLength[5]`, `MaxLength[10]`).
   *   This function receives normalized validation options and returns validation results.
   *   Function signature: `(options: ValidationOptions<TRuleParams, Context>) => ValidationResult`
   *
   * @param symbolMarker - (Internal use only) A unique symbol used to mark the rule function for special handling.
   *   This parameter is not intended for public use and should generally be omitted.
   *   It is used internally to preserve symbol markers through function wrapping,
   *   enabling reliable identification of the rule internally even in minified code.
   * @returns A decorator factory function that accepts rule parameters as rest parameters and returns a property decorator.
   *   The signature is: `(...ruleParameters: TRuleParams) => PropertyDecorator`
   *
   * @example
   * ```typescript
   * // Basic usage with required parameters
   * const minLengthRule = ({ value, ruleParams }) => {
   *   const [minLength] = ruleParams;
   *   return value.length >= minLength || `Minimum ${minLength} characters required`;
   * };
   *
   * const MinLength = Validator.buildRuleDecorator(minLengthRule);
   *
   * class User {
   *   @MinLength(8)
   *   password: string;
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Advanced usage with context and custom types
   * interface DatabaseContext {
   *   db: DatabaseConnection;
   *   transaction: Transaction;
   * }
   *
   * const uniqueRule = async ({ value, ruleParams, context }) => {
   *   const [table, column] = ruleParams;
   *   const db = (context as DatabaseContext).db;
   *
   *   const exists = await db.query(
   *     `SELECT 1 FROM ${table} WHERE ${column} = $1 LIMIT 1`,
   *     [value]
   *   );
   *
   *   return !exists.rows.length || `${column} must be unique`;
   * };
   *
   * const IsUnique = Validator.buildRuleDecorator<DatabaseContext>(uniqueRule);
   *
   * class User {
   *   @IsUnique('users', 'email')
   *   email: string;
   * }
   * ```
   *
   * @since 1.0.0
   * @public
   * @category Decorator Factories
   * @see {@link buildClassRuleDecorator}
   * @see {@link ValidatorRuleFunction}
   * @see {@link ValidatorTupleAllowsEmpty}
   */
  static buildRuleDecorator<
    TRuleParams extends ValidatorRuleParams = ValidatorRuleParams,
    Context = unknown,
  >(
    ruleFunction: ValidatorRuleFunction<TRuleParams, Context>,
    ruleName?: ValidatorRuleName,
    symbolMarker?: symbol
  ): (...ruleParameters: TRuleParams) => PropertyDecorator {
    if (ruleName) {
      this._prepareRuleDecorator(ruleFunction, ruleName, symbolMarker);
    }
    return (...ruleParameters: TRuleParams) => {
      return this._buildRuleDecorator<TRuleParams, Context>(
        ruleParameters,
        ruleFunction,
        ruleName,
        symbolMarker
      );
    };
  }
  static isSuccess<Context = unknown>(
    result: ValidatorResult<Context>
  ): result is ValidatorSuccess<Context> {
    return (
      isObj(result) &&
      result.success === true &&
      result.status == 'success' &&
      result.name == 'ValidatorSuccessResult'
    );
  }
  /**
   * ## Get Base Error Properties
   *
   * Helper method that constructs the foundational properties shared by all validation errors.
   * This ensures consistency across different error types (single, target, bulk) by centralizing
   * the creation of timestamp, duration, status code, and error identification fields.
   *
   * @param options.startTime - The timestamp when validation started (for duration calculation)
   * @returns An object containing common error fields (success status, error codes, timings)
   * @private
   */
  private static getBaseError({
    startTime,
  }: {
    startTime: number;
  }): Omit<ValidatorBaseError, 'message'> {
    const failedAt = new Date();
    return {
      __validatorBaseName: 'ValidatorBaseError',
      failedAt,
      startTime,
      duration: Date.now() - startTime,
      success: false,
      status: 'error',
      statusCode: 400,
      errorCode: 'ERR_VALIDATION_FAILED',
    };
  }

  /**
   * ## Check Base Error Structure
   *
   * Type guard that verifies if an unknown value matches the structure of a `ValidatorBaseError`.
   * Checks for specific marker properties and error codes that all validation errors inherit.
   *
   * @param value - The value to check
   * @returns `true` if it's a validation error base structure
   * @private
   */
  private static isBaseError(value: unknown): value is ValidatorBaseError {
    if (!isObj(value)) {
      return false;
    }
    return (
      value.__validatorBaseName === 'ValidatorBaseError' &&
      value.success === false &&
      value.failedAt &&
      value.statusCode === 400 &&
      value.errorCode === 'ERR_VALIDATION_FAILED'
    );
  }

  /**
   * ## Create Single Validation Error
   *
   * Factory method for creating a `ValidatorError`.
   * Represents a failure in a simple, single-value validation context.
   *
   * @param message - Human-readable error message
   * @param details - Contextual details (value, startTime, etc.)
   * @returns A structured `ValidatorError` object
   */
  static createError(
    message: string,
    details: ValidatorCreateErrorPayload
  ): ValidatorError {
    return {
      ...this.getBaseError(details),
      ...details,
      failedAt: new Date(),
      message,
      name: 'ValidatorError',
      // Explicitly ensures name is set correctly for discrimination
    };
  }

  /**
   * ## Create TClass Validation Error
   *
   * Factory method for creating a `ValidatorClassError`.
   * Represents a failure when validating a class instance or complex object target,
   * containing a map of field-specific errors.
   *
   * @param message - General summary message
   * @param details - Context including the `errors` map for specific fields
   * @returns A structured `ValidatorClassError` object
   */
  static createClassError(
    message: string,
    details: ValidatorCreateClassErrorPayload
  ): ValidatorClassError {
    return {
      ...this.getBaseError(details),
      ...details,
      message,
      name: 'ValidatorClassError',
      failedAt: new Date(),
    };
  }

  /**
   * ## Create Bulk Validation Error
   *
   * Factory method for creating a `ValidatorBulkError`.
   * Represents a failure when validating an array of items, mapping indices to specific errors.
   *
   * @template TClass - The Target class type
   * @param message - General summary message
   * @param details - Context including the `errors` map (index -> error)
   * @returns A structured `ValidatorBulkError` object
   */
  static createBulkError<TClass extends ClassConstructor = ClassConstructor>(
    message: string,
    details: ValidatorCreateBulkErrorPayload
  ): ValidatorBulkError<TClass> {
    const failures = Array.isArray(details.failures) ? details.failures : [];
    return {
      ...this.getBaseError(details),
      ...details,
      failures,
      failureCount: failures.length,
      message,
      name: 'ValidatorBulkError',
      failedAt: new Date(),
    };
  }

  /**
   * ## Check for Single Field Validation Error
   *
   * Type guard that determines if a value is specifically a `ValidatorError`,
   * representing a validation failure for a **single field or value**.
   *
   * ### Purpose
   * - **Type Discrimination**: Distinguish single field errors from class/bulk errors
   * - **Type Safety**: Enables TypeScript to narrow the type to `ValidatorError`
   * - **Specific Handling**: Access field-specific error properties
   * - **Error Classification**: Categorize validation errors by granularity
   *
   * ### When to Use
   * - **Single Field Validation**: When validating individual values
   * - **Field-Level Errors**: To access specific field, rule, and value information
   * - **Granular Error Handling**: When you need different logic for single vs. multiple errors
   * - **Error Reporting**: To format single field errors differently
   *
   * ### When NOT to Use
   * - **Generic Handling**: Use `isAnyError()` to handle all validator errors the same way
   * - **Class Validation**: Use `isClassError()` for object/class validation errors
   * - **Bulk Validation**: Use `isBulkError()` for array validation errors
   *
   * @param result - The value to check for ValidatorError type
   * @returns `true` if the value is a ValidatorError, `false` otherwise
   *
   * @example
   * ```typescript
   * // Basic single field validation
   * const emailResult = await Validator.validate({
   *   value: 'invalid-email',
   *   rules: ['Email']
   * });
   *
   * if (!emailResult.success && Validator.isError(emailResult)) {
   *   // TypeScript knows emailResult is ValidatorError
   *   console.log('Field:', emailResult.field);        // undefined (single value)
   *   console.log('Rule:', emailResult.rule);          // 'Email'
   *   console.log('Value:', emailResult.value);        // 'invalid-email'
   *   console.log('Message:', emailResult.message);    // 'Must be a valid email'
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Conditional error handling based on error type
   * async function validateInput(value: unknown, rules: string[]) {
   *   const result = await Validator.validate({ value, rules });
   *
   *   if (!result.success) {
   *     if (Validator.isError(result)) {
   *       // Handle single field error
   *       return {
   *         type: 'field',
   *         field: result.field || 'value',
   *         rule: result.rule,
   *         message: result.message
   *       };
   *     } else if (Validator.isClassError(result)) {
   *       // Handle class validation error
   *       return {
   *         type: 'class',
   *         errors: result.fieldErrors
   *       };
   *     }
   *   }
   *
   *   return { type: 'success', value };
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Error logging with field information
   * function logValidationError(error: unknown) {
   *   if (Validator.isError(error)) {
   *     logger.error({
   *       type: 'SINGLE_FIELD_VALIDATION',
   *       field: error.field,
   *       rule: error.rule,
   *       value: error.value,
   *       message: error.message,
   *       timestamp: error.failedAt,
   *       duration: error.duration
   *     });
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Custom error formatting for single fields
   * function formatValidationError(error: unknown): string {
   *   if (Validator.isError(error)) {
   *     const fieldName = error.field || 'Value';
   *     return `${fieldName} validation failed: ${error.message} (Rule: ${error.rule})`;
   *   }
   *   return 'Unknown validation error';
   * }
   * ```
   *
   * @remarks
   * **ValidatorError Properties**:
   * - `name: 'ValidatorError'` - Error type identifier
   * - `field?: string` - Field name (may be undefined for standalone validation)
   * - `rule: string` - The validation rule that failed
   * - `value: unknown` - The value that failed validation
   * - `message: string` - Human-readable error message
   * - `errorCode: 'ERR_VALIDATION_FAILED'` - Standard error code
   * - `statusCode: 400` - HTTP status code
   * - `failedAt: Date` - Timestamp of failure
   * - `duration: number` - Validation duration in milliseconds
   *
   * **Type Narrowing**:
   * - After this check, TypeScript narrows the type to `ValidatorError`
   * - Enables safe access to field-specific properties
   * - No need for additional type assertions
   *
   * **Performance**:
   * - O(1) complexity - two property checks
   * - Very fast, suitable for high-frequency validation
   * - No object creation or memory allocation
   *
   * @see {@link isClassError} - Check for class/object validation errors
   * @see {@link isBulkError} - Check for bulk/array validation errors
   * @see {@link isAnyError} - Check for any validator error type
   * @see {@link ValidatorError} - Single field validation error type
   * @see {@link validate} - Method that returns ValidatorError on failure
   *
   * @public
   * @category Type Guards
   */
  static isError(result: unknown): result is ValidatorError {
    return (
      this.isBaseError(result) &&
      (result as ValidatorError).name == 'ValidatorError'
    );
  }

  /**
   * ## Check for Class/Object Validation Error
   *
   * Type guard that determines if a value is specifically a `ValidatorClassError`,
   * representing validation failures for **class or object validation** with
   * multiple field-level errors.
   *
   * ### Purpose
   * - **Type Discrimination**: Distinguish class validation errors from single/bulk errors
   * - **Type Safety**: Enables TypeScript to narrow the type to `ValidatorClassError`
   * - **Field Access**: Access detailed field-level error information
   * - **Error Aggregation**: Handle multiple field errors together
   *
   * ### When to Use
   * - **Class Validation**: When validating decorated class instances
   * - **Object Validation**: When validating complex objects with multiple fields
   * - **Field-Level Errors**: To access individual field error details
   * - **Form Validation**: To map errors to form fields
   *
   * ### When NOT to Use
   * - **Generic Handling**: Use `isAnyError()` to handle all validator errors the same way
   * - **Single Field**: Use `isError()` for single field validation errors
   * - **Array Validation**: Use `isBulkError()` for bulk array validation errors
   *
   * @param result - The value to check for ValidatorClassError type
   * @returns `true` if the value is a ValidatorClassError, `false` otherwise
   *
   * @example
   * ```typescript
   * // Basic class validation
   * class User {
   *   @IsRequired()
   *   @IsEmail()
   *   email: string;
   *
   *   @IsRequired()
   *   @MinLength(8)
   *   password: string;
   * }
   *
   * const result = await Validator.validateClass(User, {
   *   data: { email: 'invalid', password: '123' }
   * });
   *
   * if (!result.success && Validator.isClassError(result)) {
   *   // TypeScript knows result is ValidatorClassError
   *   console.log('Failed fields:', result.fieldCount);     // 2
   *   console.log('Target class:', result.targetClass);     // User
   *
   *   result.fieldErrors.forEach(fieldError => {
   *     console.log(`${fieldError.field}: ${fieldError.message}`);
   *     // Output:
   *     // email: Must be a valid email address
   *     // password: Minimum length is 8 characters
   *   });
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Form validation with field mapping
   * async function validateForm(formData: FormData) {
   *   const result = await Validator.validateClass(FormSchema, {
   *     data: Object.fromEntries(formData)
   *   });
   *
   *   if (!result.success && Validator.isClassError(result)) {
   *     // Map errors to form fields
   *     const fieldErrors: Record<string, string> = {};
   *
   *     result.fieldErrors.forEach(error => {
   *       fieldErrors[error.field] = error.message;
   *     });
   *
   *     return {
   *       success: false,
   *       errors: fieldErrors,
   *       message: result.message
   *     };
   *   }
   *
   *   return { success: true };
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Error logging with field details
   * function logClassValidationError(error: unknown) {
   *   if (Validator.isClassError(error)) {
   *     logger.error({
   *       type: 'CLASS_VALIDATION',
   *       targetClass: error.targetClass?.name,
   *       fieldCount: error.fieldCount,
   *       fields: error.fieldErrors.map(e => e.field),
   *       message: error.message,
   *       timestamp: error.failedAt,
   *       duration: error.duration
   *     });
   *
   *     // Log individual field errors
   *     error.fieldErrors.forEach(fieldError => {
   *       logger.debug({
   *         field: fieldError.field,
   *         rule: fieldError.rule,
   *         message: fieldError.message,
   *         value: fieldError.value
   *       });
   *     });
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Conditional error handling
   * function handleValidationResult(result: unknown) {
   *   if (Validator.isClassError(result)) {
   *     // Handle class validation errors
   *     return {
   *       type: 'class',
   *       summary: `${result.fieldCount} field(s) failed validation`,
   *       fields: result.fieldErrors.reduce((acc, error) => {
   *         acc[error.field] = {
   *           message: error.message,
   *           rule: error.rule,
   *           value: error.value
   *         };
   *         return acc;
   *       }, {} as Record<string, any>)
   *     };
   *   } else if (Validator.isError(result)) {
   *     // Handle single field error
   *     return {
   *       type: 'field',
   *       message: result.message
   *     };
   *   }
   *
   *   return { type: 'unknown' };
   * }
   * ```
   *
   * @remarks
   * **ValidatorClassError Properties**:
   * - `name: 'ValidatorClassError'` - Error type identifier
   * - `targetClass: ClassConstructor` - The class that was validated
   * - `fieldErrors: FieldError[]` - Array of individual field errors
   * - `fieldCount: number` - Number of fields that failed validation
   * - `message: string` - Summary message (e.g., "Validation failed for 2 fields")
   * - `errorCode: 'ERR_VALIDATION_FAILED'` - Standard error code
   * - `statusCode: 400` - HTTP status code
   * - `failedAt: Date` - Timestamp of failure
   * - `duration: number` - Validation duration in milliseconds
   *
   * **FieldError Structure**:
   * - `field: string` - Property name that failed
   * - `message: string` - Error message for this field
   * - `rule: string` - The validation rule that failed
   * - `value: unknown` - The value that failed validation
   * - `translatedPropertyName?: string` - Localized field name
   *
   * **Type Narrowing**:
   * - After this check, TypeScript narrows the type to `ValidatorClassError`
   * - Enables safe access to `fieldErrors`, `targetClass`, etc.
   * - No need for additional type assertions
   *
   * **Performance**:
   * - O(1) complexity - two property checks
   * - Very fast, suitable for high-frequency validation
   * - No object creation or memory allocation
   *
   * @see {@link isError} - Check for single field validation errors
   * @see {@link isBulkError} - Check for bulk/array validation errors
   * @see {@link isAnyError} - Check for any validator error type
   * @see {@link ValidatorClassError} - Class validation error type
   * @see {@link validateClass} - Method that returns ValidatorClassError on failure
   *
   * @public
   * @category Type Guards
   */
  static isClassError(result: unknown): result is ValidatorClassError {
    return (
      this.isBaseError(result) &&
      (result as ValidatorClassError).name == 'ValidatorClassError'
    );
  }

  /**
   * ## Check for Bulk/Array Validation Error
   *
   * Type guard that determines if a value is specifically a `ValidatorBulkError`,
   * representing validation failures for **bulk array validation** with
   * multiple item-level errors.
   *
   * ### Purpose
   * - **Type Discrimination**: Distinguish bulk validation errors from single/class errors
   * - **Type Safety**: Enables TypeScript to narrow the type to `ValidatorBulkError`
   * - **Item Access**: Access detailed item-level error information with indices
   * - **Error Aggregation**: Handle multiple item errors together
   *
   * ### When to Use
   * - **Array Validation**: When validating arrays of items
   * - **Bulk Operations**: When processing multiple records/items
   * - **Item-Level Errors**: To access individual item error details with indices
   * - **Batch Processing**: To identify which items failed in a batch
   *
   * ### When NOT to Use
   * - **Generic Handling**: Use `isAnyError()` to handle all validator errors the same way
   * - **Single Field**: Use `isError()` for single field validation errors
   * - **Object Validation**: Use `isClassError()` for class/object validation errors
   *
   * @param result - The value to check for ValidatorBulkError type
   * @returns `true` if the value is a ValidatorBulkError, `false` otherwise
   *
   * @example
   * ```typescript
   * // Basic bulk validation
   * class User {
   *   @IsRequired()
   *   @IsEmail()
   *   email: string;
   *
   *   @IsRequired()
   *   name: string;
   * }
   *
   * const users = [
   *   { email: 'valid@example.com', name: 'John' },
   *   { email: 'invalid', name: '' },           // Invalid
   *   { email: 'test@example.com', name: 'Jane' },
   *   { email: 'bad-email', name: 'Bob' }       // Invalid
   * ];
   *
   * const result = await Validator.validateBulk(User, {
   *   data: users
   * });
   *
   * if (!result.success && Validator.isBulkError(result)) {
   *   // TypeScript knows result is ValidatorBulkError
   *   console.log('Total items:', result.totalCount);       // 4
   *   console.log('Failed items:', result.failureCount);    // 2
   *   console.log('Success rate:',
   *     `${((result.totalCount - result.failureCount) / result.totalCount * 100).toFixed(1)}%`
   *   ); // 50.0%
   *
   *   result.itemErrors.forEach(itemError => {
   *     console.log(`Item[${itemError.index}]: ${itemError.message}`);
   *     // Output:
   *     // Item[1]: Validation failed for 2 fields: email, name
   *     // Item[3]: Validation failed for field: email
   *   });
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Bulk import with error reporting
   * async function importUsers(csvData: string[][]) {
   *   const result = await Validator.validateBulk(User, {
   *     data: csvData.map(row => ({
   *       email: row[0],
   *       name: row[1]
   *     }))
   *   });
   *
   *   if (!result.success && Validator.isBulkError(result)) {
   *     // Generate error report
   *     const errorReport = {
   *       totalRecords: result.totalCount,
   *       failedRecords: result.failureCount,
   *       successRecords: result.totalCount - result.failureCount,
   *       errors: result.itemErrors.map(error => ({
   *         row: error.index + 2, // +2 for 1-based + header row
   *         message: error.message,
   *         data: csvData[error.index]
   *       }))
   *     };
   *
   *     return {
   *       success: false,
   *       report: errorReport
   *     };
   *   }
   *
   *   return { success: true };
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Error logging with item details
   * function logBulkValidationError(error: unknown) {
   *   if (Validator.isBulkError(error)) {
   *     logger.error({
   *       type: 'BULK_VALIDATION',
   *       targetClass: error.targetClass?.name,
   *       totalCount: error.totalCount,
   *       failureCount: error.failureCount,
   *       successRate: ((error.totalCount - error.failureCount) / error.totalCount * 100).toFixed(2) + '%',
   *       message: error.message,
   *       timestamp: error.failedAt,
   *       duration: error.duration
   *     });
   *
   *     // Log individual item errors
   *     error.itemErrors.forEach(itemError => {
   *       logger.debug({
   *         index: itemError.index,
   *         message: itemError.message,
   *         error: itemError.error
   *       });
   *     });
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Retry failed items
   * async function processBatchWithRetry(items: any[]) {
   *   const result = await Validator.validateBulk(ItemClass, { data: items });
   *
   *   if (!result.success && Validator.isBulkError(result)) {
   *     // Extract failed item indices
   *     const failedIndices = new Set(
   *       result.itemErrors.map(error => error.index)
   *     );
   *
   *     // Retry only failed items
   *     const failedItems = items.filter((_, index) =>
   *       failedIndices.has(index)
   *     );
   *
   *     console.log(`Retrying ${failedItems.length} failed items...`);
   *     return await retryValidation(failedItems);
   *   }
   *
   *   return { success: true };
   * }
   * ```
   *
   * @remarks
   * **ValidatorBulkError Properties**:
   * - `name: 'ValidatorBulkError'` - Error type identifier
   * - `targetClass: ClassConstructor` - The class used for validation
   * - `itemErrors: ItemError[]` - Array of individual item errors with indices
   * - `failures: ValidatorClassError[]` - Detailed class errors for each failed item
   * - `failureCount: number` - Number of items that failed validation
   * - `totalCount: number` - Total number of items validated
   * - `message: string` - Summary message (e.g., "2 of 5 items failed validation")
   * - `errorCode: 'ERR_VALIDATION_FAILED'` - Standard error code
   * - `statusCode: 400` - HTTP status code
   * - `failedAt: Date` - Timestamp of failure
   * - `duration: number` - Validation duration in milliseconds
   *
   * **ItemError Structure**:
   * - `index: number` - Zero-based index of the failed item
   * - `message: string` - Error message for this item
   * - `error: ValidatorClassError` - Detailed validation error for the item
   *
   * **Type Narrowing**:
   * - After this check, TypeScript narrows the type to `ValidatorBulkError`
   * - Enables safe access to `itemErrors`, `failures`, `totalCount`, etc.
   * - No need for additional type assertions
   *
   * **Performance**:
   * - O(1) complexity - two property checks
   * - Very fast, suitable for high-frequency validation
   * - No object creation or memory allocation
   *
   * @see {@link isError} - Check for single field validation errors
   * @see {@link isClassError} - Check for class/object validation errors
   * @see {@link isAnyError} - Check for any validator error type
   * @see {@link ValidatorBulkError} - Bulk validation error type
   * @see {@link validateBulk} - Method that returns ValidatorBulkError on failure
   *
   * @public
   * @category Type Guards
   */
  static isBulkError(result: unknown): result is ValidatorBulkError {
    return (
      this.isBaseError(result) &&
      (result as ValidatorBulkError).name == 'ValidatorBulkError'
    );
  }

  /**
   * ## Check for Any Validator Error Type
   *
   * Universal type guard that checks if a value is **any type** of validator error.
   * This method returns `true` if the value is a `ValidatorError`, `ValidatorClassError`,
   * or `ValidatorBulkError`, providing a convenient way to detect validation failures
   * without needing to check each error type individually.
   *
   * ### Purpose
   * - **Unified Error Detection**: Single method to detect all validation error types
   * - **Type Safety**: Narrows TypeScript type to union of all validator errors
   * - **Convenience**: Eliminates need for multiple type checks
   * - **Error Handling**: Simplifies error handling logic in catch blocks
   *
   * ### When to Use
   * - **Generic Error Handling**: When you want to handle all validation errors the same way
   * - **Error Classification**: To distinguish validation errors from other error types
   * - **API Responses**: To check if a response contains validation errors
   * - **Logging**: To categorize errors by type for monitoring
   *
   * ### When NOT to Use
   * - **Type-Specific Handling**: When you need different logic for each error type
   *   → Use `isError()`, `isClassError()`, or `isBulkError()` instead
   * - **Field-Level Access**: When you need to access specific error properties
   *   → Check specific type first, then access properties
   *
   * @param result - The value to check for validator error types
   * @returns `true` if the value is any validator error type, `false` otherwise
   *
   * @example
   * ```typescript
   * // Basic usage - generic validation error handling
   * try {
   *   const result = await Validator.validateClass(UserClass, { data: userData });
   *   if (!result.success) {
   *     // Handle validation failure
   *   }
   * } catch (error) {
   *   if (Validator.isAnyError(error)) {
   *     // TypeScript knows error is ValidatorError | ValidatorClassError | ValidatorBulkError
   *     console.log('Validation failed:', error.message);
   *     console.log('Error code:', error.errorCode);
   *     console.log('Status code:', error.statusCode);
   *   } else {
   *     // Handle other error types
   *     console.error('Unexpected error:', error);
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // API response validation
   * async function submitForm(formData: FormData) {
   *   const response = await fetch('/api/submit', {
   *     method: 'POST',
   *     body: formData
   *   });
   *
   *   const result = await response.json();
   *
   *   if (Validator.isAnyError(result)) {
   *     // Server returned validation errors
   *     return {
   *       success: false,
   *       type: 'validation',
   *       message: result.message,
   *       errors: result
   *     };
   *   }
   *
   *   return { success: true, data: result };
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Error classification for logging
   * function logError(error: unknown) {
   *   const errorType = Validator.isAnyError(error)
   *     ? 'VALIDATION_ERROR'
   *     : error instanceof Error
   *     ? 'RUNTIME_ERROR'
   *     : 'UNKNOWN_ERROR';
   *
   *   logger.error({
   *     type: errorType,
   *     message: error instanceof Error ? error.message : String(error),
   *     timestamp: new Date().toISOString(),
   *     details: Validator.isAnyError(error) ? {
   *       errorCode: error.errorCode,
   *       statusCode: error.statusCode,
   *       duration: error.duration
   *     } : undefined
   *   });
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Conditional error handling with type narrowing
   * function handleValidationResult(result: unknown) {
   *   if (Validator.isAnyError(result)) {
   *     // Now TypeScript knows the exact union type
   *
   *     // Further narrow to specific types if needed
   *     if (Validator.isClassError(result)) {
   *       // Handle class validation errors
   *       result.fieldErrors.forEach(fieldError => {
   *         console.log(`${fieldError.field}: ${fieldError.message}`);
   *       });
   *     } else if (Validator.isBulkError(result)) {
   *       // Handle bulk validation errors
   *       console.log(`${result.failureCount} items failed validation`);
   *     } else if (Validator.isError(result)) {
   *       // Handle single field errors
   *       console.log(`Field ${result.field} failed: ${result.message}`);
   *     }
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Integration with exception handling
   * class ValidationException extends Error {
   *   constructor(public validatorError: ValidatorError | ValidatorClassError | ValidatorBulkError) {
   *     super(validatorError.message);
   *     this.name = 'ValidationException';
   *   }
   *
   *   static from(error: unknown): ValidationException | null {
   *     if (Validator.isAnyError(error)) {
   *       return new ValidationException(error);
   *     }
   *     return null;
   *   }
   * }
   *
   * try {
   *   await validateUserInput(data);
   * } catch (error) {
   *   const validationException = ValidationException.from(error);
   *   if (validationException) {
   *     throw validationException;
   *   }
   *   throw error;
   * }
   * ```
   *
   * @remarks
   * **Implementation Details**:
   * - Checks `isError()`, `isClassError()`, and `isBulkError()` in sequence
   * - Short-circuits on first match for performance
   * - All checks delegate to `isBaseError()` for consistency
   * - No additional overhead beyond individual type checks
   *
   * **Type Narrowing**:
   * - TypeScript narrows to: `ValidatorError | ValidatorClassError | ValidatorBulkError`
   * - Use specific type guards for further narrowing
   * - Enables safe access to common properties (message, errorCode, statusCode, etc.)
   *
   * **Performance**:
   * - O(1) complexity - maximum 3 checks
   * - Short-circuits on first match (typically 1 check)
   * - No object creation or memory allocation
   * - Safe for high-frequency error checking
   *
   * **Common Properties** (available on all validator errors):
   * - `message: string` - Human-readable error message
   * - `errorCode: 'ERR_VALIDATION_FAILED'` - Standard error code
   * - `statusCode: 400` - HTTP status code
   * - `success: false` - Always false for errors
   * - `status: 'error'` - Status indicator
   * - `failedAt: Date` - Timestamp of failure
   * - `duration: number` - Validation duration in milliseconds
   *
   * **Type-Specific Properties**:
   * - `ValidatorError`: `field`, `rule`, `value`
   * - `ValidatorClassError`: `fieldErrors`, `fieldCount`, `targetClass`
   * - `ValidatorBulkError`: `failures`, `failureCount`, `totalCount`, `itemErrors`
   *
   * @see {@link isError} - Check for single field validation errors only
   * @see {@link isClassError} - Check for class/object validation errors only
   * @see {@link isBulkError} - Check for bulk/array validation errors only
   * @see {@link isBaseError} - Internal base error structure check
   * @see {@link ValidatorError} - Single field validation error type
   * @see {@link ValidatorClassError} - Class validation error type
   * @see {@link ValidatorBulkError} - Bulk validation error type
   * @see {@link ValidatorBaseError} - Base error interface
   *
   * @public
   * @since 2.0.2
   * @category Type Guards
   */
  static isAnyError(
    result: unknown
  ): result is ValidatorError | ValidatorClassError | ValidatorBulkError {
    return (
      this.isError(result) ||
      this.isClassError(result) ||
      this.isBulkError(result)
    );
  }
  private static _prepareRuleDecorator<
    TRuleParams extends ValidatorRuleParams = ValidatorRuleParams,
    Context = unknown,
  >(
    ruleFunction: ValidatorRuleFunction<TRuleParams, Context>,
    ruleName?: ValidatorRuleName,
    symbolMarker?: symbol
  ) {
    if (isNonNullString(ruleName)) {
      Validator.registerRule(ruleName, ruleFunction);
      markRuleName(ruleFunction, ruleName);
    }
    if (symbolMarker) {
      markRuleWithSymbol(ruleFunction, symbolMarker, { ruleName });
    }
    return ruleFunction;
  }
  private static _buildRuleDecorator<
    TRuleParams extends ValidatorRuleParams = ValidatorRuleParams,
    Context = unknown,
  >(
    ruleParameters: TRuleParams,
    ruleFunction: ValidatorRuleFunction<TRuleParams, Context>,
    ruleName?: ValidatorRuleName,
    symbolMarker?: symbol
  ): PropertyDecorator {
    this._prepareRuleDecorator<TRuleParams, Context>(
      ruleFunction,
      ruleName,
      symbolMarker
    );

    ruleName = defaultStr(
      ruleName,
      symbolMarker?.toString(),
      ruleFunction.name,
      ruleFunction.constructor?.name
    ) as ValidatorRuleName;
    markRuleName(ruleFunction, ruleName);
    return Validator.buildPropertyDecorator<TRuleParams, Context>({
      ruleName,
      ruleFunction,
      params: ruleParameters,
    } as ValidatorSanitizedRuleObject<TRuleParams, Context>);
  }

  /**
   * ## Build TClass Rule Decorator Factory
   *
   * Creates a specialized decorator factory for validation rules that target nested class
   * objects. This method wraps buildRuleDecorator with type specialization for target-based
   * rules like @ValidateNested.
   *
   * ### Purpose
   * TClass rule decorators validate properties by delegating to another class's validation
   * schema. The most common example is @ValidateNested, which validates nested objects
   * against a separate decorated class.
   *
   * ### How It Works
   * 1. Takes a rule function specialized for target parameters: [targetClass]
   * 2. Wraps it using buildRuleDecorator to create a decorator factory
   * 3. Returns a decorator factory that accepts the target class constructor
   * 4. When the decorator is applied to a property, it triggers target-based validation
   * 5. The rule function receives the target class constructor in ruleParams[0]
   *
   * ### Type Parameters
   * - TClass: The nested class constructor type (defaults to ClassConstructor)
   *   - Must be a valid TypeScript class constructor
   *   - Can have any validation decorators
   *   - Example: Address, Contact, Location
   *
   * - Context: Type of the validation context passed through validation layers
   *   - Optional, defaults to unknown
   *   - Available to the rule function for context-aware validation
   *   - Example: { userId: 123, permissions: [...] }
   *
   * ### Rule Function Interface
   * The rule function receives:
   * ```typescript
   * {
   *   value: any;                          // The property value being validated
   *   ruleParams: [targetClass];           // Single-element array with target constructor
   *   context?: Context;                   // Validation context (if provided)
   *   fieldName: string;                   // Property name
   *   translatedPropertyName: string;      // Localized property name
   *   i18n?: II18nService;                 // i18n service for error messages
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Create a target-based validation rule
   * const validateNestedRule = ({ value, ruleParams, context }) => {
   *   const [targetClass] = ruleParams;
   *   // Validate value against targetClass schema
   *   return Validator.validateClass(targetClass, {
   *     data: value,
   *     context: context
   *   });
   * };
   *
   * // Create a target rule decorator
   * const ValidateNested = Validator.buildClassRuleDecorator(validateNestedRule);
   *
   * // Use the decorator with a target class
   * class Address {
   *   @IsRequired()
   *   street: string;
   *
   *   @IsRequired()
   *   city: string;
   * }
   *
   * class User {
   *   @IsRequired()
   *   name: string;
   *
   *   @ValidateNested(Address)
   *   address: Address;
   * }
   * ```
   *
   * ### Advanced Usage with Validation Options
   * ```typescript
   * class Coordinates {
   *   @IsRequired()
   *   @IsNumber()
   *   latitude: number;
   *
   *   @IsRequired()
   *   @IsNumber()
   *   longitude: number;
   * }
   *
   * class Location {
   *   @IsRequired()
   *   name: string;
   *
   *   @ValidateNested([Coordinates])
   *   coordinates: Coordinates;
   * }
   *
   * class Event {
   *   @IsRequired()
   *   name: string;
   *
   *   @ValidateNested([Location])
   *   location: Location;
   * }
   *
   * // Validate with context
   * const result = await Validator.validateClass(Event, {
   *   data: eventData,
   *   context: { userId: 123, permissions: ['edit'] },
   *   errorMessageBuilder: (fieldName, error) => `${fieldName}: ${error}`
   * });
   * ```
   *
   * ### Comparison with buildRuleDecorator
   * While both create decorator factories, they differ in specialization:
   *
   * **buildRuleDecorator (General Purpose):**
   * - Accepts any array type as ruleParams
   * - Used for property-level validation
   * - Examples: @MinLength([5]), @IsEmail()([]), @Pattern([/regex/])
   * - Rule params can be any values
   *
   * **buildClassRuleDecorator (Specialized):**
   * - Accepts specifically [targetClass] as ruleParams
   * - Used for class-level nested validation
   * - Examples: @ValidateNested(Address), custom target validators
   * - Rule params must contain a class constructor
   *
   * ### Implementation Details
   * This method is a thin wrapper around buildRuleDecorator that:
   * - Specializes the TRuleParams to [target: TClass]
   * - Maintains type safety for target-based rules
   * - Delegates all decorator factory logic to buildRuleDecorator
   * - Reduces code duplication while providing specialized typing
   *
   * ### Performance Characteristics
   * - No additional overhead vs buildRuleDecorator
   * - Wrapper instantiation happens at decoration time, not at import
   * - Actual validation is performed lazily during validateClass() calls
   * - Multiple properties with same target class share no cached state
   *
   * ### Error Handling
   * When the target rule function returns errors:
   * - Single errors are wrapped in the field name context
   * - Nested errors include full path information
   * - Multi-level nesting creates hierarchical error paths
   * - Error messages can be customized via errorMessageBuilder
   *
   * ### Integration with Validation System
   * - Works seamlessly with property decorators (buildPropertyDecorator)
   * - Compatible with multi-rule decorators (buildMultiRuleDecorator)
   * - Participates in parallel validation of all class properties
   * - Context is propagated through nested validation layers
   * - I18n support for error messages
   *
   * @template TClass - Class constructor type for the target/nested class
   *   - Extends ClassConstructor (default generic class constructor)
   *   - Must be a class decorated with validation rules
   *   - Example types: typeof Address, typeof Contact, typeof Location
   *
   * @template Context - Type of context object passed through validation
   *   - Defaults to unknown if not specified
   *   - Used for context-aware validation decisions
   *   - Can include permissions, user info, environmental data, etc.
   *
   * @param ruleFunction - The target validation rule function to wrap
   *   - Must accept ruleParams in format [targetClass]
   *   - Called by the decorator with target class as first param element
   *   - Should return validation result or error message
   *   - Can be synchronous or asynchronous
   *
   * @param symbolMarker - (Internal use only) Unique symbol for marking the rule function
   *
   * @returns Decorator factory function that:
   *   - Accepts the target class constructor
   *   - Returns a property decorator
   *   - Attaches target-based validation to class properties
   *   - Works with class validation via validateClass()
   *
   *
   * @see {@link buildRuleDecorator} - General-purpose decorator factory
   * @see {@link buildPropertyDecorator} - Low-level decorator creation
   * @see {@link ValidateNested} - Example target rule decorator
   * @see {@link validateNestedRule} - Example target validation rule
   * @see {@link validateClass} - Parent validation method using target rules
   * @public
   */
  static buildClassRuleDecorator<
    TClass extends ClassConstructor = ClassConstructor,
    Context = unknown,
  >(
    ruleFunction: ValidatorRuleFunction<[target: TClass], Context>,
    symbolMarker?: symbol
  ) {
    return this.buildRuleDecorator<[target: TClass], Context>(
      ruleFunction,
      undefined,
      symbolMarker
    );
  }

  /**
   * ## Build Multi-Rule Decorator Factory
   *
   * Creates a specialized decorator factory for validation rules that operate on multiple
   * sub-rules simultaneously. This method wraps {@link buildRuleDecorator} with type
   * specialization for multi-rule validation functions like OneOf, AllOf, and ArrayOf.
   *
   * ### Purpose
   * Multi-rule decorators enable complex validation logic that combines multiple validation
   * rules with logical operators (AND/OR). This factory creates decorators that can apply
   * OneOf (at least one rule must pass), AllOf (all rules must pass), or ArrayOf (validate
   * arrays where each item must satisfy all sub-rules) validation patterns.
   *
   * ### How It Works
   * 1. Takes a multi-rule validation function that accepts an array of sub-rules as parameters
   * 2. Wraps it using {@link buildRuleDecorator} to create a decorator factory
   * 3. Returns a decorator factory that accepts an array of sub-rules as decorator parameters
   * 4. When the decorator is applied to a property, it triggers multi-rule validation
   * 5. The rule function receives the sub-rules array in `ruleParams[0]`
   *
   * ### Type Parameters
   * - **Context**: Type of the validation context passed through validation layers
   *   - Optional, defaults to `unknown`
   *   - Available to all sub-rules for context-aware validation
   *   - Example: `{ userId: 123, permissions: ['read', 'write'] }`
   *
   * - **RulesFunctions**: Array type of validation rules accepted as parameters
   *   - Constrained by {@link ValidatorDefaultMultiRule} for type safety
   *   - Must be an array of validation rule functions or rule specifications
   *   - Example: `[() => value > 0, 'Required', { MinLength: [3] }]`
   *
   * ### Rule Function Interface
   * The multi-rule function receives:
   * ```typescript
   * {
   *   value: any;                          // The property value being validated
   *   ruleParams: RulesFunctions;          // Array of sub-rules to evaluate
   *   context?: Context;                   // Validation context (if provided)
   *   fieldName: string;                   // Property name
   *   translatedPropertyName: string;      // Localized property name
   *   i18n?: II18nService;                 // i18n service for error messages
   * }
   * ```
   *
   * ### Multi-Rule Patterns
   *
   * #### OneOf Validation (OR Logic)
   * ```typescript
   * const validateOneOf = ({ value, ruleParams }) => {
   *   const subRules = ruleParams;
   *   // Return true if any sub-rule passes
   *   for (const subRule of subRules) {
   *     const result = await Validator.validate({ value, rules: [subRule] });
   *     if (result.success) return true;
   *   }
   *   return "None of the rules passed validation";
   * };
   *
   * const OneOf = Validator.buildMultiRuleDecorator(validateOneOf);
   *
   * class Contact {
   *   @OneOf(['Email', 'PhoneNumber'])  // Must be valid email OR phone
   *   contactInfo: string;
   * }
   * ```
   *
   * #### AllOf Validation (AND Logic)
   * ```typescript
   * const validateAllOf = ({ value, ruleParams }) => {
   *   const subRules = ruleParams;
   *   // Return true only if all sub-rules pass
   *   for (const subRule of subRules) {
   *     const result = await Validator.validate({ value, rules: [subRule] });
   *     if (!result.success) return result.error.message;
   *   }
   *   return true;
   * };
   *
   * const AllOf = Validator.buildMultiRuleDecorator(validateAllOf);
   *
   * class Password {
   *   @AllOf(['Required', { MinLength: [8] }, { MaxLength: [128] }])
   *   password: string;  // Must satisfy ALL conditions
   * }
   * ```
   *
   * #### ArrayOf Validation
   * ```typescript
   * const validateArrayOf = async ({ value, ruleParams }) => {
   *   if (!Array.isArray(value)) return "Must be an array";
   *   const subRules = ruleParams;
   *
   *   for (let i = 0; i < value.length; i++) {
   *     const item = value[i];
   *     for (const subRule of subRules) {
   *       const result = await Validator.validate({ value: item, rules: [subRule] });
   *       if (!result.success) return `Item ${i}: ${result.error.message}`;
   *     }
   *   }
   *   return true;
   * };
   *
   * const ArrayOf = Validator.buildMultiRuleDecorator(validateArrayOf);
   *
   * class UserList {
   *   @ArrayOf(['Email'])  // Each item must be a valid email
   *   emails: string[];
   * }
   * ```
   *
   * ### Advanced Usage with Context
   * ```typescript
   * interface ValidationContext {
   *   userRole: 'admin' | 'user';
   *   strictMode: boolean;
   * }
   *
   * const validateConditional = ({ value, ruleParams, context }) => {
   *   const subRules = ruleParams;
   *   const { userRole, strictMode } = context as ValidationContext;
   *
   *   // Apply different validation based on context
   *   if (userRole === 'admin' && strictMode) {
   *     return validateAllOf([{ value, ruleParams: subRules, context }]);
   *   }
   *   return validateOneOf([{ value, ruleParams: subRules, context }]);
   * };
   *
   * const Conditional = Validator.buildMultiRuleDecorator<ValidationContext>(validateConditional);
   *
   * class FlexibleField {
   *   @Conditional(['Required', { MinLength: [10] }])
   *   flexibleValue: string;  // Validation depends on user context
   * }
   * ```
   *
   * ### Comparison with buildRuleDecorator
   * While both create decorator factories, they differ in parameter handling:
   *
   * **buildRuleDecorator (Single Rule Focus):**
   * - Accepts flexible parameter arrays for single validation rules
   * - Used for property-level validation with fixed parameters
   * - Examples: `@MinLength([5])`, `@IsEmail([])`, `@Pattern([/regex/])`
   * - Rule parameters are typically fixed values
   *
   * **buildMultiRuleDecorator (Multiple Rules Focus):**
   * - Accepts arrays of validation rules as parameters
   * - Used for combining multiple validation rules with logic
   * - Examples: `@OneOf(['Email', 'Phone'])`, `@AllOf(['Required', 'MinLength'])`
   * - Rule parameters are themselves validation rules
   *
   * ### Implementation Details
   * This method is a thin wrapper around {@link buildRuleDecorator} that:
   * - Specializes the `TRuleParams` to `RulesFunctions` array type
   * - Maintains type safety for multi-rule validation patterns
   * - Delegates all decorator factory logic to `buildRuleDecorator`
   * - Reduces code duplication while providing specialized typing
   * - Enables complex validation logic through rule composition
   *
   * ### Performance Characteristics
   * - **No additional overhead** vs `buildRuleDecorator`
   * - **Wrapper instantiation** happens at decoration time, not import
   * - **Actual validation** is performed lazily during `validate()` calls
   * - **Rule evaluation** depends on the specific multi-rule logic (sequential/parallel)
   * - **Memory efficient** - no additional state stored beyond rule metadata
   *
   * ### Error Handling
   * When multi-rule validation fails:
   * - **OneOf failures**: Aggregates all sub-rule error messages with separators
   * - **AllOf failures**: Returns the first failing sub-rule's error message
   * - **ArrayOf failures**: Includes item indices in error messages
   * - **Invalid sub-rules**: Treated as validation failures with appropriate messages
   * - **Context errors**: Propagated through the validation chain
   *
   * ### Integration with Validation System
   * - **Works seamlessly** with property decorators and class validation
   * - **Compatible with** target rule decorators for nested validation
   * - **Participates in** parallel validation of all class properties
   * - **Context propagation** through nested validation layers
   * - **i18n support** for localized error messages in sub-rules
   * - **Symbol markers** used internally for rule type identification
   *
   * ### Type Parameters
   * - **Context**: Type of context object passed through validation
   *   - Defaults to `unknown` if not specified
   *   - Used for context-aware validation decisions
   *   - Can include user permissions, environmental data, etc.
   *
   * - **RulesFunctions**: Array type of validation rules
   *   - Constrained by `ValidatorDefaultMultiRule<Context>`
   *   - Must be an array of valid validation rule specifications
   *   - Enables type-safe multi-rule validation
   *
   * @param ruleFunction - The multi-rule validation function to wrap
   *   - Must accept `ruleParams` as an array of validation rules
   *   - Called by the decorator with sub-rules as first parameter
   *   - Should implement the desired multi-rule logic (OneOf/AllOf/ArrayOf)
   *   - Can be synchronous or asynchronous
   *   - Returns validation result or error message
   *
   * @param symbolMarker - (Internal use only) A unique symbol used to mark the rule function for special handling.
   *
   * @returns Decorator factory function that:
   *   - Accepts an array of validation rules as parameters
   *   - Returns a property decorator when called
   *   - Attaches multi-rule validation to class properties
   *   - Works with class validation via `validateClass()`
   *   - Enables complex validation logic through rule composition
   *
   * @example
   * ```typescript
   * // Create a OneOf validation rule
   * const validateOneOf = async ({ value, ruleParams }) => {
   *   const subRules = ruleParams;
   *   for (const subRule of subRules) {
   *     const result = await Validator.validate({ value, rules: [subRule] });
   *     if (result.success) return true;
   *   }
   *   return "Value must satisfy at least one of the specified rules";
   * };
   *
   * // Create the decorator factory
   * const OneOf = Validator.buildMultiRuleDecorator(validateOneOf);
   *
   * // Use the decorator
   * class Contact {
   *   @OneOf(['Email', 'PhoneNumber'])
   *   primaryContact: string;
   *
   *   @OneOf(['Required', { MinLength: [10] }])
   *   secondaryContact: string;
   * }
   *
   * // Validate with context
   * const result = await Validator.validateClass(Contact, {
   *   data: { primaryContact: "user@example.com", secondaryContact: "" },
   *   context: { allowEmptySecondary: true }
   * });
   * ```
   *
   * @see {@link buildRuleDecorator} - General-purpose decorator factory
   * @see {@link buildClassRuleDecorator} - For nested class validation
   * @see {@link buildPropertyDecorator} - Low-level decorator creation
   * @see {@link OneOf} - Example OneOf multi-rule decorator
   * @see {@link AllOf} - Example AllOf multi-rule decorator
   * @see {@link ArrayOf} - Example ArrayOf multi-rule decorator
   * @see {@link validateMultiRule} - Core multi-rule validation logic
   * @see {@link ValidatorDefaultMultiRule} - Type constraint for rule arrays
   * @see {@link ValidatorMultiRuleFunction} - Multi-rule function type
   * @public
   */
  static buildMultiRuleDecorator<
    Context = unknown,
    RulesFunctions extends ValidatorDefaultMultiRule<Context> =
      ValidatorDefaultMultiRule<Context>,
  >(
    ruleFunction: ValidatorMultiRuleFunction<Context, RulesFunctions>,
    symbolMarker?: symbol
  ) {
    return (ruleParameters: RulesFunctions) => {
      return this._buildRuleDecorator<RulesFunctions, Context>(
        ruleParameters,
        ruleFunction,
        undefined,
        symbolMarker
      );
    };
  }

  /**
   * ## Build Property Decorator Factory
   *
   * Creates a low-level property decorator that attaches validation rules directly to class properties
   * using TypeScript metadata reflection. This method provides the foundation for all validation
   * decorators in the system, enabling rule accumulation and metadata storage on class properties.
   *
   * ### Purpose
   * This is the most fundamental decorator factory in the validation system. It creates property
   * decorators that store validation rules as metadata on class properties, enabling the
   * {@link validateClass} method to discover and execute validation rules during class-based
   * validation. Unlike higher-level factories, this method works directly with rule objects
   * and metadata storage.
   *
   * ### How It Works
   * 1. Takes a validation rule or array of validation rules as input
   * 2. Uses the imported `buildPropertyDecorator` helper to create a property decorator
   * 3. Stores rules under the `VALIDATOR_TARGET_RULES_METADATA_KEY` symbol
   * 4. When applied to a property, accumulates rules with existing rules on the same property
   * 5. Enables rule discovery during `validateClass()` execution
   *
   * ### Rule Accumulation Logic
   * The decorator accumulates rules rather than replacing them:
   * ```typescript
   * // Multiple decorators on the same property accumulate rules
   * class Example {
   *   @IsRequired()              // Adds ["Required"] rule
   *   @MinLength([5])           // Adds [{ MinLength: [5] }] rule
   *   @MaxLength([100])         // Adds [{ MaxLength: [100] }] rule
   *   name: string;             // Final rules: ["Required", { MinLength: [5] }, { MaxLength: [100] }]
   * }
   * ```
   *
   * ### Type Parameters
   * - **TRuleParams**: Array type for rule parameters (default: `ValidatorRuleParams`)
   *   - Defines the parameter structure for validation rules
   *   - Must extend `ValidatorRuleParams` for type safety
   *   - Example: `[minLength: number]` for MinLength rule
   *
   * - **Context**: Type of the validation context (default: `unknown`)
   *   - Optional context passed to rule functions
   *   - Enables context-aware validation logic
   *   - Example: `{ userId: 123, permissions: ['read'] }`
   *
   * ### Rule Input Types
   * Accepts validation rules in two formats:
   * - **Single Rule**: `ValidatorRule<TRuleParams, Context>`
   * - **Rule Array**: `ValidatorRule<TRuleParams, Context>[]`
   *
   * ### Metadata Storage
   * Rules are stored using TypeScript's Reflect Metadata API:
   * ```typescript
   * // Metadata structure on class constructor
   * {
   *   [VALIDATOR_TARGET_RULES_METADATA_KEY]: {
   *     propertyName: [rule1, rule2, rule3, ...],
   *     anotherProperty: [ruleA, ruleB, ...],
   *     ...
   *   }
   * }
   * ```
   *
   * ### Usage Examples
   *
   * #### Basic Property Decoration
   * ```typescript
   * // Create a simple required decorator
   * const IsRequired = Validator.buildPropertyDecorator("Required");
   *
   * class User {
   *   @IsRequired
   *   name: string;  // Property now has ["Required"] rule attached
   * }
   * ```
   *
   * #### Parameterized Rule Decoration
   * ```typescript
   * // Create a min length decorator
   * const MinLength = Validator.buildPropertyDecorator({ MinLength: [5] });
   *
   * class Product {
   *   @MinLength
   *   name: string;  // Property has [{ MinLength: [5] }] rule attached
   * }
   * ```
   *
   * #### Multiple Rules on One Property
   * ```typescript
   * class Contact {
   *   @Validator.buildPropertyDecorator("Required")
   *   @Validator.buildPropertyDecorator({ MinLength: [3] })
   *   @Validator.buildPropertyDecorator({ MaxLength: [50] })
   *   name: string;  // Accumulates all three rules
   * }
   * ```
   *
   * #### Array Rule Input
   * ```typescript
   * // Attach multiple rules at once
   * const NameRules = Validator.buildPropertyDecorator([
   *   "Required",
   *   { MinLength: [2] },
   *   { MaxLength: [100] }
   * ]);
   *
   * class Person {
   *   @NameRules
   *   fullName: string;  // All rules attached in single decorator
   * }
   * ```
   *
   * ### Advanced Usage with Custom Rules
   * ```typescript
   * // Custom validation function
   * const customRule = ({ value }) => value.startsWith('prefix_') || 'Must start with prefix_';
   *
   * const Prefixed = Validator.buildPropertyDecorator(customRule);
   *
   * class Config {
   *   @Prefixed
   *   apiKey: string;  // Uses custom validation function
   * }
   * ```
   *
   * ### Context-Aware Rules
   * ```typescript
   * interface UserContext {
   *   isAdmin: boolean;
   *   department: string;
   * }
   *
   * const contextRule = ({ value, context }) => {
   *   const userCtx = context as UserContext;
   *   if (userCtx.isAdmin) return true;  // Admins bypass validation
   *   return value.length >= 5 || 'Non-admin users need longer values';
   * };
   *
   * const AdminBypass = Validator.buildPropertyDecorator<UserContext>(contextRule);
   *
   * class Document {
   *   @AdminBypass
   *   title: string;  // Validation depends on user context
   * }
   * ```
   *
   * ### Comparison with Higher-Level Factories
   *
   * **buildPropertyDecorator (Low-Level):**
   * - Works directly with rule objects and metadata
   * - Requires manual rule specification
   * - Maximum flexibility and control
   * - Used internally by other decorator factories
   * - Example: `buildPropertyDecorator("Required")`
   *
   * **buildRuleDecorator (Mid-Level):**
   * - Creates decorator factories with parameter handling
   * - Supports rest parameters and rule wrapping
   * - Used for single validation rules with parameters
   * - Example: `buildRuleDecorator(ruleFunc)` returns factory for `@MinLength([5])`
   *
   * **buildMultiRuleDecorator (High-Level):**
   * - Creates decorators for multi-rule validation
   * - Handles OneOf/AllOf/ArrayOf patterns
   * - Used for complex validation logic
   * - Example: `buildMultiRuleDecorator(ruleFunc)` returns factory for `@OneOf(['Email', 'Phone'])`
   *
   * ### Implementation Details
   * This method uses the imported `buildPropertyDecorator` helper:
   * ```typescript
   * return buildPropertyDecorator<ValidatorRule<TRuleParams, Context>[]>(
   *   VALIDATOR_TARGET_RULES_METADATA_KEY,  // Metadata key for storage
   *   (oldRules) => {                        // Accumulation function
   *     return [
   *       ...(Array.isArray(oldRules) ? oldRules : []),  // Preserve existing
   *       ...(Array.isArray(rule) ? rule : [rule]),      // Add new rules
   *     ];
   *   }
   * );
   * ```
   *
   * ### Performance Characteristics
   * - **Decoration time**: Minimal overhead (metadata storage only)
   * - **Runtime impact**: No performance cost during decoration
   * - **Validation time**: Rules discovered efficiently via metadata lookup
   * - **Memory usage**: Stores rule references (not rule execution)
   * - **Accumulation**: Efficient array concatenation for multiple decorators
   *
   * ### Error Handling
   * - **Invalid rules**: Stored as-is (validation errors occur during `validateClass`)
   * - **Metadata failures**: Falls back gracefully if Reflect Metadata unavailable
   * - **Type mismatches**: TypeScript prevents invalid rule types at compile time
   * - **Runtime errors**: Handled during validation, not decoration
   *
   * ### Integration with Validation System
   * - **Metadata discovery**: Rules found by `getDecoratedProperties()` during validation
   * - **Parallel execution**: All property rules validated simultaneously in `validateClass()`
   * - **Error aggregation**: Property-level errors collected with field names
   * - **Context propagation**: Validation context passed to all rule functions
   * - **i18n support**: Error messages localized through validation system
   *
   * ### Type Parameters
   * - **TRuleParams**: Parameter array type for validation rules
   *   - Defaults to `ValidatorRuleParams` for maximum compatibility
   *   - Constrains rule parameter structures for type safety
   *   - Example: `[number]` for single numeric parameter
   *
   * - **Context**: Validation context type
   *   - Defaults to `unknown` for flexibility
   *   - Passed to rule functions for context-aware validation
   *   - Example: `{ user: User, permissions: string[] }`
   *
   * @param rule - Validation rule(s) to attach to properties
   *   - Can be a single `ValidatorRule<TRuleParams, Context>`
   *   - Or an array of `ValidatorRule<TRuleParams, Context>[]`
   *   - Rules are accumulated when multiple decorators applied
   *   - Invalid rules stored but cause validation errors later
   *
   * @returns PropertyDecorator function that:
   *   - Attaches the specified rule(s) to class properties
   *   - Accumulates rules when multiple decorators applied
   *   - Stores rules as metadata for validation discovery
   *   - Works with `validateClass()` for class validation
   *   - Enables type-safe property-level validation
   *
   * @example
   * ```typescript
   * // Create basic validation decorators
   * const IsRequired = Validator.buildPropertyDecorator("Required");
   * const IsEmail = Validator.buildPropertyDecorator("Email");
   * const MinLength5 = Validator.buildPropertyDecorator({ MinLength: [5] });
   *
   * // Use in class definitions
   * class User {
   *   @IsRequired
   *   @MinLength5
   *   name: string;
   *
   *   @IsEmail()
   *   email: string;
   *
   *   @Validator.buildPropertyDecorator([
   *     "Required",
   *     { MinLength: [8] },
   *     { MaxLength: [128] }
   *   ])
   *   password: string;
   * }
   *
   * // Validate the class
   * const result = await Validator.validateClass(User, {
   *   data: {
   *     name: "John",
   *     email: "john@example.com",
   *     password: "secure123"
   *   }
   * });
   *
   * console.log(result.success); // true if all validations pass
   * ```
   *
   * @see {@link buildRuleDecorator} - Higher-level decorator factory with parameter handling
   * @see {@link buildMultiRuleDecorator} - For multi-rule validation patterns
   * @see {@link buildClassRuleDecorator} - For nested class validation
   * @see {@link validateClass} - Class validation method that uses these decorators
   * @see {@link getDecoratedProperties} - Metadata discovery for validation
   * @see {@link ValidatorRule} - Rule type attached by this decorator
   * @see {@link VALIDATOR_TARGET_RULES_METADATA_KEY} - Metadata key for rule storage
   * @public
   */
  static buildPropertyDecorator<
    TRuleParams extends ValidatorRuleParams = ValidatorRuleParams,
    Context = unknown,
  >(
    rule:
      | BuildPropertyDecorator<TRuleParams, Context>
      | BuildPropertyDecorator<TRuleParams, Context>[]
  ): PropertyDecorator {
    return buildPropertyDecorator<
      BuildPropertyDecorator<TRuleParams, Context>[]
    >(VALIDATOR_TARGET_RULES_METADATA_KEY, (oldRules) => {
      return [
        ...(Array.isArray(oldRules) ? oldRules : []),
        ...(Array.isArray(rule) ? rule : [rule]),
      ];
    });
  }
}

/**
 * ## ValidationClassOptions Class Decorator
 *
 * Class decorator that configures validation behavior for a target class.
 * This decorator allows you to set class-level validation options that will
 * be automatically applied whenever `validateClass` is called on the class.
 *
 * ### Configuration Options
 * - **errorMessageBuilder**: Custom function to format validation error messages
 * - **context**: Default validation context for all validations
 * - **stopOnFirstError**: Whether to stop validation at first error (future feature)
 * - **locale**: Specific locale for error messages (future feature)
 *
 * ### Use Cases
 * - **Consistent Error Formatting**: Apply uniform error message styling across a class
 * - **Context Injection**: Provide default context for validation rules
 * - **Custom Validation Behavior**: Override default validation behavior per class
 *
 * @example
 * ```typescript
 * // Basic usage with custom error formatting
 * @ValidationClassOptions({
 *   errorMessageBuilder: (fieldName, error) => {
 *     return `🚫 ${fieldName.toUpperCase()}: ${error}`;
 * // {
 * //   email: ['Required', 'Email'],
 * //   name: ['Required', 'MinLength', 'MaxLength'],
 * //   age: ['Number']  // IsOptional doesn't add a rule
 * // }
 *
 * // Check if a property has specific rules
 * const emailRules = rules.email;
 * const hasEmailValidation = emailRules.includes('Email');
 *   name: string;
 * }
 *
 * // When validation fails, errors will be formatted as:
 * // "🚫 EMAIL: Invalid email format"
 * // "🚫 NAME: Must be at least 3 characters"
 *
 * // Advanced usage with context and detailed formatting
 * @ValidationClassOptions({
 *   errorMessageBuilder: (translatedName, error, builderOptions) => {
 *     const { propertyName, ruleName, separators } = builderOptions;
 *
 *     // Custom formatting based on rule type
 *     if (ruleName === 'required') {
 *       return `❗ ${translatedName} is mandatory`;
 *     }
 *
 *     if (ruleName === 'email') {
 *       return `📧 Please enter a valid email for ${translatedName}`;
 *     }
 *
 *     return `⚠️ ${translatedName}: ${error}`;
 *   }
 * })
 * class DetailedUser {
 *   @IsRequired()
 *   @IsEmail()
 *   email: string;
 *
 *   @IsRequired()
 *   name: string;
 * }
 * ```
 *
 * ### Context-Aware Validation
 * ```typescript
 * interface UserValidationContext {
 *   isAdmin: boolean;
 *   permissions: string[];
 *   organizationId: string;
 * }
 *
 * @ValidationClassOptions({
 *   errorMessageBuilder: (fieldName, error, { context }) => {
 *     const userContext = context as UserValidationContext;
 *     if (userContext?.isAdmin) {
 *       return `[ADMIN] ${fieldName}: ${error}`;
 *     }
 *     return `${fieldName}: ${error}`;
 *   }
 * })
 * class AdminUser {
 *   @IsRequired()
 *   @IsEmail()
 *   email: string;
 *
 *   @CustomRule([
 *     ({ value, context }) => {
 *       const { isAdmin, permissions } = context as UserValidationContext;
 *       return isAdmin && permissions.includes('manage-users') ||
 *              'Admin privileges required';
 *     }
 *   ])
 *   adminAction: string;
 * }
 * ```
 *
 * ### Internationalization Support
 * ```typescript
 * @ValidationClassOptions({
 *   errorMessageBuilder: (translatedName, error, { data }) => {
 *     // Use translated property names and localized error formatting
 *     const locale = data.preferredLocale || 'en';
 *
 *     switch (locale) {
 *       case 'fr':
 *         return `❌ ${translatedName} : ${error}`;
 *       case 'es':
 *         return `❌ ${translatedName}: ${error}`;
 *       default:
 *         return `❌ ${translatedName}: ${error}`;
 *     }
 *   }
 * })
 * class InternationalUser {
 *   @IsRequired()
 *   @IsEmail()
 *   email: string;
 *
 *   preferredLocale?: string;
 * }
 * ```
 *
 * @param validationOptions - Configuration object for validation behavior
 * @param validationOptions.errorMessageBuilder - Custom error message formatting function
 *
 * @returns Class decorator function that applies the validation configuration
 *
 *
 * @see {@link validateClass} - Method that uses these options
 * @see {@link getValidatorClassOptions} - Retrieves configured options
 * @decorator
 * @public
 */
export function ValidationClassOptions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validationOptions: ValidatorClassOptions<any, any>
): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return function (targetClass: Function) {
    Reflect.defineMetadata(
      VALIDATOR_TARGET_OPTIONS_METADATA_KEY,
      validationOptions,
      targetClass
    );
  };
}

function createSuccessResult<Context = unknown>(
  options: {
    context?: Context;
    value: unknown;
    data?: Dictionary;
  },
  startTime: number
): ValidatorSuccess<Context> {
  return {
    ...options,
    status: 'success',
    name: 'ValidatorSuccessResult',
    success: true,
    validatedAt: new Date(),
    duration: Date.now() - startTime,
  };
}
type ValidatorDefaultArray = Array<unknown>;

/** Metadata keys for storing validation target information on classes */
const VALIDATOR_TARGET_RULES_METADATA_KEY = Symbol.for('validatorClassRules');
const VALIDATOR_TARGET_OPTIONS_METADATA_KEY = Symbol.for(
  'validatorClassOptions'
);

/**
 * Checks if a rule function has a specific marker.
 * @param ruleFunc - The rule function to check
 * @param marker - The marker symbol to check for
 * @returns true if the function has the specified marker
 */
function hasRuleMarker(ruleFunc: unknown, marker: symbol): boolean {
  if (typeof ruleFunc !== 'function') {
    return false;
  }
  const m = getRuleMarker(ruleFunc, marker);
  return Boolean(m?.validatorRuleFuncMarked);
}
function getRuleMarker(
  ruleFunc: unknown,
  marker: symbol
): ValidatorRuleMarkerMeta | null {
  if (typeof ruleFunc !== 'function') {
    return null;
  }
  return Object.assign(
    {},
    (ruleFunc as unknown as Record<symbol, unknown>)[marker]
  );
}
function markRuleName(ruleFunc: unknown, ruleName: ValidatorRuleName): void {
  if (typeof ruleFunc === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ruleFunc as any)[VALIDATOR_RULE_MARKERS.ruleName] = ruleName;
  }
}
function getMarkedRuleName(ruleFunc: unknown): ValidatorRuleName | undefined {
  if (typeof ruleFunc == 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const markedRuleName = (ruleFunc as any)[VALIDATOR_RULE_MARKERS.ruleName];
    return isNonNullString(markedRuleName) ? markedRuleName : undefined;
  }
}
/**
 * Marks a rule function with a specific marker symbol.
 * Used during decorator creation to mark OneOf, AllOf, ArrayOf, ValidateNested rules.
 * @param ruleFunc - The rule function to mark
 * @param marker - The marker symbol to apply
 */

function markRuleWithSymbol(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ruleFunc: any,
  marker: symbol,
  meta?: ValidatorRuleMarkerMeta
): void {
  if (typeof ruleFunc === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ruleFunc as any)[marker] = {
      ...meta,
      validatorRuleFuncMarked: true,
      ruleName: meta?.ruleName ?? marker,
    };
  }
}

type ValidatorRuleMarkerMeta = Dictionary & {
  validatorRuleFuncMarked?: boolean;
  ruleName?: ValidatorRuleName;
};

type BuildPropertyDecorator<
  TRuleParams extends ValidatorRuleParams = ValidatorRuleParams,
  Context = unknown,
> =
  | ValidatorRule<TRuleParams, Context>
  | ValidatorSanitizedRuleObject<TRuleParams, Context>;
