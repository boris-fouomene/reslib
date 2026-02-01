---
sidebar_position: 1
title: Validation
---

# Validation Module

A comprehensive, type-safe validation system with 70+ built-in rules, decorator support, async validation, and full i18n integration.

## Overview

ResLib's validator supports multiple validation approaches:

| Approach          | Best For         | Example                       |
| ----------------- | ---------------- | ----------------------------- |
| **Decorators**    | Class-based      | `@IsRequired()`               |
| **Functional**    | Single value     | `Validator.validate(...)`     |
| **Object Schema** | Plain objects    | `Validator.object(...)`       |
| **Bulk**          | Multiple records | `Validator.validateBulk(...)` |

## Quick Example

```typescript
import { Validator, IsRequired, IsEmail, MinLength } from 'reslib/validator';

// Decorator-based
class UserDto {
  @IsRequired()
  @MinLength(2)
  name: string;

  @IsRequired()
  @IsEmail()
  email: string;
}

// Functional
const result = await Validator.validate({
  value: 'hello@example.com',
  rules: ['Required', 'Email'],
  fieldName: 'email',
});

// Object Schema (Zod-like)
const schema = Validator.object({
  name: ['Required', { MinLength: [2] }],
  email: ['Required', 'Email'],
});
const objResult = await Validator.validateObject(data, schema);
```

## Core Methods

### `Validator.validate()`

Validates a single value:

```typescript
const result = await Validator.validate({
  value: 'test@example.com',
  rules: ['Required', 'Email'],
  fieldName: 'email',
});

if (result.success) {
  console.log('Valid!');
} else {
  console.log('Error:', result.error.message);
}
```

### `Validator.validateClass()`

Validates a class instance:

```typescript
const user = new UserDto();
user.name = 'A';
user.email = 'invalid';

const result = await Validator.validateClass(user);
// result.errors: { name: [...], email: [...] }
```

### `Validator.validateObject()`

Validates plain objects:

```typescript
const schema = Validator.object({
  username: ['Required', { MinLength: [3] }],
  email: ['Required', 'Email'],
});

const result = await Validator.validateObject(data, schema);
```

## Rule Formats

### String Rules

```typescript
rules: ['Required', 'Email', 'IsNumber'];
```

### Object Rules with Parameters

```typescript
rules: [{ MinLength: [5] }, { MaxLength: [100] }, { Between: [1, 100] }];
```

### Custom Messages

```typescript
rules: [
  {
    Required: {
      params: [],
      message: 'This field cannot be empty!',
    },
  },
];
```

### Function Rules

```typescript
rules: [
  ({ value, fieldName }) => {
    if (value.includes('forbidden')) {
      return `${fieldName} cannot contain "forbidden"`;
    }
    return true;
  },
];
```

## Built-in Rules

### Required

| Rule         | Description                 |
| ------------ | --------------------------- |
| `Required`   | Value must not be empty     |
| `RequiredIf` | Required when condition met |
| `Nullable`   | Allows null values          |
| `Optional`   | Field is optional           |

### String

| Rule           | Description              |
| -------------- | ------------------------ |
| `MinLength`    | Minimum string length    |
| `MaxLength`    | Maximum string length    |
| `Length`       | Exact string length      |
| `StartsWith`   | Must start with value    |
| `EndsWith`     | Must end with value      |
| `Contains`     | Must contain substring   |
| `Regex`        | Must match pattern       |
| `Alpha`        | Only letters             |
| `AlphaNumeric` | Letters and numbers only |

### Format

| Rule          | Description       |
| ------------- | ----------------- |
| `Email`       | Valid email       |
| `Url`         | Valid URL         |
| `Uuid`        | Valid UUID        |
| `PhoneNumber` | Valid phone       |
| `CreditCard`  | Valid card number |
| `Ip`          | Valid IP address  |

### Numeric

| Rule        | Description        |
| ----------- | ------------------ |
| `IsNumber`  | Must be a number   |
| `IsInteger` | Must be an integer |
| `Min`       | Minimum value      |
| `Max`       | Maximum value      |
| `Between`   | Within range       |

### Array

| Rule             | Description         |
| ---------------- | ------------------- |
| `IsArray`        | Must be array       |
| `ArrayMinLength` | Min array length    |
| `In`             | Must be in list     |
| `NotIn`          | Must not be in list |

## Custom Rules

```typescript
Validator.registerRule('IsPalindrome', ({ value }) => {
  const cleaned = value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const reversed = cleaned.split('').reverse().join('');
  return cleaned === reversed || 'Must be a palindrome';
});
```

### Async Rules

```typescript
Validator.registerRule('UniqueEmail', async ({ value }) => {
  const exists = await db.user.findByEmail(value);
  return !exists || 'Email already taken';
});
```

## Error Handling

```typescript
const result = await Validator.validate({
  value: 'short',
  rules: [{ MinLength: [10] }],
  fieldName: 'password',
});

if (!result.success) {
  console.log(result.error.message); // "password must be at least 10 characters."
  console.log(result.error.field); // "password"
  console.log(result.error.rule); // "MinLength"
}
```

## Next Steps

- [Basic Usage](/docs/modules/validator/basic-usage)
- [Rules Reference](/docs/modules/validator/rules-reference)
- [Decorators](/docs/modules/validator/decorators)
- [Custom Rules](/docs/modules/validator/custom-rules)
