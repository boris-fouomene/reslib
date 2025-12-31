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
    - [Validator.validateObject()](#validatorvalidateobject)
      - [Parameters](#parameters-3)
      - [Returns](#returns-3)
      - [Examples](#examples-3)
    - [Validator.object()](#validatorobject)
      - [Parameters](#parameters-4)
      - [Returns](#returns-4)
      - [Examples](#examples-4)
    - [Validator.registerRule()](#validatorregisterrule)
      - [Parameters](#parameters-5)
      - [Rule Function Signature](#rule-function-signature)
      - [Examples](#examples-5)
    - [Validator.getRule()](#validatorgetrule)
      - [Parameters](#parameters-6)
      - [Returns](#returns-5)
      - [Example](#example)
    - [Validator.getRules()](#validatorgetrules)
      - [Returns](#returns-6)
      - [Example](#example-1)
    - [Validator.hasRule()](#validatorhasrule)
      - [Parameters](#parameters-7)
      - [Returns](#returns-7)
      - [Example](#example-2)
  - [Types](#types)
    - [ValidatorOptions](#validatoroptions)
    - [ValidatorResult](#validatorresult)
  - [ValidatorClassResult](#validatorclassresult)
  - [ValidatorObjectResult](#validatorobjectresult)
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
    { Matches: { params: [/.*\d.*/], message: 'Must contain a number' } },
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

### Validator.validateObject()

**Validate a plain object against a set of rules without requiring a class.**

```typescript
static async validateObject<T extends object, Context = unknown>(
  data: T,
  rules: ValidatorObjectRules<T>,
  options?: ValidatorObjectOptions<T, Context>
): Promise<ValidatorObjectResult<T, Context>>
```

#### Parameters

| Parameter         | Type                      | Required | Description                            |
| :---------------- | :------------------------ | :------- | :------------------------------------- |
| `data`            | `T`                       | ✅       | The data object to validate            |
| `rules`           | `ValidatorObjectRules<T>` | ✅       | Map of field names to validation rules |
| `options`         | `ValidatorObjectOptions`  | ❌       | Optional validation configuration      |
| `options.context` | `Context`                 | ❌       | Custom validation context              |
| `options.i18n`    | `I18n`                    | ❌       | Custom i18n instance                   |

#### Returns

```typescript
Promise<ValidatorObjectResult<T, Context>>;

type ValidatorObjectResult<T, Context> =
  | ValidatorObjectSuccess<T, Context>
  | ValidatorObjectError<T>;

interface ValidatorObjectSuccess<T, Context> {
  success: true;
  data: T;
  status: 'success';
  duration: number;
  validatedAt: Date;
}

interface ValidatorObjectError<T> {
  success: false;
  status: 'error';
  message: string;
  fieldErrors: Partial<Record<keyof T | string, string>>;
  errors: ValidatorClassItemError[];
  failureCount: number;
}
```

#### Examples

**Direct validation:**

```typescript
const result = await Validator.validateObject(
  { name: 'John', age: 25 },
  {
    name: ['Required', 'String'],
    age: ['Required', 'Number', { NumberGTE: [18] }],
  }
);

if (result.success) {
  console.log(result.data.name); // 'John'
}
```

---

### Validator.object()

**Factory method that creates a reusable object schema for validation.**

```typescript
static object<T extends object, Context = unknown>(
  rules: ValidatorObjectRules<T>
): ValidatorObjectSchema<T, Context>
```

#### Parameters

| Parameter | Type                      | Required | Description                            |
| :-------- | :------------------------ | :------- | :------------------------------------- |
| `rules`   | `ValidatorObjectRules<T>` | ✅       | Map of field names to validation rules |

#### Returns

```typescript
ValidatorObjectSchema<T, Context>;

interface ValidatorObjectSchema<T, Context> {
  validate(
    data: T,
    options?: ValidatorObjectOptions
  ): Promise<ValidatorObjectResult<T, Context>>;
}
```

#### Examples

**Schema instantiation and reuse:**

```typescript
const UserSchema = Validator.object({
  id: ['Required', 'Numeric'],
  email: ['Required', 'Email'],
});

// Reuse same schema for multiple validations
const result1 = await UserSchema.validate({ id: 1, email: 'a@b.com' });
const result2 = await UserSchema.validate({ id: 2, email: 'c@d.com' });
```

---

### Validator.if()

**Factory method to create a conditional validation rule.**

```typescript
static if<Context = unknown>(
  resolver: ValidatorIfResolver<Context>
): ValidatorIfRuleFunction<Context>
```

#### Parameters

| Parameter  | Type                  | Required | Description                                     |
| :--------- | :-------------------- | :------- | :---------------------------------------------- |
| `resolver` | `ValidatorIfResolver` | ✅       | Function that returns rules or skips validation |

#### Returns

A validation rule function that can be used in `rules` arrays or decorators.

#### Examples

```typescript
const ifAdmin = Validator.if(({ context }) =>
  context.isAdmin ? ['Required'] : []
);

const rules = [ifAdmin, { MinLength: [5] }];
```

---

### Validator.validateIfRule()

**Execute a conditional validation rule directly.**

```typescript
static async validateIfRule<Context = unknown>(
  options: ValidatorIfRuleOptions<Context>
): Promise<ValidatorRuleResult>
```

#### Parameters

| Parameter          | Type                     | Required | Description                 |
| :----------------- | :----------------------- | :------- | :-------------------------- |
| `options`          | `ValidatorIfRuleOptions` | ✅       | Configuration options       |
| `options.resolver` | `ValidatorIfResolver`    | ✅       | Logic to determine rules    |
| `options.value`    | `any`                    | ✅       | Value being validated       |
| `options.data`     | `object`                 | ❌       | Object containing the value |
| `options.context`  | `Context`                | ❌       | Validation context          |

#### Returns

```typescript
Promise<string | true>; // Error message or true if valid
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

## ValidatorClassResult

Discriminated union for class validation results.

```typescript
type ValidatorClassResult<T, Context = unknown> =
  | ValidatorClassSuccess<T, Context>
  | ValidatorClassError<T>;

interface ValidatorClassSuccess<T, Context> {
  success: true;
  data: T; // Class instance
  status: 'success';
  duration: number;
  validatedAt: Date;
}

interface ValidatorClassError<T> {
  success: false;
  status: 'error';
  message: string;
  fieldErrors: Partial<Record<keyof T, string>>;
  errors: ValidatorClassItemError[];
  failureCount: number;
}
```

## ValidatorObjectResult

Discriminated union for functional object validation results.

```typescript
type ValidatorObjectResult<T, Context = unknown> =
  | ValidatorObjectSuccess<T, Context>
  | ValidatorObjectError<T>;

interface ValidatorObjectSuccess<T, Context> {
  success: true;
  data: T; // The validated object
  status: 'success';
  duration: number;
  validatedAt: Date;
}

interface ValidatorObjectError<T> {
  success: false;
  status: 'error';
  message: string; // Summary message
  fieldErrors: Partial<Record<keyof T | string, string>>;
  errors: ValidatorClassItemError[];
  failureCount: number;
  data: T; // The original data object
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
```

### ValidatorIfResolver

Function that determines rules dynamically.

```typescript
type ValidatorIfResolver<Context = unknown> = (
  options: Pick<ValidatorOptions<ValidatorRuleParams, Context>, 'value' | 'data' | 'context' | 'i18n'>
) =>
  | ValidatorRules
  | { rules: ValidatorRules; message?: string | ((opts: any) => string) } // With custom message
  | [] // Skip validation
  | undefined
  | null
  | Promise<ValidatorRules | { rules: ValidatorRules; message?: string } | [] | undefined | null>;
```

### ValidatorIfRuleOptions

Options for `validateIfRule`, extending standard options but replacing `rules` with `resolver`.

```typescript
interface ValidatorIfRuleOptions<Context = unknown>
  extends Omit<ValidatorOptions<ValidatorRuleParams, Context>, 'rules' | 'ruleParams'>,
    ValidatorMessageConfig {
  resolver: ValidatorIfResolver<Context>;
}
```

### ValidatorMessageConfig

Mixin interface for providing custom error messages.

```typescript
interface ValidatorMessageConfig {
  /**
   * Custom error message or generator function.
   * If a function is provided, it receives the validation options/results.
   */
  message?: string | ((options: ValidatorOptions) => string);
}
```
`

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
```

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
