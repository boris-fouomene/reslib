import { ClassConstructor } from '@/types';
import {
  BaseException,
  BaseExceptionDetails,
  BaseExceptionOptions,
} from '../../exception';

/**
 * Standard interface for a single validation error detail.
 * Defines the structure of a validation failure for a specific constraint.
 */
export interface ValidationErrorDetail extends BaseExceptionDetails {
  /** The error message (translated if available) */
  message: string;
  /** The specific rule that failed (e.g., 'Email', 'MinLength') */
  ruleName?: string;
  /** Parameters passed to the failing rule */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ruleParams?: any[];
  /** The value that failed validation */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
  /** The original rule name as specified (e.g., 'MinLength[5]') */
  rawRuleName?: string;
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
 * Base Validation Error.
 * All validation-related errors extend this class.
 *
 * Can be used directly for single-value validation failures (formerly ValidatorError).
 * Sets the default HTTP status code to 422 (Unprocessable Entity).
 */
export class ValidationError<
  TDetails extends BaseExceptionDetails = ValidationErrorDetail,
> extends BaseException<TDetails> {
  static readonly VALIDATION_CODE = 'VALIDATION_ERROR';
  static readonly VALIDATION_STATUS = 422;

  constructor(
    messageOrDetail: string | ValidationErrorDetail,
    options?: BaseExceptionOptions<TDetails>
  ) {
    let message: string;
    let details: TDetails | undefined;
    let code = ValidationError.VALIDATION_CODE;

    if (typeof messageOrDetail === 'object') {
      message = messageOrDetail.message || 'Validation failed';
      details = messageOrDetail as unknown as TDetails;
      code = messageOrDetail.code || 'VALIDATION_VALUE_ERROR';
    } else {
      message = messageOrDetail;
    }

    super(message, {
      code,
      statusCode: ValidationError.VALIDATION_STATUS,
      ...options,
      details: details || options?.details,
    });
  }

  /**
   * Gets the rule name that caused the failure (if available).
   */
  get ruleName(): string | undefined {
    // Cast to expected type to access potential property
    return (this.details as unknown as ValidationErrorDetail)?.ruleName;
  }

  /**
   * Gets the value that failed validation (if available).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get invalidValue(): any {
    return (this.details as unknown as ValidationErrorDetail)?.value;
  }
}

/**
 * Details structure for Target (Object) validation errors.
 */
export interface ValidatorTargetErrorDetails<
  Target extends ClassConstructor = ClassConstructor,
> extends BaseExceptionDetails {
  /** List of validation errors for specific fields */
  errors: ValidationErrorDetail[];
  /** Total number of failures */
  failureCount: number;
  /** The source data object that was validated */

  data?: ValidatorTargetData<Target>;
}

/**
 * Validator Target Error.
 * Represents a failure in validating a class instance or object (from `validateTarget()`).
 * Contains validation errors for multiple properties.
 */
export class ValidatorTargetError<
  Target extends ClassConstructor = ClassConstructor,
> extends ValidationError<ValidatorTargetErrorDetails<Target>> {
  constructor(
    data: {
      errors: ValidationErrorDetail[];

      data: ValidatorTargetData<Target>;
      message: string;
    },
    options?: BaseExceptionOptions<ValidatorTargetErrorDetails<Target>>
  ) {
    const failureCount = data.errors.length;

    const details: ValidatorTargetErrorDetails<Target> = {
      errors: data.errors,
      failureCount,
      data: data.data,
    };

    super(data.message, {
      ...options,
      details,
      code: 'VALIDATOR_TARGET_ERROR',
    });
  }

  /**
   * Returns all field validation errors.
   */
  get errors(): ValidationErrorDetail[] {
    return this.details?.errors || [];
  }

  /**
   * Returns errors specific to a given field name.
   * @param fieldName The name of the field or property to filter by
   */
  getErrorsFor(fieldName: string): ValidationErrorDetail[] {
    return this.errors.filter(
      (e) => e.fieldName === fieldName || e.propertyName === fieldName
    );
  }
}

/**
 * Structure for a single item failure in a bulk validation operation.
 */
export interface ValidatorBulkFailureItem<
  Target extends ClassConstructor = ClassConstructor,
> {
  /** The index of the item in the original array */
  index: number;
  /** The validation errors for this item */
  errors: ValidationErrorDetail[];
  /** The item data that failed */

  data?: ValidatorTargetData<Target>;
}

/**
 * Details structure for Bulk validation errors.
 */
export interface ValidatorBulkErrorDetails<
  Target extends ClassConstructor = ClassConstructor,
> extends BaseExceptionDetails {
  /** List of failures per item */
  failures: ValidatorBulkFailureItem<Target>[];
  /** Total items processed */
  totalCount: number;
  /** Number of items that failed */
  failureCount: number;
}

/**
 * Validator Bulk Error.
 * Represents failures in a bulk validation operation (from `validateTargets()`).
 * Contains failures mapped to their index in the original array.
 */
export class ValidatorBulkError<
  Target extends ClassConstructor = ClassConstructor,
> extends ValidationError<ValidatorBulkErrorDetails<Target>> {
  constructor(
    data: {
      failures: ValidatorBulkFailureItem<Target>[];
      totalCount: number;
    },
    options?: BaseExceptionOptions<ValidatorBulkErrorDetails>
  ) {
    const failureCount = data.failures.length;
    const message = `Bulk validation failed for ${failureCount} out of ${data.totalCount} items`;

    const details: ValidatorBulkErrorDetails<Target> = {
      failures: data.failures,
      totalCount: data.totalCount,
      failureCount,
    };

    super(message, {
      ...options,
      details,
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

export type ValidatorTargetPaths<Target extends ClassConstructor> =
  keyof InstanceType<Target>;
export type ValidatorTargetData<
  Target extends ClassConstructor = ClassConstructor,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> = Partial<Record<ValidatorTargetPaths<Target>, any>>;
