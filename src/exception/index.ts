import { defaultStr } from '@utils/defaultStr';
import { getGlobal } from '@utils/global';
import { isNonNullString } from '@utils/isNonNullString';
import { JsonHelper } from '@utils/json';
import { defaultNumber } from '@utils/numbers';
import { isObj } from '@utils/object';

/**
 * Represents a generic dictionary for exception details.
 * Replaces the strict Dictionary type to allow more flexibility.
 */
export type BaseExceptionDetails = Record<string | number | symbol, unknown>;

/**
 * Hook function type for intercepting exceptions (e.g., for logging).
 */

export type ExceptionHook = (exception: BaseException) => void;

/**
 * Options for serializing the exception.
 */
export interface SerializationOptions {
  /** Include the stack trace in the output. Default: false (unless not in production) */
  stack?: boolean;
  /** Include the cause chain in the output. Default: true */
  cause?: boolean;
  /** Max depth to serialize nested causes. Default: 10 */
  maxCauseDepth?: number;
}

/**
 * Base application exception class.
 * This class provides a standardized, serializable exception structure that can be
 * safely returned from REST API endpoints, extended for domain-specific errors,
 * and intercepted via hooks.
 *
 * @example
 * ```typescript
 * // Basic usage
 * throw new BaseException('User not found');
 * ```
 *
 * @example
 * // extending
 * class PaymentException extends BaseException<{ transactionId: string }> {
 *    constructor(message: string, transactionId: string) {
 *      super(message, { details: { transactionId } });
 *    }
 * }
 */
export class BaseException<
  TDetails extends BaseExceptionDetails = BaseExceptionDetails,
> extends Error {
  /**
   * The constant name identifier for this exception class.
   */
  public static readonly NAME = 'BaseException' as const;

  /**
   * Unique marker property to identify BaseException instances (and subclasses)
   * even after serialization/deserialization where instanceof check fails.
   */
  public readonly __isBaseException = true;

  /**
   * Global hooks that run when any BaseException (or subclass) is instantiated.
   */
  private static hooks: ExceptionHook[] = [];

  /**
   * Application-specific error code (e.g., 'USER_NOT_FOUND').
   */
  public code?: string;

  /**
   * HTTP status code associated with this exception.
   */
  public statusCode?: number;

  /**
   * Additional structured details about the exception.
   */
  public details?: TDetails;

  /**
   * The underlying error that caused this exception.
   */
  public cause?: unknown;

  /**
   * Timestamp when the exception was created.
   */
  public readonly timestamp: Date;

  public readonly success: boolean = false;

  /**
   * Creates a new BaseException instance.
   *
   * @param message - Human-readable error message describing what went wrong
   * @param options - Optional configuration object containing metadata like code, statusCode, details, cause, and timestamp
   *
   * @example
   * ```typescript
   * // Basic usage
   * const error = new BaseException('User not found');
   * ```
   *
   * @example
   * ```typescript
   * // With error code and HTTP status
   * const error = new BaseException('Invalid credentials', {
   *   code: 'AUTH_FAILED',
   *   statusCode: 401
   * });
   * ```
   *
   * @example
   * ```typescript
   * // With typed details
   * interface PaymentDetails extends BaseExceptionDetails {
   *   transactionId: string;
   *   amount: number;
   * }
   *
   * const error = new BaseException<PaymentDetails>('Payment failed', {
   *   code: 'PAYMENT_ERROR',
   *   statusCode: 402,
   *   details: {
   *     transactionId: 'tx_12345',
   *     amount: 99.99
   *   }
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Wrapping another error as cause
   * try {
   *   await database.query('SELECT * FROM users');
   * } catch (dbError) {
   *   throw new BaseException('Database query failed', {
   *     code: 'DB_ERROR',
   *     cause: dbError // Original error preserved
   *   });
   * }
   * ```
   */
  constructor(message: string, options?: BaseExceptionOptions<TDetails>) {
    super(message);

    // Set the prototype explicitly for proper instanceof checks in older environments
    Object.setPrototypeOf(this, new.target.prototype);

    // Default name (can be overridden by subclasses)
    if (new.target === BaseException) {
      this.name = BaseException.NAME;
    } else {
      this.name = new.target.name || BaseException.NAME;
    }

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Assign optional properties
    this.code = options?.code;
    this.statusCode = options?.statusCode;
    this.details = options?.details;
    this.timestamp = options?.timestamp ?? new Date();
    this.cause = options?.cause; // Error.cause is standard in modern JS, but we keep a public property too.
    this.success = false;
  }

  /**
   * Converts the exception to a plain JSON-serializable object.
   *
   * This method creates a structured representation of the exception that can be safely
   * sent over HTTP, stored in databases, or logged to external systems. The output includes
   * all relevant exception metadata while avoiding circular references and non-serializable values.
   *
   * @param options - Optional configuration to control what gets included in the serialization
   * @param options.stack - Whether to include the stack trace. Defaults to true in non-production, false in production
   * @param options.cause - Whether to include the error cause chain. Defaults to true
   * @param options.maxCauseDepth - Maximum depth for serializing nested causes. Defaults to 10
   * @returns A plain object suitable for JSON.stringify() or API responses
   *
   * @example
   * ```typescript
   * // Basic serialization
   * const error = new BaseException('User not found', {
   *   code: 'USER_NOT_FOUND',
   *   statusCode: 404
   * });
   *
   * console.log(error.toJSON());
   * // {
   * //   __isBaseException: true,
   * //   __baseExceptionName: 'BaseException',
   * //   name: 'BaseException',
   * //   message: 'User not found',
   * //   code: 'USER_NOT_FOUND',
   * //   statusCode: 404,
   * //   timestamp: '2024-01-15T10:30:00.000Z',
   * //   success: false
   * // }
   * ```
   *
   * @example
   * ```typescript
   * // Serialize with stack trace for debugging
   * const error = new BaseException('Database connection failed');
   * const serialized = error.toJSON({ stack: true });
   *
   * console.log(serialized.stack); // Full stack trace included
   * ```
   *
   * @example
   * ```typescript
   * // API response usage
   * app.use((err, req, res, next) => {
   *   if (BaseException.isBaseException(err)) {
   *     res.status(err.statusCode || 500).json(err.toJSON({
   *       stack: process.env.NODE_ENV !== 'production',
   *       cause: true
   *     }));
   *   }
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Serializing error chains
   * const dbError = new Error('Connection timeout');
   * const appError = new BaseException('Failed to fetch user', {
   *   cause: dbError
   * });
   *
   * const json = appError.toJSON({ cause: true });
   * console.log(json.cause);
   * // {
   * //   name: 'Error',
   * //   message: 'Connection timeout'
   * // }
   * ```
   *
   * @example
   * ```typescript
   * // With custom details
   * interface PaymentDetails extends BaseExceptionDetails {
   *   transactionId: string;
   *   amount: number;
   * }
   *
   * const error = new BaseException<PaymentDetails>('Payment failed', {
   *   code: 'PAYMENT_FAILED',
   *   details: {
   *     transactionId: 'tx_12345',
   *     amount: 99.99
   *   }
   * });
   *
   * console.log(error.toJSON().details);
   * // { transactionId: 'tx_12345', amount: 99.99 }
   * ```
   *
   * @remarks
   * - Always includes `__isBaseException: true` marker for runtime type checking
   * - Timestamps are converted to ISO 8601 strings
   * - Circular references in causes are prevented via maxCauseDepth
   * - Stack traces are excluded by default in production for security
   * - Compatible with JSON.stringify() and structured clone algorithms
   */
  toJSON(options?: SerializationOptions): Record<string, unknown> {
    const includeStack = options?.stack ?? (!isProduction() && !!this.stack);
    const includeCause = options?.cause ?? true;
    const maxCauseDepth = defaultNumber(options?.maxCauseDepth, 10);

    return {
      __isBaseException: true,
      __baseExceptionName: BaseException.NAME,
      name: this.name,
      message: this.message,
      ...(this.code && { code: this.code }),
      ...(this.statusCode && { statusCode: this.statusCode }),
      ...(this.details && { details: this.details }),
      timestamp: this.timestamp.toISOString(),
      ...(includeStack ? { stack: this.stack } : {}),
      ...(includeCause && this.cause
        ? { cause: this.serializeCause(this.cause, maxCauseDepth) }
        : {}),
      success: false,
    };
  }

  /**
   * Helper to Recursively serialize causes.
   */
  private serializeCause(cause: unknown, depth: number): unknown {
    if (depth <= 0) return '[Max Depth Reached]';
    if (BaseException.isBaseException(cause)) {
      return cause.toJSON({
        stack: false,
        cause: true,
        maxCauseDepth: depth - 1,
      });
    }
    if (cause instanceof Error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = cause as any;
      return {
        name: c.name,
        message: c.message,
        ...(c.code ? { code: c.code } : {}),
      };
    }
    return String(cause);
  }

  /**
   * Creates a human-readable string representation of the exception.
   *
   * Returns a formatted string in the format: `Name [CODE]: Message` or `Name: Message` if no code is set.
   * This is automatically called when the exception is converted to a string (e.g., when logged).
   *
   * @returns Formatted string representation
   *
   * @example
   * ```typescript
   * // Without code
   * const error = new BaseException('User not found');
   * console.log(error.toString());
   * // "BaseException: User not found"
   * ```
   *
   * @example
   * ```typescript
   * // With error code
   * const error = new BaseException('Invalid credentials', {
   *   code: 'AUTH_FAILED'
   * });
   * console.log(error.toString());
   * // "BaseException [AUTH_FAILED]: Invalid credentials"
   * ```
   *
   * @example
   * ```typescript
   * // String coercion
   * const error = new BaseException('Payment failed', { code: 'PAYMENT_ERROR' });
   * console.log('Error: ' + error);
   * // "Error: BaseException [PAYMENT_ERROR]: Payment failed"
   * ```
   *
   * @example
   * ```typescript
   * // In subclasses
   * class ApiException extends BaseException {
   *   // toString automatically uses the subclass name
   * }
   *
   * const error = new ApiException('Request failed', { code: 'API_ERROR' });
   * console.log(error.toString());
   * // "ApiException [API_ERROR]: Request failed"
   * ```
   */
  override toString(): string {
    const codePrefix = this.code ? ` [${this.code}]` : '';
    return `${this.name}${codePrefix}: ${this.message}`;
  }
  /**
   * Custom instanceof check. When consumers import `BaseException` from built packages or
   * across module boundaries, class identity can differ. Using Symbol.hasInstance
   * allows `instanceof BaseException` to succeed if the object has the required BaseException API
   * shape (duck typing). This preserves `instanceof` checks externally while
   * keeping the current exported API intact.
   */

  /* static [Symbol.hasInstance](obj: any) {
    return this.isBaseException(obj);
  } */
  /**
   * Type guard to check if a value is a BaseException instance or has BaseException structure.
   *
   * This method performs both runtime `instanceof` checks and duck-typing validation.
   * It works correctly even with:
   * - Serialized/deserialized exceptions from JSON
   * - Exceptions from different module boundaries
   * - Objects that match the BaseException shape
   *
   * @template TException - The specific exception type to check for (defaults to BaseException)
   * @param value - The value to check
   * @returns True if the value is a BaseException or matches its structure
   *
   * @example
   * ```typescript
   * // Check exception instances
   * const error = new BaseException('Error');
   * if (BaseException.isBaseException(error)) {
   *   console.log(error.code); // TypeScript knows it's a BaseException
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Works with serialized exceptions
   * const error = new BaseException('Test', { code: 'TEST' });
   * const json = JSON.stringify(error);
   * const parsed = JSON.parse(json);
   *
   * BaseException.isBaseException(parsed); // true! (duck-typing)
   * ```
   *
   * @example
   * ```typescript
   * // Type narrowing in error handlers
   * function handleError(error: unknown) {
   *   if (BaseException.isBaseException(error)) {
   *     // TypeScript narrows type to BaseException
   *     console.log('Code:', error.code);
   *     console.log('Status:', error.statusCode);
   *     console.log('Details:', error.details);
   *   } else {
   *     console.log('Unknown error:', error);
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Filter exceptions from array
   * const errors: unknown[] = [
   *   new BaseException('Error 1'),
   *   new Error('Error 2'),
   *   'string error',
   *   { message: 'plain object' }
   * ];
   *
   * const baseExceptions = errors.filter(BaseException.isBaseException);
   * // baseExceptions is typed as BaseException[]
   * ```
   *
   * @example
   * ```typescript
   * // Check for specific subclass
   * class ApiException extends BaseException {}
   *
   * const error: unknown = new ApiException('API failed');
   * if (BaseException.isBaseException<ApiException>(error)) {
   *   // error is narrowed to ApiException
   * }
   * ```
   *
   * @remarks
   * The duck-typing check verifies:
   * - `__isBaseException === true`
   * - `message` is a string
   * - `success === false`
   * - `__baseExceptionName === 'BaseException'`
   *
   * This ensures compatibility across module boundaries and serialization.
   */
  static isBaseException<TException extends BaseException>(
    value: unknown
  ): value is TException {
    try {
      return (
        value instanceof BaseException ||
        (isObj(value) &&
          (value as { __isBaseException?: boolean }).__isBaseException ===
            true &&
          typeof (value as { message?: unknown }).message === 'string' &&
          (value as { success?: unknown }).success === false &&
          (value as { __baseExceptionName: string }).__baseExceptionName ===
            BaseException.NAME)
      );
    } catch {
      return false;
    }
  }

  // --- Factory Methods with proper inheritance support ---

  /**
   * Protected factory method to create an exception instance.
   *
   * This is a low-level helper method used internally by `from()` and `createFromError()`.
   * It uses the polymorphic `this` parameter to ensure that when called on subclasses,
   * it returns an instance of the subclass, not BaseException.
   *
   * **Protected**: This method is not part of the public API. Use `from()` or the constructor
   * directly. Override this in subclasses only if you need to customize instance creation
   * (e.g., for dependency injection or custom initialization logic).
   *
   * @template TDetails - Type of the details object
   * @template TException - The exception type being created
   * @param this - The exception constructor (auto-bound)
   * @param message - The error message
   * @param options - Optional exception metadata
   * @returns A new exception instance of the calling class type
   *
   * @example
   * ```typescript
   * // Internal usage (this is what from() does internally)
   * class ApiException extends BaseException {
   *   // The create method is inherited and works polymorphically
   * }
   *
   * // When ApiException.from() calls create internally:
   * const instance = ApiException.create('Error', { code: 'API_ERROR' });
   * // instance is typed as ApiException, not BaseException
   * ```
   *
   * @example
   * ```typescript
   * // Override for custom initialization
   * class TrackedEvent {
   *   constructor(public eventId: string) {}
   * }
   *
   * class TrackedExceptio extends BaseException {
   *   public tracker?: TrackedEvent;
   *
   *   protected static override create<
   *     TDetails extends BaseExceptionDetails = BaseExceptionDetails,
   *     T extends BaseException<TDetails> = BaseException<TDetails>
   *   >(
   *     this: BaseExceptionConstructor<TDetails, T>,
   *     message: string,
   *     options?: BaseExceptionOptions<TDetails>
   *   ): T {
   *     const instance = new this(message, options);
   *
   *     // Custom post-creation logic
   *     if (instance instanceof TrackedExceptio) {
   *       instance.tracker = new TrackedEvent(generateId());
   *     }
   *
   *     return instance;
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Dependency injection pattern
   * class ServiceException extends BaseException {
   *   private static logger?: Logger;
   *
   *   static setLogger(logger: Logger) {
   *     this.logger = logger;
   *   }
   *
   *   protected static override create<
   *     TDetails extends BaseExceptionDetails = BaseExceptionDetails,
   *     T extends BaseException<TDetails> = BaseException<TDetails>
   *   >(
   *     this: BaseExceptionConstructor<TDetails, T>,
   *     message: string,
   *     options?: BaseExceptionOptions<TDetails>
   *   ): T {
   *     const instance = new this(message, options);
   *
   *     // Auto-log on creation
   *     if (this.logger) {
   *       this.logger.error(`[${instance.code}] ${message}`);
   *     }
   *
   *     return instance;
   *   }
   * }
   * ```
   *
   * @remarks
   * **When to override**:
   * - Custom initialization logic needed after construction
   * - Dependency injection or service location
   * - Automatic tracking/logging on creation
   * - Default property values based on context
   *
   * **When NOT to override**:
   * - For custom error conversion logic (use `createFromError` instead)
   * - For message formatting (use `parseErrorMessage` instead)
   * - For detail extraction (use `parseErrorDetails` instead)
   *
   * The default implementation simply calls `new this(message, options)`, which
   * correctly creates instances of subclasses due to the polymorphic `this` typing.
   *
   * @see {@link from} - Public factory method that uses create internally
   * @see {@link createFromError} - Override this for error conversion logic
   */
  protected static create<
    TDetails extends BaseExceptionDetails = BaseExceptionDetails,
    TException extends BaseException<TDetails> = BaseException<TDetails>,
  >(
    this: BaseExceptionConstructor<TDetails, TException>,
    message: string,
    options?: BaseExceptionOptions<TDetails>
  ): TException {
    return new this(message, options);
  }

  /**
   * Creates a BaseException instance from any unknown error value.
   *
   * This is the primary factory method for creating exceptions from various error sources.
   * It intelligently handles different input types:
   * - Error objects (preserves message, stack, cause)
   * - JSON strings (automatically parses)
   * - Plain objects (extracts message and details)
   * - Strings (uses as message)
   * - Existing BaseException instances (merges options)
   *
   * **Extensibility**: Subclasses can override `parseErrorMessage`, `parseErrorDetails`, or
   * `createFromError` to customize how errors are converted.
   *
   * @template TDetails - Type of the details object
   * @template TException - The exception type being created (automatically inferred from the class)
   * @param this - The exception constructor (automatically bound when called as `ClassName.from()`)
   * @param error - The error value to convert (any type)
   * @param options - Optional metadata to merge/override
   * @returns A new exception instance of the calling class type
   *
   * @example
   * ```typescript
   * // Convert standard Error
   * try {
   *   JSON.parse('invalid');
   * } catch (err) {
   *   throw BaseException.from(err);
   *   // BaseException with err.message, err.stack preserved
   * }
   * ```
   *
   * @example
   * ```typescript
   * // From string
   * const error = BaseException.from('Something went wrong');
   * console.log(error.message); // \"Something went wrong\"
   * ```
   *
   * @example
   * ```typescript
   * // From plain object (API error responses)\n   * const apiError = {\n   *   message: 'Validation failed',\n   *   code: 'VALIDATION_ERROR',\n   *   statusCode: 400,\n   *   errors: [{ field: 'email', message: 'Invalid format' }]\n   * };\n   *\n   * const exception = BaseException.from(apiError);\n   * console.log(exception.code); // 'VALIDATION_ERROR'\n   * console.log(exception.statusCode); // 400\n   * console.log(exception.details); // Contains the API error details\n   * ```\n   *\n   * @example\n   * ```typescript\n   * // From JSON string\n   * const jsonError = '{\"message\":\"Error\",\"code\":\"ERR_001\"}';\n   * const error = BaseException.from(jsonError);\n   * // Automatically parsed and converted\n   * ```\n   *\n   * @example\n   * ```typescript\n   * // With additional options\n   * const dbError = new Error('Connection timeout');\n   * const appError = BaseException.from(dbError, {\n   *   code: 'DB_CONNECTION_ERROR',\n   *   statusCode: 503,\n   *   details: { database: 'users_db', timeout: 5000 }\n   * });\n   * ```\n   *\n   * @example\n   * ```typescript\n   * // Subclass usage - maintains type\n   * class ApiException extends BaseException<{ endpoint: string }> {\n   *   protected static override parseErrorDetails(error: unknown) {\n   *     const details = super.parseErrorDetails(error);\n   *     return {\n   *       ...details,\n   *       endpoint: typeof error === 'object' && error !== null \n   *         ? (error as any).url || (error as any).endpoint\n   *         : undefined\n   *     };\n   *   }\n   * }\n   *\n   * const apiError = { message: 'Failed', url: '/api/users' };\n   * const exception = ApiException.from(apiError);\n   * // exception is typed as ApiException\n   * console.log(exception.details?.endpoint); // '/api/users'\n   * ```\n   *\n   * @example\n   * ```typescript\n   * // Error chain preservation\n   * const rootCause = new Error('Network timeout');\n   * const wrapped = BaseException.from(rootCause, {\n   *   code: 'NETWORK_ERROR'\n   * });\n   *\n   * console.log(wrapped.cause === rootCause); // true\n   * console.log(wrapped.toJSON().cause); // Serialized root cause\n   * ```\n   *\n   * @example\n   * ```typescript\n   * // Re-using existing exception with new options\n   * const original = new BaseException('Error');\n   * const updated = BaseException.from(original, {\n   *   code: 'UPDATED_CODE'\n   * });\n   *\n   * console.log(updated === original); // true (same instance)\n   * console.log(updated.code); // 'UPDATED_CODE' (merged)\n   * ```\n   *\n   * @remarks\n   * **Behavior**:\n   * - If `error` is already an instance of the calling class, returns it with options merged\n   * - Automatically detects and parses JSON strings\n   * - Extracts `code` and `statusCode` from error objects when available\n   * - Preserves error chains via the `cause` property\n   * - Sets `statusCode` to 500 by default for unknown errors\n  * - Override `parseErrorMessage()` to customize message extraction\n   * - Override `parseErrorDetails()` to extract custom fields\n   * - Override `createFromError()` for complete control over error conversion\n   * - Override `from()` itself for pre/post-processing logic\n   *\n   * @see {@link parseErrorMessage} - Customize message extraction\n   * @see {@link parseErrorDetails} - Customize details extraction\n   * @see {@link createFromError} - Full control over error conversion\n   * @see {@link withOptions} - Merge options into existing exceptions\n   */
  static from<
    TDetails extends BaseExceptionDetails = BaseExceptionDetails,
    TException extends BaseException<TDetails> = BaseException<TDetails>,
  >(
    this: BaseExceptionConstructor<TDetails, TException>,
    error: unknown,
    options?: BaseExceptionOptions<TDetails>
  ): TException {
    // If it's already an instance of the class we are calling from, just reuse/merge
    if (error instanceof this) {
      // Call withOptions from the class hierarchy
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (this as any).withOptions(error, options) as TException;
    }

    // If it's another BaseException type but we want `this` type (conversion)
    // We treat it as a source error to wrap or clone.
    // For simplicity, we extract info and create a new one.

    // Handle JSON strings
    if (JsonHelper.isJSON(error)) {
      const parsed = JsonHelper.parse(error);
      // Recursively call from with parsed object
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (this as any).from(parsed, options);
    }

    // Use protected method for creating the exception (allows override)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this as any).createFromError(error, options);
  }

  /**
   * Protected method to create an exception from an error source.
   *
   * This is the **core conversion method** called by `from()` after it has handled
   * JSON parsing and existing instance checks. Override this method in subclasses
   * to implement custom error handling logic, such as detecting specific error types
   * and setting appropriate codes, status codes, and details.
   *
   * The default implementation:
   * 1. Calls `parseErrorMessage(error, options)` to extract the message
   * 2. Calls `parseErrorDetails(error, options)` to extract structured details
   * 3. Determines the final `code` from options, details.code, or details.errorCode
   * 4. Determines the final `statusCode` from options, details.statusCode, or defaults to 500
   * 5. Creates a new exception instance via `create()` with all extracted data
   * 6. Sets the original error as the `cause`
   *
   * **Protected**: This is an extensibility hook. Override this when you need complete
   * control over how errors are converted to exceptions for domain-specific logic.
   *
   * @template TDetails - Type of the details object
   * @template TException - The exception type being created
   * @param this - The exception constructor (auto-bound)
   * @param error - The error value to convert (any type)
   * @param options - Optional metadata to merge/override
   * @returns A new exception instance with extracted data
   *
   * @example
   * ```typescript
   * // Database exception with error code detection
   * interface DbErrorDetails extends BaseExceptionDetails {
   *   query?: string;
   *   table?: string;
   *   constraint?: string;
   * }
   *
   * class DatabaseException extends BaseException<DbErrorDetails> {
   *   protected static override createFromError<
   *     TDetails extends BaseExceptionDetails = DbErrorDetails,
   *     T extends BaseException<TDetails> = BaseException<TDetails>
   *   >(
   *     this: BaseExceptionConstructor<TDetails, T>,
   *     error: unknown,
   *     options?: BaseExceptionOptions<TDetails>
   *   ): T {
   *     if (typeof error === 'object' && error !== null) {
   *       const err = error as Record<string, unknown>;
   *
   *       // PostgreSQL duplicate key error
   *       if (err.code === '23505') {
   *         return new this('Duplicate entry detected', {
   *           ...options,
   *           code: 'DB_DUPLICATE_ENTRY',
   *           statusCode: 409,
   *           details: {
   *             ...options?.details,
   *             table: err.table as string,
   *             constraint: err.constraint as string,
   *             query: err.query as string
   *           } as TDetails,
   *           cause: error
   *         });
   *       }
   *
   *       // Foreign key constraint error
   *       if (err.code === '23503') {
   *         return new this('Foreign key violation', {
   *           ...options,
   *           code: 'DB_FK_VIOLATION',
   *           statusCode: 400,
   *           details: {
   *             ...options?.details,
   *             table: err.table as string,
   *             constraint: err.constraint as string
   *           } as TDetails,
   *           cause: error
   *         });
   *       }
   *     }
   *
   *     // Fall back to default behavior for unknown errors
   *     return super.createFromError(error, options) as T;
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // HTTP exception with status code mapping
   * interface HttpErrorDetails extends BaseExceptionDetails {
   *   statusCode: number;
   *   path?: string;
   *   method?: string;
   *   headers?: Record<string, string>;
   * }
   *
   * class HttpException extends BaseException<HttpErrorDetails> {
   *   protected static override createFromError<
   *     TDetails extends BaseExceptionDetails = HttpErrorDetails,
   *     T extends BaseException<TDetails> = BaseException<TDetails>
   *   >(
   *     this: BaseExceptionConstructor<TDetails, T>,
   *     error: unknown,
   *     options?: BaseExceptionOptions<TDetails>
   *   ): T {
   *     if (typeof error === 'object' && error !== null) {
   *       const err = error as Record<string, unknown>;
   *       const status = typeof err.statusCode === 'number' ? err.statusCode : 500;
   *
   *       // Map status codes to standard messages
   *       const statusMessages: Record<number, string> = {
   *         400: 'Bad Request',
   *         401: 'Unauthorized',
   *         403: 'Forbidden',
   *         404: 'Not Found',
   *         500: 'Internal Server Error',
   *         502: 'Bad Gateway',
   *         503: 'Service Unavailable'
   *       };
   *
   *       const message = typeof err.message === 'string'
   *         ? err.message
   *         : statusMessages[status] || 'HTTP Error';
   *
   *       return new this(message, {
   *         ...options,
   *         code: `HTTP_${status}`,
   *         statusCode: status,
   *         details: {
   *           ...options?.details,
   *           statusCode: status,
   *           path: typeof err.path === 'string' ? err.path : undefined,
   *           method: typeof err.method === 'string' ? err.method : undefined,
   *           headers: err.headers as Record<string, string>
   *         } as TDetails,
   *         cause: error
   *       });
   *     }
   *
   *     return super.createFromError(error, options) as T;
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Validation exception with error aggregation
   * interface ValidationErrorDetails extends BaseExceptionDetails {
   *   errors: Array<{ field: string; message: string; rule: string }>;
   * }
   *
   * class ValidationException extends BaseException<ValidationErrorDetails> {
   *   protected static override createFromError<
   *     TDetails extends BaseExceptionDetails = ValidationErrorDetails,
   *     T extends BaseException<TDetails> = BaseException<TDetails>
   *   >(
   *     this: BaseExceptionConstructor<TDetails, T>,
   *     error: unknown,
   *     options?: BaseExceptionOptions<TDetails>
   *   ): T {
   *     if (typeof error === 'object' && error !== null) {
   *       const err = error as Record<string, unknown>;
   *
   *       // Check for validation error array (Joi, Yup, etc.)
   *       if (Array.isArray(err.details) && err.details.length > 0) {
   *         const validationErrors = err.details.map((detail: any) => ({
   *           field: detail.path?.join('.') || 'unknown',
   *           message: detail.message || 'Validation failed',
   *           rule: detail.type || 'unknown'
   *         }));
   *
   *         const firstError = validationErrors[0];
   *         const message = validationErrors.length === 1
   *           ? `Validation failed for ${firstError.field}: ${firstError.message}`
   *           : `Validation failed for ${validationErrors.length} fields`;
   *
   *         return new this(message, {
   *           ...options,
   *           code: 'VALIDATION_ERROR',
   *           statusCode: 400,
   *           details: {
   *             ...options?.details,
   *             errors: validationErrors
   *           } as TDetails,
   *           cause: error
   *         });
   *       }
   *     }
   *
   *     return super.createFromError(error, options) as T;
   *   }
   * }
   * ```
   *
   * @remarks
   * **When to override this method**:
   * - You need domain-specific error detection (e.g., database error codes)
   * - You want to map error types to standardized codes/messages
   * - You need to aggregate or transform complex error structures
   * - You want complete control over the conversion logic
   *
   * **When to use helper methods instead**:
   * - Only need custom message formatting → override `parseErrorMessage`
   * - Only need custom detail extraction → override `parseErrorDetails`
   * - Need simple pre/post processing → override `from` itself
   *
   * **Implementation tips**:
   * - Always fall back to `super.createFromError()` for unknown error types
   * - Preserve the original error as `cause` for debugging
   * - Use type guards to safely check error properties
   * - Return specific status codes (400 for client errors, 500 for server errors)
   * - Include relevant context in details for troubleshooting
   *
   * @see {@link from} - Public method that calls this after handling JSON/instances
   * @see {@link parseErrorMessage} - Override for custom message extraction only
   * @see {@link parseErrorDetails} - Override for custom detail extraction only
   * @see {@link create} - The method used to instantiate the exception
   */
  protected static createFromError<
    TDetails extends BaseExceptionDetails = BaseExceptionDetails,
    TException extends BaseException<TDetails> = BaseException<TDetails>,
  >(
    this: BaseExceptionConstructor<TDetails, TException>,
    error: unknown,
    options?: BaseExceptionOptions<TDetails>
  ): TException {
    // Parse message using protected method (allows override)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = (this as any).parseErrorMessage(error, options);

    // Parse details using protected method (allows override)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const details = (this as any).parseErrorDetails(error, options);

    // Determine final code/status
    const finalCode = defaultStr(
      options?.code,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (details as any).code,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (details as any).errorCode
      //'INTERNAL_ERROR'
    );
    const finalStatus = defaultNumber(
      options?.statusCode,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (details as any).statusCode,
      500
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this as any).create(message, {
      ...options,
      details: details as TDetails,
      code: finalCode,
      statusCode: finalStatus,
      cause: options?.cause ?? error,
    });
  }

  /**
   * Protected method to extract a human-readable message from an error value.
   *
   * Override this in subclasses to customize how messages are extracted from different
   * error types. For example, you might want to format validation errors differently
   * or add context from error properties.
   *
   * The default implementation:
   * 1. Extracts `message` property from objects
   * 2. Uses the string value directly if error is a string
   * 3. Falls back to `Error.message` for Error instances
   * 4. Uses `options.fallbackMessage` if provided
   * 5. Defaults to "Unknown Error" if nothing else works
   *
   * @param error - The error value to extract a message from
   * @param options - Optional configuration with fallbackMessage
   * @returns The extracted error message string
   *
   * @example
   * ```typescript
   * // Custom validation exception with formatted message
   * class ValidationException extends BaseException {
   *   protected static override parseErrorMessage(
   *     error: unknown,
   *     options?: BaseExceptionOptions
   *   ): string {
   *     if (typeof error === 'object' && error !== null) {
   *       const err = error as Record<string, unknown>;
   *
   *       // Check for validation error array
   *       if (Array.isArray(err.errors) && err.errors.length > 0) {
   *         const firstError = err.errors[0];
   *         if (typeof firstError === 'object' && firstError !== null) {
   *           const field = (firstError as any).field;
   *           const msg = (firstError as any).message;
   *           return `Validation failed for ${field}: ${msg}`;
   *         }
   *       }
   *     }
   *
   *     // Fall back to default
   *     return super.parseErrorMessage(error, options);
   *   }
   * }
   *
   * const validationError = {
   *   errors: [{ field: 'email', message: 'Invalid format' }]
   * };
   * const ex = ValidationException.from(validationError);
   * // ex.message === 'Validation failed for email: Invalid format'
   * ```
   *
   * @example
   * ```typescript
   * // Add table context to database errors
   * class DatabaseException extends BaseException {
   *   protected static override parseErrorMessage(
   *     error: unknown,
   *     options?: BaseExceptionOptions
   *   ): string {
   *     const baseMessage = super.parseErrorMessage(error, options);
   *
   *     if (typeof error === 'object' && error !== null) {
   *       const err = error as Record<string, unknown>;
   *       if (typeof err.table === 'string') {
   *         return `${baseMessage} (table: ${err.table})`;
   *       }
   *     }
   *
   *     return baseMessage;
   *   }
   * }
   * ```
   *
   * @remarks
   * - Always returns a non-empty string (minimum "Unknown Error")
   * - Sanitizes "undefined" strings to "Unknown Error"
   * - Called by `createFromError()` during error conversion
   */
  protected static parseErrorMessage(
    error: unknown,
    options?: BaseExceptionOptions
  ): string {
    let message = '';

    if (isObj(error)) {
      // If the object has a message, use it
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof (error as any).message === 'string') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        message = (error as any).message;
      }
    } else if (typeof error === 'string') {
      message = error;
    }

    // Fallbacks
    if (!message && error instanceof Error) message = error.message;
    if (!message && options?.fallbackMessage) message = options.fallbackMessage;
    if (!isNonNullString(message))
      message = defaultStr(message, 'Unknown Error');

    // Remove 'undefined' string edge cases
    if (message.trim().toLowerCase() === 'undefined') message = 'Unknown Error';

    return message;
  }

  /**
   * Protected method to extract structured details from an error value.
   *
   * Override this in subclasses to extract domain-specific fields from errors.
   * For example, API errors might have `endpoint` and `method`, while database
   * errors might have `query` and `table`.
   *
   * The default implementation:
   * 1. Spreads all properties from the error object (if it's an object)
   * 2. Merges with `options.details` (options take precedence)
   *
   * @template TDetails - Type of the details object
   * @param error - The error value to extract details from
   * @param options - Optional configuration with details to merge
   * @returns Object containing extracted details
   *
   * @example
   * ```typescript
   * // Extract API-specific fields
   * interface ApiErrorDetails extends BaseExceptionDetails {
   *   endpoint?: string;
   *   method?: string;
   *   requestId?: string;
   * }
   *
   * class ApiException extends BaseException<ApiErrorDetails> {
   *   protected static override parseErrorDetails<
   *     TDetails extends BaseExceptionDetails = ApiErrorDetails
   *   >(
   *     error: unknown,
   *     options?: BaseExceptionOptions<TDetails>
   *   ): BaseExceptionDetails {
   *     const baseDetails = super.parseErrorDetails(error, options);
   *
   *     if (typeof error === 'object' && error !== null) {
   *       const err = error as Record<string, unknown>;
   *       return {
   *         ...baseDetails,
   *         endpoint: typeof err.url === 'string' ? err.url : undefined,
   *         method: typeof err.method === 'string' ? err.method : undefined,
   *         requestId: typeof err.requestId === 'string' ? err.requestId : undefined
   *       };
   *     }
   *
   *     return baseDetails;
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Extract database-specific fields
   * interface DbErrorDetails extends BaseExceptionDetails {
   *   query?: string;
   *   table?: string;
   *   constraint?: string;
   * }
   *
   * class DatabaseException extends BaseException<DbErrorDetails> {
   *   protected static override parseErrorDetails<
   *     TDetails extends BaseExceptionDetails = DbErrorDetails
   *   >(
   *     error: unknown,
   *     options?: BaseExceptionOptions<TDetails>
   *   ): BaseExceptionDetails {
   *     const baseDetails = super.parseErrorDetails(error, options);
   *
   *     if (typeof error === 'object' && error !== null) {
   *       const err = error as Record<string, unknown>;
   *       return {
   *         ...baseDetails,
   *         query: typeof err.sql === 'string' ? err.sql : undefined,
   *         table: typeof err.table === 'string' ? err.table : undefined,
   *         constraint: typeof err.constraint === 'string' ? err.constraint : undefined
   *       };
   *     }
   *
   *     return baseDetails;
   *   }
   * }
   * ```
   *
   * @remarks
   * - Returns all properties from error objects by default
   * - Options.details take precedence over extracted details
   * - Called by `createFromError()` during error conversion
   * - Use TypeScript interfaces to ensure type safety of extracted fields
   */
  protected static parseErrorDetails<
    TDetails extends BaseExceptionDetails = BaseExceptionDetails,
  >(
    error: unknown,
    options?: BaseExceptionOptions<TDetails>
  ): BaseExceptionDetails {
    return {
      ...(isObj(error) ? error : undefined),
      ...options?.details,
    };
  }

  /**
   * Merges additional options into an existing BaseException instance.
   *
   * This utility method mutates the exception instance by updating its `code`,
   * `statusCode`, and `details` properties with values from the options object.
   * Used internally by `from()` when reusing existing exceptions.
   *
   * @template TException - The exception type (automatically inferred)
   * @param error - The exception instance to update
   * @param options - Options to merge into the exception
   * @returns The same exception instance with updated properties
   *
   * @example
   * ```typescript
   * // Update error code
   * const error = new BaseException('Failed');
   * BaseException.withOptions(error, { code: 'NEW_CODE' });
   * console.log(error.code); // 'NEW_CODE'
   * ```
   *
   * @example
   * ```typescript
   * // Merge details
   * const error = new BaseException('Error', {
   *   details: { originalData: 'value1' }
   * });
   *
   * BaseException.withOptions(error, {
   *   details: { additionalData: 'value2' }
   * });
   *
   * console.log(error.details);
   * // { originalData: 'value1', additionalData: 'value2' }
   * ```
   *
   * @example
   * ```typescript
   * // Update multiple properties
   * const error = new BaseException('Error');
   * BaseException.withOptions(error, {
   *   code: 'UPDATED_CODE',
   *   statusCode: 503,
   *   details: { retry: true }
   * });
   * ```
   *
   * @remarks
   * **Mutates** the input exception instance. This is intentional for performance
   * when reusing existing exceptions via `from()`.
   *
   * @see {@link from} - Calls this when converting existing exceptions
   */
  static withOptions<TException extends BaseException>(
    error: TException,
    options?: BaseExceptionOptions
  ): TException {
    if (options?.code) error.code = options.code;
    if (options?.statusCode) error.statusCode = options.statusCode;
    if (options?.details) {
      error.details = { ...error.details, ...options.details };
    }
    return error;
  }

  /**
   * Wraps an async operation, converting any thrown errors into BaseException.
   *
   * Executes the operation and returns its result if successful. If it throws,
   * converts the error to a BaseException using `from()` and throws that instead.
   *
   * @template TResult - The return type of the operation
   * @template TDetails - Type of exception details
   * @param operation - Async function to execute
   * @param options - Optional exception metadata to add if an error occurs
   * @returns Promise resolving to the operation result
   * @throws {BaseException} If the operation throws
   *
   * @example
   * ```typescript
   * // Wrap API call
   * const data = await BaseException.wrap(
   *   async () => fetch('/api/users').then(r => r.json()),
   *   { code: 'API_ERROR', statusCode: 503 }
   * );
   * // On error, throws BaseException with code 'API_ERROR'
   * ```
   *
   * @example
   * ```typescript
   * // Wrap database query
   * async function getUser(id: number) {
   *   return BaseException.wrap(
   *     async () => db.query('SELECT * FROM users WHERE id = ?', [id]),
   *     {
   *       code: 'DB_ERROR',
   *       statusCode: 500,
   *       details: { query: 'getUser', userId: id }
   *     }
   *   );
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Chain wrapping
   * const result = await BaseException.wrap(
   *   async () => {
   *     const user = await getUser(123);
   *     const orders = await getOrders(user.id);
   *     return { user, orders };
   *   },
   *   { code: 'USER_ORDERS_ERROR' }
   * );
   * ```
   *
   * @remarks
   * Prefer `tryCatch()` if you need error handling without throwing.
   * This method always throws on error after conversion.
   *
   * @see {@link tryCatch} - Returns error tuple instead of throwing
   * @see {@link from} - The conversion method used internally
   */
  static async wrap<
    TResult,
    TDetails extends BaseExceptionDetails = BaseExceptionDetails,
  >(
    operation: () => Promise<TResult>,
    options?: BaseExceptionOptions<TDetails>
  ): Promise<TResult> {
    try {
      return await operation();
    } catch (error) {
      return BaseException.throw(error, options);
    }
  }

  /**
   * Immediately throws a BaseException created from the given error value.
   *
   * This is a convenience method equivalent to `throw BaseException.from(error, options)`.
   * Useful for concise one-liner error throwing with proper conversion.
   *
   * @template TDetails - Type of exception details
   * @param error - The error value to convert and throw
   * @param options - Optional exception metadata
   * @throws {BaseException} Always throws
   *
   * @example
   * ```typescript
   * // One-liner error throwing
   * if (!user) {
   *   BaseException.throw('User not found', {
   *     code: 'USER_NOT_FOUND',
   *     statusCode: 404
   *   });
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Convert and re-throw
   * try {
   *   riskyOperation();
   * } catch (err) {
   *   BaseException.throw(err, {
   *     code: 'OPERATION_FAILED',
   *     details: { context: 'important data' }
   *   });
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Conditional throwing
   * const validateAge = (age: number) => {
   *   age < 0 && BaseException.throw('Invalid age', { code: 'VALIDATION_ERROR' });
   *   age > 150 && BaseException.throw('Age too high', { code: 'VALIDATION_ERROR' });
   *   return age;
   * };
   * ```
   *
   * @remarks
   * Return type is `never` since this function always throws.
   * Helps TypeScript understand control flow correctly.
   *
   * @see {@link from} - Creates exception without throwing
   */
  static throw<TDetails extends BaseExceptionDetails = BaseExceptionDetails>(
    error: unknown,
    options?: BaseExceptionOptions<TDetails>
  ): never {
    throw BaseException.from(error, options);
  }

  /**
   * Safely executes a synchronous operation and returns a Result tuple.
   *
   * This method implements the Result/Either pattern, returning a tuple of
   * `[error, null]` if the operation fails, or `[null, result]` if it succeeds.
   * This eliminates the need for try-catch blocks and makes error handling explicit.
   *
   * **Type-safe**: When called on subclasses, returns that subclass type in the error position.
   *
   * @template TResult - The return type of the operation
   * @template TDetails - Type of exception details
   * @param this - The exception constructor (auto-bound)
   * @param operation - Synchronous function to execute
   * @param options - Optional exception metadata if an error occurs
   * @returns Tuple of `[error, null]` or `[null, result]`
   *
   * @example
   * ```typescript
   * // Basic usage
   * const [error, result] = BaseException.tryCatchSync(() => {
   *   return JSON.parse(someString);
   * });
   *
   * if (error) {
   *   console.error('Parse failed:', error.message);
   *   return;
   * }
   *
   * console.log('Parsed:', result);
   * ```
   *
   * @example
   * ```typescript
   * // With additional error metadata
   * const [error, user] = BaseException.tryCatchSync(
   *   () => validateUser(data),
   *   {
   *     code: 'VALIDATION_ERROR',
   *     statusCode: 400,
   *     details: { input: data }
   *   }
   * );
   * ```
   *
   * @example
   * ```typescript
   * // Chaining operations
   * function processData(input: string) {
   *   const [parseError, data] = BaseException.tryCatchSync(() =>
   *     JSON.parse(input)
   *   );
   *   if (parseError) return { error: parseError };
   *
   *   const [validError, validated] = BaseException.tryCatchSync(() =>
   *     validateData(data)
   *   );
   *   if (validError) return { error: validError };
   *
   *   return { data: validated };
   * }
   * ```
   *
   * @example
   * ```typescript
   * // With subclass - maintains type
   * class ValidationException extends BaseException {}
   *
   * const [error, result] = ValidationException.tryCatchSync(() =>
   *   validateEmail(email)
   * );
   *
   * if (error) {
   *   // error is typed as ValidationException
   *   console.log(error.name); // 'ValidationException'
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Functional programming style
   * const results = data.map(item =>
   *   BaseException.tryCatchSync(() => processItem(item))
   * );
   *
   * const errors = results
   *   .filter(([err]) => err !== null)
   *   .map(([err]) => err);
   *
   * const values = results
   *   .filter(([, val]) => val !== null)
   *   .map(([, val]) => val);
   * ```
   *
   * @remarks
   * **Result Pattern**: Returns `[error, null] | [null, result]`
   * - Eliminates try-catch blocks
   * - Makes error handling explicit and type-safe
   * - Works well with destructuring
   * - Inspired by Go's error handling
   *
   * @see {@link tryCatch} - Async version
   * @see {@link wrap} - Throws on error instead of returning tuple
   */
  static tryCatchSync<
    TResult,
    TDetails extends BaseExceptionDetails = BaseExceptionDetails,
  >(
    this: BaseExceptionConstructor<TDetails, BaseException<TDetails>>,
    operation: () => TResult,
    options?: BaseExceptionOptions<TDetails>
  ): [BaseException<TDetails>, null] | [null, TResult] {
    try {
      const result = operation();
      return [null, result];
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return [(this as any).from(error, options), null];
    }
  }

  /**
   * Safely executes an async operation and returns a Result tuple Promise.
   *
   * Async version of `tryCatchSync`. Returns a Promise that resolves to a tuple of
   * `[error, null]` if the operation fails, or `[null, result]` if it succeeds.
   * Eliminates async try-catch blocks and makes async error handling explicit.
   *
   * **Type-safe**: When called on subclasses, returns that subclass type in the error position.
   *
   * @template TResult - The return type of the async operation
   * @template TDetails - Type of exception details
   * @param this - The exception constructor (auto-bound)
   * @param operation - Async function to execute
   * @param options - Optional exception metadata if an error occurs
   * @returns Promise resolving to tuple of `[error, null]` or `[null, result]`
   *
   * @example
   * ```typescript
   * // Basic async operation
   * const [error, data] = await BaseException.tryCatch(async () => {
   *   const response = await fetch('/api/users');
   *   return response.json();
   * });
   *
   * if (error) {
   *   console.error('API call failed:', error.message);
   *   return;
   * }
   *
   * console.log('Users:', data);
   * ```
   *
   * @example
   * ```typescript
   * // With error metadata
   * const [error, user] = await BaseException.tryCatch(
   *   async () => db.users.findById(userId),
   *   {
   *     code: 'DB_ERROR',
   *     statusCode: 500,
   *     details: { operation: 'findUser', userId }
   *   }
   * );
   * ```
   *
   * @example
   * ```typescript
   * // Async operation chain
   * async function processUserData(userId: number) {
   *   const [userError, user] = await BaseException.tryCatch(() =>
   *     fetchUser(userId)
   *   );
   *   if (userError) return { error: userError };
   *
   *   const [ordersError, orders] = await BaseException.tryCatch(() =>
   *     fetchOrders(user.id)
   *   );
   *   if (ordersError) return { error: ordersError };
   *
   *   return { data: { user, orders } };
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Parallel operations
   * const results = await Promise.all([
   *   BaseException.tryCatch(() => fetchUsers()),
   *   BaseException.tryCatch(() => fetchPosts()),
   *   BaseException.tryCatch(() => fetchComments())
   * ]);
   *
   * const [usersResult, postsResult, commentsResult] = results;
   *
   * const allSucceeded = results.every(([err]) => err === null);
   * if (allSucceeded) {
   *   const [, users] = usersResult;
   *   const [, posts] = postsResult;
   *   const [, comments] = commentsResult;
   *   // All operations succeeded
   * }
   * ```
   *
   * @example
   * ```typescript
   * // With custom exception class
   * class ApiException extends BaseException {
   *   // Custom properties/methods
   * }
   *
   * const [error, response] = await ApiException.tryCatch(
   *   async () => callExternalAPI()
   * );
   *
   * if (error) {
   *   // error is typed as ApiException
   *   handleApiError(error);
   * }
   * ```
   *
   * @example
   * ```typescript
   * // API endpoint handler
   * app.get('/users/:id', async (req, res) => {
   *   const [error, user] = await BaseException.tryCatch(
   *     async () => userService.getById(req.params.id),
   *     { code: 'USER_FETCH_ERROR' }
   *   );
   *
   *   if (error) {
   *     return res.status(error.statusCode || 500).json(
   *       error.toJSON()
   *     );
   *   }
   *
   *   res.json(user);
   * });
   * ```
   *
   * @remarks
   * **Async Result Pattern**: Returns `Promise<[error, null] | [null, result]>`
   * - Eliminates async/await try-catch blocks
   * - Makes async error handling explicit and type-safe
   * - Works perfectly with Promise.all() for parallel operations
   * - Great for API handlers and service methods
   *
   * @see {@link tryCatchSync} - Synchronous version
   * @see {@link wrap} - Throws on error instead of returning tuple
   * @see {@link from} - The conversion method used internally
   */
  static async tryCatch<
    TResult,
    TDetails extends BaseExceptionDetails = BaseExceptionDetails,
  >(
    this: BaseExceptionConstructor<TDetails, BaseException<TDetails>>,
    operation: () => Promise<TResult>,
    options?: BaseExceptionOptions<TDetails>
  ): Promise<[BaseException<TDetails>, null] | [null, TResult]> {
    try {
      const result = await operation();
      return [null, result];
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return [(this as any).from(error, options), null];
    }
  }
}

/**
 * Configuration options for creating or customizing a BaseException.
 *
 * This interface defines the optional metadata that can be provided when creating
 * exceptions via the constructor, `from()`, or other factory methods. All properties
 * are optional, allowing flexible error creation with varying levels of detail.
 *
 * @template TDetails - Type of the structured details object. Must extend BaseExceptionDetails.
 *
 * @example
 * ```typescript
 * // Basic options
 * const options: BaseExceptionOptions = {
 *   code: 'USER_NOT_FOUND',
 *   statusCode: 404
 * };
 *
 * const error = new BaseException('User not found', options);
 * ```
 *
 * @example
 * ```typescript
 * // With typed details
 * interface PaymentDetails extends BaseExceptionDetails {
 *   transactionId: string;
 *   amount: number;
 *   currency: string;
 * }
 *
 * const options: BaseExceptionOptions<PaymentDetails> = {
 *   code: 'PAYMENT_FAILED',
 *   statusCode: 402,
 *   details: {
 *     transactionId: 'tx_12345',
 *     amount: 99.99,
 *     currency: 'USD'
 *   }
 * };
 *
 * const error = new BaseException<PaymentDetails>('Payment processing failed', options);
 * ```
 *
 * @example
 * ```typescript
 * // With error chain (cause)
 * try {
 *   await database.connect();
 * } catch (dbError) {
 *   throw new BaseException('Failed to connect to database', {
 *     code: 'DB_CONNECTION_ERROR',
 *     statusCode: 503,
 *     cause: dbError, // Preserves the original error
 *     details: {
 *       host: 'localhost',
 *       port: 5432
 *     }
 *   });
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With custom timestamp (for replaying/testing)
 * const options: BaseExceptionOptions = {
 *   code: 'TEST_ERROR',
 *   timestamp: new Date('2024-01-15T10:30:00Z'), // Specific timestamp
 *   details: { testCase: 'scenario-1' }
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Using fallbackMessage for error conversion
 * const unknownError: unknown = someOperation();
 *
 * const error = BaseException.from(unknownError, {
 *   code: 'OPERATION_FAILED',
 *   fallbackMessage: 'An unknown error occurred', // Used if error has no message
 *   statusCode: 500
 * });
 * ```
 */
export interface BaseExceptionOptions<
  TDetails extends BaseExceptionDetails = BaseExceptionDetails,
> {
  /**
   * Application-specific error code for categorizing errors.
   *
   * Error codes should be unique, uppercase strings with underscores (e.g., `USER_NOT_FOUND`).
   * They're useful for:
   * - Error categorization and filtering
   * - Client-side error handling logic
   * - Logging and monitoring
   * - Internationalization (mapping codes to localized messages)
   *
   * @example
   * ```typescript
   * { code: 'VALIDATION_ERROR' }
   * { code: 'AUTH_TOKEN_EXPIRED' }
   * { code: 'DB_CONSTRAINT_VIOLATION' }
   * ```
   */
  code?: string;

  /**
   * HTTP status code associated with this exception.
   *
   * Use standard HTTP status codes to indicate the type of error:
   * - `400-499`: Client errors (bad request, unauthorized, not found, etc.)
   * - `500-599`: Server errors (internal error, service unavailable, etc.)
   *
   * Defaults to `500` (Internal Server Error) when creating exceptions via `from()`.
   *
   * @example
   * ```typescript
   * { statusCode: 400 } // Bad Request
   * { statusCode: 401 } // Unauthorized
   * { statusCode: 404 } // Not Found
   * { statusCode: 409 } // Conflict
   * { statusCode: 500 } // Internal Server Error
   * { statusCode: 503 } // Service Unavailable
   * ```
   */
  statusCode?: number;

  /**
   * Structured additional details about the exception.
   *
   * Use this to include any domain-specific context that helps with:
   * - Debugging (input values, state information)
   * - Client-side handling (field-specific validation errors)
   * - Logging and monitoring (request IDs, user context)
   * - Error recovery (retry information, alternative actions)
   *
   * The type is generic to ensure type safety for your specific error details.
   *
   * @example
   * ```typescript
   * // Validation details
   * {
   *   details: {
   *     field: 'email',
   *     value: 'invalid-email',
   *     rule: 'email_format'
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // API error details
   * {
   *   details: {
   *     endpoint: '/api/users',
   *     method: 'POST',
   *     requestId: 'req_abc123',
   *     responseTime: 523
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Database error details
   * {
   *   details: {
   *     query: 'SELECT * FROM users WHERE id = ?',
   *     table: 'users',
   *     constraint: 'users_email_unique'
   *   }
   * }
   * ```
   */
  details?: TDetails;

  /**
   * The underlying error that caused this exception.
   *
   * Preserves the error chain for debugging. This is automatically set when using
   * `from()` to convert errors. The cause is:
   * - Preserved in the exception's `cause` property
   * - Included in `toJSON()` output (serialized recursively)
   * - Available for logging and error tracking
   *
   * Follows the standard Error.cause pattern from ECMAScript.
   *
   * @example
   * ```typescript
   * try {
   *   const data = JSON.parse(invalidJson);
   * } catch (parseError) {
   *   throw new BaseException('Failed to parse configuration', {
   *     cause: parseError // Original SyntaxError preserved
   *   });
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Error chain
   * const networkError = new Error('ETIMEDOUT');
   * const apiError = new BaseException('API request failed', {
   *   cause: networkError
   * });
   * const appError = new BaseException('User fetch failed', {
   *   cause: apiError
   * });
   *
   * // The entire chain is preserved and can be serialized
   * console.log(appError.toJSON().cause);
   * // Includes apiError with its cause networkError
   * ```
   */
  cause?: unknown;

  /**
   * Custom timestamp for when the exception occurred.
   *
   * Defaults to `new Date()` when the exception is created. Override this when:
   * - Replaying/reconstructing exceptions from logs
   * - Testing with fixed timestamps
   * - Forwarding exceptions from other systems
   *
   * @example
   * ```typescript
   * // Reconstructing from logs
   * {
   *   timestamp: new Date('2024-01-15T10:30:45.123Z')
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Fixed timestamp for testing
   * {
   *   timestamp: new Date('2024-01-01T00:00:00Z')
   * }
   * ```
   */
  timestamp?: Date;

  /**
   * Fallback message to use if the error source has no message.
   *
   * Only used by `from()` and related methods when converting errors that don't
   * have a message property. Useful for providing context-specific default messages.
   *
   * @example
   * ```typescript
   * // Converting unknown errors
   * const error = BaseException.from(unknownValue, {
   *   fallbackMessage: 'Database operation failed',
   *   code: 'DB_ERROR'
   * });
   * // If unknownValue has no message, "Database operation failed" is used
   * ```
   *
   * @example
   * ```typescript
   * // Context-specific fallbacks
   * function wrapApiCall(apiError: unknown) {
   *   return BaseException.from(apiError, {
   *     fallbackMessage: 'External API request failed',
   *     code: 'API_ERROR'
   *   });
   * }
   * ```
   */
  fallbackMessage?: string;
}

/**
 * Type representing a constructor (class) for BaseException or its subclasses.
 *
 * This is a **constructor type**, not an instance type. It represents the type of the
 * class itself (the constructor function) rather than instances created by the class.
 *
 * This type is essential for proper TypeScript typing of static methods that need to
 * reference `this` in a way that works correctly with inheritance. When a static method
 * uses `this: BaseExceptionConstructor<TDetails, TException>`, TypeScript understands
 * that `this` refers to the constructor being called, enabling proper type inference
 * for subclasses.
 *
 * @template TDetails - The type of the exception details object. Must extend BaseExceptionDetails.
 * @template TException - The type of exception instance the constructor creates. Must extend BaseException<TDetails>.
 *
 * @example
 * ```typescript
 * // Basic usage in a static method
 * class MyException extends BaseException {
 *   static customMethod<
 *     TDetails extends BaseExceptionDetails = BaseExceptionDetails,
 *     T extends BaseException<TDetails> = BaseException<TDetails>
 *   >(
 *     this: BaseExceptionConstructor<TDetails, T>,
 *     message: string
 *   ): T {
 *     return new this(message); // `this` correctly refers to the constructor
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Why this is needed: Without proper typing, subclass static methods lose type information
 * interface ApiErrorDetails extends BaseExceptionDetails {
 *   endpoint: string;
 * }
 *
 * class ApiException extends BaseException<ApiErrorDetails> {
 *   // Using BaseExceptionConstructor ensures proper typing
 * }
 *
 * // When calling ApiException.from(), TypeScript knows the return type is ApiException
 * const ex = ApiException.from(new Error('API failed'));
 * // ex is typed as ApiException, not BaseException
 * ```
 *
 * @example
 * ```typescript
 * // Constructor type vs instance type comparison
 * type ConstructorType = BaseExceptionConstructor<BaseExceptionDetails>;
 * // This is the TYPE OF THE CLASS itself (new (...) => Instance)
 *
 * type InstanceType = BaseException<BaseExceptionDetails>;
 * // This is the type of an INSTANCE of the class
 *
 * const exampleClass: ConstructorType = BaseException; // ✓ Valid
 * const exampleInstance: InstanceType = new BaseException('error'); // ✓ Valid
 * ```
 *
 * @remarks
 * This follows TypeScript's convention for constructor types, similar to built-in types
 * like `ErrorConstructor`, `PromiseConstructor`, etc.
 *
 * @see {@link BaseException.from} - Uses this type for proper subclass typing
 * @see {@link BaseException.create} - Uses this type for proper subclass typing
 * @see {@link BaseException.createFromError} - Uses this type for proper subclass typing
 */
export type BaseExceptionConstructor<
  TDetails extends BaseExceptionDetails = BaseExceptionDetails,
  TException extends BaseException<TDetails> = BaseException<TDetails>,
> = new (
  message: string,
  options?: BaseExceptionOptions<TDetails>
) => TException;

// Helper to check production env
const isProduction = () => {
  try {
    const g = getGlobal();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = (g as any).process;
    return p?.env?.NODE_ENV === 'production';
  } catch {
    return false;
  }
};
