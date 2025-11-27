import { ensureRulesRegistered, IsBoolean, Validator } from '../../index';

// Ensure rules are registered
ensureRulesRegistered();

describe('Boolean Validation Rules', () => {
  describe('IsBoolean', () => {
    it('should pass for boolean true', async () => {
      const result = await Validator.validate({
        value: true,
        rules: ['Boolean'],
      });
      expect(result.success).toBe(true);
    });

    it('should pass for boolean false', async () => {
      const result = await Validator.validate({
        value: false,
        rules: ['Boolean'],
      });
      expect(result.success).toBe(true);
    });

    it('should pass for number 1', async () => {
      const result = await Validator.validate({
        value: 1,
        rules: ['Boolean'],
      });
      expect(result.success).toBe(true);
    });

    it('should pass for number 0', async () => {
      const result = await Validator.validate({
        value: 0,
        rules: ['Boolean'],
      });
      expect(result.success).toBe(true);
    });

    it('should pass for string "1"', async () => {
      const result = await Validator.validate({
        value: '1',
        rules: ['Boolean'],
      });
      expect(result.success).toBe(true);
    });

    it('should pass for string "0"', async () => {
      const result = await Validator.validate({
        value: '0',
        rules: ['Boolean'],
      });
      expect(result.success).toBe(true);
    });

    it('should pass for string "true" (case insensitive)', async () => {
      const values = ['true', 'True', 'TRUE', 'false', 'False', 'FALSE'];
      for (const value of values) {
        const result = await Validator.validate({
          value,
          rules: ['Boolean'],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should fail for invalid strings', async () => {
      const values = ['yes', 'no', 'maybe', 'invalid', ''];
      for (const value of values) {
        const result = await Validator.validate({
          value,
          rules: ['Boolean'],
        });
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('Boolean');
      }
    });

    it('should fail for numbers other than 0 or 1', async () => {
      const values = [2, -1, 1.5, NaN, Infinity];
      for (const value of values) {
        const result = await Validator.validate({
          value,
          rules: ['Boolean'],
        });
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('Boolean');
      }
    });

    it('should fail for null', async () => {
      const result = await Validator.validate({
        value: null,
        rules: ['Boolean'],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Boolean');
    });

    it('should fail for undefined', async () => {
      const result = await Validator.validate({
        value: undefined,
        rules: ['Boolean'],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Boolean');
    });

    it('should fail for objects', async () => {
      const result = await Validator.validate({
        value: {},
        rules: ['Boolean'],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Boolean');
    });

    it('should fail for arrays', async () => {
      const result = await Validator.validate({
        value: [],
        rules: ['Boolean'],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Boolean');
    });

    // Decorator test
    it('should work with decorator for valid boolean', async () => {
      class TestClass {
        @IsBoolean()
        isActive!: boolean;
      }

      const instance = new TestClass();
      instance.isActive = true;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should work with decorator for valid string boolean', async () => {
      class TestClass {
        @IsBoolean()
        isActive!: boolean;
      }

      const instance = new TestClass();
      instance.isActive = 'false' as any;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should work with decorator for valid number boolean', async () => {
      class TestClass {
        @IsBoolean()
        isActive!: boolean;
      }

      const instance = new TestClass();
      instance.isActive = 1 as any;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator for invalid value', async () => {
      class TestClass {
        @IsBoolean()
        isActive!: boolean;
      }

      const instance = new TestClass();
      instance.isActive = 'maybe' as any;

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain('Boolean');
    });

    // Edge cases
    it('should handle string with whitespace', async () => {
      const result = await Validator.validate({
        value: ' true ',
        rules: ['Boolean'],
      });
      expect(result.success).toBe(false); // Should fail because it's not exactly 'true'
    });

    it('should handle mixed case strings correctly', async () => {
      const result = await Validator.validate({
        value: 'True',
        rules: ['Boolean'],
      });
      expect(result.success).toBe(true);
    });

    it('should handle zero as valid', async () => {
      const result = await Validator.validate({
        value: 0,
        rules: ['Boolean'],
      });
      expect(result.success).toBe(true);
    });

    it('should handle negative zero as valid', async () => {
      const result = await Validator.validate({
        value: -0,
        rules: ['Boolean'],
      });
      expect(result.success).toBe(true);
    });
  });
});
