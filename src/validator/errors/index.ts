import { ClassConstructor } from '@/types';
import {
  ValidatorClassInput,
  ValidatorClassKeys,
  ValidatorRuleName,
} from '@validator/rules.types';

/**
 * ## Single Validation Error
 *
 * Represents a specific failure of a single validation rule against a single value.
 * This is the most granular error type in the validation system.
 *
 * It contains detailed context about *why* the validation failed, including
 * the rule name, parameters, and the specific value that was rejected.
 *
 */
export interface ValidatorError extends ValidatorBaseError {
  name: 'ValidatorError';

  /**
   * The specific rule that triggered the failure.
   * Can be a built-in rule name or a custom rule identifier.
   *
   * @example "Email"
   * @example "MinLength"
   * @example "CustomBusinessLogic"
   */
  ruleName: ValidatorRuleName | string;

  /**
   * The parameters that were passed to the validation rule.
   * These define the constraints that were violated.
   *
   * @example [] // For "Required"
   * @example [5] // For "MinLength" (meaning minimum required was 5)
   * @example [18] // For "MinAge"
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ruleParams: any[];

  /**
   * The actual value that failed validation.
   * Captured at the time of validation for debugging or feedback messages.
   *
   * @example "invalid-email"
   * @example 17 (when failure was MinAge: [18])
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;

  /**
   * The logical identifier of the field being validated.
   * Often corresponds to the form input name or API parameter name.
   *
   * @example "userEmail"
   * @example "password_confirm"
   */
  fieldName?: string;

  /**
   * The specific property key on the target object (if validating an class/object).
   *
   * @example "email"
   * @example "age"
   */
  propertyName?: string;

  /**
   * A localized or human-friendly label for the property.
   * Used when generating user-facing error messages.
   *
   * @example "Email Address"
   * @example "Age of User"
   */
  translatedPropertyName?: string;

  /**
   * A machine-readable sub-code specific to this validation failure.
   * Useful for client-side translation lookups.
   *
   * @example "validation.email.invalid"
   * @example "validation.required"
   */
  code?: string;

  /**
   * The severity of the validation failure.
   * - `error`: Blocks operation (default)
   * - `warning`: Alerts user but allows proceeding
   * - `info`: Informational feedback
   */
  severity?: 'error' | 'warning' | 'info';
}

/**
 * @internal
 * Helper type defining the keys that are automatically managed by the BaseError factory
 * and thus should not be required when creating a new error.
 */
type ValidatorCreateErrorPartialKeys =
  | 'message'
  | '__validatorBaseName'
  | 'failedAt'
  | 'success'
  | 'name'
  | 'status'
  | 'statusCode'
  | 'errorCode';

/**
 * ## Create Single Error Payload
 *
 * Helper type used when creating a `ValidatorError` using `Validator.createError`.
 * It excludes properties that are automatically generated (like assertions and timestamps).
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ValidatorCreateErrorPayload extends Omit<
  ValidatorError,
  ValidatorCreateErrorPartialKeys
> {}

/**
 * ## Create Class Error Payload
 *
 * Helper type used when creating a `ValidatorClassError` using `Validator.createClassError`.
 * It excludes properties that are automatically generated.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ValidatorCreateClassErrorPayload extends Omit<
  ValidatorClassError,
  ValidatorCreateErrorPartialKeys
> {}

/**
 * ## Create Bulk Error Payload
 *
 * Helper type used when creating a `ValidatorBulkError` using `Validator.createBulkError`.
 * It excludes properties that are automatically generated.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ValidatorCreateBulkErrorPayload extends Omit<
  ValidatorBulkError,
  ValidatorCreateErrorPartialKeys
> {}

/**
 * ## Validator Bulk Failure Item
 *
 * Represents the failure details for a single item within a bulk validation operation.
 * It maps the specific item from the original array (by index) to the errors it triggered.
 *
 * @template TClass - The class constructor of the items being validated
 * @public
 */
export interface ValidatorBulkFailureItem<
  TClass extends ClassConstructor = ClassConstructor,
> {
  /**
   * The zero-based index of the item in the original input array.
   * Use this to correlate the error back to the specific row or item in the source data.
   *
   * @example 0 (First item failed)
   * @example 5 (Sixth item failed)
   */
  index: number;

  /**
   * The collection of validation errors that occurred for this specific item.
   * An item might fail multiple rules simultaneously.
   */
  errors: ValidatorError[];

  /**
   * The original data object that failed validation.
   * Captured here to provide immediate context without needing to look up the original array.
   */
  data?: ValidatorClassInput<TClass>;
}

/**
 * ## Validator Bulk Error Details
 *
 * Specialized error type for reporting failures in bulk operations (e.g., validating an array of 100 users).
 * Instead of failing on the first error, this aggregates ALL failures across ALL items.
 *
 * This is crucial for batch processing where you want to report "Items 3, 5, and 10 failed"
 * rather than just "Validation failed".
 *
 * @template TClass - The class constructor of the items being validated
 * @public
 */
export interface ValidatorBulkError<
  TClass extends ClassConstructor = ClassConstructor,
> extends ValidatorBaseError {
  name: 'ValidatorBulkError';

  /**
   * A list of all items that failed validation, with their specific errors.
   * Items that passed validation are not included in this list.
   */
  failures: ValidatorBulkFailureItem<TClass>[];

  /**
   * The total count of items that were processed in the batch.
   * @example 100
   */
  totalCount: number;

  /**
   * The total count of items that failed validation.
   * `failureCount` <= `totalCount`
   * @example 3
   */
  failureCount: number;
}

/**
 * ## Validator Base Error
 *
 * The foundational interface that all validation errors implement.
 * It provides a consistent structure for error reporting, including timing,
 * status codes, and identifiers.
 *
 * This ensures that regardless of whether an error is a simple single-value failure
 * or a complex bulk validation failure, consumers can rely on a common set of properties.
 */
export interface ValidatorBaseError {
  readonly __validatorBaseName: 'ValidatorBaseError';

  /**
   * The primary human-readable error message.
   * If i18n is enabled, this will be the translated string.
   *
   * @example "Value must be at least 5 characters long."
   * @example "L'adresse email est invalide." (Localized)
   */
  message: string;

  /**
   * The timestamp (in milliseconds) when the validation process initiated.
   * Captured via `Date.now()`.
   */
  startTime: number;

  /**
   * The total duration of the validation process in milliseconds.
   * Useful for performance monitoring and latency tracking.
   *
   * @example 15 // Took 15ms
   */
  duration?: number;

  /**
   * The Date object representing when the failure occurred.
   * Typically `new Date()` at moment of error creation.
   */
  failedAt: Date;

  /**
   * Boolean flag used for type narrowing.
   * Always `false` for error objects.
   */
  success: false;

  /**
   * A string status status "error".
   * Consistent with many API response standards (e.g., JSend).
   */
  status: 'error';

  /**
   * HTTP-compatible status code indicating the nature of the error.
   * Defaults to 422 (Unprocessable Entity) for validation failures.
   */
  statusCode: 422;

  /**
   * A constant string code identifying this as a validation failure.
   * distinct from system errors or auth errors.
   */
  errorCode: 'ERR_VALIDATION_FAILED';
}

/**
 * ## Validator Class Error
 *
 * Represents validation failures for a complex class instance or object target.
 * Unlike simple errors, a Class Error aggregates multiple failures across different fields
 * of the same object/instance.
 *
 * It provides both a flat list of errors and a mapped structure (`fieldErrors`)
 * for easy UI integration.
 *
 * @template TClass - The class constructor of the validated target
 */
export interface ValidatorClassError<
  TClass extends ClassConstructor = ClassConstructor,
> extends ValidatorBaseError {
  name: 'ValidatorClassError';

  /**
   * Map of field names to their first encountered error message.
   *
   * This property is optimized for UI form handling, providing direct access
   * to error strings keyed by field name.
   *
   * @example
   * ```typescript
   * {
   *   username: "Username is required",
   *   age: "Must be 18 or older"
   * }
   * ```
   */
  fieldErrors: Partial<Record<ValidatorClassKeys<TClass>, string>>;

  /**
   * A flat list of ALL individual validation errors that occurred on this target.
   * Includes nested details for every rule failure.
   */
  errors: Array<ValidatorClassItemError>;

  /**
   * The total number of validation rules that failed for this target.
   */
  failureCount: number;

  /**
   * The original data object that was validated.
   * Attached for context.
   */
  data: ValidatorClassInput<TClass>;
}

/**
 * ## Class Single Error Item
 *
 * A specialized wrapper for a validation error that occurred within a Class/Object validation context.
 * It links the specific `ValidatorError` (`cause`) to the broader class validation failure.
 *
 * Use this to drill down into the specifics of why a particular field on an instance failed.
 */
export interface ValidatorClassItemError extends ValidatorError {
  /**
   * The underlying simple `ValidatorError` that was generated by the failing rule.
   * Contains the granular details (ruleName, params, etc.).
   */
  cause: ValidatorError;
}
