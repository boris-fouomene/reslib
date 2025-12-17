import { defaultStr } from '@utils/defaultStr';
import { getGlobal } from '@utils/global';
import { isNonNullString } from '@utils/isNonNullString';
import { JsonHelper } from '@utils/json';
import { defaultNumber } from '@utils/numbers';
import { isObj } from '@utils/object';
import { stringify } from '@utils/stringify';
import { Dictionary } from 'reslib/types';

/**
 * Main application exception class.
 * This class provides a standardized, serializable exception structure that can be
 * safely returned from REST API endpoints.
 *
 * Features:
 * - Extends native Error for proper error handling and stack traces
 * - Fully serializable via toJSON() for REST API responses
 * - Supports error codes, HTTP status codes, and additional metadata
 * - Maintains error chain with 'cause' property
 * - Automatic timestamp tracking
 * - Generic support for custom error details
 *
 * @example
 * ```typescript
 * // Basic usage
 * throw new AppException('User not found');
 * ```
 *
 * @example
 * ```typescript
 * // With custom typed details
 * interface ValidationDetails {
 *   field: string;
 *   constraint: string;
 * }
 *
 * throw new AppException<ValidationDetails>('Validation failed', {
 *   code: 'VALIDATION_ERROR',
 *   statusCode: 400,
 *   details: {
 *     field: 'email',
 *     constraint: 'Email already exists'
 *   }
 * });
 * ```
 */
export class AppException<
  TDetails extends Dictionary = Dictionary,
> extends Error {
  /**
   * The constant name identifier for this exception class.
   * This is the same as the exported APP_EXCEPTION_NAME constant.
   */
  public static readonly NAME = 'AppException' as const;

  /**
   * Application-specific error code.
   */
  public readonly code?: string;

  /**
   * HTTP status code associated with this exception.
   */
  public readonly statusCode?: number;

  /**
   * Additional structured details about the exception.
   */
  public readonly details?: TDetails;

  /**
   * The underlying error that caused this exception.
   */
  public readonly cause?: unknown;

  /**
   * Timestamp when the exception was created.
   */
  public readonly timestamp: Date;

  public readonly success: boolean = false;

  /**
   * Creates a new AppException instance.
   *
   * @param message - Human-readable error message
   * @param options - Additional exception options and metadata
   */
  constructor(message: string, options?: AppExceptionOptions<TDetails>) {
    super(message);

    // Set the prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, AppException.prototype);

    // Assign a custom name for better debugging
    this.name = AppException.NAME;

    // Capture stack trace (excluding constructor call from stack trace)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Assign optional properties
    this.code = options?.code;
    this.statusCode = options?.statusCode;
    this.details = options?.details;
    this.cause = options?.cause;
    this.timestamp = options?.timestamp ?? new Date();
    this.success = false;
  }

  /**
   * Converts the exception to a plain JSON object suitable for serialization.
   * This method ensures that the exception can be safely sent over REST APIs
   * without circular references or non-serializable properties.
   *
   * @returns A serializable object representation of the exception
   */
  toJSON(): {
    name: string;
    message: string;
    code?: string;
    statusCode?: number;
    details?: TDetails;
    timestamp: string;
    stack?: string;
  } {
    return {
      name: this.name,
      message: this.message,
      ...(this.code && { code: this.code }),
      ...(this.statusCode && { statusCode: this.statusCode }),
      ...(this.details && { details: this.details }),
      timestamp: this.timestamp.toISOString(),
      // Include stack trace only in development/debugging scenarios
      ...(!isProduction() && this.stack ? { stack: this.stack } : {}),
    };
  }

  /**
   * Creates a string representation of the exception.
   * Useful for logging and debugging.
   */
  override toString(): string {
    const codePrefix = this.code ? ` [${this.code}]` : '';
    return `${this.name}${codePrefix}: ${this.message}`;
  }

  /**
   * Type guard that checks if a given value is an AppException instance or
   * a plain object that matches the AppException structure.
   */
  static isAppException(value: unknown): value is AppException {
    // Check if it's an actual AppException instance
    if (value instanceof AppException) {
      return true;
    }

    // Check if it's a plain object that looks like an AppException
    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      // Required properties for AppException structure identification
      const hasRequiredProperties =
        obj.name === AppException.NAME &&
        typeof obj.message === 'string' &&
        obj.success === false &&
        (typeof obj.timestamp === 'string' || obj.timestamp instanceof Date);

      const hasValidOptionalProperties =
        (obj.code === undefined || typeof obj.code === 'string') &&
        (obj.statusCode === undefined || typeof obj.statusCode === 'number');

      return hasRequiredProperties && hasValidOptionalProperties;
    }
    return false;
  }

  static overrideOptions<T extends Dictionary = Dictionary>(
    error: AppException<T>,
    options?: AppExceptionOptions<T>
  ): AppException<T> {
    if (!this.isAppException(error)) return error;

    // Create new options object merged with existing error properties
    const mergedDetails = { ...error.details, ...options?.details } as T;

    // We cast to access and modify properties that are readonly on the public interface
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mutableError = error as any;

    if (options?.details) {
      mutableError.details = mergedDetails;
    }
    if (options?.statusCode) {
      mutableError.statusCode = options.statusCode;
    }
    // Update code if provided
    if (options?.code) {
      mutableError.code = options.code;
    }

    return error;
  }

  /**
   * Factory method that creates an AppException from any error type.
   */
  static from<T extends Dictionary = Dictionary>(
    error: unknown,
    options?: AppExceptionOptions<T>
  ): AppException<T> {
    // If it's already an AppException, return it (potentially overriding options)
    if (this.isAppException(error)) {
      return this.overrideOptions(error as AppException<T>, options);
    }

    // Handle JSON strings or objects
    if (JsonHelper.isJSON(error)) {
      const r = JsonHelper.parse(error);
      if (this.isAppException(r)) {
        return this.overrideOptions(r as AppException<T>, options);
      }
    }

    // Extract message from error
    let errorMessage = typeof error === 'string' ? error : '';
    const details: Dictionary = {};

    if (isObj(error)) {
      Object.assign(details, error);
    }
    // Merge provided details
    if (options?.details) {
      Object.assign(details, options.details);
    }

    if (!errorMessage) {
      errorMessage =
        typeof (error as { message?: string })?.message === 'string' ||
        error instanceof Error
          ? (error as Error).message
          : '';
    }

    // Apply fallback message if needed
    const fallbackMessage = options?.fallbackMessage;
    if (!isNonNullString(errorMessage) && isNonNullString(fallbackMessage)) {
      errorMessage = fallbackMessage;
    }

    errorMessage = defaultStr(errorMessage);

    // If message is still too short or missing, stringify the error
    if (!isNonNullString(errorMessage) || errorMessage.length <= 10) {
      errorMessage = error ? stringify(error, { escapeString: false }) : '';
    }

    // Handle edge case where message is literally 'undefined'
    if (errorMessage.toLowerCase().trim() === 'undefined') {
      errorMessage = '';
    }

    // Create new AppException, preserving original error as cause
    return new AppException<T>(errorMessage, {
      ...options,
      cause: options?.cause ?? error,
      statusCode: defaultNumber(options?.statusCode, details?.statusCode, 500),
      code: defaultStr(
        options?.code,
        details.errorCode,
        details?.code,
        details.statusText
      ),
      details: details as T,
    });
  }

  /**
   * Static factory method for creating a new AppException instance.
   */
  static create<T extends Dictionary = Dictionary>(
    message: string,
    options?: AppExceptionOptions<T>
  ): AppException<T> {
    return new AppException<T>(message, options);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static throw(error: any) {
    throw AppException.from(error).toJSON();
  }

  /**
   * Ensures that a value is an AppException instance.
   */
  static ensure<T extends Dictionary = Dictionary>(
    error: unknown,
    options?: AppExceptionOptions<T>
  ): AppException<T> {
    return this.isAppException(error)
      ? (error as AppException<T>)
      : this.from<T>(error, options);
  }

  /**
   * Wraps an async operation and automatically converts any thrown errors to AppException.
   */
  static async wrap<TResult, TDetails extends Dictionary = Dictionary>(
    operation: () => Promise<TResult>,
    options?: AppExceptionOptions<TDetails>
  ): Promise<TResult> {
    try {
      return await operation();
    } catch (error) {
      throw AppException.from<TDetails>(error, options);
    }
  }

  /**
   * Safely executes an async operation and returns a result tuple.
   */
  static async tryCatch<TResult, TDetails extends Dictionary = Dictionary>(
    operation: () => Promise<TResult>,
    options?: AppExceptionOptions<TDetails>
  ): Promise<[AppException<TDetails>, null] | [null, TResult]> {
    try {
      const result = await operation();
      return [null, result];
    } catch (error) {
      return [AppException.from<TDetails>(error, options), null];
    }
  }
}

/**
 * Configuration options for creating an AppException.
 */
export interface AppExceptionOptions<TDetails extends Dictionary = Dictionary> {
  /**
   * Application-specific error code for categorizing the exception.
   */
  code?: string;

  /**
   * HTTP status code associated with this exception.
   */
  statusCode?: number;

  /**
   * Additional details about the exception.
   */
  details?: TDetails;

  /**
   * The underlying error that caused this exception.
   */
  cause?: unknown;

  /**
   * Timestamp when the exception occurred.
   */
  timestamp?: Date;

  /**
   * A fallback message to use when the original error doesn't provide a meaningful message.
   */
  fallbackMessage?: string;
}

const isProduction = () => {
  const g = getGlobal();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _p = (g as any).process;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p: any = _p && _p.process ? _p : undefined;
  return p?.env?.NODE_ENV === 'production';
};
