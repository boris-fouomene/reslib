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
export type ExceptionDetails = Record<string | number | symbol, unknown>;

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
  /** Max depth to serialize nested causes. Default: 3 */
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
  TDetails extends ExceptionDetails = ExceptionDetails,
> extends Error {
  /**
   * The constant name identifier for this exception class.
   */
  public static readonly NAME = 'BaseException' as const;

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

    // Execute hooks safely
    BaseException.executeHooks(this);
  }

  /**
   * Registers a global hook that will be called whenever a BaseException is instantiated.
   * @returns A function to unregister the hook.
   */
  static registerHook(hook: ExceptionHook): () => void {
    this.hooks.push(hook);
    return () => {
      this.hooks = this.hooks.filter((h) => h !== hook);
    };
  }

  private static executeHooks(exception: BaseException) {
    for (const hook of this.hooks) {
      try {
        hook(exception);
      } catch (err) {
        console.error('Error executing exception hook:', err);
      }
    }
  }

  /**
   * Converts the exception to a plain JSON object suitable for serialization.
   * This method ensures that the exception can be safely sent over REST APIs.
   */
  toJSON(options?: SerializationOptions): Record<string, unknown> {
    const includeStack = options?.stack ?? (!isProduction() && !!this.stack);
    const includeCause = options?.cause ?? true;
    const maxCauseDepth = options?.maxCauseDepth ?? 3;

    return {
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
   * Type guard to check if a value is a BaseException.
   */
  static isBaseException<TException extends BaseException>(
    value: unknown
  ): value is TException {
    return (
      value instanceof BaseException ||
      (isObj(value) &&
        value.name === BaseException.NAME && // Checks strictly for BaseException name if generic check needed, relying on prototype is safer usually.
        typeof value.message === 'string' &&
        value.success === false)
    );
  }

  // --- Factory Methods with proper inheritance support ---

  /**
   * Factory method to create an exception instance.
   * Uses `this` to allow subclasses to inherit this static method and return their own type.
   */
  static create<
    TDetails extends ExceptionDetails = ExceptionDetails,
    T extends BaseException<TDetails> = BaseException<TDetails>,
  >(
    this: new (message: string, options?: BaseExceptionOptions<TDetails>) => T,
    message: string,
    options?: BaseExceptionOptions<TDetails>
  ): T {
    return new this(message, options);
  }

  /**
   * Creates an exception from any unknown error.
   * Tries to preserve message, stack, and details.
   */
  static from<
    TDetails extends ExceptionDetails = ExceptionDetails,
    T extends BaseException<TDetails> = BaseException<TDetails>,
  >(
    this: new (message: string, options?: BaseExceptionOptions<TDetails>) => T,
    error: unknown,
    options?: BaseExceptionOptions<TDetails>
  ): T {
    // If it's already an instance of the class we are calling from, just reuse/merge
    if (error instanceof this) {
      return BaseException.withOptions(error, options) as T;
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

    let message = '';
    const details: ExceptionDetails = {};

    if (isObj(error)) {
      Object.assign(details, error);
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

    // Merge options
    if (options?.details) {
      Object.assign(details, options.details);
    }

    // Determine final code/status
    const finalCode = defaultStr(
      options?.code,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (details as any).code,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (details as any).errorCode,
      'INTERNAL_ERROR'
    );
    const finalStatus = defaultNumber(
      options?.statusCode,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (details as any).statusCode,
      500
    );

    return new this(message, {
      ...options,
      details: details as TDetails,
      code: finalCode,
      statusCode: finalStatus,
      cause: options?.cause ?? error,
    });
  }

  /**
   * Utility to override options on an existing exception instance.
   * Mutates the instance if possible or returns it.
   */
  static withOptions<T extends BaseException>(
    error: T,
    options?: BaseExceptionOptions
  ): T {
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
    TDetails extends ExceptionDetails = ExceptionDetails,
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
  static throw<TDetails extends ExceptionDetails = ExceptionDetails>(
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
    TDetails extends ExceptionDetails = ExceptionDetails,
  >(
    operation: () => TResult,
    options?: BaseExceptionOptions<TDetails>
  ): [BaseException<TDetails>, null] | [null, TResult] {
    try {
      const result = operation();
      return [null, result];
    } catch (error) {
      return [BaseException.from<TDetails>(error, options), null];
    }
  }

  /**
   * Safely executes an async operation and returns a result tuple.
   */
  static async tryCatch<
    TResult,
    TDetails extends ExceptionDetails = ExceptionDetails,
  >(
    operation: () => Promise<TResult>,
    options?: BaseExceptionOptions<TDetails>
  ): Promise<[BaseException<TDetails>, null] | [null, TResult]> {
    try {
      const result = await operation();
      return [null, result];
    } catch (error) {
      return [BaseException.from<TDetails>(error, options), null];
    }
  }
}

/**
 * Configuration options for creating a BaseException.
 */
export interface BaseExceptionOptions<
  TDetails extends ExceptionDetails = ExceptionDetails,
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

export { BaseException as AppException };
