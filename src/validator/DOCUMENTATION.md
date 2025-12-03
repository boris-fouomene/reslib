# Validator Documentation

The `reslib/validator` module provides a comprehensive, type-safe, and extensible validation system for TypeScript/JavaScript applications. It supports synchronous and asynchronous validation, decorator-based validation for classes, and a rich ecosystem of built-in rules.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
  - [Basic Usage](#basic-usage)
  - [Decorator Usage](#decorator-usage)
- [Core Concepts](#core-concepts)
  - [Rule Formats](#rule-formats)
  - [Validation Options](#validation-options)
- [Available Rules](#available-rules)
  - [Common / Presence](#common--presence)
  - [String Rules](#string-rules)
  - [Numeric Rules](#numeric-rules)
  - [Date Rules](#date-rules)
  - [Format Rules](#format-rules)
  - [Array Rules](#array-rules)
  - [Boolean Rules](#boolean-rules)
  - [File Rules](#file-rules)
  - [Enum Rules](#enum-rules)
- [Custom Rules](#custom-rules)
  - [Registering a Rule](#registering-a-rule)
  - [Type Augmentation](#type-augmentation)
- [Nested Validation](#nested-validation)
- [Internationalization (i18n)](#internationalization-i18n)

---

## Overview

The Validator system is designed to be:

- **Type-Safe**: Leverages TypeScript generics to ensure rule parameters are correct at compile time.
- **Extensible**: Easy to add custom rules that integrate seamlessly with the existing system.
- **Flexible**: Supports validation of single values, objects, and complex nested structures.
- **i18n Ready**: Built-in support for internationalized error messages.

## Getting Started

### Basic Usage

You can validate any value directly using `Validator.validate`.

```typescript
import { Validator } from 'reslib/validator';

async function validateUser() {
  const result = await Validator.validate({
    value: 'user@example.com',
    rules: ['Required', 'Email'],
  });

  if (result === true) {
    console.log('Valid!');
  } else {
    console.error('Error:', result); // Returns error message string
  }
}
```

### Decorator Usage

For class-based validation, use the provided decorators.

```typescript
import { IsRequired, IsEmail, MinLength, Validator } from 'reslib/validator';

class User {
  @IsRequired()
  @IsEmail()
  email: string;

  @IsRequired()
  @MinLength(8)
  password: string;
}

async function register(data: any) {
  // Validate the plain object against the class schema
  const result = await Validator.validateTarget(User, data);

  if (result.success) {
    console.log('User data is valid');
  } else {
    console.error('Validation errors:', result.errors);
  }
}
```

## Core Concepts

### Rule Formats

Rules can be specified in four different ways, offering flexibility and type safety:

1. **Named Rules** (String): Simple rules with no parameters.

   ```typescript
   rules: ['Required', 'Email'];
   ```

2. **Object Rules** (Type-Safe Object): The most type-safe way to specify rules with parameters.

   ```typescript
   rules: [{ MinLength: [5] }, { NumberBetween: [0, 100] }];
   ```

3. **Function Rules** (Custom Logic): Inline functions for one-off validation logic.

   ```typescript
   rules: [({ value }) => value.startsWith('admin') || 'Must start with admin'];
   ```

### Validation Options

The `Validator.validate` method accepts a `ValidatorValidateOptions` object:

| Property | Type | Description |
|Str|---|---|
| `value` | `any` | The value to validate. |
| `rules` | `ValidatorRules` | Array of rules to apply. |
| `message` | `string` | Custom error message to override rule defaults. |
| `propertyName` | `string` | Name of the property (for error messages). |
| `fieldName` | `string` | Form field identifier (e.g., HTML id). |
| `context` | `any` | Custom context object passed to rules. |

---

## Available Rules

### Common / Presence

| Rule Name  | Decorator       | Parameters | Description                                                  |
| ---------- | --------------- | ---------- | ------------------------------------------------------------ |
| `Required` | `@IsRequired()` | `[]`       | Value must be non-null, non-undefined, and non-empty string. |
| `Optional` | `@IsOptional()` | `[]`       | If value is undefined, validation stops (passes).            |
| `Nullable` | `@IsNullable()` | `[]`       | If value is null, validation stops (passes).                 |
| `Empty`    | `@IsEmpty()`    | `[]`       | If value is empty string, validation stops (passes).         |

### String Rules

| Rule Name       | Decorator            | Parameters          | Description                                         |
| --------------- | -------------------- | ------------------- | --------------------------------------------------- |
| `String`        | `@IsString()`        | `[]`                | Value must be a string.                             |
| `NonNullString` | `@IsNonNullString()` | `[]`                | Value must be a string and not null/undefined.      |
| `MinLength`     | `@MinLength(min)`    | `[number]`          | String length >= min.                               |
| `MaxLength`     | `@MaxLength(max)`    | `[number]`          | String length <= max.                               |
| `Length`        | `@Length(min, max?)` | `[number, number?]` | String length between min and max (or exactly min). |

### Numeric Rules

| Rule Name       | Decorator                    | Parameters         | Description                            |
| --------------- | ---------------------------- | ------------------ | -------------------------------------- |
| `Number`        | `@IsNumber()`                | `[]`               | Value must be a number.                |
| `NumberGT`      | `@IsNumberGT(min)`           | `[number]`         | Value > min.                           |
| `NumberGTE`     | `@IsNumberGTE(min)`          | `[number]`         | Value >= min.                          |
| `NumberLT`      | `@IsNumberLT(max)`           | `[number]`         | Value < max.                           |
| `NumberLTE`     | `@IsNumberLTE(max)`          | `[number]`         | Value <= max.                          |
| `NumberEQ`      | `@IsNumberEQ(val)`           | `[number]`         | Value === val.                         |
| `NumberNE`      | `@IsNumberNE(val)`           | `[number]`         | Value !== val.                         |
| `NumberBetween` | `@IsNumberBetween(min, max)` | `[number, number]` | Value between min and max (inclusive). |

### Date Rules

| Rule Name          | Decorator                   | Parameters                                     | Description                                                  |
| ------------------ | --------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `Date`             | `@IsDate()`                 | `[]`                                           | Value must be a valid Date object, ISO string, or timestamp. |
| `DateAfter`        | `@IsDateAfter(date)`        | `[Date\|string\|number]`                       | Date must be after the specified date.                       |
| `DateBefore`       | `@IsDateBefore(date)`       | `[Date\|string\|number]`                       | Date must be before the specified date.                      |
| `DateSameOrAfter`  | `@IsDateSameOrAfter(date)`  | `[Date\|string\|number]`                       | Date must be same or after.                                  |
| `DateSameOrBefore` | `@IsDateSameOrBefore(date)` | `[Date\|string\|number]`                       | Date must be same or before.                                 |
| `DateBetween`      | `@IsDateBetween(min, max)`  | `[Date\|string\|number, Date\|string\|number]` | Date must be between min and max.                            |

### Format Rules

| Rule Name            | Decorator                 | Parameters                                                  | Description                                          |
| -------------------- | ------------------------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| `Email`              | `@IsEmail()`              | `[]`                                                        | Valid email format.                                  |
| `Url`                | `@IsUrl(options?)`        | `[{ requireHost?: boolean, allowedProtocols?: string[] }?]` | Valid URL format.                                    |
| `PhoneNumber`        | `@IsPhoneNumber(region?)` | `[string?]`                                                 | Valid phone number (optionally for specific region). |
| `EmailOrPhoneNumber` | `@IsEmailOrPhoneNumber()` | `[]`                                                        | Valid email OR phone number.                         |
| `Alpha`              | `@IsAlpha()`              | `[]`                                                        | Contains only letters (a-zA-Z).                      |
| `AlphaNum`           | `@IsAlphaNum()`           | `[]`                                                        | Contains only letters and numbers.                   |
| `Base64`             | `@IsBase64()`             | `[]`                                                        | Valid Base64 string.                                 |
| `JSON`               | `@IsJSON()`               | `[]`                                                        | Valid JSON string.                                   |
| `HexColor`           | `@IsHexColor()`           | `[]`                                                        | Valid Hex color code.                                |

### Array Rules

| Rule Name          | Decorator                   | Parameters | Description                                     |
| ------------------ | --------------------------- | ---------- | ----------------------------------------------- |
| `Array`            | `@IsArray()`                | `[]`       | Value must be an array.                         |
| `ArrayMinLength`   | `@ArrayMinLength(min)`      | `[number]` | Array length >= min.                            |
| `ArrayMaxLength`   | `@ArrayMaxLength(max)`      | `[number]` | Array length <= max.                            |
| `ArrayNotEmpty`    | `@ArrayNotEmpty()`          | `[]`       | Array must not be empty.                        |
| `ArrayUnique`      | `@ArrayUnique()`            | `[]`       | Array must contain unique values.               |
| `ArrayContains`    | `@ArrayContains(values)`    | `[any[]]`  | Array must contain all specified values.        |
| `ArrayNotContains` | `@ArrayNotContains(values)` | `[any[]]`  | Array must not contain any of specified values. |

### Boolean Rules

| Rule Name | Decorator      | Parameters | Description                                                   |
| --------- | -------------- | ---------- | ------------------------------------------------------------- | --- |
| `Boolean` | `@IsBoolean()` | `[]`       | Value must be a boolean (true, false, 1, 0, "true", "false"). |     |

### File Rules

| Rule Name       | Decorator              | Parameters   | Description                                           |
| --------------- | ---------------------- | ------------ | ----------------------------------------------------- |
| `File`          | `@IsFile()`            | `[]`         | Value must be a valid file object (name, size, type). |
| `FileMinSize`   | `@FileMinSize(bytes)`  | `[number]`   | File size >= bytes.                                   |
| `FileMaxSize`   | `@FileMaxSize(bytes)`  | `[number]`   | File size <= bytes.                                   |
| `FileExtension` | `@FileExtension(exts)` | `[string[]]` | File extension must be in list.                       |
| `FileMimeType`  | `@FileMimeType(types)` | `[string[]]` | File mime type must be in list.                       |

### Enum Rules

| Rule Name | Decorator         | Parameters | Description                              |
| --------- | ----------------- | ---------- | ---------------------------------------- |
| `Enum`    | `@IsEnum(values)` | `[any[]]`  | Value must be one of the allowed values. |

---

## Custom Rules

You can extend the validator with your own rules. To maintain type safety, you must register the rule AND augment the `ValidatorRuleParamTypes` interface.

### 1. Registering a Rule

```typescript
import { Validator } from 'reslib/validator';

// Register the rule logic
Validator.registerRule('MyCustomRule', ({ value, ruleParams }) => {
  const [param1] = ruleParams;
  return value === param1 || `Value must be ${param1}`;
});
```

### 2. Type Augmentation

Create a declaration file (e.g., `validator.d.ts`) or add to your types file to let TypeScript know about your new rule and its parameters.

```typescript
import { ValidatorRuleParams } from 'reslib/validator';

declare module 'reslib/validator' {
  export interface ValidatorRuleParamTypes {
    // Define the rule name and its parameter types
    MyCustomRule: ValidatorRuleParams<[string]>;
  }
}
```

Now you can use it with full type safety:

```typescript
// Valid
Validator.validate({
  value: 'test',
  rules: [{ MyCustomRule: ['test'] }],
});

// TypeScript Error: Argument of type 'number' is not assignable to parameter of type 'string'
Validator.validate({
  value: 'test',
  rules: [{ MyCustomRule: [123] }],
});
```

## Nested Validation

To validate nested objects or arrays of objects, use the `@ValidateNested` decorator.

```typescript
import { ValidateNested, IsRequired, IsString } from 'reslib/validator';

class Address {
  @IsRequired()
  @IsString()
  street: string;
}

class User {
  @IsRequired()
  @IsString()
  name: string;

  @IsRequired()
  @ValidateNested()
  address: Address;
}
```

## Internationalization (i18n)

The validator uses an internal i18n system. You can customize error messages by providing a `message` option or by configuring the i18n resources.

```typescript
Validator.validate({
  value: '',
  rules: ['Required'],
  message: 'Hey! You must provide a value here.',
});
```

For global translations, you would typically configure the `reslib` i18n resources (refer to `reslib` i18n documentation).
