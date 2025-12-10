import { Validator, ensureRulesRegistered } from '../../index';
import { IsObject } from '../object';

// Ensure rules are registered
ensureRulesRegistered();

describe('Object Validation Rules', () => {
  describe('Object', () => {
    it('should pass for plain objects', async () => {
      const result = await Validator.validate({
        value: { key: 'value' },
        rules: ['Object'],
      });
      expect(result.success).toBe(true);
    });

    it('should pass for empty objects', async () => {
      const result = await Validator.validate({
        value: {},
        rules: ['Object'],
      });
      expect(result.success).toBe(true);
    });

    it('should fail for non-objects', async () => {
      const values = [
        null,
        undefined,
        [],
        'string',
        42,
        true,
        new Date(),
        /regex/,
      ];
      for (const value of values) {
        const result = await Validator.validate({
          value,
          rules: ['Object'],
        });
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('This field must be an object');
      }
    });

    it('should fail for class instances', async () => {
      class TestClass {
        prop = 'value';
      }
      const instance = new TestClass();
      const result = await Validator.validate({
        value: instance,
        rules: ['Object'],
      });
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('This field must be an object');
    });

    // Decorator test
    it('should work with IsObject decorator', async () => {
      class TestClass {
        @IsObject()
        config!: Record<string, any>;
      }

      const instance = new TestClass();
      instance.config = { setting: 'value' };

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
    });
    it('should work with IsObject decorator 2', async () => {
      class TestClass {
        @IsObject()
        config!: Record<string, any>;
      }

      const instance = new TestClass();
      instance.config = { setting: 'value' };

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with IsObject decorator for non-objects', async () => {
      class TestClass {
        @IsObject()
        config!: Record<string, any>;
      }

      const instance = new TestClass();
      (instance as any).config = 'not an object';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain(
        'This field must be an object'
      );
    });
  });
});
