/* eslint-disable jest/no-conditional-expect */
import { Validator, ensureRulesRegistered } from '@/validator';
import 'reflect-metadata';
import { i18n } from '../../i18n';
import {
  ValidatorObjectOptions,
  ValidatorObjectResult,
  ValidatorObjectRules,
} from '../types';

describe('Validator - Object-Based Validation (Zod-like)', () => {
  beforeAll(async () => {
    ensureRulesRegistered();
    await i18n.setLocale('en');
  });

  describe('Validator.validateObject()', () => {
    it('should validate a simple object successfully', async () => {
      const data = { name: 'John Doe', age: 30 };
      const rules: ValidatorObjectRules<typeof data> = {
        name: ['Required', 'String'],
        age: ['Required', 'Number'],
      };

      const result: ValidatorObjectResult<typeof data> =
        await Validator.validateObject(data, rules);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    it('should return errors for invalid object data', async () => {
      const data = { name: '', age: 'thirty' };
      const rules: ValidatorObjectRules<typeof data> = {
        name: ['Required'],
        age: ['Number'],
      };

      const result = await Validator.validateObject(data, rules);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.fieldErrors.name).toBeDefined();
        expect(result.fieldErrors.age).toBeDefined();
      }
    });

    it('should handle complex rules with parameters', async () => {
      const data = { password: '123' };
      const rules: ValidatorObjectRules<typeof data> = {
        password: [{ MinLength: [8] }],
      };

      const result = await Validator.validateObject(data, rules);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.fieldErrors.password).toContain('8');
      }
    });

    it('should support dynamic message functions in object rules', async () => {
      const data = { email: 'invalid-email' };
      const rules: ValidatorObjectRules<typeof data> = {
        email: [
          {
            Email: {
              message: ({ value }: any) =>
                `"${value}" is not a valid email address`,
              params: [],
            },
          },
        ],
      };

      const result = await Validator.validateObject(data, rules);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.fieldErrors.email).toContain(
          '"invalid-email" is not a valid email address'
        );
      }
    });

    it('should pass context through to custom rules', async () => {
      const data = { username: 'admin' };
      const context = { reserved: ['admin', 'root'] };
      const rules: ValidatorObjectRules<typeof data> = {
        username: [
          (options: any) => {
            const { value, context: ctx } = options;
            if ((ctx as any)?.reserved.includes(value)) {
              return 'Username is reserved';
            }
            return true;
          },
        ],
      };

      const options: Omit<ValidatorObjectOptions<any, any>, 'data'> = {
        context,
      };

      const result = await Validator.validateObject(
        data,
        rules,
        options as any
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.fieldErrors.username).toBe(
          '[username] : Username is reserved'
        );
      }
    });
  });

  describe('Validator.object() Schema Factory', () => {
    const UserSchema = Validator.object({
      email: ['Required', 'Email'],
      age: ['Required', { NumberGTE: [18] }],
    });

    it('should validate valid data using the schema instance', async () => {
      const validUser = { email: 'alice@example.com', age: 25 };
      const result = await UserSchema.validate(validUser);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validUser);
      }
    });

    it('should fail invalid data using the schema instance', async () => {
      const invalidUser = { email: 'not-an-email', age: 16 };
      const result = await UserSchema.validate(invalidUser);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.failureCount).toBe(2);
      }
    });

    it('should be reusable for multiple validations', async () => {
      const users = [
        { email: 'a@b.com', age: 20 },
        { email: 'c@d.com', age: 30 },
      ];

      for (const user of users) {
        const result = await UserSchema.validate(user);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Edge Cases and Advanced Scenarios', () => {
    it('should handle empty objects and no rules', async () => {
      const data = {};
      const rules: ValidatorObjectRules<typeof data> = {};
      const result = await Validator.validateObject(data, rules);
      expect(result.success).toBe(true);
    });

    it('should handle extra properties not in rules (pass-through)', async () => {
      const data = { name: 'John', extra: 'field' };
      const rules: ValidatorObjectRules<any> = { name: ['Required'] };
      const result = await Validator.validateObject(data, rules);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    it('should support nested objects via custom rules calling validateObject', async () => {
      const data = {
        user: { name: 'Alice', email: 'alice@example.com' },
        metadata: { version: 1 },
      };

      const rules: ValidatorObjectRules<typeof data> = {
        user: [
          async ({ value }: any) => {
            const res = await Validator.validateObject(value, {
              name: ['Required'],
              email: ['Email'],
            });
            return res.success || res.message;
          },
        ],
        metadata: [],
      };

      const result = await Validator.validateObject(data, rules);
      expect(result.success).toBe(true);
    });

    it('should handle null/undefined data values correctly according to rules', async () => {
      const rules: ValidatorObjectRules<any> = {
        optionalField: ['Optional', 'String'],
        requiredField: ['Required', 'String'],
      };

      const result1 = await Validator.validateObject(
        { requiredField: 'here' },
        rules
      );
      expect(result1.success).toBe(true);

      const result2 = await Validator.validateObject(
        { optionalField: 123, requiredField: 'here' },
        rules
      );
      expect(result2.success).toBe(false); // 123 is not a string
    });
  });
});
