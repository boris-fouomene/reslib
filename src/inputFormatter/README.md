# InputFormatter Module

The `InputFormatter` module is a comprehensive utility for formatting, masking, and validating various types of input values, including numbers, dates, and phone numbers. It leverages powerful libraries like `google-libphonenumber` and `moment` to provide robust internationalization support.

## Table of Contents

- [Features](#features)
- [Basic Usage](#basic-usage)
- [Formatting Values](#formatting-values)
  - [Numbers &amp; Decimals](#numbers--decimals)
  - [Dates &amp; Times](#dates--times)
  - [Phone Numbers](#phone-numbers)
  - [Custom Formats](#custom-formats)
- [Input Masking](#input-masking)
  - [Applying Masks](#applying-masks)
  - [Date Masks](#date-masks)
  - [Phone Number Masks](#phone-number-masks)
  - [Predefined Masks](#predefined-masks)
- [Utilities](#utilities)
- [Types](#types)

## Features

- **Universal Formatting**: Format any value (string, number, date) into a display-ready string.
- **Input Masking**: Apply complex masks (regex/pattern based) to inputs, useful for UI components.
- **Phone Number Handling**: comprehensive support for parsing, formatting, and validating international phone numbers.
- **Date/Time Integration**: Seamless integration with `moment.js` formats.
- **Number Abbreviation**: built-in support for abbreviating large numbers (e.g., 1.5M).

## Basic Usage

The primary entry point is the `InputFormatter` class. You can format values using `formatValue` (returns an object with details) or `formatValueAsString` (returns just the string).

```typescript
import { InputFormatter } from 'reslib/inputFormatter';

// Simple string formatting
const result = InputFormatter.formatValueAsString({
  value: 1234.56,
  type: 'money', // Assuming 'money' format is configured in global Number prototype extensions
});
// Output: "$1,234.56" (depending on locale)

// Detailed formatting result
const fullResult = InputFormatter.formatValue({
  value: '1234.56',
  type: 'decimal',
});
console.log(fullResult);
/*
{
  formattedValue: "1234.56",
  isDecimalType: true,
  parsedValue: 1234.56,
  decimalValue: 1234.56,
  ...
}
*/
```

## Formatting Values

### Numbers & Decimals

Format numbers with support for parsing strings, handling nulls, and potential abbreviations.

```typescript
// Basic Decimal
InputFormatter.formatValueAsString({ value: '1,234.56', type: 'decimal' }); // "1234.56"

// With Abbreviation
InputFormatter.formatValueAsString({
  value: 1500000,
  type: 'number',
  abreviateNumber: true,
}); // "1.5M" (approximate, depends on implementation)
```

### Dates & Times

Format dates using standard `DateFormat` strings or `moment` patterns.

```typescript
InputFormatter.formatValueAsString({
  value: new Date(),
  type: 'date',
  dateFormat: 'YYYY-MM-DD',
}); // "2023-10-27"

InputFormatter.formatValueAsString({
  value: '2023-10-27T10:00:00',
  type: 'time',
}); // "10:00"
```

### Phone Numbers

Format phone numbers with international standards.

```typescript
InputFormatter.formatValueAsString({
  value: '2025550123',
  type: 'tel',
  phoneCountryCode: 'US',
}); // "(202) 555-0123"
```

### Custom Formats

You can provide a custom formatting function.

```typescript
InputFormatter.formatValueAsString({
  value: 'secret',
  format: (opts) => `***${opts.value}***`,
}); // "***secret***"
```

## Input Masking

The module provides a powerful masking engine via `formatWithMask`.

### Applying Masks

```typescript
import { InputFormatter } from './inputFormatter';

const maskResult = InputFormatter.formatWithMask({
  value: '1234567890',
  mask: [
    '(',
    /\d/,
    /\d/,
    /\d/,
    ')',
    ' ',
    /\d/,
    /\d/,
    /\d/,
    '-',
    /\d/,
    /\d/,
    /\d/,
    /\d/,
  ],
  placeholderCharacter: '_',
});

console.log(maskResult.masked); // "(123) 456-7890"
console.log(maskResult.isValid); // true (if matches mask)
console.log(maskResult.unmasked); // "1234567890"
```

### Date Masks

Generate regex masks from Moment.js format strings automatically.

```typescript
const dateMask = InputFormatter.createDateMask('YYYY/MM/DD');
// dateMask.mask contains the regex array for this format
// dateMask.validate(value) checks if value matches format AND is a valid date
```

### Phone Number Masks

Dynamic masks based on country code and example numbers.

```typescript
const usPhoneMask = InputFormatter.createPhoneNumberMask('US');
// Returns a mask suitable for US numbers (e.g., (xxx) xxx-xxxx)
// Includes validation logic
```

### Predefined Masks

Access common masks via `InputFormatter.MASKS_WITH_VALIDATIONS`.

- `DATE`: Standard date mask
- `TIME`: Standard time mask
- `DATE_TIME`: Standard date-time mask
- `CREDIT_CARD`: Generic credit card masking

## Utilities

The class exposes several static utility methods:

### General Utilities

- **`parseDecimal(value: any): number`**
  Safely parses a string/number into a float, handling commas and whitespace. Returns `0` if invalid.

- **`normalizeNumber(value: any, decimalSeparator?: string): string`**
  Cleans a number string, removing whitespace and standardizing separators to the provided decimal separator (default '.').

- **`endsWithDecimalSeparator(value: any): boolean`**
  Checks if a value ends with a decimal separator (., ,, or ٫).

- **`isNumericString(n: string): boolean`**
  Strict check if a string represents a valid finite number.

- **`extractNumbersFromString(str: string): string`**
  Removes all non-numeric characters from a string.

- **`isValidMask(mask?: InputFormatterMask): boolean`**
  Checks if a provided mask is valid (array or function).

### Phone Number Utilities

- **`getCountryDialCode(countryCode: CountryCode): string`**
  Returns the international dial code (e.g., "1" for US) for a country.

- **`isValidPhoneNumber(phoneNumber: string, countryCode?: CountryCode): boolean`**
  Validates a phone number for a specific region using `google-libphonenumber`.

- **`formatPhoneNumber(phoneNumber: string, countryCode?: CountryCode): string | null`**
  Formats a phone number to international format (e.g., "+1 202 555 0123").

- **`parsePhoneNumber(number: string, countryCode?: CountryCode): PhoneNumber | null`**
  Parses a string into a `google-libphonenumber` `PhoneNumber` object.

- **`prefixPhoneNumberWithDialCode(phoneNumber: string, dialCode: string): string`**
  Ensures a phone number starts with the correct dial code.

- **`extractDialCodeFromPhoneNumber(phoneNumber: string, countryCode?: CountryCode): string`**
  Extracts the calling code from a full phone number string.

- **`getPhoneNumberExample(countryCode: CountryCode): PhoneNumber | null`**
  Returns a valid example phone number for the specified country.

- **`cleanPhoneNumber(phoneNumber: string): string`**
  Removes all whitespace and formatting characters from a phone number string.

- **`createPhoneNumberMaskFromExample(phoneNumber: string, countryCode?: CountryCode, format?: PhoneNumberFormat)`**
  Advanced: Generate a mask from a specific example number structure.

## Types

### `InputFormatterOptions`

Configuration object for `formatValue`.

- **`value`**: `any` - The input value to format.
- **`type`**: `string` - The type of input. Common values:
  - `'decimal' | 'numeric' | 'number'`: Treats value as a number.
  - `'date' | 'time' | 'datetime'`: Treats value as a date.
  - `'tel'`: Treats value as a phone number.
  - `'custom'`: Uses the custom format function.
- **`format`**: `InputFormatterValueFormat` - Formatting rule. Can be:
  - `'number'`: Standard number formatting.
  - `'money'`: Currency formatting.
  - `CurrencyFormatName`: Specific currency format (e.g., `'formatUSD'`).
  - `Function`: Custom formatter `(options) => string`.
- **`dateFormat`**: `DateFormat` (string) - Pattern for date formatting (e.g., `'YYYY-MM-DD'`). Defaults based on type.
- **`phoneCountryCode`**: `CountryCode` - ISO 3166-1 alpha-2 country code (e.g., `'US'`, `'FR'`) for phone parsing.
- **`abreviateNumber`**: `boolean` - If `true`, abbreviates large numbers (e.g., `1.5M`).

### `InputFormatterMaskOptions`

Configuration object for `formatWithMask`.

- **`value`**: `string` - The value to mask.
- **`mask`**: `InputFormatterMask` - The mask definition.
  - Can be an array of `string | RegExp`.
  - Can be a function returning the array.
- **`obfuscationCharacter`**: `string` - Character to use for obfuscated segments (default: `'*'`).
- **`placeholderCharacter`**: `string` - Character for empty slots in the mask (default: `'_'`).
- **`validate`**: `(value: string) => boolean` - Custom validation function run against the masked value.
- **`maskAutoComplete`**: `boolean` - If `true`, attempts to auto-complete the mask where possible.

### `InputFormatterResult`

Return object from `formatValue`.

- **`formattedValue`**: `string` - The final formatted string.
- **`isDecimalType`**: `boolean` - True if the input was treated as a decimal/number.
- **`parsedValue`**: `any` - The parsed raw value (number, Date, or string).
- **`decimalValue`**: `number` - The numeric representation (0 if not a number).
- **`value`**: `any` - The original input value.
- **`phoneNumber`**: `string` - (If phone type) The formatted phone number.
- **`dialCode`**: `string` - (If phone type) The extracted country dial code.
- **`dateValue`**: `Date` - (If date type) The parsed Date object.

### `InputFormatterMaskResult`

Return object from `formatWithMask`.

- **`masked`**: `string` - The value with the mask applied.
- **`unmasked`**: `string` - The raw value stripping mask characters.
- **`obfuscated`**: `string` - The value with obfuscation applied to secret segments.
- **`isValid`**: `boolean` - True if the value satisfies the mask and validation function.
- **`maskArray`**: `InputFormatterMaskArray` - The resolved mask array used.
- **`placeholder`**: `string` - The generated placeholder string showing the mask structure.
- **`maskedPlaceholder`**: `string` - The placeholder combined with the current value.
- **`maskedAutoCompleted`**: `string` - The value with auto-completion applied.
- **`maskHasObfuscation`**: `boolean` - True if any part of the mask is set to obfuscate.
- **`nonRegexReplacedChars`**: `Array` - Details about characters that were replaced/rejected during masking.

## Notes & Best Practices

- **Null Handling**: `formatValue` gracefully handles `null` or `undefined` inputs. For decimal types, it defaults to `0`; for others, it returns an empty string.
- **Phone Numbers**: The module relies on `google-libphonenumber`. Ensure specific country codes (ISO 3166-1 alpha-2) are uppercase (e.g., `'US'`), though the module generally handles case insensitivity.
- **Masking Performance**: Regex-based masks are powerful but can be computationally expensive if very complex. Use simple string characters where possible.
- **Validation**: When using `createPhoneNumberMask`, the returned `validate` function checks if the number is valid for the _specified region_, not just if it matches the mask pattern.
