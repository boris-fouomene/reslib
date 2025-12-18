import { ClassConstructor, MakeOptional } from '@/types';
import { defaultStr } from '@utils/defaultStr';
import { isNumber } from '@utils/isNumber';
import { defaultNumber } from '@utils/numbers';
import { isObj } from '@utils/object';
import { ValidatorRuleName } from '@validator/rules.types';
import { BaseException, BaseExceptionOptions } from '../../exception';

/**
 * ## Validator Error Details
 *
 * Standard interface for a single validation error detail.
 * Defines the structure of a validation failure for a specific constraint.
 *
 * This interface is used to describe *why* a validation failed, including:
 * - The error message
 * - The rule that was violated
 * - The invalid value
 * - The field or property name
 *
 * @public
 */
export interface ValidatorErrorDetails extends ValidatorErrorBaseDetails {
  /** The error message (translated if available) */
  message: string;
  /** The specific rule that failed (e.g., 'Email', 'MinLength') */
  ruleName: ValidatorRuleName | string;

  /** Parameters passed to the failing rule */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ruleParams: any[];
  /** The value that failed validation */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  /** The form field name/identifier */
  fieldName?: string;
  /** The object property name */
  propertyName?: string;
  /** Localized property name for display */
  translatedPropertyName?: string;
  /** Machine-readable error code */
  code?: string;
  /** Error severity */
  severity?: 'error' | 'warning' | 'info';
}

/**
 * ## Validator Base Error
 *
 * Abstract base class for all validator-related exceptions.
 * Extends `BaseException` to provide consistent error handling structure
 * across the validation system.
 *
 * - **Code**: `VALIDATION_ERROR` (default)
 * - **HTTP Status**: 422 Unprocessable Entity
 *
 * This class establishes the common interface for validation errors but
 * should not be instantiated directly. Use specific error classes like
 * `ValidatorError`, `ValidatorTargetError`, or `ValidatorBulkError`.
 *
 * @template TDetails - The type of the error details object (defaults to ValidatorErrorBaseDetails)
 *
 * @public
 */
export class ValidatorBaseError<
  TDetails extends ValidatorErrorBaseDetails = ValidatorErrorBaseDetails,
  TCause = unknown,
> extends BaseException<TDetails, TCause> {
  static readonly VALIDATION_CODE = 'VALIDATION_ERROR';
  static readonly VALIDATION_STATUS = 422;

  constructor(
    messageOrDetail: string | ValidatorErrorDetails,
    options?: BaseExceptionOptions<TDetails>
  ) {
    let message: string;
    let details: TDetails | undefined;
    let code = ValidatorBaseError.VALIDATION_CODE;

    if (typeof messageOrDetail === 'object') {
      message = messageOrDetail.message || 'Validation failed';
      details = messageOrDetail as unknown as TDetails;
      code = messageOrDetail.code || 'VALIDATION_VALUE_ERROR';
    } else {
      message = messageOrDetail;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const failedAt: Date = (options as any)?.failedAt ?? new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const startTime = (options as any)?.startTime ?? undefined;
    const vDetails: Partial<ValidatorErrorDetails> = {
      failedAt,
      startTime,
      duration: isNumber(startTime) ? Date.now() - startTime : undefined,
    };
    super(message, {
      code,
      statusCode: ValidatorBaseError.VALIDATION_STATUS,
      ...options,
      details: details || options?.details,
      ...vDetails,
      cause: options?.cause as TCause,
    });
  }

  /**
   * Gets the rule name that caused the failure (if available).
   */
  get ruleName(): ValidatorRuleName | string | undefined {
    // Cast to expected type to access potential property
    return (this.details as unknown as ValidatorErrorDetails)?.ruleName;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get value(): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.getDetails() as any).value;
  }
  getDetails(): TDetails {
    return isObj(this.details) ? this.details : ({} as TDetails);
  }
}

/**
 * ## Validator Error
 *
 * Represents a standard validation failure for a single value.
 * This is the most common error thrown when a simple value (like a string, number, etc.)
 * fails to validate against a set of rules.
 *
 * Usage example:
 * ```typescript
 * throw new ValidatorError("Email is required", { ...details });
 * ```
 *
 * @template TDetails - The type of the error details object (defaults to ValidatorErrorDetails)
 *
 * @public
 */
export class ValidatorError<
  TDetails extends ValidatorErrorDetails = ValidatorErrorDetails,
  TCause = unknown,
> extends ValidatorBaseError<TDetails, TCause> {}

/**
 * ## Validator Target Error
 *
 * Represents an error that occurs during the validation of a target object or class instance.
 * Thrown by `validateTarget` (or similar methods) when one or more properties satisfy
 * their validaton rules.
 *
 * This error aggregates multiple validation failures into a single exception object,
 * making it easy to handle complex form or object validation scenarios.
 *
 * @template Target - The class constructor of the target object
 *
 * @public
 */
export class ValidatorTargetError<
  Target extends ClassConstructor = ClassConstructor,
> extends ValidatorBaseError<ValidatorTargetErrorDetails<Target>> {
  constructor(
    message: string,
    details: MakeOptional<ValidatorTargetErrorDetails<Target>, 'failureCount'>,
    options?: BaseExceptionOptions<ValidatorTargetErrorDetails<Target>>
  ) {
    details.errors = Array.isArray(details.errors) ? details.errors : [];

    // Auto-generate fieldErrors map if not provided
    if (
      !isObj(details.fieldErrors) ||
      !Object.getSize(details.fieldErrors, true)
    ) {
      const fieldErrors: Partial<Record<ValidatorTargetKeys<Target>, string>> =
        {};
      for (const error of details.errors) {
        const key = defaultStr(
          error.propertyName,
          error.fieldName
        ) as ValidatorTargetKeys<Target>;
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = error.message;
        }
      }
      details.fieldErrors = fieldErrors;
    }

    super(message, {
      ...options,
      details: {
        ...details,
        failureCount: defaultNumber(
          details.failureCount,
          details.errors.length
        ),
      },
      code: 'VALIDATOR_TARGET_ERROR',
    });
  }

  /**
   * Returns all field validation errors.
   */
  getErrors(): ValidatorErrorDetails[] {
    const errors = this.getDetails().errors;
    return Array.isArray(errors) ? errors : [];
  }

  /**
   * Returns errors specific to a given field name.
   * @param fieldName The name of the field or property to filter by
   */
  getErrorsFor(fieldName: string): ValidatorErrorDetails[] {
    return this.getErrors().filter(
      (e) => e.fieldName === fieldName || e.propertyName === fieldName
    );
  }
}

/**
 * ## Validator Bulk Failure Item
 *
 * Represents the failure result for a single item within a bulk validation operation.
 * Maps the original array index to the specific validation errors occurred for that item.
 *
 * @template Target - The class constructor of the items being validated
 *
 * @public
 */
export interface ValidatorBulkFailureItem<
  Target extends ClassConstructor = ClassConstructor,
> {
  /** The index of the item in the original array */
  index: number;
  /** The validation errors for this item */
  errors: ValidatorErrorDetails[];
  /** The item data that failed */

  data?: ValidatorTargetData<Target>;
}

/**
 * ## Validator Bulk Error Details
 *
 * Detailed error structure for bulk validation failures.
 * Used by {@link ValidatorBulkError} to report failures across a collection of items.
 *
 * Tracks:
 * - Which items failed (by index)
 * - The total number of items processed
 * - The total number of failures
 *
 * @template Target - The class constructor of the items being validated
 *
 * @public
 */
export interface ValidatorBulkErrorDetails<
  Target extends ClassConstructor = ClassConstructor,
> extends ValidatorErrorBaseDetails {
  /** List of failures per item */
  failures: ValidatorBulkFailureItem<Target>[];
  /** Total items processed */
  totalCount: number;
  /** Number of items that failed */
  failureCount: number;
}

interface ValidatorErrorBaseDetails {
  /**
   * The time when the validation started.
   */
  startTime: number;
  /**
   * The duration of the validation in milliseconds.
   */
  duration?: number;
  /**
   * The date and time when the validation failed.
   */
  failedAt: Date;
}

/**
 * ## Validator Bulk Error
 *
 * Represents an error that occurs during the bulk validation of an array of objects.
 * Thrown by `validateTargets` when one or more items in the provided array fail validation.
 *
 * This error allows for "partial validation" where valid items can be processed
 * while invalid ones are reported back to the caller.
 *
 * @template Target - The class constructor of the items being validated
 *
 * @public
 */
export class ValidatorBulkError<
  Target extends ClassConstructor = ClassConstructor,
> extends ValidatorBaseError<ValidatorBulkErrorDetails<Target>> {
  constructor(
    message: string,
    details: Omit<ValidatorBulkErrorDetails<Target>, 'totalCount'>,
    options?: BaseExceptionOptions<ValidatorBulkErrorDetails>
  ) {
    details.failures = Array.isArray(details.failures) ? details.failures : [];
    const failureCount = details.failures.length;

    super(message, {
      ...options,
      details: {
        ...details,
        failureCount,
        totalCount: details.failures.length,
      },
      code: 'VALIDATOR_BULK_ERROR',
    });
  }

  /**
   * Returns the list of all item failures.
   */
  get failures(): ValidatorBulkFailureItem<Target>[] {
    return this.details?.failures || [];
  }

  /**
   * Gets failures for a specific index in the original array.
   * @param index The array index
   */
  getFailuresForIndex(
    index: number
  ): ValidatorBulkFailureItem<Target> | undefined {
    return this.failures.find((f) => f.index === index);
  }
}

/**
 * ## Validator Target Error Details
 *
 * Detailed error structure for object/class validation failures.
 * Used by {@link ValidatorTargetError} to provide a comprehensive view of
 * all validation errors encountered within an object instance.
 *
 * Includes:
 * - A list of all individual field errors
 * - A summary map of field errors (for easy access)
 * - The failure count
 * - The original data object (optional)
 *
 * @template Target - The class constructor of the target object
 *
 * @public
 */
export interface ValidatorTargetErrorDetails<
  Target extends ClassConstructor = ClassConstructor,
> extends ValidatorErrorBaseDetails {
  /**
   * Map of field names to their corresponding error messages.
   * This property provides a convenient way to access the first validation error
   * message encountered for each field. It is particularly useful for:
   * 1. Displaying error messages next to form fields in UI
   * 2. Quick access to error text without iterating through the `errors` array
   * 3. Serializing errors to a simple key-value format
   *
   * @example
   * ```typescript
   * {
   *   username: "Username is required",
   *   email: "Invalid email format"
   * }
   * ```
   */
  fieldErrors: Partial<Record<ValidatorTargetKeys<Target>, string>>;

  /** List of validation errors for specific fields */
  errors: Array<ValidatorTargetSingleError>;
  /** Total number of failures */
  failureCount: number;
  /** The source data object that was validated */

  data: ValidatorTargetData<Target>;
}

export interface ValidatorTargetSingleError extends ValidatorErrorDetails {
  cause: ValidatorError;
}
/**
 * ## Validator Target Keys
 *
 * Type alias for extracting the valid property keys from a target class or constructor.
 * Used to ensure type safety when referencing properties of validated objects.
 *
 * @template Target - The class constructor
 *
 * @public
 */
export type ValidatorTargetKeys<Target extends ClassConstructor> =
  keyof InstanceType<Target>;

/**
 * ## Validator Target Data
 *
 * Represents a partial data object corresponding to a target class.
 * Used for describing the data involved in validation errors without requiring
 * a full instance of the class.
 *
 * @template Target - The class constructor
 *
 * @public
 */
export type ValidatorTargetData<
  Target extends ClassConstructor = ClassConstructor,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> = Partial<Record<ValidatorTargetKeys<Target>, any>>;
