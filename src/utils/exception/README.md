# BaseException Utility

The `BaseException` class provides a robust, standardized, and extensible way to handle errors in your application. It is designed to be cleaner and more powerful than the native `Error` class, offering features like serialization, error chaining, global hooks, and safe type handling.

Import it from `reslib/utils`:

```typescript
import { BaseException } from 'reslib/utils';
```

## Features

- **Serialization**: `toJSON()` method for safe REST API responses.
- **Extensibility**: Easy to extend for domain-specific exceptions.
- **Error Chaining**: Preserves the original cause of errors.
- **Factory Methods**: Helpers like `from()`, `tryCatch()`, and `tryCatchSync()` for safe execution.
- **Global Hooks**: Intercept all exceptions for logging or monitoring.
- **Cross-Platform**: Works in Node.js, Browsers, and React Native.

## Usage

### 1. Basic Usage

Throwing a simple exception:

```typescript
throw new BaseException('Something went wrong');
```

Throwing with options (code, status, details):

```typescript
throw new BaseException('User not found', {
  code: 'USER_NOT_FOUND',
  statusCode: 404,
  details: { userId: '123' },
  cause: originalError,
});
```

### 2. Custom Extensions

You can extend `BaseException` to create domain-specific errors. The static factory methods will automatically respect your custom class.

```typescript
interface PaymentErrorDetails {
  transactionId: string;
  amount: number;
}

class PaymentException extends BaseException<PaymentErrorDetails> {
  constructor(message: string, details: PaymentErrorDetails) {
    super(message, {
      code: 'PAYMENT_FAILED',
      statusCode: 402,
      details,
    });
  }
}

// Usage
throw new PaymentException('Insufficient funds', {
  transactionId: 'txn_123',
  amount: 50.0,
});
```

### 3. Safe Execution (Try/Catch Helpers)

Avoid messy try-catch blocks with `tryCatch` (async) and `tryCatchSync` (sync). They return a tuple `[error, result]`.

**Synchronous:**

```typescript
const [error, result] = BaseException.tryCatchSync(() => {
  return JSON.parse(potentiallyBadJson);
});

if (error) {
  console.error(error.message); // automatically wrapped in BaseException
  return;
}
console.log(result);
```

**Asynchronous:**

```typescript
const [error, user] = await BaseException.tryCatch(async () => {
  return await db.users.findOne(id);
});

if (error) {
  // Handle error
}
```

### 4. Converting Errors

Convert any unknown error (string, Error object, generic object) into a `BaseException`:

```typescript
try {
  dangerousCode();
} catch (err) {
  const ex = BaseException.from(err);
  console.log(ex.code); // Safe to access
}
```

### 5. Global Hooks (Logging)

Register a hook to capture every `BaseException` created. Useful for integrating libraries like Sentry or Datadog.

```typescript
BaseException.registerHook((exception) => {
  logger.error(`[${exception.code}] ${exception.message}`, {
    meta: exception.details,
  });
});
```

### 6. Serialization (JSON)

Prepare exceptions for API responses:

```typescript
const ex = new BaseException('Error');
console.log(ex.toJSON());
/* Output:
{
  name: 'BaseException',
  message: 'Error',
  timestamp: '2023-11-01T10:00:00.000Z',
  ...
}
*/
```

Options for serialization:

```typescript
ex.toJSON({
  stack: true, // Force include stack trace
  cause: false, // Hide cause chain
  maxCauseDepth: 5, // Unwrap up to 5 levels of nested errors
});
```
