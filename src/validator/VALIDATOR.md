# Comprehensive Validator Feature Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Module Overview](#module-overview)
3. [Core Concepts](#core-concepts)
4. [Type System Architecture](#type-system-architecture)
5. [Validation Results](#validation-results)
6. [Single-Value Validation](#single-value-validation)
7. [Class-Based Validation (Decorators)](#class-based-validation-decorators)
8. [Built-in Validation Rules](#built-in-validation-rules)
9. [Custom Rule Creation](#custom-rule-creation)
10. [Advanced Features](#advanced-features)
11. [Error Handling](#error-handling)
12. [Internationalization (i18n)](#internationalization-i18n)
13. [Testing Strategies](#testing-strategies)
14. [Best Practices](#best-practices)
15. [API Reference](#api-reference)

---

## Introduction

The validator module (`reslib/validator`) provides a comprehensive, type-safe validation framework for JavaScript/TypeScript applications. It combines:

- **Synchronous and asynchronous validation** with unified result handling
- **Decorator-based class validation** using TypeScript reflection metadata
- **Type-safe rule definitions** with compile-time parameter checking
- **Module augmentation** for extensible rule registration
- **Internationalization support** for localized error messages
- **Flexible rule composition** supporting single-value and complex nested validations

### Key Features

- ✅ Full TypeScript support with strict type safety
- ✅ Decorators for class-based validation
- ✅ 100+ built-in validation rules
- ✅ Custom rule registration and composition
- ✅ Async/await support for asynchronous validations
- ✅ Error aggregation for multi-field validation
- ✅ i18n translation support
- ✅ Reflected metadata API integration
- ✅ Performance tracking and error context

---

## Module Overview

### Import Structure

```typescript
// Default imports from 'reslib/validator'
import {
  Validator,
  // Type definitions
  ValidatorRule,
  ValidatorRuleParamTypes,
  ValidatorValidateOptions,
  ValidatorValidateResult,
  ValidatorValidateTargetResult,
  // Decorators
  IsRequired,
  IsEmail,
  MinLength,
  MaxLength,
  IsOptional,
  ValidateNested,
  OneOf,
  AllOf,
  // And 100+ more...
} from 'reslib/validator';
```

### Directory Structure

```
reslib/src/validator/
├── index.ts                 # Main exports
├── types.ts                # Type definitions & module augmentation
├── validator.ts            # Core Validator class
├── rulesMarkers.ts        # Symbol markers for rules
├── rules/                  # Rule implementations
│   ├── index.ts           # Rule registry
│   ├── string.ts          # String validation rules
│   ├── numeric.ts         # Number validation rules
│   ├── array.ts           # Array validation rules
│   ├── boolean.ts         # Boolean validation
│   ├── date.ts            # Date/time validation
│   ├── format.ts          # Format validation (email, URL, etc.)
│   ├── default.ts         # Presence rules (Required, Optional, etc.)
│   ├── enum.ts            # Enum validation
│   ├── file.ts            # File validation
│   ├── target.ts          # Nested object validation
│   ├── multiRules.ts      # OneOf, AllOf rules
│   └── utils.ts           # Rule utilities
└── tests/                  # Test files
    ├── validator.test.ts
    ├── string.test.ts
    ├── array.test.ts
    ├── validator.validate.test.ts
    └── ...
```

---

## Core Concepts

### 1. Validation Rules

A **validation rule** is a function that checks if a value meets specific criteria. Rules return:

- `true` - Validation passed
- `string` - Validation failed with this error message
- `Promise<true | string>` - Async validation

### 2. Rule Specification Formats

The validator supports four different rule formats:

#### Format 1: Named Rules (String)

```typescript
'Required'; // Simple string reference
'Email'; // No parameters
```

#### Format 2: Parameterized Rules (String with Parameters)

```typescript
'MinLength[5]'; // Single parameter
'Length[5,10]'; // Multiple parameters
'NumberBetween[0,100]'; // Multiple parameters
```

#### Format 3: Object Rules (Type-Safe)

```typescript
{
  Required: [];
}
{
  MinLength: [5];
}
{
  MaxLength: [100];
}
{
  NumberBetween: [0, 100];
}
```

#### Format 4: Function Rules (Custom Logic)

```typescript
({ value, context }) => {
  return value.length > 5 || 'Must be longer than 5 characters';
};

async ({ value, context }) => {
  const isUnique = await checkUniqueness(value);
  return isUnique || 'Value already exists';
};
```

### 3. Rule Parameters

Rules can have:

- **No parameters**: `Required`, `Email`, `Array`
- **Single parameter**: `MinLength[5]`
- **Multiple parameters**: `Length[5,10]`
- **Optional parameters**: `PhoneNumber[countryCode?]`

---

## Type System Architecture

### ValidatorRuleParamTypes Interface

The foundation of the type system - a module-augmented interface that maps rule names to their parameter types:

```typescript
interface ValidatorRuleParamTypes {
  Required: [];
  Email: [];
  MinLength: [number];
  MaxLength: [number];
  Length: [number, number?];
  NumberBetween: [number, number];
  PhoneNumber: [CountryCode?];
  // ... extends with custom rules
}
```

**Key Points:**

- Each property key is a valid rule name
- Each property value is the parameter array type
- Enables compile-time parameter validation
- Extensible through module augmentation

### Module Augmentation Pattern

Add custom rules by extending the interface:

```typescript
declare module 'reslib/validator' {
  interface ValidatorRuleParamTypes {
    MyCustomRule: [string, number?];
    UniqueEmail: [];
  }
}
```

### Type-Safe Rule Names

```typescript
type ValidatorRuleName = keyof ValidatorRuleParamTypes & string;

// Valid rule names (autocomplete friendly)
const rule1: ValidatorRuleName = 'Required'; // ✓
const rule2: ValidatorRuleName = 'MinLength'; // ✓
const rule3: ValidatorRuleName = 'InvalidRule'; // ✗ Type error
```

### ValidatorTupleAllowsEmpty Type

Determines if a rule can be called without parameters:

```typescript
type ValidatorTupleAllowsEmpty<T extends Array<unknown>> = T extends []
  ? true
  : [] extends T
    ? true
    : false;

// Results
ValidatorTupleAllowsEmpty<[]>; // true (no params)
ValidatorTupleAllowsEmpty<[string?]>; // true (optional param)
ValidatorTupleAllowsEmpty<[string]>; // false (required param)
ValidatorTupleAllowsEmpty<[number, number]>; // false (required params)
```

---

## Validation Results

### Discriminated Union Pattern

Results use the Either/Discriminated Union pattern for type safety:

```typescript
type ValidatorValidateResult<Context = unknown> =
  | ValidatorValidateSuccess<Context>
  | ValidatorValidateFailure<Context>;
```

### Success Result

```typescript
interface ValidatorValidateSuccess<Context = unknown> {
  success: true;
  value: any; // The validated value
  validatedAt?: Date; // Validation completion time
  duration?: number; // Milliseconds elapsed
  data?: Dictionary; // Optional context data
  context?: Context; // Typed validation context
  error?: undefined; // Explicitly undefined for type narrowing
  failedAt?: undefined; // Explicitly undefined for type narrowing
}
```

**Example Success Result:**

```json
{
  "success": true,
  "value": "user@example.com",
  "validatedAt": "2024-11-08T10:30:45.123Z",
  "duration": 5,
  "data": { "userId": 123 }
}
```

### Failure Result

```typescript
interface ValidatorValidateFailure<Context = unknown> {
  success: false;
  value: any; // The value that failed
  error: ValidatorValidationError; // Error details
  failedAt?: Date; // When validation failed
  duration?: number; // Time until failure
  data?: Dictionary; // Context data
  context?: Context; // Typed context
  validatedAt?: undefined; // Explicitly undefined
}

interface ValidatorValidationError {
  status: 'error';
  name: 'ValidatorValidationError';
  message: string; // Formatted error message
  ruleName?: ValidatorRuleName; // Rule that failed
  ruleParams: any[]; // Rule parameters
  rawRuleName?: string; // Original rule spec
  propertyName?: string; // Property name
  fieldName?: string; // Field name
  translatedPropertyName?: string; // Localized name
  value: any; // Failed value
  code?: string; // Error code
  severity?: 'error' | 'warning' | 'info';
  timestamp?: Date; // Error timestamp
  metadata?: Dictionary; // Additional context
}
```

**Example Failure Result:**

```json
{
  "success": false,
  "value": "invalid-email",
  "error": {
    "status": "error",
    "name": "ValidatorValidationError",
    "message": "[Email]: Must be a valid email address",
    "ruleName": "Email",
    "ruleParams": [],
    "propertyName": "email",
    "fieldName": "email_input",
    "value": "invalid-email"
  },
  "failedAt": "2024-11-08T10:30:45.118Z",
  "duration": 2
}
```

### Type Narrowing Strategies

#### Strategy 1: Check `success` Property

```typescript
const result = await Validator.validate({ value: "...", rules: [...] });

if (result.success) {
  // TypeScript knows: result is ValidatorValidateSuccess
  console.log(result.value);        // ✓ Available
  console.log(result.validatedAt);  // ✓ Available
  console.log(result.error);        // ✗ Type error
} else {
  // TypeScript knows: result is ValidatorValidateFailure
  console.log(result.error.message); // ✓ Available
  console.log(result.failedAt);      // ✓ Available
  console.log(result.value);         // Still available (value that failed)
}
```

#### Strategy 2: Use Type Guard Functions

```typescript
if (Validator.isSuccess(result)) {
  // result is ValidatorValidateSuccess
  console.log(result.value);
}

if (Validator.isFailure(result)) {
  // result is ValidatorValidateFailure
  console.log(result.error.message);
}
```

---

## Single-Value Validation

### Basic Usage

Validate a single value against one or more rules:

```typescript
// Simple validation
const result = await Validator.validate({
  value: 'user@example.com',
  rules: ['Required', 'Email'],
  propertyName: 'email',
});

if (result.success) {
  console.log('Valid email:', result.value);
} else {
  console.error('Invalid email:', result.error.message);
}
```

### Validation Options

```typescript
interface ValidatorValidateOptions<Context = unknown> {
  // The value to validate
  value: any;

  // Validation rules (any format)
  rules?: ValidatorRules<Context>;

  // Single rule to apply
  rule?: ValidatorRule<TParams, Context>;

  // Parameters for the rule
  ruleParams: TParams;

  // Rule name
  ruleName?: ValidatorRuleName;

  // Original rule specification
  rawRuleName?: string;

  // Error message overrides
  message?: string;

  // Field identifiers
  fieldName?: string;
  propertyName?: string;
  fieldLabel?: string;
  translatedPropertyName?: string;

  // Context for validation rules
  context?: Context;

  // Additional data
  data?: Dictionary;

  // Internationalization
  i18n: I18n;
}
```

### Multiple Rules

```typescript
// Validate against multiple rules (all must pass)
const result = await Validator.validate({
  value: 'mypassword123',
  rules: [
    'Required',
    { MinLength: [8] },
    { MaxLength: [50] },
    ({ value }) => /[A-Z]/.test(value) || 'Must contain uppercase',
    ({ value }) => /[0-9]/.test(value) || 'Must contain number',
  ],
  propertyName: 'password',
});

if (result.success) {
  console.log('Strong password!');
} else {
  console.log('Password error:', result.error.message);
}
```

### Asynchronous Validation

```typescript
// Async rule for uniqueness check
const result = await Validator.validate({
  value: 'newuser@example.com',
  rules: [
    'Required',
    'Email',
    async ({ value }) => {
      const exists = await User.findByEmail(value);
      return !exists || 'Email already registered';
    },
  ],
  propertyName: 'email',
});
```

### Custom Validation Context

```typescript
interface ValidationContext {
  userId: number;
  permissions: string[];
  isAdmin: boolean;
}

const result = await Validator.validate({
  value: 'sensitive-action',
  rules: [
    'Required',
    ({ value, context }) => {
      const ctx = context as ValidationContext;
      return ctx?.isAdmin || 'Only admins can perform this action';
    },
  ],
  context: {
    userId: 123,
    permissions: ['read', 'write'],
    isAdmin: false,
  },
});
```

---

## Class-Based Validation (Decorators)

### Basic Decorator Usage

```typescript
import {
  IsRequired,
  IsEmail,
  MinLength,
  MaxLength,
  IsOptional,
  Validator,
} from 'reslib/validator';

class UserForm {
  @IsRequired()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsRequired()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEmail()
  backupEmail?: string;

  @IsRequired()
  @MinLength(8)
  password: string;
}

// Validate the form
const result = await Validator.validateTarget(UserForm, {
  username: 'john_doe',
  email: 'john@example.com',
  password: 'SecurePass123',
});

if (result.success) {
  console.log('Form is valid!');
  console.log(result.data); // Validated instance
} else {
  console.log('Form has errors:');
  result.errors.forEach((error) => {
    console.log(`[${error.propertyName}]: ${error.message}`);
  });
}
```

### Decorator Result Types

```typescript
type ValidatorValidateTargetResult<Context = unknown> =
  | ValidatorValidateTargetSuccess<Context>
  | ValidatorValidateTargetFailure<Context>;

// Success - all fields passed
interface ValidatorValidateTargetSuccess<Context = unknown> {
  success: true;
  status: 'success';
  data: Dictionary; // Validated instance
  validatedAt?: Date;
  duration?: number;
  context?: Context;
  value?: undefined; // Explicitly undefined
  message?: undefined; // Explicitly undefined
}

// Failure - one or more fields failed
interface ValidatorValidateTargetFailure<Context = unknown> {
  success: false;
  status: 'error';
  message: string; // "Validation failed for N fields"
  errors: ValidatorValidationError[]; // Array of errors
  failureCount: number; // Number of failed fields
  failedAt?: Date;
  duration?: number;
  context?: Context;
  data: Dictionary;
  validatedAt?: undefined; // Explicitly undefined
}
```

### Nested Object Validation

```typescript
class Address {
  @IsRequired()
  street: string;

  @IsRequired()
  city: string;

  @IsRequired()
  zipCode: string;
}

class CompleteUser {
  @IsRequired()
  @MinLength(3)
  name: string;

  @IsRequired()
  @IsEmail()
  email: string;

  @IsOptional()
  @ValidateNested(Address)
  address?: Address;
}

// Validate with nested objects
const result = await Validator.validateTarget(CompleteUser, {
  name: 'John Doe',
  email: 'john@example.com',
  address: {
    street: '123 Main St',
    city: 'Springfield',
    zipCode: '12345',
  },
});

if (!result.success) {
  // Errors include nested field paths
  result.errors.forEach((error) => {
    console.log(error.propertyName); // e.g., "address", etc.
    console.log(error.message);
  });
}
```

### Array Validation with Items

```typescript
class CartItem {
  @IsRequired()
  @IsNumber()
  quantity: number;

  @IsRequired()
  @MinLength(1)
  productId: string;
}

class ShoppingCart {
  @IsRequired()
  @ArrayMinLength(1)
  items: CartItem[];
}

const result = await Validator.validateTarget(ShoppingCart, {
  items: [
    { quantity: 2, productId: 'PROD001' },
    { quantity: 1, productId: 'PROD002' },
  ],
});
```

---

## Built-in Validation Rules

### Presence/Existence Rules

#### Required

Validates that a value is not null, undefined, or empty string.

```typescript
class User {
  @IsRequired()
  username: string;
}

// Valid: "john_doe", "123", "true"
// Invalid: null, undefined, "", 0 is VALID (not considered empty)
```

#### Optional

Validates that a value is either not provided or passes other rules if provided.

```typescript
class User {
  @IsOptional()
  @IsEmail()
  secondaryEmail?: string;
}

// Valid: undefined (not provided), "user@example.com" (passes Email)
// Invalid: null (different from undefined), "invalid-email"
```

#### Nullable

Validates that null/undefined values skip validation of subsequent rules.

```typescript
class User {
  @IsNullable()
  @IsEmail()
  email?: string;
}

// Valid: null, undefined, "user@example.com"
// Invalid: "invalid-email"
```

#### Empty

Validates that empty strings skip validation of subsequent rules.

```typescript
class Form {
  @IsEmpty()
  @MinLength(3)
  nickname?: string;
}

// Valid: "", "abc"
// Invalid: "ab" (fails MinLength, empty string is skipped)
```

### String Validation Rules

#### MinLength

Validates minimum string length.

```typescript
class User {
  @MinLength(3)
  username: string;
}

// Valid: "abc", "john_doe"
// Invalid: "ab", ""
```

**Parameters:** `[minLength: number]`

#### MaxLength

Validates maximum string length.

```typescript
class Post {
  @MaxLength(280)
  content: string;
}

// Valid: "Short text", "" (empty is allowed)
// Invalid: "Very long text that exceeds 280 characters..."
```

**Parameters:** `[maxLength: number]`

#### Length / IsLength

Validates exact or range length.

```typescript
class Product {
  // Exact length
  @Length(12)
  sku: string;

  // Range length
  @Length(5, 100)
  description: string;
}

// Valid: "PROD123456789" (12 chars), "5-100 chars"
// Invalid: "PROD" (4 chars), "Very long text..."
```

**Parameters:** `[min: number, max?: number]`

#### IsNonNullString

Validates that value is a string and not null/undefined.

```typescript
class Entity {
  @IsNonNullString()
  code: string;
}

// Valid: "ABC123"
// Invalid: null, undefined, 123
```

#### IsString

Validates that value is a string.

```typescript
class Data {
  @IsString()
  value: string;
}

// Valid: "", "text", "123"
// Invalid: null, undefined, 123
```

#### FileName

Validates that value is a valid file name.

```typescript
class Upload {
  @FileName()
  filename: string;
}

// Valid: "document.pdf", "image.jpg"
// Invalid: "con.txt" (reserved name), "../etc/passwd", "file|name"
```

### Numeric Validation Rules

#### NumberGT

Greater Than - validates value > limit.

```typescript
class Product {
  @NumberGT(0)
  price: number;
}

// Valid: 0.01, 100, 1000
// Invalid: 0, -5
```

**Parameters:** `[limit: number]`

#### NumberGTE

Greater Than or Equal - validates value >= limit.

```typescript
class Discount {
  @NumberGTE(0)
  percent: number;
}

// Valid: 0, 50, 100
// Invalid: -1, -0.5
```

**Parameters:** `[limit: number]`

#### NumberLT

Less Than - validates value < limit.

```typescript
class Settings {
  @NumberLT(100)
  maxRetries: number;
}

// Valid: 0, 50, 99
// Invalid: 100, 101
```

**Parameters:** `[limit: number]`

#### NumberLTE

Less Than or Equal - validates value <= limit.

```typescript
class User {
  @NumberLTE(120)
  age: number;
}

// Valid: 0, 50, 120
// Invalid: 121, 150
```

**Parameters:** `[limit: number]`

#### NumberEQ

Equals - validates value === limit.

```typescript
class Exam {
  @NumberEQ(100)
  fullScore: number;
}

// Valid: 100
// Invalid: 99, 101, 100.0 (floating point consideration)
```

**Parameters:** `[target: number]`

#### NumberNE

Not Equals - validates value !== limit.

```typescript
class Setting {
  @NumberNE(0)
  timeout: number;
}

// Valid: -1, 1, 100, 999
// Invalid: 0
```

**Parameters:** `[target: number]`

#### NumberBetween

Validates value is within a range [min, max].

```typescript
class Score {
  @NumberBetween(0, 100)
  percentage: number;
}

// Valid: 0, 50, 100
// Invalid: -1, 101
```

**Parameters:** `[min: number, max: number]`

#### IsNumber

Validates value is a number.

```typescript
class Data {
  @IsNumber()
  count: number;
}

// Valid: 0, -1, 3.14, NaN (is number type!)
// Invalid: "123", null, undefined
```

### Format Validation Rules

#### IsEmail

Validates RFC 5322-compliant email addresses.

```typescript
class Contact {
  @IsRequired()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEmail({
    maxTotalLength: 100,
    maxLocalPartLength: 32,
  })
  businessEmail?: string;
}

// Valid: "user@example.com", "test+tag@sub.example.co.uk"
// Invalid: "invalid", "@example.com", "user@"
```

**Parameters:** `[options?: IsEmailOptions]`

**Options:**

```typescript
{
  maxTotalLength?: number;        // Default: 320
  maxLocalPartLength?: number;    // Default: 64
  maxDomainLength?: number;       // Default: 255
  maxDomainLabelLength?: number;  // Default: 63
}
```

#### IsUrl

Validates URL format.

```typescript
class Website {
  @IsUrl()
  homepage: string;

  @IsOptional()
  @IsUrl({ requireProtocol: true })
  apiEndpoint?: string;
}

// Valid: "https://example.com", "http://sub.example.co.uk:8080/path"
// Invalid: "not a url", "htp://typo.com"
```

**Parameters:** `[options?: IsUrlOptions]`

#### PhoneNumber

Validates phone numbers with optional country code.

```typescript
class Person {
  @PhoneNumber()
  phone: string;

  @PhoneNumber('US')
  usPhone: string;
}

// Valid: "+1-234-567-8900", "1234567890" (US format)
// Invalid: "invalid", "123" (too short)
```

**Parameters:** `[countryCode?: CountryCode]`

#### EmailOrPhoneNumber

Validates that value is either a valid email or phone number.

```typescript
class User {
  @EmailOrPhoneNumber()
  contact: string;
}

// Valid: "user@example.com", "+1-234-567-8900"
// Invalid: "invalid", "123456"
```

### Array Validation Rules

#### IsArray

Validates that value is an array.

```typescript
class TagList {
  @IsArray()
  tags: string[];
}

// Valid: [], ["tag1", "tag2"]
// Invalid: "tag", null, { items: [] }
```

#### ArrayMinLength

Validates array has minimum number of items.

```typescript
class Order {
  @ArrayMinLength(1)
  items: OrderItem[];
}

// Valid: [item1], [item1, item2]
// Invalid: []
```

**Parameters:** `[minLength: number]`

#### ArrayMaxLength

Validates array doesn't exceed maximum items.

```typescript
class SelectList {
  @ArrayMaxLength(10)
  selected: string[];
}

// Valid: [], ["a"], ["a", "b", ..., "j"] (10 items)
// Invalid: [11+ items]
```

**Parameters:** `[maxLength: number]`

#### ArrayLength

Validates exact or range array length.

```typescript
class Coordinates {
  @ArrayLength(2) // Exactly 2 items
  point: [number, number];

  @ArrayLength(1, 5) // 1-5 items
  tags: string[];
}
```

**Parameters:** `[min: number, max?: number]`

#### ArrayUnique

Validates all array items are unique.

```typescript
class Tags {
  @ArrayUnique()
  selected: string[];
}

// Valid: ["tag1", "tag2"], []
// Invalid: ["tag1", "tag1"]
```

#### ArrayContains

Validates array contains specific value(s).

```typescript
class Permissions {
  @ArrayContains('admin')
  roles: string[];
}

// Valid: ["admin", "user"]
// Invalid: ["user", "guest"]
```

**Parameters:** `[searchValue: any]`

#### ArrayEvery

Validates all items pass a validation rule.

```typescript
class Numbers {
  @ArrayEvery({ NumberGT: [0] })
  positive: number[];
}

// Valid: [1, 2, 3], [0.1]
// Invalid: [0], [-1], [1, -1]
```

### Boolean Validation Rules

#### IsBoolean

Validates value is or can be cast to boolean.

```typescript
class Settings {
  @IsBoolean()
  enabled: boolean;
}

// Valid: true, false, 1, 0, "1", "0", "true", "false"
// Invalid: "yes", "maybe", 2, null
```

### Date/Time Validation Rules

#### IsDate

Validates value is a valid Date object.

```typescript
class Event {
  @IsDate()
  startTime: Date;
}

// Valid: new Date(), new Date('2024-01-01')
// Invalid: '2024-01-01' (string), 1704067200000 (timestamp)
```

#### DateBefore

Validates date is before specified date.

```typescript
class Booking {
  @DateBefore(() => new Date())
  pastDate: Date;
}

// Valid: Yesterday, last month
// Invalid: Tomorrow, today
```

#### DateAfter

Validates date is after specified date.

```typescript
class Event {
  @DateAfter(() => new Date())
  futureDate: Date;
}

// Valid: Tomorrow, next month
// Invalid: Yesterday, today
```

#### DateBetween

Validates date is within range.

```typescript
class OrderWindow {
  @DateBetween(() => new Date('2024-01-01'), () => new Date('2024-12-31'))
  orderDate: Date;
}
```

### Enum/Match Rules

#### IsEnum

Validates value is a valid enum value.

```typescript
class User {
  @IsEnum(['admin', 'user', 'guest'])
  role: string;
}

// Valid: "admin", "user", "guest"
// Invalid: "moderator", "root"
```

**Parameters:** `[allowedValues: any[]]`

#### Equals

Validates value equals another field.

```typescript
class Registration {
  @IsRequired()
  password: string;

  @Equals(['password'])
  confirmPassword: string;
}

// Valid: Both passwords match
// Invalid: Passwords don't match
```

**Parameters:** `[fieldName: string]`

### File Validation Rules

#### IsFile

Validates value looks like a file object.

```typescript
class Upload {
  @IsFile()
  attachment: File;
}
```

#### FileSize

Validates file size is within range.

```typescript
class ImageUpload {
  @FileSize(1024 * 1024)  // 1MB max
  image: File;
}

@FileSize(1024 * 1024 * 5, 1024)  // 1KB - 5MB
document: File;
```

**Parameters:** `[maxSize: number, minSize?: number]`

#### FileExtension

Validates file extension is allowed.

```typescript
class DocumentUpload {
  @FileExtension(['pdf', 'doc', 'docx'])
  document: File;
}

// Valid: file.pdf, file.doc
// Invalid: file.txt, file.exe
```

**Parameters:** `[extensions: string[]]`

### Multi-Rule Composition

#### OneOf

Validates that value passes at least one of the provided rules.

```typescript
class Contact {
  @OneOf('IsEmail', { PhoneNumber: [] })
  contactMethod: string;
}

// Valid: "user@example.com" (email), "+1-555-0123" (phone)
// Invalid: "invalid", "12345"
```

The OneOf decorator accepts multiple validation rules and succeeds if ANY pass.

#### AllOf

Validates that value passes ALL provided rules.

```typescript
class Email {
  @AllOf('IsRequired', 'IsEmail', { MaxLength: [254] })
  address: string;
}

// Valid: "user@example.com" (all rules pass)
// Invalid: "" (fails Required), "invalid" (fails Email), (fails MaxLength)
```

---

## Custom Rule Creation

### Registering Custom Rules

```typescript
import {
  Validator,
  ValidatorRuleName,
  ValidatorRuleFunction,
} from 'reslib/validator';

// Simple synchronous rule
Validator.registerRule('IsEven' as ValidatorRuleName, ({ value }) => {
  if (typeof value !== 'number') {
    return 'Value must be a number';
  }
  return value % 2 === 0 || 'Value must be an even number';
});

// Rule with parameters
Validator.registerRule(
  'DivisibleBy' as ValidatorRuleName,
  ({ value, ruleParams }) => {
    const [divisor] = ruleParams;
    return value % divisor === 0 || `Value must be divisible by ${divisor}`;
  }
);

// Async rule (e.g., database check)
Validator.registerRule(
  'UniqueUsername' as ValidatorRuleName,
  async ({ value }) => {
    const exists = await User.findByUsername(value);
    return !exists || 'Username is already taken';
  }
);

// Rule with context
Validator.registerRule(
  'AdminOnly' as ValidatorRuleName,
  ({ value, context }) => {
    const ctx = context as { isAdmin: boolean };
    return ctx?.isAdmin || 'Only administrators can use this value';
  }
);
```

### Creating Custom Decorators

Custom decorators wrap the rule registration:

```typescript
import { Validator, ValidatorRuleParamTypes } from 'reslib/validator';

// Module augmentation for type safety
declare module 'reslib/validator' {
  interface ValidatorRuleParamTypes {
    CustomValidation: [string];
  }
}

// Create decorator factory
export const MyCustomDecorator = (param: string) => {
  return Validator.buildRuleDecorator<
    ValidatorRuleParamTypes['CustomValidation']
  >(function MyCustomValidation({ value, ruleParams, i18n }) {
    const [expectedValue] = ruleParams;
    return value === expectedValue || `Value must be ${expectedValue}`;
  }, 'CustomValidation');
};

// Usage
class MyClass {
  @MyCustomDecorator('expected-value')
  field: string;
}
```

### Rule Builder Pattern

```typescript
import {
  ValidatorRuleFunction,
  ValidatorValidateOptions,
} from 'reslib/validator';

// Reusable rule builder
function createRangeValidator(min: number, max: number): ValidatorRuleFunction {
  return ({ value }) => {
    const num = Number(value);
    if (isNaN(num)) return 'Value must be a number';
    return (
      (num >= min && num <= max) || `Value must be between ${min} and ${max}`
    );
  };
}

// Use in validation
const range0to100 = createRangeValidator(0, 100);
const result = await Validator.validate({
  value: 50,
  rules: [range0to100],
});
```

---

## Advanced Features

### Context-Aware Validation

Pass typed context to enable context-dependent validation:

```typescript
interface UserContext {
  userId: number;
  role: 'admin' | 'user' | 'guest';
  permissions: string[];
  isActive: boolean;
}

class SecureResource {
  @IsRequired()
  name: string;

  // This decorator allows sensitive content for admins only
  customRule: ({ value, context }: ValidatorValidateOptions) => {
    const ctx = context as UserContext;
    if (ctx?.role === 'admin') {
      return true; // Admins can use any content
    }
    // Users must follow content policy
    return !containsProhibited(value) || "Content not allowed";
  };
}

const result = await Validator.validateTarget(SecureResource,
  { name: "Sensitive", customRule: "content" },
  {
    context: {
      userId: 1,
      role: 'admin',
      permissions: ['write', 'delete'],
      isActive: true,
    }
  }
);
```

### Parallel Validation with Multiple Rules

All rules are validated in parallel:

```typescript
// All these rules run concurrently, not sequentially
const result = await Validator.validate({
  value: 'user@example.com',
  rules: [
    'Required',
    'Email',
    'MaxLength[254]',
    async ({ value }) => {
      // This async rule runs in parallel with others
      const isUnique = await checkEmailUniqueness(value);
      return isUnique || 'Email already registered';
    },
  ],
});
```

### Error Aggregation in Forms

Target validation collects all errors:

```typescript
class CompleteForm {
  @IsRequired()
  @MinLength(3)
  username: string;

  @IsRequired()
  @IsEmail()
  email: string;

  @IsRequired()
  @MinLength(8)
  password: string;
}

const result = await Validator.validateTarget(CompleteForm, {
  username: 'ab', // Too short
  email: 'invalid', // Invalid format
  password: 'short', // Too short
});

if (!result.success) {
  // result.failureCount === 3
  // result.errors is array with 3 errors
  // User sees all problems at once, not one at a time
  result.errors.forEach((error) => {
    console.log(`${error.propertyName}: ${error.message}`);
  });
}
```

### Dynamic Rule Selection

```typescript
const userType = 'premium'; // From form or state

const rules =
  userType === 'premium'
    ? [
        'Required',
        { MinLength: [8] },
        async ({ value }) => {
          const isUnique = await checkUniqueness(value);
          return isUnique || 'Not unique';
        },
      ]
    : ['Required'];

const result = await Validator.validate({
  value: 'somevalue',
  rules,
});
```

### Conditional Field Validation

```typescript
class ConditionalForm {
  @IsRequired()
  userType: 'individual' | 'business';

  @IsRequired()
  @IsEmail()
  email: string;

  // Only validated if userType is 'business'
  @IsOptional()
  @IsRequired()
  businessName?: string;

  // Only validated if userType is 'individual'
  @IsOptional()
  firstName?: string;
}
```

---

## Error Handling

### Single Value Error Handling

```typescript
const result = await Validator.validate({
  value: 'invalid@',
  rules: ['Required', 'Email'],
});

if (!result.success) {
  // Access error details
  const error = result.error;

  console.error('Field:', error.propertyName); // undefined or "email"
  console.error('Rule:', error.ruleName); // "Email"
  console.error('Message:', error.message); // "[Email]: Invalid format"
  console.error('Severity:', error.severity); // "error"
  console.error('Code:', error.code); // Custom error code
  console.error('Metadata:', error.metadata); // { suggestion: "..." }

  // Handle specific errors
  if (error.ruleName === 'Email') {
    showEmailHelp();
  }
}
```

### Multi-Field Error Handling

```typescript
const result = await Validator.validateTarget(UserForm, data);

if (!result.success) {
  // Iterate through all errors
  result.errors.forEach((error) => {
    // Group by field
    const fieldContainer = document.querySelector(
      `[data-field="${error.propertyName}"]`
    );

    if (fieldContainer) {
      const errorEl = fieldContainer.querySelector('.error');
      errorEl.textContent = error.message;
      fieldContainer.classList.add('has-error');
    }
  });

  // Show summary
  console.error(result.message); // "Validation failed for N fields"
}
```

### Custom Error Message Builders

```typescript
const result = await Validator.validateTarget(UserForm, data, {
  errorMessageBuilder: (translatedName, error, options) => {
    // Customize error message formatting
    const { propertyName, ruleParams, i18n } = options;

    if (propertyName === 'email' && error.includes('format')) {
      return `${translatedName}: Please use a valid email (example@domain.com)`;
    }

    if (propertyName === 'password' && error.includes('length')) {
      return `${translatedName}: Must be at least ${ruleParams[0]} characters`;
    }

    return `${translatedName}: ${error}`;
  },
});
```

---

## Internationalization (i18n)

### Default i18n Keys

Validators automatically use i18n for error messages:

```typescript
// Message keys used by validators
validator.required; // "This field is required"
validator.email; // "Must be a valid email address"
validator.minLength; // "Must be at least {minLength} characters"
validator.maxLength; // "Must not exceed {maxLength} characters"
validator.array; // "Must be an array"
validator.number; // "Must be a number"
// ... and many more
```

### Providing Custom i18n

```typescript
import { i18n } from 'reslib/i18n';

// Set locale
await i18n.setLocale('en');

// Custom translations
i18n.set('validator.email', {
  en: 'Please enter a valid email address',
  fr: 'Veuillez entrer une adresse e-mail valide',
  es: 'Por favor, ingrese una dirección de correo electrónico válida',
});

// Then validators use these messages
const result = await Validator.validate({
  value: 'invalid',
  rules: ['Email'],
});

// Error will use custom i18n message
console.log(result.error.message);
```

### Localized Property Names

```typescript
i18n.set('property.email', {
  en: 'Email Address',
  fr: 'Adresse E-mail',
});

const result = await Validator.validate({
  value: 'invalid',
  rules: ['Email'],
  translatedPropertyName: i18n.t('property.email'), // Uses locale-specific name
});

// Message: "[Email Address]: Please enter a valid email address"
```

---

## Testing Strategies

### Unit Testing Validation Rules

```typescript
import { Validator } from 'reslib/validator';
import { i18n } from 'reslib/i18n';

describe('Email Validation', () => {
  beforeAll(async () => {
    await i18n.setLocale('en');
  });

  it('should accept valid emails', async () => {
    const emails = [
      'user@example.com',
      'test+tag@sub.example.co.uk',
      'user.name@example.com',
    ];

    for (const email of emails) {
      const result = await Validator.validate({
        value: email,
        rules: ['Email'],
      });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid emails', async () => {
    const invalidEmails = [
      'invalid',
      '@example.com',
      'user@',
      'user..name@example.com',
    ];

    for (const email of invalidEmails) {
      const result = await Validator.validate({
        value: email,
        rules: ['Email'],
      });
      expect(result.success).toBe(false);
      expect(result.error.ruleName).toBe('Email');
    }
  });
});
```

### Testing Custom Rules

```typescript
describe('Custom Rule Registration', () => {
  it('should register and use custom rule', async () => {
    Validator.registerRule('IsEven', ({ value }) => {
      return value % 2 === 0 || 'Must be even';
    });

    const result = await Validator.validate({
      value: 4,
      rules: ['IsEven'],
    });

    expect(result.success).toBe(true);
  });

  it('should handle async rules', async () => {
    Validator.registerRule('UniqueValue', async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 10)); // Simulate DB call
      return value !== 'taken' || 'Value is taken';
    });

    const result = await Validator.validate({
      value: 'available',
      rules: ['UniqueValue'],
    });

    expect(result.success).toBe(true);
  });
});
```

### Testing Decorator-Based Validation

```typescript
describe('Class Validation', () => {
  class TestForm {
    @IsRequired()
    @MinLength(3)
    username: string;

    @IsRequired()
    @IsEmail()
    email: string;
  }

  it('should validate all fields', async () => {
    const result = await Validator.validateTarget(TestForm, {
      username: 'john_doe',
      email: 'john@example.com',
    });

    expect(result.success).toBe(true);
  });

  it('should collect multiple errors', async () => {
    const result = await Validator.validateTarget(TestForm, {
      username: 'ab', // Too short
      email: 'invalid', // Invalid format
    });

    expect(result.success).toBe(false);
    expect(result.failureCount).toBe(2);
    expect(result.errors).toHaveLength(2);
  });
});
```

### Integration Testing with Context

```typescript
describe('Context-Aware Validation', () => {
  interface TestContext {
    isAdmin: boolean;
  }

  it('should use context in validation', async () => {
    Validator.registerRule('AdminOnly', ({ context }) => {
      const ctx = context as TestContext;
      return ctx?.isAdmin || 'Admin access required';
    });

    // Fail without admin context
    const result1 = await Validator.validate({
      value: 'data',
      rules: ['AdminOnly'],
      context: { isAdmin: false },
    });
    expect(result1.success).toBe(false);

    // Pass with admin context
    const result2 = await Validator.validate({
      value: 'data',
      rules: ['AdminOnly'],
      context: { isAdmin: true },
    });
    expect(result2.success).toBe(true);
  });
});
```

---

## Best Practices

### 1. Use Type-Safe Rule Objects

```typescript
// ✅ Good - Type-safe with compiler checking
const rules = [{ Required: [] }, { MinLength: [5] }, { MaxLength: [100] }];

// ❌ Avoid - String format loses type safety
const rules = ['Required', 'MinLength[5]', 'MaxLength[100]'];
```

### 2. Leverage Decorators for Forms

```typescript
// ✅ Good - Centralized validation rules on the class
class UserForm {
  @IsRequired()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsRequired()
  @IsEmail()
  email: string;
}

// ❌ Avoid - Scattered validation rules
const validateUsername = (value) => {
  if (!value) return 'Required';
  if (value.length < 3) return 'Too short';
  if (value.length > 50) return 'Too long';
  return true;
};
```

### 3. Use Optional for Optional Fields

```typescript
// ✅ Good
class User {
  @IsRequired()
  name: string;

  @IsOptional()
  @IsEmail()
  secondaryEmail?: string;
}

// ❌ Avoid - Checking for undefined is tedious
class User {
  @IsRequired()
  name: string;

  @IsEmail()
  secondaryEmail?: string;
  // Now Email rule runs on undefined, which fails
}
```

### 4. Create Reusable Validation Schemas

```typescript
// ✅ Good - Reusable schema composition
export class PasswordRules {
  @IsRequired()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}

export class UserRegistration {
  @IsRequired()
  @IsEmail()
  email: string;

  @IsRequired()
  @MinLength(3)
  username: string;

  ...PasswordRules,
}

// ❌ Avoid - Duplicated rules
class UserRegistration {
  @IsRequired()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}

class PasswordChange {
  @IsRequired()
  @MinLength(8)
  @MaxLength(128)
  newPassword: string;
  // Rules are duplicated
}
```

### 5. Handle Errors Gracefully

```typescript
// ✅ Good - Comprehensive error handling
const result = await Validator.validateTarget(UserForm, data);

if (result.success) {
  await saveUser(result.data);
  showSuccessMessage();
} else {
  // User sees all validation issues at once
  displayErrors(result.errors);
  logValidationFailure(result);
}

// ❌ Avoid - Throwing exceptions
try {
  const validated = await validateUserForm(data);
  // User only sees first error, must submit form again for each error
} catch (error) {
  showError(error.message);
}
```

### 6. Use Nested Validation for Complex Objects

```typescript
// ✅ Good - Nested validation is clear and maintainable
class Address {
  @IsRequired()
  street: string;

  @IsRequired()
  city: string;

  @IsRequired()
  @Length(5) // ZIP code length
  zipCode: string;
}

class User {
  @IsRequired()
  name: string;

  @ValidateNested(Address)
  address: Address;
}

// ❌ Avoid - Flat structure is hard to maintain
class UserWithAddress {
  @IsRequired()
  name: string;

  @IsRequired()
  addressStreet: string;

  @IsRequired()
  addressCity: string;

  @IsRequired()
  @Length(5)
  addressZipCode: string;
  // Hard to validate related fields together
}
```

### 7. Performance Considerations

```typescript
// ✅ Good - Avoid unnecessary async operations
class User {
  @IsRequired()
  @MinLength(3)      // Fast local validation first
  @MaxLength(50)
  username: string;

  // Expensive async check only if local checks pass
  async customRule({ value }) {
    return await checkUsernameUniqueness(value);
  }
}

// ❌ Avoid - Starting with expensive operations
async customRule({ value }) {
  // This runs even for empty or too-short values
  return await checkUsernameUniqueness(value);
}
```

### 8. Provide Clear Error Context

```typescript
// ✅ Good - Include helpful context in errors
const result = await Validator.validate({
  value: enteredPassword,
  rules: [
    'Required',
    { MinLength: [8] },
    ({ value }) => /[A-Z]/.test(value) || 'Must contain uppercase letter',
    ({ value }) => /[0-9]/.test(value) || 'Must contain number',
  ],
  propertyName: 'password',
  translatedPropertyName: 'Password',
  fieldLabel: 'password_field',
  data: {
    formId: 'registration',
    step: 'step-2-of-3',
  },
});

// ❌ Avoid - Generic errors
const result = await Validator.validate({
  value: enteredPassword,
  rules: ['Required', 'MinLength[8]'],
  // No context, user doesn't know which password field failed in multi-form scenario
});
```

---

## API Reference

### Validator Class Methods

#### static registerRule()

```typescript
static registerRule<TParams, Context>(
  ruleName: ValidatorRuleName,
  ruleHandler: ValidatorRuleFunction<TParams, Context>
): void
```

Register a custom validation rule that can be used throughout the application.

#### static getRules()

```typescript
static getRules<Context>(): ValidatorRuleFunctionsMap<Context>
```

Get all registered validation rules. Returns a shallow copy of the rules registry.

#### static getRule()

```typescript
static getRule(ruleName: ValidatorRuleName): ValidatorRuleFunction | undefined
```

Get a specific registered validation rule by name.

#### static validate()

```typescript
static async validate<Context>(
  options: ValidatorValidateOptions<ValidatorRuleParams, Context>
): Promise<ValidatorValidateResult<Context>>
```

Validate a single value against one or more rules. Returns discriminated union result.

#### static validateTarget()

```typescript
static async validateTarget<Target extends ClassConstructor, Context>(
  target: Target,
  data: ValidatorValidateTargetData<Target>,
  options?: Partial<ValidatorValidateTargetOptions<Target, Context>>
): Promise<ValidatorValidateTargetResult<Context>>
```

Validate a class instance against decorated validation rules. Collects errors from all decorated properties.

#### static validateNested()

```typescript
static async validateNested<Target extends ClassConstructor, Context>(
  target: Target,
  data: any,
  options?: Partial<ValidatorValidateTargetOptions<Target, Context>>
): Promise<ValidatorValidateResult<Context>>
```

Validate nested objects within a target class.

#### static validateOneOfRule()

```typescript
static async validateOneOfRule<Context>(
  options: ValidatorValidateMultiRuleOptions<Context>
): Promise<ValidatorResult>
```

Validate that at least one of multiple rules passes.

#### static validateAllOfRule()

```typescript
static async validateAllOfRule<Context>(
  options: ValidatorValidateMultiRuleOptions<Context>
): Promise<ValidatorResult>
```

Validate that all provided rules pass.

#### static isSuccess()

```typescript
static isSuccess<Context>(
  result: ValidatorValidateResult<Context>
): result is ValidatorValidateSuccess<Context>
```

Type guard to check if validation succeeded.

#### static isFailure()

```typescript
static isFailure<Context>(
  result: ValidatorValidateResult<Context>
): result is ValidatorValidateFailure<Context>
```

Type guard to check if validation failed.

#### static buildRuleDecorator()

```typescript
static buildRuleDecorator<TParams extends ValidatorRuleParams>(
  handler: ValidatorRuleFunction<TParams, Context>,
  ruleName: ValidatorRuleName,
  marker?: symbol
): PropertyDecorator
```

Create a property decorator for class-based validation.

#### static parseAndValidateRules()

```typescript
static parseAndValidateRules(
  rules?: ValidatorRules
): {
  sanitizedRules: ValidatorSanitizedRules;
  invalidRules: string[];
}
```

Parse and sanitize validation rules into standardized format.

---

## Complete Example: User Registration Form

```typescript
import {
  Validator,
  IsRequired,
  IsEmail,
  MinLength,
  MaxLength,
  IsOptional,
  ValidateNested,
  OneOf,
} from 'reslib/validator';

// Address sub-form
class AddressForm {
  @IsRequired()
  @MinLength(5)
  street: string;

  @IsRequired()
  @MinLength(2)
  @MaxLength(50)
  city: string;

  @IsRequired()
  @Length(5)
  zipCode: string;
}

// Main registration form
class RegistrationForm {
  @IsRequired()
  @MinLength(3)
  @MaxLength(50)
  firstName: string;

  @IsRequired()
  @MinLength(3)
  @MaxLength(50)
  lastName: string;

  @IsRequired()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEmail()
  backupEmail?: string;

  @IsRequired()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsRequired()
  @OneOf(
    'PhoneNumber',
    // Custom rule for internal ID
    ({ value }) => value.startsWith('ID-') || 'Must be phone or ID'
  )
  contactMethod: string;

  @IsOptional()
  @ValidateNested(AddressForm)
  address?: AddressForm;

  @IsRequired()
  @IsBoolean()
  agreeToTerms: boolean;
}

// Usage
async function handleRegistration(formData: unknown) {
  const result = await Validator.validateTarget(RegistrationForm, formData);

  if (result.success) {
    // All validation passed
    const user = result.data;
    console.log('User registered:', user);

    // Send to server
    await api.post('/users', user);
    showSuccessMessage('Registration complete!');
  } else {
    // Validation failed - show all errors
    console.error('Validation failed');
    result.errors.forEach((error) => {
      const field = document.querySelector(
        `[data-field="${error.propertyName}"]`
      );
      if (field) {
        field.classList.add('error');
        field.querySelector('.error-message').textContent = error.message;
      }
    });

    showErrorMessage(`Please fix ${result.failureCount} errors`);
  }
}
```

---

## Advanced Module Augmentation

Extend the validator with your application's custom rules:

```typescript
// In your types/validator.ts
import 'reslib/validator';

// Augment the ValidatorRuleParamTypes interface
declare module 'reslib/validator' {
  interface ValidatorRuleParamTypes {
    // Custom business rules
    ValidBusinessNumber: [];
    ValidTaxId: [CountryCode];
    ValidIPAddress: ['v4' | 'v6'];
    BetweenDates: [Date, Date];

    // Database validations
    UniqueEmail: [];
    UniqueUsername: [];
    ValidUserId: [];

    // Custom domain rules
    ValidCreditCard: [CardType?];
    ValidCurrencyAmount: [Currency, DecimalPlaces?];
  }
}

// In your rules/custom-rules.ts
import { Validator } from 'reslib/validator';

Validator.registerRule('ValidBusinessNumber', ({ value, i18n }) => {
  return (
    /^[0-9]{8,14}$/.test(value) ||
    i18n.t('validator.validBusinessNumber', { value })
  );
});

Validator.registerRule('UniqueEmail', async ({ value }) => {
  const exists = await db.users.findOne({ email: value });
  return !exists || 'Email already registered';
});

Validator.registerRule('ValidUserId', async ({ value, context }) => {
  // Use context for database connection or permissions
  const user = await getUserFromDB(value, context);
  return !!user || 'User not found';
});

// Export for use elsewhere
export * from 'reslib/validator';
```

---

## Troubleshooting

### Common Issues

#### 1. "Rule not found" Error

**Problem:** Validator can't find a registered rule.

```typescript
// ❌ Wrong - rule isn't registered
const result = await Validator.validate({
  value: 'test',
  rules: ['MyCustomRule'],
});

// ✅ Fix - register the rule first
Validator.registerRule('MyCustomRule', ({ value }) => {
  return value === 'valid' || 'Invalid';
});
```

#### 2. Parameter Type Mismatch

**Problem:** Rule parameters don't match declared types.

```typescript
// ❌ Wrong - MinLength expects [number], not string
const result = await Validator.validate({
  value: 'test',
  rules: [{ MinLength: ['5'] }], // Should be [5]
});

// ✅ Fix - use correct parameter types
const result = await Validator.validate({
  value: 'test',
  rules: [{ MinLength: [5] }],
});
```

#### 3. Async Rules Timing Out

**Problem:** Async validation takes too long.

```typescript
// ❌ Problem - database check on every validation
Validator.registerRule('UniqueEmail', async ({ value }) => {
  // This is called for every keystroke!
  const exists = await db.users.findByEmail(value);
  return !exists || 'Email taken';
});

// ✅ Solution - debounce or use explicit validation
class Form {
  @IsRequired()
  @IsEmail()
  email: string;

  @IsOptional() // Only validated when explicitly submitted
  async confirmEmail() {
    const exists = await db.users.findByEmail(this.email);
    return !exists || 'Email taken';
  }
}
```

#### 4. Nested Validation Not Working

**Problem:** Nested objects not validating.

```typescript
// ❌ Wrong - forgot @ValidateNested decorator
class User {
  @IsRequired()
  name: string;

  address: Address; // Not decorated!
}

// ✅ Fix - add @ValidateNested
class User {
  @IsRequired()
  name: string;

  @ValidateNested(Address)
  address: Address;
}
```

---

## Summary

The validator module provides a powerful, type-safe validation framework that scales from simple single-field validation to complex multi-level object validation. Key highlights:

1. **Type Safety**: Compile-time checking of rule parameters via module augmentation
2. **Flexibility**: Supports multiple rule formats (string, object, function, parameterized)
3. **Composability**: Combine rules, create custom validators, nest objects
4. **Async Support**: Handle async validations (database checks, API calls)
5. **Error Handling**: Discriminated union results with comprehensive error details
6. **i18n Ready**: Built-in internationalization support
7. **Testable**: Easy to mock, test with fixtures, validate with context
8. **Performance**: Parallel validation, short-circuit on success, optimized for scale

Use cases:

- Form validation (client and server-side)
- API request validation
- Configuration file validation
- Data transformation pipelines
- Business rule enforcement
- Type-safe data contracts

The validator is designed to be your application's single source of truth for data validation.
