# BaseException Documentation

`BaseException` is the foundational error class for the `reslib` ecosystem. It is designed to solve the common frustrations with JavaScript's native `Error` class: lack of structure, poor serialization, and difficulty in handling unknown error types.

## 🚀 Quick Start

### Installation

```typescript
import { BaseException } from 'reslib/exception';
```

### Basic Usage

```typescript
// 1. Throwing a simple exception
throw new BaseException('User not found');

// 2. Throwing with metadata (codes, status, details)
throw new BaseException('Invalid permissions', {
  code: 'AUTH_forbidden',
  statusCode: 403,
  details: {
    userId: 'u_123',
    resource: 'billing_settings',
  },
});

// 3. Converting ANY unknown error (safe handler)
try {
  await database.query();
} catch (err) {
  // Automatically preserves stack traces and original causes
  throw BaseException.from(err, { code: 'DB_ERROR' });
}
```

---

## 🏗 Architecture & Design

To effectively extend `BaseException`, it is critical to understand its creation flow. It uses a **Factory Method Pattern** to handle the complexity of converting unknown errors into structured exceptions.

### The Creation Flow

When you call `BaseException.from(error)`, the following pipeline executes:

1.  **`from(error)`**: The public entry point. It handles basics like JSON string parsing and checking if the error is already an instance of the class (to reuse it).
2.  **`createFromError(error)`**: The **brain** of the operation. It decides _how_ to extract information from the error.
    - Calls `parseErrorMessage(error)` to get the string message.
    - Calls `parseErrorDetails(error)` to extract structured data.
3.  **`create(message, options)`**: The factory that instantiates the class.
4.  **`constructor`**: The final initialization.

**Why this matters**: You can hook into _any_ stage of this pipeline to customize behavior (see [Extensibility](#-extensibility--customization)).

---

## 🧩 Extensibility & Customization

This is where `BaseException` shines. You can customize it at four different levels depending on your needs.

### Level 1: Typed Details (Generics)

If you just need structured data without new logic, use TypeScript interfaces.

```typescript
interface PaymentDetails {
  transactionId: string;
  gateway: 'stripe' | 'paypal';
  amount: number;
}

// Usage
throw new BaseException<PaymentDetails>('Card Declined', {
  code: 'PAY_DECLINED',
  details: {
    transactionId: 'tx_123',
    gateway: 'stripe',
    amount: 100, // Type-checked!
  },
});
```

### Level 2: Domain-Specific Subclasses

Create classes for specific error domains. This allows you to centralize error logic.

```typescript
class DatabaseException extends BaseException {
  // Override to automatically detect SQL error codes
  protected static override createFromError(error: unknown, options?: BaseExceptionOptions) {
    if (isPostgresError(error)) {
      if (error.code === '23505') { // Unique violation
        return new this('Duplicate Record', {
           code: 'DB_DUPLICATE',
           statusCode: 409,
           cause: error
        });
      }
    }
    // Fallback to default behavior
    return super.createFromError(error, options);
  }
}

// Usage everywhere in your app:
try { ... } catch (e) { throw DatabaseException.from(e); }
```

### Level 3: Custom Properties (High Control)

Sometimes `details` isn't enough. You want top-level properties on your error object (e.g., `error.retryAfter`).

**Pattern Checklist**:

1.  Declare properties on the class.
2.  Update the constructor to accept them.
3.  Override `toJSON` to include them in serialization.

```typescript
interface RateLimitOptions extends BaseExceptionOptions {
  retryAfterSeconds?: number;
}

class RateLimitException extends BaseException {
  public readonly retryAfterSeconds: number;

  constructor(message: string, options?: RateLimitOptions) {
    super(message, options);
    this.retryAfterSeconds = options?.retryAfterSeconds ?? 60;
  }

  // CRITICAL: Override toJSON to include your new field in API responses
  override toJSON() {
    return {
      ...super.toJSON(),
      retryAfterSeconds: this.retryAfterSeconds,
    };
  }
}
```

### Level 4: Deep Customization (Hooks)

For extreme control, you can override the parsing logic itself.

```typescript
class FriendlyException extends BaseException {
  // Prefix all error messages
  protected static override parseErrorMessage(error: unknown): string {
    const original = super.parseErrorMessage(error);
    return `Oops! ${original}`;
  }

  // Auto-extract specific fields from legacy libraries
  protected static override parseErrorDetails(error: unknown) {
    const details = super.parseErrorDetails(error);
    if (error && typeof error === 'object' && 'legacy_id' in error) {
      return { ...details, legacyId: error.legacy_id };
    }
    return details;
  }
}
```

---

## 🧪 Comprehensive Examples

### Scenario A: The Smart Payment Exception

A real-world example handling transaction failures, custom properties, and automatic error mapping.

```typescript
// 1. Define the shape of your details
interface TransactionDetails {
  merchantId: string;
  terminal?: string;
}

// 2. Define custom options
interface PaymentExceptionOptions {
  transactionId?: string;
  currency?: string;
}

class PaymentException extends BaseException<TransactionDetails> {
  // Custom Top-Level Fields
  public transactionId?: string;
  public currency?: string;

  constructor(message: string, options?: PaymentExceptionOptions) {
    super(message, options);
    this.transactionId = options?.transactionId;
    this.currency = options?.currency;
  }

  // Smart Factory: Detects errors from specific gateways
  protected static override createFromError(
    error: unknown,
    options?: PaymentExceptionOptions
  ) {
    // Detect Stripe Errors
    if (
      error &&
      typeof error === 'object' &&
      (error as any).type === 'StripeCardError'
    ) {
      return new this('Card was declined by gateway', {
        ...options,
        code: 'PAYMENT_DECLINED',
        statusCode: 402,
        transactionId: (error as any).charge,
        details: { merchantId: 'default' },
      });
    }

    // Default handling
    return super.createFromError(error, options);
  }

  override toJSON() {
    return {
      ...super.toJSON(), // Standard fields (message, code, etc.)
      transactionId: this.transactionId,
      currency: this.currency,
    };
  }
}
```

### Scenario B: Validation Aggregation

Handling multiple validation errors in a single exception.

```typescript
interface ValidationErrorItem {
  field: string;
  rule: string;
  message: string;
}

interface ValidationDetails {
  errors: ValidationErrorItem[];
}

class ValidationException extends BaseException<ValidationDetails> {
  constructor(errors: ValidationErrorItem[]) {
    super('Validation Failed', {
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      details: { errors },
    });
  }

  // Helper to format message based on error count
  override toString() {
    return `${this.name}: ${this.details?.errors.length} validation errors found.`;
  }
}
```

---

## 🛠 Functional Helpers

`BaseException` provides functional utilities to cleaner code that avoids standard `try/catch` boilerplate.

### `tryCatch` (The Result Pattern)

Great for Go-style error handling. Returns `[error, result]`.

```typescript
// Async
const [err, user] = await BaseException.tryCatch(async () => db.getUser(id));
if (err) {
  // err is explicitly typed as BaseException
  return { status: 500, error: err.message };
}

// Sync
const [err, parsed] = BaseException.tryCatchSync(() => JSON.parse(input));
```

### `wrap` (Async Bubble-Up)

When you want to ensure _everything_ that leaves a function is a `BaseException`.

```typescript
const data = await BaseException.wrap(
  async () => {
    return await thirdPartyService.getData();
  },
  {
    code: 'SERVICE_DOWN',
    statusCode: 503,
  }
);
// If thirdPartyService fails, this throws BaseException(code='SERVICE_DOWN')
```

---

## 🔍 Core Features Reference

### Serialization (`toJSON`)

Safe for JSON.stringify. Handles circular references and hides stack traces in production.

```typescript
console.log(JSON.stringify(exception));
// {
//   "__isBaseException": true,
//   "message": "...",
//   "code": "...",
//   "timestamp": "..."
// }
```

### Duck Typing (`is`)

Works across packages, versions, and network boundaries.

```typescript
// Works even if the object came from a JSON payload!
if (BaseException.is(someObject)) {
  console.log(someObject.code);
}
```

### Error Chaining (`cause`) with Root Cause Normalization

BaseException implements an **intelligent cause normalization** system that automatically extracts the **root cause** from nested exception chains.

#### The Problem It Solves

When exceptions wrap other exceptions multiple times (common in layered architectures), the cause chain can become deeply nested:

```typescript
// Traditional approach creates deep nesting
const dbError = new Error('Connection timeout');
const serviceError = new BaseException('Service failed', { cause: dbError });
const controllerError = new BaseException('Request failed', {
  cause: serviceError,
});
const middlewareError = new BaseException('Operation failed', {
  cause: controllerError,
});

// Without normalization: middlewareError.cause === controllerError (not the root!)
```

This causes problems:

1. **Serialization failures**: Duck-typed exceptions from `JSON.parse()` don't have a `toJSON()` method
2. **Debugging complexity**: Finding the root cause requires manual traversal
3. **Inconsistent behavior**: Different exception instances may have different cause depths

#### How Cause Normalization Works

When you set a `cause` on a `BaseException`, it automatically **extracts the deepest non-BaseException cause**:

```typescript
const rootDbError = new Error('ECONNREFUSED');
const level3 = new BaseException('Query failed', { cause: rootDbError });
const level2 = new BaseException('Service error', { cause: level3 });
const level1 = new BaseException('API error', { cause: level2 });

// The cause is NORMALIZED to the root error
console.log(level1.cause === rootDbError); // ✅ true (not level2!)
console.log(level2.cause === rootDbError); // ✅ true (not level3!)
console.log(level3.cause === rootDbError); // ✅ true
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

#### Serialization of Causes

When calling `toJSON()`, the cause is serialized safely:

```typescript
const dbError = new Error('Connection refused');
dbError.code = 'ECONNREFUSED';

const exception = new BaseException('Database unavailable', { cause: dbError });
const json = exception.toJSON({ cause: true });

console.log(json.cause);
// {
//   name: 'Error',
//   message: 'Connection refused',
//   code: 'ECONNREFUSED'
// }
```

For non-Error causes, `JsonHelper.stringify()` is used:

```typescript
const apiResponse = { status: 500, errors: ['Internal error'] };
const exception = new BaseException('API failed', { cause: apiResponse });

const json = exception.toJSON({ cause: true });
console.log(json.cause);
// '{\n  "status": 500,\n  "errors": ["Internal error"]\n}'
```

#### Depth Limiting

To prevent infinite recursion with circular references, cause serialization has a configurable depth limit:

```typescript
const json = exception.toJSON({
  cause: true,
  maxCauseDepth: 5, // Default is 10
});
```

When the depth limit is reached, the cause is replaced with `'[Max Depth Reached]'`.

#### Practical Pattern: Error Wrapping in Catch Blocks

With cause normalization, you can safely wrap errors at each layer without losing the original:

```typescript
// Database layer
async function queryUser(id: string) {
  try {
    return await db.query('SELECT * FROM users WHERE id = ?', [id]);
  } catch (err) {
    throw new BaseException('Database query failed', {
      code: 'DB_QUERY_ERROR',
      cause: err, // Original DB error
    });
  }
}

// Service layer
async function getUser(id: string) {
  try {
    return await queryUser(id);
  } catch (err) {
    throw new BaseException('User service error', {
      code: 'USER_SERVICE_ERROR',
      cause: err, // BaseException from DB layer → normalized to original DB error
    });
  }
}

// Controller layer
async function handleGetUser(req, res) {
  try {
    const user = await getUser(req.params.id);
    res.json(user);
  } catch (err) {
    const exception = BaseException.from(err, { code: 'REQUEST_ERROR' });

    // exception.cause is the ORIGINAL database error, not intermediate layers
    console.log(exception.cause); // The raw DB error

    res.status(exception.statusCode || 500).json(exception.toJSON());
  }
}
```

#### Override `normalizeCause` for Custom Behavior

If you need to preserve the full chain or implement custom normalization logic, override `normalizeCause`:

```typescript
class ChainPreservingException extends BaseException {
  // Preserve the full chain (disable normalization)
  normalizeCause<T>(cause: unknown): T {
    return cause as T; // No unwrapping
  }
}

class LoggingException extends BaseException {
  // Log each level while normalizing
  normalizeCause<T>(cause: unknown): T {
    if (BaseException.is(cause)) {
      console.log('Unwrapping:', cause.message);
      return this.normalizeCause(cause.cause);
    }
    return cause as T;
  }
}
```
