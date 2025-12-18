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
   * @param message - Human-readable error message
   * @param options - Additional exception options and metadata
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
   * Converts the exception to a plain JSON object suitable for serialization.
   * This method ensures that the exception can be safely sent over REST APIs.
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
   * Creates a string representation of the exception.
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
   * Type guard to check if a value is a BaseException.
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
   * Factory method to create an exception instance.
   * Uses `this` to allow subclasses to inherit this static method and return their own type.
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
   * Creates an exception from any unknown error.
   * Tries to preserve message, stack, and details.
   *
   * This method can be overridden in subclasses to provide custom error handling logic.
   * Use the protected helper methods (parseErrorMessage, parseErrorDetails, createFromError)
   * for finer control over the conversion process.
   */
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
   * Protected method to create an exception from an error.
   * Override this method in subclasses to customize error conversion logic.
   *
   * @param error - The error to convert
   * @param options - Additional options
   * @returns A new instance of the exception class
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
   * Protected method to parse the error message from an unknown error.
   * Override this method in subclasses to customize message extraction logic.
   *
   * @param error - The error to parse
   * @param options - Additional options
   * @returns The parsed error message
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
   * Protected method to parse error details from an unknown error.
   * Override this method in subclasses to customize details extraction logic.
   *
   * @param error - The error to parse
   * @param options - Additional options
   * @returns The parsed error details
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
   * Utility to override options on an existing exception instance.
   * Mutates the instance if possible or returns it.
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
   * Wraps an async operation.
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
   * Helper: Throw immediately (for concise one-liners).
   */
  static throw<TDetails extends BaseExceptionDetails = BaseExceptionDetails>(
    error: unknown,
    options?: BaseExceptionOptions<TDetails>
  ): never {
    throw BaseException.from(error, options);
  }

  /**
   * Safely executes a synchronous operation and returns a result tuple.
   * Useful for handling errors in synchronous code without try-catch blocks.
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
   * Safely executes an async operation and returns a result tuple.
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
 * Configuration options for creating a BaseException.
 */
export interface BaseExceptionOptions<
  TDetails extends BaseExceptionDetails = BaseExceptionDetails,
> {
  code?: string;
  statusCode?: number;
  details?: TDetails;
  cause?: unknown;
  timestamp?: Date;
  fallbackMessage?: string;
}

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
