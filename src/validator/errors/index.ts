import { ClassConstructor } from '@/types';
import {
  ValidatorRuleName,
  ValidatorTargetData,
  ValidatorTargetKeys,
} from '@validator/rules.types';

export interface ValidatorError extends ValidatorBaseError {
  name: 'ValidatorError';
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
type ValidatorCreateErrorPartialKeys =
  | 'message'
  | '__validatorBaseName'
  | 'failedAt'
  | 'success'
  | 'name'
  | 'status'
  | 'statusCode'
  | 'errorCode';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ValidatorCreateErrorPayload extends Omit<
  ValidatorError,
  ValidatorCreateErrorPartialKeys
> {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ValidatorCreateTargetErrorPayload extends Omit<
  ValidatorTargetError,
  ValidatorCreateErrorPartialKeys
> {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ValidatorCreateBulkErrorPayload extends Omit<
  ValidatorBulkError,
  ValidatorCreateErrorPartialKeys
> {}

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
  errors: ValidatorError[];
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
export interface ValidatorBulkError<
  Target extends ClassConstructor = ClassConstructor,
> extends ValidatorBaseError {
  name: 'ValidatorBulkError';
  /** List of failures per item */
  failures: ValidatorBulkFailureItem<Target>[];
  /** Total items processed */
  totalCount: number;
  /** Number of items that failed */
  failureCount: number;
}

export interface ValidatorBaseError {
  readonly __validatorBaseName: 'ValidatorBaseError';
  /** The error message (translated if available) */
  message: string;
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

  success: false;

  status: 'error';

  statusCode: 422;

  errorCode: 'ERR_VALIDATION_FAILED';
}

export interface ValidatorTargetError<
  Target extends ClassConstructor = ClassConstructor,
> extends ValidatorBaseError {
  name: 'ValidatorTargetError';
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

export interface ValidatorTargetSingleError extends ValidatorError {
  cause: ValidatorError;
}
