## 1.0.3 (2025-12-09)

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
