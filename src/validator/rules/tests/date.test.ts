import { Validator, ensureRulesRegistered } from '../../index';
import {
  IsDate,
  IsDateAfter,
  IsDateBefore,
  IsDateBetween,
  IsFutureDate,
  IsPastDate,
  IsSameDate,
} from '../index';

// Ensure rules are registered
ensureRulesRegistered();

describe('Date Validation Rules', () => {
  const now = new Date();
  const pastDate = new Date(now.getTime() - 86400000); // 1 day ago
  const futureDate = new Date(now.getTime() + 86400000); // 1 day from now
  const farPast = new Date('2020-01-01');
  const farFuture = new Date('2030-01-01');

  describe('IsDate', () => {
    it('should pass for Date objects', async () => {
      const result = await Validator.validate({
        value: new Date(),
        rules: ['Date'],
      });
      expect(result.success).toBe(true);
    });

    it('should pass for valid date strings', async () => {
      const validStrings = [
        '2023-01-01',
        '2023-12-31T23:59:59.999Z',
        '2023-01-01T00:00:00.000Z',
        'January 1, 2023',
        '01/01/2023',
      ];

      for (const dateStr of validStrings) {
        const result = await Validator.validate({
          value: dateStr,
          rules: ['Date'],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should pass for valid timestamps', async () => {
      const timestamps = [
        1640995200000, // 2022-01-01
        0, // 1970-01-01
        -1, // Just before 1970
        Date.now(),
      ];

      for (const timestamp of timestamps) {
        const result = await Validator.validate({
          value: timestamp,
          rules: ['Date'],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail for invalid date strings', async () => {
      const invalidStrings = [
        'invalid',
        'not-a-date',
        '2023-13-01', // Invalid month
        '2023-01-32', // Invalid day
        '',
        'abc',
      ];

      for (const dateStr of invalidStrings) {
        const result = await Validator.validate({
          value: dateStr,
          rules: ['Date'],
        });
        expect(result.success).toBe(false);
        expect((result as any).error?.message).toContain('date');
      }
    });

    it('should fail for invalid values', async () => {
      const invalidValues = [
        null,
        undefined,
        {},
        [],
        true,
        false,
        NaN,
        Infinity,
        -Infinity,
      ];

      for (const value of invalidValues) {
        const result = await Validator.validate({
          value,
          rules: ['Date'],
        });
        expect(result.success).toBe(false);
        expect((result as any).error?.message).toContain('date');
      }
    });

    it('should fail for invalid Date objects', async () => {
      const result = await Validator.validate({
        value: new Date('invalid'),
        rules: ['Date'],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('date');
    });

    // Decorator test
    it('should work with decorator for valid date', async () => {
      class TestClass {
        @IsDate()
        eventDate!: Date;
      }

      const instance = new TestClass();
      instance.eventDate = new Date();

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should work with decorator for valid date string', async () => {
      class TestClass {
        @IsDate()
        eventDate!: Date;
      }

      const instance = new TestClass();
      instance.eventDate = '2023-01-01' as any;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for invalid date', async () => {
      class TestClass {
        @IsDate()
        eventDate!: Date;
      }

      const instance = new TestClass();
      instance.eventDate = 'invalid-date' as any;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any)?.errors?.[0].message).toContain('date');
    });
  });

  describe('IsDateAfter', () => {
    it('should pass when date is after reference date', async () => {
      const result = await Validator.validate({
        value: futureDate,
        rules: [{ DateAfter: [now] }],
      });
      expect(result.success).toBe(true);
    });

    it('should pass when date string is after reference date', async () => {
      const result = await Validator.validate({
        value: '2025-01-01',
        rules: [{ DateAfter: ['2024-01-01'] }],
      });
      expect(result.success).toBe(true);
    });

    it('should fail when date is before reference date', async () => {
      const result = await Validator.validate({
        value: pastDate,
        rules: [{ DateAfter: [now] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('after');
    });

    it('should fail when date equals reference date', async () => {
      const result = await Validator.validate({
        value: now,
        rules: [{ DateAfter: [now] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('after');
    });

    it('should fail for invalid date values', async () => {
      const result = await Validator.validate({
        value: 'invalid',
        rules: [{ DateAfter: [now] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('after');
    });

    it('should fail for invalid reference date', async () => {
      const result = await Validator.validate({
        value: futureDate,
        rules: [{ DateAfter: ['invalid'] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('invalidRuleParams');
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @IsDate()
        @IsDateAfter(farPast)
        eventDate!: Date;
      }

      const instance = new TestClass();
      instance.eventDate = now;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator when date is not after', async () => {
      class TestClass {
        @IsDate()
        @IsDateAfter(farFuture)
        eventDate!: Date;
      }

      const instance = new TestClass();
      instance.eventDate = now;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any)?.errors?.[0].message).toContain('after');
    });
  });

  describe('IsDateBefore', () => {
    it('should pass when date is before reference date', async () => {
      const result = await Validator.validate({
        value: pastDate,
        rules: [{ DateBefore: [now] }],
      });
      expect(result.success).toBe(true);
    });

    it('should fail when date is after reference date', async () => {
      const result = await Validator.validate({
        value: futureDate,
        rules: [{ DateBefore: [now] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('before');
    });

    it('should fail when date equals reference date', async () => {
      const result = await Validator.validate({
        value: now,
        rules: [{ DateBefore: [now] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('before');
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @IsDate()
        @IsDateBefore(farFuture)
        eventDate!: Date;
      }

      const instance = new TestClass();
      instance.eventDate = now;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator when date is not before', async () => {
      class TestClass {
        @IsDate()
        @IsDateBefore(farPast)
        eventDate!: Date;
      }

      const instance = new TestClass();
      instance.eventDate = now;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any)?.errors?.[0].message).toContain('before');
    });
  });

  describe('IsDateBetween', () => {
    it('should pass when date is between min and max (inclusive)', async () => {
      const result = await Validator.validate({
        value: now,
        rules: [{ DateBetween: [pastDate, futureDate] }],
      });
      expect(result.success).toBe(true);
    });

    it('should pass when date equals min date', async () => {
      const result = await Validator.validate({
        value: pastDate,
        rules: [{ DateBetween: [pastDate, futureDate] }],
      });
      expect(result.success).toBe(true);
    });

    it('should pass when date equals max date', async () => {
      const result = await Validator.validate({
        value: futureDate,
        rules: [{ DateBetween: [pastDate, futureDate] }],
      });
      expect(result.success).toBe(true);
    });

    it('should fail when date is before min date', async () => {
      const earlierDate = new Date(pastDate.getTime() - 86400000);
      const result = await Validator.validate({
        value: earlierDate,
        rules: [{ DateBetween: [pastDate, futureDate] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('between');
    });

    it('should fail when date is after max date', async () => {
      const laterDate = new Date(futureDate.getTime() + 86400000);
      const result = await Validator.validate({
        value: laterDate,
        rules: [{ DateBetween: [pastDate, futureDate] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('between');
    });

    it('should fail for invalid parameters', async () => {
      const result = await Validator.validate({
        value: now,
        rules: [{ DateBetween: ['invalid' as any, 'invalidDate' as any] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('invalidRuleParams');
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @IsDate()
        @IsDateBetween(farPast, farFuture)
        eventDate!: Date;
      }

      const instance = new TestClass();
      instance.eventDate = now;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator when date is out of range', async () => {
      class TestClass {
        @IsDate()
        @IsDateBetween(farPast, farPast)
        eventDate!: Date;
      }

      const instance = new TestClass();
      instance.eventDate = now;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any)?.errors?.[0].message).toContain('between');
    });
  });

  describe('IsSameDate', () => {
    it('should pass when dates are the same', async () => {
      const date1 = new Date('2023-01-01T12:00:00Z');
      const date2 = new Date('2023-01-01T15:30:00Z');
      const result = await Validator.validate({
        value: date1,
        rules: [{ SameDate: [date2] }],
      });
      expect(result.success).toBe(true);
    });

    it('should fail when dates are different', async () => {
      const result = await Validator.validate({
        value: now,
        rules: [{ SameDate: [pastDate] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('equal to');
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @IsDate()
        @IsSameDate(now)
        eventDate!: Date;
      }

      const instance = new TestClass();
      instance.eventDate = new Date(now.getTime()); // Same date, different object

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('IsFutureDate', () => {
    it('should pass for future dates', async () => {
      const result = await Validator.validate({
        value: futureDate,
        rules: ['FutureDate'],
      });
      expect(result.success).toBe(true);
    });

    it('should fail for past dates', async () => {
      const result = await Validator.validate({
        value: pastDate,
        rules: ['FutureDate'],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('date in the future');
    });

    it('should fail for current date (not strictly future)', async () => {
      const result = await Validator.validate({
        value: now,
        rules: ['FutureDate'],
      });
      expect(result.success).toBe(false);
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @IsDate()
        @IsFutureDate()
        eventDate!: Date;
      }

      const instance = new TestClass();
      instance.eventDate = futureDate;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('IsPastDate', () => {
    it('should pass for past dates', async () => {
      const result = await Validator.validate({
        value: pastDate,
        rules: ['PastDate'],
      });
      expect(result.success).toBe(true);
    });

    it('should fail for future dates', async () => {
      const result = await Validator.validate({
        value: futureDate,
        rules: ['PastDate'],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('date in the past');
    });

    it('should fail for current date (not strictly past)', async () => {
      const result = await Validator.validate({
        value: now,
        rules: ['PastDate'],
      });
      expect(result.success).toBe(false);
    });

    // Decorator test
    it('should work with decorator', async () => {
      class TestClass {
        @IsDate()
        @IsPastDate()
        eventDate!: Date;
      }

      const instance = new TestClass();
      instance.eventDate = pastDate;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });
  });
});
