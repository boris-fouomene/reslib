import { ensureRulesRegistered, IsEnum, Validator } from '../../index';

// Ensure rules are registered
ensureRulesRegistered();

describe('Enum Validation Rules', () => {
  describe('IsEnum', () => {
    enum Status {
      ACTIVE = 'active',
      INACTIVE = 'inactive',
      PENDING = 'pending',
    }

    enum Priority {
      LOW = 1,
      MEDIUM = 2,
      HIGH = 3,
    }

    it('should pass for valid enum string values', async () => {
      const result = await Validator.validate({
        value: 'active',
        rules: [{ Enum: Object.values(Status) }],
      });
      expect(result.success).toBe(true);
    });

    it('should pass for valid enum numeric values', async () => {
      const result = await Validator.validate({
        value: 2,
        rules: [{ Enum: Object.values(Priority) }],
      });
      expect(result.success).toBe(true);
    });

    it('should fail for invalid string values', async () => {
      const result = await Validator.validate({
        value: 'invalid',
        rules: [{ Enum: Object.values(Status) }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('must be one of');
    });

    it('should fail for invalid numeric values', async () => {
      const result = await Validator.validate({
        value: 99,
        rules: [{ Enum: Object.values(Priority) }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('must be one of');
    });

    it('should fail for null', async () => {
      const result = await Validator.validate({
        value: null,
        rules: [{ Enum: Object.values(Status) }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('must be one of');
    });

    it('should fail for undefined', async () => {
      const result = await Validator.validate({
        value: undefined,
        rules: [{ Enum: Object.values(Status) }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('must be one of');
    });

    it('should fail for objects', async () => {
      const result = await Validator.validate({
        value: {},
        rules: [{ Enum: Object.values(Status) }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('must be one of');
    });

    it('should fail for arrays', async () => {
      const result = await Validator.validate({
        value: [],
        rules: [{ Enum: Object.values(Status) }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('must be one of');
    });

    it('should work with string enums', async () => {
      enum Color {
        RED = 'red',
        GREEN = 'green',
        BLUE = 'blue',
      }

      const validValues = ['red', 'green', 'blue'];
      const invalidValues = ['yellow', 'purple', 'redX'];

      for (const value of validValues) {
        const result = await Validator.validate({
          value,
          rules: [{ Enum: Object.values(Color) }],
        });
        expect(result.success).toBe(true);
      }

      for (const value of invalidValues) {
        const result = await Validator.validate({
          value,
          rules: [{ Enum: Object.values(Color) }],
        });
        expect(result.success).toBe(false);
      }
    });

    it('should work with numeric enums', async () => {
      enum Size {
        SMALL = 1,
        MEDIUM = 2,
        LARGE = 3,
      }

      const validValues = [1, 2, 3];
      const invalidValues = [0, 4, 1.5, '1'];

      for (const value of validValues) {
        const result = await Validator.validate({
          value,
          rules: [{ Enum: Object.values(Size) }],
        });
        expect(result.success).toBe(true);
      }

      for (const value of invalidValues) {
        const result = await Validator.validate({
          value,
          rules: [{ Enum: Object.values(Size) }],
        });
        expect(result.success).toBe(false);
      }
    });

    it('should work with mixed enums', async () => {
      enum Mixed {
        A = 'a',
        B = 2,
        C = 'c',
      }

      const validValues = ['a', 2, 'c'];
      const invalidValues = ['b', 1, 'A', 'C'];

      for (const value of validValues) {
        const result = await Validator.validate({
          value,
          rules: [{ Enum: Object.values(Mixed) }],
        });
        expect(result.success).toBe(true);
      }

      for (const value of invalidValues) {
        const result = await Validator.validate({
          value,
          rules: [{ Enum: Object.values(Mixed) }],
        });
        expect(result.success).toBe(false);
      }
    });

    it('should fail for invalid enum parameter', async () => {
      const result = await Validator.validate({
        value: 'test',
        rules: [{ Enum: ['not-an-enum'] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('must be one of');
    });

    it('should fail when no enum provided', async () => {
      const result = await Validator.validate({
        value: 'test',
        rules: [{ Enum: [] }],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain(
        'Invalid parameters for rule Enum'
      );
    });

    // Decorator test
    it('should work with decorator for valid enum value', async () => {
      class TestClass {
        @IsEnum(...Object.values(Status))
        status!: Status;
      }

      const instance = new TestClass();
      instance.status = Status.ACTIVE;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should work with decorator for valid string enum value', async () => {
      class TestClass {
        @IsEnum(...Object.values(Status))
        status!: Status;
      }

      const instance = new TestClass();
      instance.status = 'active' as any;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should work with decorator for valid numeric enum value', async () => {
      class TestClass {
        @IsEnum(...Object.values(Priority))
        priority!: Priority;
      }

      const instance = new TestClass();
      instance.priority = 1;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for invalid enum value', async () => {
      class TestClass {
        @IsEnum(...Object.values(Status))
        status!: Status;
      }

      const instance = new TestClass();
      instance.status = 'invalid' as any;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain('must be one of');
    });

    // Edge cases
    it('should handle enum with zero value', async () => {
      enum ZeroEnum {
        NONE = 0,
        SOME = 1,
      }

      const result = await Validator.validate({
        value: 0,
        rules: [{ Enum: Object.values(ZeroEnum) }],
      });
      expect(result.success).toBe(true);
    });

    it('should handle enum with empty string value', async () => {
      enum EmptyStringEnum {
        EMPTY = '',
        NON_EMPTY = 'value',
      }

      const result1 = await Validator.validate({
        value: '',
        rules: [{ Enum: Object.values(EmptyStringEnum) }],
      });
      expect(result1.success).toBe(true);

      const result2 = await Validator.validate({
        value: 'value',
        rules: [{ Enum: Object.values(EmptyStringEnum) }],
      });
      expect(result2.success).toBe(true);
    });

    it('should handle large enums', async () => {
      enum LargeEnum {
        VALUE_1 = 'val1',
        VALUE_2 = 'val2',
        VALUE_3 = 'val3',
        VALUE_4 = 'val4',
        VALUE_5 = 'val5',
        VALUE_6 = 'val6',
        VALUE_7 = 'val7',
        VALUE_8 = 'val8',
        VALUE_9 = 'val9',
        VALUE_10 = 'val10',
      }

      const result = await Validator.validate({
        value: 'val5',
        rules: [{ Enum: Object.values(LargeEnum) }],
      });
      expect(result.success).toBe(true);
    });
  });
});
