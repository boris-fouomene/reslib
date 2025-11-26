import type { ValidatorRuleParams } from '../types';
import { ValidatorResult, ValidatorRuleParamTypes } from '../types';
import { Validator } from '../validator';

/**
 * ### Date Rule
 *
 * Validates that the field under validation is a valid date.
 *
 * @example
 * ```typescript
 * // Class validation
 * class Event {
 *   @IsRequired()
 *   @IsDate()
 *   eventDate: Date;
 * }
 * ```
 *
 * @param options - Validation options containing value and context
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const IsDate = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['Date']
>(function _Date({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}): ValidatorResult {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return true;
  } else if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return true;
    } else {
      const message = i18n.t('validator.date', {
        field: translatedPropertyName || fieldName,
        value,
        ...rest,
      });
      return message;
    }
  } else {
    const message = i18n.t('validator.date', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }
}, 'Date');

/**
 * ### DateAfter Rule
 *
 * Validates that the date is after the specified date.
 *
 * #### Parameters
 * - Date to compare against (Date object, ISO string, or timestamp)
 *
 * @example
 * ```typescript
 * // Class validation
 * class Event {
 *   @IsDateAfter(new Date('2024-01-01'))
 *   eventDate: Date;
 * }
 * ```
 *
 * @param options - Validation options with rule parameters
 * @param options.ruleParams - Array containing the date to compare against
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const IsDateAfter = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['DateAfter']
>(function DateAfter({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}): ValidatorResult {
  if (
    !value ||
    (!(value instanceof Date) &&
      typeof value !== 'string' &&
      typeof value !== 'number')
  ) {
    const message = i18n.t('validator.dateAfter', {
      field: translatedPropertyName || fieldName,
      value,
      date: ruleParams?.[0] || '',
      ...rest,
    });
    return message;
  }

  const valueDate = value instanceof Date ? value : new Date(value);
  if (isNaN(valueDate.getTime())) {
    const message = i18n.t('validator.dateAfter', {
      field: translatedPropertyName || fieldName,
      value,
      date: ruleParams?.[0] || '',
      ...rest,
    });
    return message;
  }

  if (!ruleParams) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'DateAfter',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }

  const compareDate =
    ruleParams[0] instanceof Date ? ruleParams[0] : new Date(ruleParams[0]);
  if (isNaN(compareDate.getTime())) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'DateAfter',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }

  if (valueDate > compareDate) {
    return true;
  } else {
    const message = i18n.t('validator.dateAfter', {
      field: translatedPropertyName || fieldName,
      value,
      date: ruleParams[0],
      ...rest,
    });
    return message;
  }
});

/**
 * ### DateBefore Rule
 *
 * Validates that the date is before the specified date.
 *
 * #### Parameters
 * - Date to compare against (Date object, ISO string, or timestamp)
 *
 * @example
 * ```typescript
 * // Class validation
 * class Deadline {
 *   @IsDateBefore(new Date('2024-12-31'))
 *   submissionDate: Date;
 * }
 * ```
 *
 * @param options - Validation options with rule parameters
 * @param options.ruleParams - Array containing the date to compare against
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const IsDateBefore = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['DateBefore']
>(function DateBefore({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}): ValidatorResult {
  if (
    !value ||
    (!(value instanceof Date) &&
      typeof value !== 'string' &&
      typeof value !== 'number')
  ) {
    const message = i18n.t('validator.dateBefore', {
      field: translatedPropertyName || fieldName,
      value,
      date: ruleParams?.[0] || '',
      ...rest,
    });
    return message;
  }

  const valueDate = value instanceof Date ? value : new Date(value);
  if (isNaN(valueDate.getTime())) {
    const message = i18n.t('validator.dateBefore', {
      field: translatedPropertyName || fieldName,
      value,
      date: ruleParams?.[0] || '',
      ...rest,
    });
    return message;
  }

  if (!ruleParams) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'DateBefore',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }

  const compareDate =
    ruleParams[0] instanceof Date ? ruleParams[0] : new Date(ruleParams[0]);
  if (isNaN(compareDate.getTime())) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'DateBefore',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }

  if (valueDate < compareDate) {
    return true;
  } else {
    const message = i18n.t('validator.dateBefore', {
      field: translatedPropertyName || fieldName,
      value,
      date: ruleParams[0],
      ...rest,
    });
    return message;
  }
});

/**
 * ### DateBetween Rule
 *
 * Validates that the date is between the specified start and end dates (inclusive).
 *
 * #### Parameters
 * - Start date (Date object, ISO string, or timestamp)
 * - End date (Date object, ISO string, or timestamp)
 *
 * @example
 * ```typescript
 * // Class validation
 * class Vacation {
 *   @IsDateBetween(new Date('2024-01-01'), new Date('2024-12-31'))
 *   vacationDate: Date;
 * }
 * ```
 *
 * @param options - Validation options with rule parameters
 * @param options.ruleParams - Array containing start date and end date
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const IsDateBetween = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['DateBetween']
>(function DateBetween({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}): ValidatorResult {
  if (
    !value ||
    (!(value instanceof Date) &&
      typeof value !== 'string' &&
      typeof value !== 'number')
  ) {
    const message = i18n.t('validator.dateBetween', {
      field: translatedPropertyName || fieldName,
      value,
      startDate: ruleParams?.[0] || '',
      endDate: ruleParams?.[1] || '',
      ...rest,
    });
    return message;
  }

  const valueDate = value instanceof Date ? value : new Date(value);
  if (isNaN(valueDate.getTime())) {
    const message = i18n.t('validator.dateBetween', {
      field: translatedPropertyName || fieldName,
      value,
      startDate: ruleParams?.[0] || '',
      endDate: ruleParams?.[1] || '',
      ...rest,
    });
    return message;
  }

  if (!ruleParams || ruleParams.length < 2) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'DateBetween',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }

  const startDate =
    ruleParams[0] instanceof Date ? ruleParams[0] : new Date(ruleParams[0]);
  const endDate =
    ruleParams[1] instanceof Date ? ruleParams[1] : new Date(ruleParams[1]);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'DateBetween',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }

  if (valueDate >= startDate && valueDate <= endDate) {
    return true;
  } else {
    const message = i18n.t('validator.dateBetween', {
      field: translatedPropertyName || fieldName,
      value,
      startDate: ruleParams[0],
      endDate: ruleParams[1],
      ...rest,
    });
    return message;
  }
});

/**
 * ### SameDate Rule
 *
 * Validates that the date equals the specified date (compares date part only, ignores time).
 *
 * #### Parameters
 * - Date to compare against (Date object, ISO string, or timestamp)
 *
 * @example
 * ```typescript
 * // Class validation
 * class Birthday {
 *   @IsSameDate(new Date('1990-01-01'))
 *   birthDate: Date;
 * }
 * ```
 *
 * @param options - Validation options with rule parameters
 * @param options.ruleParams - Array containing the date to compare against
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const IsSameDate = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['SameDate']
>(function SameDate({
  value,
  ruleParams,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}): ValidatorResult {
  if (
    !value ||
    (!(value instanceof Date) &&
      typeof value !== 'string' &&
      typeof value !== 'number')
  ) {
    const message = i18n.t('validator.dateEquals', {
      field: translatedPropertyName || fieldName,
      value,
      date: ruleParams?.[0] || '',
      ...rest,
    });
    return message;
  }

  const valueDate = value instanceof Date ? value : new Date(value);
  if (isNaN(valueDate.getTime())) {
    const message = i18n.t('validator.dateEquals', {
      field: translatedPropertyName || fieldName,
      value,
      date: ruleParams?.[0] || '',
      ...rest,
    });
    return message;
  }

  if (!ruleParams) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'SameDate',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }

  const compareDate =
    ruleParams[0] instanceof Date ? ruleParams[0] : new Date(ruleParams[0]);
  if (isNaN(compareDate.getTime())) {
    const message = i18n.t('validator.invalidRuleParams', {
      rule: 'SameDate',
      field: translatedPropertyName || fieldName,
      ruleParams,
      ...rest,
    });
    return message;
  }

  // Compare dates by setting time to start of day for date-only comparison
  const valueStartOfDay = new Date(
    valueDate.getFullYear(),
    valueDate.getMonth(),
    valueDate.getDate()
  );
  const compareStartOfDay = new Date(
    compareDate.getFullYear(),
    compareDate.getMonth(),
    compareDate.getDate()
  );

  if (valueStartOfDay.getTime() === compareStartOfDay.getTime()) {
    return true;
  } else {
    const message = i18n.t('validator.dateEquals', {
      field: translatedPropertyName || fieldName,
      value,
      date: ruleParams[0],
      ...rest,
    });
    return message;
  }
});

/**
 * ### IsFutureDate Rule
 *
 * Validates that the date is in the future.
 *
 * @example
 * ```typescript
 * // Class validation
 * class Appointment {
 *   @IsFutureDate
 *   appointmentDate: Date;
 * }
 * ```
 *
 * @param options - Validation options containing value and context
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const IsFutureDate = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['FutureDate']
>(function FutureDate({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}): ValidatorResult {
  if (
    !value ||
    (!(value instanceof Date) &&
      typeof value !== 'string' &&
      typeof value !== 'number')
  ) {
    const message = i18n.t('validator.futureDate', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }
  const valueDate = value instanceof Date ? value : new Date(value);
  if (isNaN(valueDate.getTime())) {
    const message = i18n.t('validator.futureDate', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }

  const now = new Date();
  if (valueDate > now) {
    return true;
  } else {
    const message = i18n.t('validator.futureDate', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }
}, 'FutureDate');

/**
 * ### PastDate Rule
 *
 * Validates that the date is in the past.
 *
 * @example
 * ```typescript
 * // Class validation
 * class HistoricalEvent {
 *   @IsPastDate
 *   eventDate: Date;
 * }
 * ```
 *
 * @param options - Validation options containing value and context
 * @returns Promise resolving to true if valid, rejecting with error message if invalid
 *
 *
 * @public
 */
export const IsPastDate = Validator.buildRuleDecorator<
  ValidatorRuleParamTypes['PastDate']
>(function IsPassDate({
  value,
  fieldName,
  translatedPropertyName,
  i18n,
  ...rest
}): ValidatorResult {
  if (
    !value ||
    (!(value instanceof Date) &&
      typeof value !== 'string' &&
      typeof value !== 'number')
  ) {
    const message = i18n.t('validator.pastDate', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }

  const valueDate = value instanceof Date ? value : new Date(value);
  if (isNaN(valueDate.getTime())) {
    const message = i18n.t('validator.pastDate', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }

  const now = new Date();
  if (valueDate < now) {
    return true;
  } else {
    const message = i18n.t('validator.pastDate', {
      field: translatedPropertyName || fieldName,
      value,
      ...rest,
    });
    return message;
  }
}, 'PastDate');

declare module '../types' {
  export interface ValidatorRuleParamTypes {
    /**
     * ### Date Rule
     *
     * Validates that the field under validation is a valid date.
     *
     * @example
     * ```typescript
     * // Valid dates
     * await Validator.validate({
     *   value: new Date(),
     *   rules: ['Date']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: '2024-01-01',
     *   rules: ['Date']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: 1640995200000,
     *   rules: ['Date']
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: 'invalid-date',
     *   rules: ['Date']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: null,
     *   rules: ['Date']
     * }); // ✗ Invalid
     *
     * // Class validation
     * class Event {
     *   @Required
     *   @IsDate()
     *   eventDate: Date;
     * }
     * ```
     *
     * @param options - Validation options containing value and context
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     *
     * @public
     */
    Date: ValidatorRuleParams<[]>;

    /**
     * ### DateAfter Rule
     *
     * Validates that the date is after the specified date.
     *
     * #### Parameters
     * - Date to compare against (Date object, ISO string, or timestamp)
     *
     * @example
     * ```typescript
     * // Valid examples
     * await Validator.validate({
     *   value: new Date('2024-01-02'),
     *   rules: ['DateAfter[2024-01-01]']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: '2024-06-15',
     *   rules: ['DateAfter[2024-01-01]']
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: new Date('2023-12-31'),
     *   rules: ['DateAfter[2024-01-01]']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: '2024-01-01',
     *   rules: ['DateAfter[2024-01-01]']
     * }); // ✗ Invalid (not strictly after)
     *
     * // Class validation
     * class Event {
     *   @IsDateAfter(new Date('2024-01-01'))
     *   eventDate: Date;
     * }
     * ```
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array containing the date to compare against
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     *
     * @public
     */
    DateAfter: ValidatorRuleParams<[date: ValidatorDate]>;

    /**
     * ### DateBefore Rule
     *
     * Validates that the date is before the specified date.
     *
     * #### Parameters
     * - Date to compare against (Date object, ISO string, or timestamp)
     *
     * @example
     * ```typescript
     * // Valid examples
     * await Validator.validate({
     *   value: new Date('2023-12-31'),
     *   rules: ['DateBefore[2024-01-01]']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: '2023-06-15',
     *   rules: ['DateBefore[2024-01-01]']
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: new Date('2024-01-02'),
     *   rules: ['DateBefore[2024-01-01]']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: '2024-01-01',
     *   rules: ['DateBefore[2024-01-01]']
     * }); // ✗ Invalid (not strictly before)
     *
     * // Class validation
     * class Deadline {
     *   @IsDateBefore(new Date('2024-12-31'))
     *   submissionDate: Date;
     * }
     * ```
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array containing the date to compare against
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     *
     * @public
     */
    DateBefore: ValidatorRuleParams<[date: ValidatorDate]>;

    /**
     * ### DateBetween Rule
     *
     * Validates that the date is between the specified start and end dates (inclusive).
     *
     * #### Parameters
     * - Start date (Date object, ISO string, or timestamp)
     * - End date (Date object, ISO string, or timestamp)
     *
     * @example
     * ```typescript
     * // Valid examples
     * await Validator.validate({
     *   value: new Date('2024-06-15'),
     *   rules: ['DateBetween[2024-01-01,2024-12-31]']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: '2024-01-01',
     *   rules: ['DateBetween[2024-01-01,2024-12-31]']
     * }); // ✓ Valid (inclusive)
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: new Date('2023-12-31'),
     *   rules: ['DateBetween[2024-01-01,2024-12-31]']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: '2025-01-01',
     *   rules: ['DateBetween[2024-01-01,2024-12-31]']
     * }); // ✗ Invalid
     *
     * // Class validation
     * class Vacation {
     *   @IsDateBetween(new Date('2024-01-01'), new Date('2024-12-31'))
     *   vacationDate: Date;
     * }
     * ```
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array containing start date and end date
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     *
     * @public
     */
    DateBetween: ValidatorRuleParams<
      [minDate: ValidatorDate, maxDate: ValidatorDate]
    >;

    /**
     * ### SameDate Rule
     *
     * Validates that the date equals the specified date (compares date part only, ignores time).
     *
     * #### Parameters
     * - Date to compare against (Date object, ISO string, or timestamp)
     *
     * @example
     * ```typescript
     * // Valid examples
     * await Validator.validate({
     *   value: new Date('2024-01-01T10:30:00'),
     *   rules: ['SameDate[2024-01-01]']
     * }); // ✓ Valid (time ignored)
     *
     * await Validator.validate({
     *   value: '2024-01-01',
     *   rules: ['SameDate[2024-01-01]']
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: new Date('2024-01-02'),
     *   rules: ['SameDate[2024-01-01]']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: '2024-01-01T10:30:00',
     *   rules: ['SameDate[2024-01-02]']
     * }); // ✗ Invalid
     *
     * // Class validation
     * class Birthday {
     *   @IsSameDate(new Date('1990-01-01'))
     *   birthDate: Date;
     * }
     * ```
     *
     * @param options - Validation options with rule parameters
     * @param options.ruleParams - Array containing the date to compare against
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     *
     * @public
     */
    SameDate: ValidatorRuleParams<[date: ValidatorDate]>;

    /**
     * ### FutureDate Rule
     *
     * Validates that the date is in the future.
     *
     * @example
     * ```typescript
     * // Valid examples
     * await Validator.validate({
     *   value: new Date(Date.now() + 86400000), // Tomorrow
     *   rules: ['FutureDate']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: '2025-01-01',
     *   rules: ['FutureDate']
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: new Date(Date.now() - 86400000), // Yesterday
     *   rules: ['FutureDate']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: new Date(), // Now
     *   rules: ['FutureDate']
     * }); // ✗ Invalid
     *
     * // Class validation
     * class Appointment {
     *   @IsFutureDate
     *   appointmentDate: Date;
     * }
     * ```
     *
     * @param options - Validation options containing value and context
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     *
     * @public
     */
    FutureDate: ValidatorRuleParams<[]>;

    /**
     * ### PastDate Rule
     *
     * Validates that the date is in the past.
     *
     * @example
     * ```typescript
     * // Valid examples
     * await Validator.validate({
     *   value: new Date(Date.now() - 86400000), // Yesterday
     *   rules: ['PastDate']
     * }); // ✓ Valid
     *
     * await Validator.validate({
     *   value: '2020-01-01',
     *   rules: ['PastDate']
     * }); // ✓ Valid
     *
     * // Invalid examples
     * await Validator.validate({
     *   value: new Date(Date.now() + 86400000), // Tomorrow
     *   rules: ['PastDate']
     * }); // ✗ Invalid
     *
     * await Validator.validate({
     *   value: new Date(), // Now
     *   rules: ['PastDate']
     * }); // ✗ Invalid
     *
     * // Class validation
     * class HistoricalEvent {
     *   @IsPastDate
     *   eventDate: Date;
     * }
     * ```
     *
     * @param options - Validation options containing value and context
     * @returns Promise resolving to true if valid, rejecting with error message if invalid
     *
     *
     * @public
     */
    PastDate: ValidatorRuleParams<[]>;
  }
}

type ValidatorDate = string | Date | number;
