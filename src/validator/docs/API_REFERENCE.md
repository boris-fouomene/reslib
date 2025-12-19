# API Reference

**Complete API documentation for reslib/validator**

🔙 **[Back to README](../README.md)** | 📖 **[User Guide](./GUIDE.md)** | 📋 **[Rules Reference](./RULES.md)**

---

## Table of Contents

- [API Reference](#api-reference)
  - [Table of Contents](#table-of-contents)
  - [Validator Class](#validator-class)
    - [Validator.validate()](#validatorvalidate)
      - [Parameters](#parameters)
      - [Returns](#returns)
      - [Examples](#examples)
    - [Validator.validateClass()](#validatorvalidateclass)
      - [Parameters](#parameters-1)
      - [Returns](#returns-1)
      - [Examples](#examples-1)
    - [Validator.validateBulk()](#validatorvalidatebulk)
      - [Parameters](#parameters-2)
      - [Returns](#returns-2)
      - [Examples](#examples-2)
    - [Validator.registerRule()](#validatorregisterrule)
      - [Parameters](#parameters-3)
      - [Rule Function Signature](#rule-function-signature)
      - [Examples](#examples-3)
    - [Validator.getRule()](#validatorgetrule)
      - [Parameters](#parameters-4)
      - [Returns](#returns-3)
      - [Example](#example)
    - [Validator.getRules()](#validatorgetrules)
      - [Returns](#returns-4)
      - [Example](#example-1)
    - [Validator.hasRule()](#validatorhasrule)
      - [Parameters](#parameters-5)
      - [Returns](#returns-5)
      - [Example](#example-2)
  - [Types](#types)
    - [ValidatorOptions](#validatoroptions)
    - [ValidatorResult](#validatorresult)
    - [ValidatorClassResult](#validatorclassresult)
    - [ValidatorRules](#validatorrules)
    - [ValidatorRuleResult](#validatorruleresult)
  - [Error Handling](#error-handling)
    - [Validation Errors](#validation-errors)
    - [Class Validation Errors](#class-validation-errors)
  - [Best Practices](#best-practices)
    - [✅ Do's](#-dos)
    - [❌ Don'ts](#-donts)
  - [Next Steps](#next-steps)

---

## Validator Class

The main `Validator` class provides static methods for validation.

### Validator.validate()

**Validate a single value against validation rules.**

```typescript
static async validate<Context = unknown>(
  options: ValidatorOptions<Context>
): Promise<ValidatorResult<Context>>
```

#### Parameters

| Parameter          | Type             | Required | Description                         |
| ------------------ | ---------------- | -------- | ----------------------------------- |
| `value`            | `any`            | ✅       | Value to validate                   |
| `rules`            | `ValidatorRules` | ✅       | Validation rules to apply           |
| `context`          | `Context`        | ❌       | Optional context data               |
| `fieldName`        | `string`         | ❌       | Field name for error messages       |
| `i18n`             | `I18n`           | ❌       | i18n instance for translations      |
| `phoneCountryCode` | `boolean`        | ❌       | Enable phone country code detection |

#### Returns

```typescript
Promise<ValidatorResult<Context>>;

type ValidatorResult<Context = unknown> =
  | ValidatorSuccess<Context>
  | ValidatorError<Context>;

interface ValidatorSuccess<Context> {
  success: true;
  status: 'success';
  name: 'ValidatorSuccessResult';
  value: any;
  context?: Context;
  duration: number;
  validatedAt: Date;
}

interface ValidatorError<Context> {
  success: false;
  status: 'error';
  name: 'ValidatorError';
  message: string;
  ruleName: string;
  value: any;
  propertyName?: string;
  fieldName?: string;
  errorCode: string;
  statusCode: number;
}
```

#### Examples

**Basic validation:**

```typescript
const result = await Validator.validate({
  value: 'user@example.com',
  rules: ['Required', 'Email'],
});

if (result.success) {
  console.log('✅ Valid!');
} else {
  console.log('❌ Error:', result.message);
}
```

**With parameters:**

```typescript
const result = await Validator.validate({
  value: 'password123',
  rules: [
    'Required',
    { MinLength: [8] },
    { MaxLength: [100] },
    { Matches: [/.*\d.*/, 'Must contain a number'] },
  ],
  fieldName: 'password',
});
```

**With context:**

```typescript
const result = await Validator.validate({
  value: password,
  rules: [
    ({ value, context }) => {
      if (context?.requireStrong) {
        return /[A-Z]/.test(value) || 'Must contain uppercase';
      }
      return true;
    },
  ],
  context: { requireStrong: true },
});
```

---

### Validator.validateClass()

**Validate class instances using decorator-based rules.**

```typescript
static async validateClass<TClass extends object, Context = unknown>(
  targetClass: new () => TClass,
  options: ValidatorClassOptions<TClass, Context>
): Promise<ValidatorClassResult<TClass, Context>>
```

#### Parameters

| Parameter         | Type      | Required | Description                                  |
| ----------------- | --------- | -------- | -------------------------------------------- |
| `targetClass`     | `class`   | ✅       | Class constructor with validation decorators |
| `options.data`    | `object`  | ✅       | Data to validate against class schema        |
| `options.context` | `Context` | ❌       | Optional validation context                  |
| `options.i18n`    | `I18n`    | ❌       | i18n instance for translations               |

#### Returns

```typescript
Promise<ValidatorClassResult<TClass, Context>>;

type ValidatorClassResult<TClass, Context> =
  | ValidatorClassSuccess<TClass, Context>
  | ValidatorClassError<TClass>;

interface ValidatorClassSuccess<TClass, Context> {
  success: true;
  status: 'success';
  name: 'ValidatorSuccessResult';
  data: TClass;
  context?: Context;
  duration: number;
  validatedAt: Date;
}

interface ValidatorClassError<TClass> {
  success: false;
  status: 'error';
  name: 'ValidatorError';
  message: string;
  errors: ValidatorError[];
  fieldErrors: Record<keyof TClass, string>;
  data: Partial<TClass>;
  duration: number;
  failedAt: Date;
}
```

#### Examples

**Basic class validation:**

```typescript
class User {
  @IsRequired()
  @IsEmail()
  email: string;

  @IsRequired()
  @MinLength(8)
  password: string;
}

const result = await Validator.validateClass(User, {
  data: {
    email: 'user@example.com',
    password: 'SecurePass123',
  },
});

if (result.success) {
  console.log('✅ All fields valid');
  // result.data is fully validated User object
} else {
  console.log('❌ Errors:', result.errors);
  // result.errors: Array of failure details
  // result.fieldErrors: { password: '...' }
}
```

**With nested validation:**

```typescript
class Address {
  @IsRequired()
  street: string;

  @IsRequired()
  city: string;
}

class User {
  @IsRequired()
  name: string;

  @ValidateNested(Address)
  address: Address;
}

const result = await Validator.validateClass(User, {
  data: {
    name: 'John Doe',
    address: {
      street: '123 Main St',
      city: 'Springfield',
    },
  },
});
```

**With context:**

```typescript
const result = await Validator.validateClass(UserDTO, {
  data: userData,
  context: { userId: currentUser.id, mode: 'strict' },
});
```

---

### Validator.validateBulk()

**Validate an array of class instances in a single batch operation.**

```typescript
static async validateBulk<TClass extends ClassConstructor, Context = unknown>(
  targetClass: TClass,
  options: ValidatorBulkOptions<TClass, Context>
): Promise<ValidatorBulkResult<TClass, Context>>
```

#### Parameters

| Parameter           | Type       | Required | Description                                  |
| :------------------ | :--------- | :------- | :------------------------------------------- |
| `targetClass`       | `class`    | ✅       | Class constructor with validation decorators |
| `options.data`      | `object[]` | ✅       | Array of data objects to validate            |
| `options.context`   | `Context`  | ❌       | Optional validation context                  |
| `options.i18n`      | `I18n`     | ❌       | i18n instance for translations               |
| `options.startTime` | `number`   | ❌       | Custom start time (performance tracking)     |

#### Returns

```typescript
Promise<ValidatorBulkResult<TClass, Context>>;

type ValidatorBulkResult<TClass, Context> =
  | ValidatorBulkSuccess<TClass, Context>
  | ValidatorBulkError<TClass>;

interface ValidatorBulkSuccess<TClass, Context> {
  success: true;
  status: 'success';
  name: 'ValidatorSuccessResult';
  data: TClass[];
  duration: number;
  validatedAt: Date;
}

interface ValidatorBulkError<TClass> {
  success: false;
  status: 'error';
  name: 'ValidatorBulkError';
  message: string;
  failures: ValidatorBulkErrorItem[];
  failureCount: number;
  totalCount: number;
  duration: number;
}

interface ValidatorBulkErrorItem extends ValidatorClassError<any> {
  index: number; // 1-based index of the failed item
}
```

#### Examples

**Bulk validation with partial success:**

```typescript
const result = await Validator.validateBulk(User, {
  data: [
    { email: 'valid@test.com', name: 'Valid' },
    { email: 'invalid', name: 'X' }, // Will fail
  ],
});

if (result.success) {
  processData(result.data);
} else {
  console.log(`Failed: ${result.failureCount} of ${result.totalCount}`);
  result.failures.forEach((f) => {
    console.log(`Item at index ${f.index} failed:`, f.fieldErrors);
  });
}
```

---

### Validator.registerRule()

**Register a custom validation rule.**

```typescript
static registerRule<Params extends ValidatorRuleParams = []>(
  name: string,
  ruleFunction: ValidatorRuleFunction<Params>
): void
```

#### Parameters

| Parameter      | Type                    | Description                       |
| -------------- | ----------------------- | --------------------------------- |
| `name`         | `string`                | Unique rule name (case-sensitive) |
| `ruleFunction` | `ValidatorRuleFunction` | Validation function               |

#### Rule Function Signature

```typescript
type ValidatorRuleFunction<Params> = (
  options: ValidatorOptions<Params>
) => ValidatorRuleResult | Promise<ValidatorRuleResult>;

type ValidatorRuleResult = true | string | Promise<true | string>;
```

#### Examples

**Simple custom rule:**

```typescript
Validator.registerRule('IsPositive', ({ value, i18n }) => {
  if (typeof value !== 'number' || value <= 0) {
    return i18n.t('validator.positive', { value });
  }
  return true;
});

// Use it
const result = await Validator.validate({
  value: 42,
  rules: [{ IsPositive: [] }],
});
```

**Rule with parameters:**

```typescript
Validator.registerRule('IsBetween', ({ value, ruleParams, i18n }) => {
  const [min, max] = ruleParams;
  if (value < min || value > max) {
    return i18n.t('validator.between', { min, max, value });
  }
  return true;
});

// Use it
const result = await Validator.validate({
  value: 50,
  rules: [{ IsBetween: [0, 100] }],
});
```

**Async validation:**

```typescript
Validator.registerRule('UniqueEmail', async ({ value, context }) => {
  const exists = await database.users.findByEmail(value);
  if (exists) {
    return 'Email already exists';
  }
  return true;
});
```

**With TypeScript types:**

```typescript
// Augment types for autocomplete
declare module 'reslib/validator' {
  interface ValidatorRuleParamTypes {
    IsPositive: [];
    IsBetween: [number, number];
    UniqueEmail: [];
  }
}
```

---

### Validator.getRule()

**Get a registered validation rule by name.**

```typescript
static getRule(name: string): ValidatorRuleFunction | undefined
```

#### Parameters

| Parameter | Type     | Description |
| --------- | -------- | ----------- |
| `name`    | `string` | Rule name   |

#### Returns

The validation rule function, or `undefined` if not found.

#### Example

```typescript
const emailRule = Validator.getRule('Email');
if (emailRule) {
  console.log('Email rule exists');
}
```

---

### Validator.getRules()

**Get all registered validation rules.**

```typescript
static getRules(): ValidatorRuleFunctionsMap
```

#### Returns

```typescript
type ValidatorRuleFunctionsMap = Map<string, ValidatorRuleFunction>;
```

#### Example

```typescript
const allRules = Validator.getRules();
console.log('Total rules:', allRules.size);

for (const [name, rule] of allRules) {
  console.log(`Rule: ${name}`);
}
```

---

### Validator.hasRule()

**Check if a rule is registered.**

```typescript
static hasRule(name: string): boolean
```

#### Parameters

| Parameter | Type     | Description |
| --------- | -------- | ----------- |
| `name`    | `string` | Rule name   |

#### Returns

`true` if the rule exists, `false` otherwise.

#### Example

```typescript
if (Validator.hasRule('Email')) {
  console.log('Email validation available');
}

if (!Validator.hasRule('CustomRule')) {
  Validator.registerRule('CustomRule', customValidation);
}
```

---

## Types

### ValidatorOptions

```typescript
interface ValidatorOptions<Context = unknown> {
  value: any;
  rules: ValidatorRules;
  context?: Context;
  fieldName?: string;
  i18n?: I18n;
  phoneCountryCode?: boolean;
}
```

### ValidatorResult

```typescript
interface ValidatorResult<Context = unknown> {
  isValid: boolean;
  message?: string;
  value: any;
  context?: Context;
}
```

### ValidatorClassResult

```typescript
interface ValidatorClassResult<TClass, Context = unknown> {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
  data: TClass;
  context?: Context;
}
```

### ValidatorRules

```typescript
type ValidatorRules = Array<
  | string // 'Required', 'Email'
  | { [ruleName: string]: any[] } // { MinLength: [8] }
  | ValidatorRuleFunction // Custom function
>;
```

### ValidatorRuleResult

````typescript
type ValidatorRuleResult =
  | true // Validation passed
  | string // Validation failed (error message)
  | Promise<true | string>; // Async validation

### ValidatorRuleConfig

When providing rules complex rules, you can specify custom messages and parameters.

```typescript
interface ValidatorRuleConfig {
  /** Parameters for the rule */
  params?: any[];

  /**
   * Custom error message or translator function
   * @since 1.2.0
   */
  message?: string | ((options: ValidatorOptions) => string);
}

// Example usage
const rules: ValidatorRules = [
  {
    MinLength: {
      params: [8],
      message: ({ fieldName, ruleParams }) =>
        `${fieldName} must be at least ${ruleParams[0]} characters long`
    }
  }
];
````

---

````

---

## Decorators

All 67 validation rules have corresponding decorators.

### Decorator Naming Convention

- **Decorator name:** `@IsRequired`, `@IsEmail`, `@MinLength`
- **Rule name (in arrays):** `'Required'`, `'Email'`, `'MinLength'`

### Example Decorators

```typescript
// Default
@IsRequired()
@IsOptional()
@IsNullable()

// String
@MinLength(n)
@MaxLength(n)
@IsNonNullString()

// Numeric
@IsNumber()
@IsNumberGTE(n)
@IsNumberLTE(n)

// Format
@IsEmail(options?)
@IsUrl(options?)
@IsPhoneNumber(options?)

// File
@IsFile()
@MaxFileSize(bytes)
@IsImage()

// Advanced
@OneOf(...rules)
@AllOf(...rules)
@ArrayOf(...rules)
@ValidateNested(Class)
````

📋 **[See All Rules →](./RULES.md)**

---

## Error Handling

### Validation Errors

```typescript
const result = await Validator.validate({
  value: 'invalid',
  rules: ['Required', 'Email'],
});

if (!result.success) {
  console.error(result.message); // "Must be a valid email"
}
```

### Class Validation Errors

```typescript
const result = await Validator.validateClass(UserDTO, {
  data: invalidData,
});

if (!result.success) {
  result.errors.forEach((error) => {
    console.error(`${error.propertyName}: ${error.message}`);
  });
}
```

---

## Best Practices

### ✅ Do's

- Use decorators for DTOs and class-based validation
- Use rule arrays for dynamic/form validation
- Register custom rules with type augmentation
- Use async rules for database checks
- Provide clear field names for better error messages

### ❌ Don'ts

- Don't mix decorator names with rule names in arrays
- Don't forget type augmentation for custom rules
- Don't use synchronous database calls in validation
- Don't skip error handling

---

## Next Steps

- 📖 **[User Guide](./GUIDE.md)** - Complete documentation
- 📋 **[Rules Reference](./RULES.md)** - All 67 validation rules
- 🔙 **[Back to README](../README.md)** - Main documentation

---

Made with ❤️ by the reslib team
