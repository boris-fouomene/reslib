## 2.6.1

### Patch Changes

- build: Generate CommonJS wrapper files for all library modules.

## 2.6.0

### Minor Changes

- feat: enhance CurrencyFormatter with unformat and improved formatting options

## 2.5.0

### Minor Changes

- chore: update dependencies and improve type definitions
  - Bump @changesets/cli to version 2.30.0
  - Add @eslint/js as a new dependency
  - Update various [@types](https://github.com/types) and eslint packages to their latest versions
  - Improve type definition in isPromise function to return a more specific type
  - Remove unused code in \_abreviateNumber function
  - Clean up type definitions in Validator class methods

## 1.0.3 (2025-12-09)

## 2.4.0

### Minor Changes

- Refactor `CountryRegistry` to improve testability and feature completeness.
  - **Breaking Change**: `CountryRegistry.setCountries` now returns `void` instead of the updated `Countries` object. This aligns with standard setter patterns and simplifies the implementation.
  - **Refactor**: Internal storage now uses `Reflect` metadata, improving compatibility with framework patterns.
  - **Feature**: Added `dialCodePriority` to the `Country` interface to help resolve ambiguous dial codes (e.g., +1).
  - **Feature**: Enhanced `getCountry` and `setCountry` logic to correctly prioritize and merge i18n translations with registry data.
  - **Refactor**: `isValid` now only enforces the presence of `code`, allowing for more flexible partial inputs.
  - **Documentation**: Added comprehensive documentation in `src/countries/README.md` inclusive of usage examples and augmentation guides.

## 2.3.3

### Patch Changes

- test(JsonHelper): add additional test case for isJSON method with complex JSON string

## 2.3.2

### Patch Changes

- ## BaseException: Root Cause Normalization

  ### New Feature: Automatic Cause Chain Flattening

  `BaseException` now implements **intelligent cause normalization** that automatically extracts the root cause from nested exception chains. This prevents the "t.toJSON is not a function" error and simplifies error analysis.

  #### Problem Solved

  When exceptions wrap other exceptions multiple times (common in layered architectures), the cause chain could become deeply nested with duck-typed `BaseException` objects (e.g., from `JSON.parse()`) that lack actual methods. This caused serialization failures:

  ```typescript
  // Previously would throw "t.toJSON is not a function"
  const parsed = JSON.parse(serializedError);
  const wrapped = new BaseException('Wrapper', { cause: parsed });
  wrapped.toJSON(); // ❌ Error!
  ```

  #### How It Works

  The new `normalizeCause()` method recursively unwraps `BaseException` instances to find the ultimate origin of the error:

  ```typescript
  const rootDbError = new Error('ECONNREFUSED');
  const level3 = new BaseException('Query failed', { cause: rootDbError });
  const level2 = new BaseException('Service error', { cause: level3 });
  const level1 = new BaseException('API error', { cause: level2 });

  // The cause is NORMALIZED to the root error
  console.log(level1.cause === rootDbError); // ✅ true (not level2!)
  ```

  #### Key Behaviors

  | Scenario                                         | Cause Value                  | Normalized To      |
  | ------------------------------------------------ | ---------------------------- | ------------------ |
  | `cause` is an `Error`                            | `new Error('fail')`          | The `Error` itself |
  | `cause` is a `BaseException` with a root `Error` | `BaseException <- Error`     | The root `Error`   |
  | `cause` is a deep `BaseException` chain          | `BE <- BE <- BE <- Error`    | The root `Error`   |
  | `cause` is a `BaseException` with no root        | `BaseException <- undefined` | `undefined`        |
  | `cause` is a plain object                        | `{ code: 500 }`              | The object itself  |
  | `cause` is a string                              | `'Something failed'`         | The string itself  |

  #### New Methods
  - **`normalizeCause<T>(cause: unknown): T`** - Extracts the deepest non-BaseException cause from a chain
  - **Enhanced `serializeCause(cause, depth)`** - Now uses `normalizeCause()` and `JsonHelper.stringify()` for safe serialization

  #### Override for Custom Behavior

  If you need to preserve the full chain or implement custom normalization logic:

  ```typescript
  class ChainPreservingException extends BaseException {
    // Preserve the full chain (disable normalization)
    normalizeCause<T>(cause: unknown): T {
      return cause as T; // No unwrapping
    }
  }
  ```

  ### Documentation
  - Added comprehensive JSDoc documentation to `normalizeCause()` and `serializeCause()` methods
  - Updated `BaseException.md` with detailed explanation of cause normalization behavior
  - Added practical examples for error wrapping patterns in layered architectures

  ### Tests
  - Updated test suite to reflect new normalization behavior
  - Added tests for duck-typed exception handling with nested errors
  - All 42 exception tests passing

## 2.3.1

### Patch Changes

- feat: Add new utility functions for type checking (isRegex, isNumber, isPrimitive, isPromise, isEmpty, isNonNullString, isEmail) and URI manipulation.

## 2.3.0

### Minor Changes

- ## 🚀 Validator Enhancements (v2.3.0)

  ### Conditional Validation (New Feature)
  - **`@If` Rule**: Added a powerful new conditional validation rule that allows dynamic application of rules based on runtime context, data state, or value content.
  - **`Validator.if()`**: Introduced a fluent API factory for creating conditional rules programmaticallly.
  - **`Validator.validateIfRule()`**: Added public method for executing conditional validation logic imperatively.
  - **Dynamic Resolvers**: Implemented `ValidatorIfResolver` type to support both synchronous and asynchronous path resolution in `@If` rules.
  - **Context Access**: Resolvers have full access to the validation `context` and `rootData`, enabling cross-field dependency checks (e.g., "required if type is 'business'").

  ### API Improvements & Refactoring
  - **Exposed Decorator Builder**: Publicly exposed `Validator.createPropertyDecoratorFromRule` (formerly `_buildRuleDecorator`). This method matches the internal functionality of `buildRuleDecorator` but is designed for creating _bound_ decorator instances directly from rule parameters, clarifying the distinction between factory-builders and decorator-creators.
  - **Enhanced Message Config**: Updated `ValidatorMessageConfig` to support consistent custom error message definitions across all rule types (including the new `@If` rule).

  ### Documentation
  - **New Section**: Added comprehensive "Conditional Validation" section to `GUIDE.md` with 4 detailed examples (Role-Based, Dependent Fields, Async Logic).
  - **API Reference**: Updated `API_REFERENCE.md` with full documentation for `Validator.if`, `Validator.validateIfRule`, `createPropertyDecoratorFromRule`, and related types.
  - **Rules Reference**: Added `@If` rule entry to `RULES.md` with parameter specifications.

  ### Versioning
  - Bumped `reslib` version to `2.3.0` to reflect these feature additions.

## 2.2.0

### Minor Changes

- ## Features
  - **Validator**: Enhanced `IsEnum` decorator to accept an array of values as a single argument (e.g., `@IsEnum([Value1, Value2])`), improving support for array-based enum definitions and cleaner syntax.
  - **Validator**: Added `Validator.buildRuleArrayDecorator` to easily create custom validation rules that accept parameters as a single array/object argument.
  - **Utils**: Updated `JsonHelper.stringify` to support the standard `JSON.stringify` signature (`value, replacer, space`) while maintaining backward compatibility for the `decycle` parameter.

  ## Improvements
  - Updated JSDoc documentation for `JsonHelper.stringify` and `Validator.buildRuleArrayDecorator`.
  - Fixed lint errors in `JsonHelper`.

## 2.1.1

### Patch Changes

- ## Features
  - **I18n**: Introduced core `I18n` class and related types for managing translations, interpolation, and locale settings.

## 2.1.0

### Minor Changes

- Refactor I18n Module:
  - **Architecture**: Removed external dependency on `i18n-js`. The module is now fully standalone, lightweight, and optimized for TypeScript.
  - **Behavioral Changes**:
    - **Fallback Keys Standardized**: When passing an array of keys (`t(['primary', 'secondary'])`), the system now strictly respects priority.
    - **Missing Key Output**: If all keys in a fallback array are missing, the method now returns the **first key** (`'primary'`) instead of a joined string. This ensures consistent and predictable return values.
  - **Documentation**:
    - Completely rewrote `README.md` to be a comprehensive reference manual.
    - Added deep-dive sections for **Interpolation** (nested objects), **Lazy Loading** (Namespaces), and **Class Decorators**.
    - Clarified the interaction between `setLocale` and lazy-loaded namespaces (automatic reloading).
  - **Testing**:
    - Implemented a rigorous test suite with over 50 new test cases.
    - Added coverage for edge cases: deeply nested fallbacks, cross-locale fallback chains (`fr` -> `en`), and complex interpolation scenarios.
  - **Type Safety**:
    - Enhanced `I18nScope` and `I18nTranslations` types for better IDE support and type inference.

## 2.0.3

### Patch Changes

- 7712ba6: Fix validator error extraction in BaseException.getValidatorError() to correctly check error.cause instead of non-existent error.validatorError property. Add JSDoc annotations to ValidatorError interface for better documentation.

## 2.0.2

### Patch Changes

- **New Features**: Added comprehensive validator error type guards and enhanced documentation

  ### New Methods

  #### Validator Class
  - **`Validator.isAnyError()`**: Universal type guard to check for any validator error type (ValidatorError | ValidatorClassError | ValidatorBulkError)
    - Provides convenient single method to detect all validation failures
    - Short-circuits on first match for optimal performance
    - Includes comprehensive documentation with 5 detailed examples

  #### BaseException Class
  - **`BaseException.isAnyValidatorError()`**: Alias for `Validator.isAnyError()`
    - Provides consistent API across exception and validator modules
    - Delegates to `Validator.isAnyError()` for unified implementation
    - Includes comprehensive documentation with 4 detailed examples
  - **`BaseException.isValidatorError()`**: Type guard for single field validation errors
  - **`BaseException.isValidatorClassError()`**: Type guard for class validation errors
  - **`BaseException.isValidatorBulkError()`**: Type guard for bulk validation errors
  - **`BaseException.getValidationError()`**: Extracts validation errors from exceptions or errors

  ### Documentation Enhancements

  Enhanced documentation for all validator type guard methods with:
  - **Purpose sections**: Clear explanation of when and why to use each method
  - **When to Use/NOT to Use**: Practical guidance for appropriate usage
  - **Multiple examples**: 4-5 real-world examples per method showing:
    - Basic usage patterns
    - Error handling and logging
    - Form validation and field mapping
    - Bulk processing and retry logic
    - API response handling
  - **Remarks sections**: Detailed property listings, type narrowing behavior, and performance characteristics
  - **Cross-references**: Links to related methods and types

  Methods with enhanced documentation:
  - `Validator.isError()` - Single field validation error detection
  - `Validator.isClassError()` - Class/object validation error detection
  - `Validator.isBulkError()` - Bulk/array validation error detection
  - `Validator.isAnyError()` - Universal validator error detection

  ### Benefits
  1. **Improved Developer Experience**:
     - Single method to check for any validation error type
     - Comprehensive examples for common use cases
     - Clear guidance on when to use each type guard
  2. **Better Type Safety**:
     - TypeScript type narrowing for all error types
     - Union type support for generic error handling
     - No need for manual type assertions
  3. **Enhanced Error Handling**:
     - Easier to distinguish validation errors from other errors
     - Simplified error classification in catch blocks
     - Better integration with exception handling systems
  4. **Performance**:
     - O(1) complexity for all type guards
     - Short-circuit evaluation for optimal speed
     - No memory allocation or object creation

  ### Migration

  No breaking changes. All new methods are additive and backward compatible.

  **Recommended usage**:

  ```typescript
  // Check for any validation error
  if (Validator.isAnyError(error)) {
    // Handle all validation errors generically
  }

  // Or use specific type guards
  if (Validator.isClassError(error)) {
    // Handle class validation errors specifically
    error.fieldErrors.forEach((fieldError) => {
      console.log(`${fieldError.field}: ${fieldError.message}`);
    });
  }
  ```

## 2.0.1

### Patch Changes

- **BREAKING CHANGE**: Changed validation error HTTP status code from 422 to 400
  - Changed `ValidatorError.statusCode` from `422` (Unprocessable Entity) to `400` (Bad Request) to align with standard REST API conventions and NestJS best practices
  - Updated `Validator.isError()` check to validate against status code `400` instead of `422`
  - Added `validationError` property to `BaseException` to track the underlying validation error
  - Added `BaseException.isValidationError()` static method to check if an error is a validation error
  - Added `BaseException.getValidationError()` static method to extract validation errors from exceptions

  This change improves consistency with HTTP standards where 400 is the conventional status code for client-side validation failures.

## 2.0.0

### Major Changes

- 8ec84e9: # Validator Error Messages: Complete i18n Overhaul

  ## Breaking Changes

  This release introduces a comprehensive overhaul of validation error messages to provide full internationalization support and significantly improved user experience. **This is a breaking change** as the error message format has been completely redesigned.

  ### What Changed

  #### 1. Class Validation Error Messages (`validateClass`)

  **Old Behavior:**
  - Generic message: `"Validation failed for 2 fields"`
  - No indication of which fields failed
  - Hardcoded English text

  **New Behavior:**
  - Descriptive message with field names: `"Validation failed for 2 fields: Email, Password"`
  - Uses **translated field names** from `@Translate()` decorator
  - Fallback chain: `translatedPropertyName` → `fieldName` → `propertyName`
  - Smart truncation: Shows up to 3 fields, then `"2 more"` (fully localized)
  - All text uses i18n translation keys

  **Example Output:**

  ```typescript
  // Single field failure
  'Validation failed for field: Email Address';

  // Multiple fields (≤3)
  'Validation failed for 2 fields: Email, Password';

  // Many fields (>3)
  'Validation failed for 5 fields: Email, Password, Name, 2 more';
  ```

  #### 2. Array Validation Error Messages (`validateArrayOfRule`)

  **Old Behavior:**
  - Generic header: `"Validation failed for 2 items"`
  - Item errors: `"#0: error message, #1: error message"`
  - Hardcoded format with `#` prefix

  **New Behavior:**
  - Contextual summary: `"Array validation failed for 2 of 5 items at indices: 0, 1"`
  - Shows **which items** failed (indices)
  - Shows **total count** for context
  - Detailed errors: `"Item[0]: error message, Item[1]: error message"`
  - Smart truncation for many failures
  - All text uses i18n translation keys

  **Example Output:**

  ```typescript
  // Single item failure
  'Array validation failed for item at index: 1';
  // Details: "Item[1]: This field must be a valid email address"

  // Multiple items
  'Array validation failed for 2 of 5 items at indices: 1, 3';
  // Details: "Item[1]: Invalid email, Item[3]: Invalid email"

  // Many items (>3)
  'Array validation failed for 5 of 10 items at indices: 0, 2, 4, 2 more items';
  ```

  ### Migration Guide

  #### For Class Validation

  If your code checks for specific error message text:

  ```typescript
  // ❌ Old code that will break
  if (result.message.includes('failed for one field')) {
    // ...
  }

  // ✅ New code
  if (!result.success && result.fieldCount === 1) {
    // Or check for the new message format
    if (result.message.includes('Validation failed for field:')) {
      // ...
    }
  }
  ```

  #### For Array Validation

  If your code parses array validation errors:

  ```typescript
  // ❌ Old code that will break
  if (result.includes('#0:')) {
    // ...
  }

  // ✅ New code
  if (result.includes('Item[0]:')) {
    // Or better: use the structured error data
    if (!result.success) {
      result.errors.forEach((error) => {
        // Access structured error information
      });
    }
  }
  ```

  ### New Translation Keys

  #### Class Validation

  ```typescript
  classValidationFailed: {
    one: 'Validation failed for field: %{fields}',
    other: 'Validation failed for %{fieldCount} fields: %{fields}',
  }

  fieldListOverflow: {
    one: '1 more',
    other: '%{count} more',
  }
  ```

  #### Array Validation

  ```typescript
  arrayValidationFailed: {
    one: 'Array validation failed for item at index: %{items}',
    other: 'Array validation failed for %{itemCount} of %{totalCount} items at indices: %{items}',
  }

  itemListOverflow: {
    one: '1 more item',
    other: '%{count} more items',
  }

  arrayItemError: 'Item[%{index}]: %{message}'
  ```

  ### Deprecated Keys

  The following translation keys are now **deprecated** but still functional for backward compatibility:
  - `validator.failedForNFields` → Use `validator.classValidationFailed`
  - `validator.failedForNItems` → Use `validator.arrayValidationFailed`

  ### Benefits
  1. **Full Internationalization**: Every piece of text uses i18n keys
     - Separators customizable per language (`,` vs `、` vs `،`)
     - Overflow text fully localized
     - Number formatting respects locale
  2. **Better User Experience**: Users immediately see which fields/items failed
     - No need to scan through all errors to find the problem
     - Translated field names for better readability
     - Context-aware messages (e.g., "2 of 5 items")
  3. **Improved Developer Experience**:
     - More informative error messages during development
     - Easier debugging with field/item identification
     - Consistent error format across class and array validation
  4. **Accessibility**: Screen readers can better announce validation errors with proper field names

  ### Technical Details

  #### Implementation Changes
  1. **Field Name Resolution** (Class Validation):
     - Deduplicates field names (same field with multiple errors appears once)
     - Uses `Map<propertyName, displayName>` for efficient lookup
     - Preserves order of first occurrence
  2. **Index Tracking** (Array Validation):
     - Stores `{ index, message }` tuples for failed items
     - Provides both summary (indices) and details (full errors)
     - Maintains original array order
  3. **Separator Handling**:
     - Uses existing `validator.separators.multiple` for consistency
     - Respects language-specific separator preferences
     - Applies to both field lists and item lists

  ### Testing

  All 2,322 tests passing, including:
  - Updated tests for new error message format
  - Backward compatibility tests for deprecated keys
  - Localization tests for different languages
  - Edge cases (empty arrays, single fields, overflow scenarios)

  ### Upgrade Recommendation

  **Recommended for all users** despite being a breaking change. The improved error messages significantly enhance user experience and debugging capabilities. The migration effort is minimal for most applications.

  If you have custom error message parsing or display logic, review the migration guide above and update your code accordingly.

## 1.2.0

### Minor Changes

- feat: Introduce a comprehensive validation system with various rules, multi-rules, decorators, and documentation.

  feat: Introduce a comprehensive validation system with various rules, multi-rules, decorators, and documentation.

  feat: Add comprehensive validation and exception handling modules with rules, types, errors, and tests.

  feat: introduce core types for the validation system, including rule definitions and validation results.

  feat: add ValidatorError, ValidatorClassError, and ValidatorBulkError classes with their respective interfaces for structured validation error handling

## 1.1.1

### Patch Changes

- feat: add i18n module with enhanced I18n class, @Translate decorator, and related tests

## 1.1.0

### Minor Changes

- chore: add changeset configuration and update package.json dependencies
  - Added changeset commands to package.json for versioning and publishing.
  - Updated devDependencies:
    - Added @changesets/cli version 2.29.8.
    - Updated @types/node to version 24.10.2.
    - Updated @typescript-eslint/eslint-plugin and parser to version 8.49.0.
    - Updated prettier to version 3.7.4.
    - Updated ts-jest to version 29.4.6.
    - Updated typedoc to version 0.28.15.
  - Created a new changeset configuration file with default settings.

### Bug Fixes

- add missing commas in README examples for clarity ([2f6f749](https://github.com/boris-fouomene/reslib/commit/2f6f749c2d65d38b29e799ac16176893b8227df1))
- uncomment id property in AuthUser interface for clarity ([47c9227](https://github.com/boris-fouomene/reslib/commit/47c92277961995250d8fbc06da1b3bada265af05))
- update accessCode validation to use array syntax for OneOf decorator ([0b64808](https://github.com/boris-fouomene/reslib/commit/0b64808824a69d50b974577c0c0c7ac624486f85))
- Update IsEmail decorator to require parentheses for consistency ([1f356a4](https://github.com/boris-fouomene/reslib/commit/1f356a4eadb808a6f7ab47931ab32e67be3febc8))
- update module declaration paths in documentation comments ([6e9d2d8](https://github.com/boris-fouomene/reslib/commit/6e9d2d8119d057da40077aed1c35f891a02875ed))
- update session timestamp property name from authSessionCreatedAt to sessionCreatedAt ([da14aa2](https://github.com/boris-fouomene/reslib/commit/da14aa259d2b86d4f51eee93f92ad3d52b096575))

### Features

- add AttachAuthSecureStorage decorator for configurable secure storage implementations ([dba68eb](https://github.com/boris-fouomene/reslib/commit/dba68eb13872aae5001ff80e6cf45407c9bd7839))
- add ESLint configuration for TypeScript and improve pre-commit setup ([1cbc676](https://github.com/boris-fouomene/reslib/commit/1cbc676d5f25cd3f76d6fb4aceca67e861dde489))
- add ESLint, Prettier, Husky, and lint-staged for code quality ([31e9949](https://github.com/boris-fouomene/reslib/commit/31e9949fd14227b111a3dfaad2d13a8b8aa4c8c4))
- add isHexadecimal and isMongoId validation functions ([173cbf4](https://github.com/boris-fouomene/reslib/commit/173cbf467c145eb03831ea9dc01b091f598c0238))
- add secureStorage getter and setter for customizable authentication data storage ([4c87320](https://github.com/boris-fouomene/reslib/commit/4c87320ff39cf8a96d2042ed9478b24130a79e5b))
- enhance validation and utility functions ([da790c3](https://github.com/boris-fouomene/reslib/commit/da790c338d1cf067a84bb2ccb3311c5bb2639fd4))
- **image:** enhance isImageSrc function to support custom image extensions ([1dd74e1](https://github.com/boris-fouomene/reslib/commit/1dd74e14e3d047afc6bd5cef24323533633ea33f))
- implement AuthStorage interface for secure session management and update sessionCreatedAt property ([ad25b9c](https://github.com/boris-fouomene/reslib/commit/ad25b9c2468d6cc4c20871d8864b2b44d73ee4af))
- initial setup of reslib package with core modules and build system ([3670dad](https://github.com/boris-fouomene/reslib/commit/3670dadcebb14fe859fa109d4fdd4e948c278dda))
- update AuthUser interface to include email and username, and modify getKey method for improved session key generation ([c9f4505](https://github.com/boris-fouomene/reslib/commit/c9f450524187b0913f9e890304074d998c2b7267))
