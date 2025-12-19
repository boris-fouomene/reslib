---
'reslib': major
---

# Validator Error Messages: Complete i18n Overhaul

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
