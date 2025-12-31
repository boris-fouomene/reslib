import { I18n } from '@/i18n';
import {
  If,
  Validator,
  ValidatorIfResolver,
  ensureRulesRegistered,
} from '../../index';

// Ensure rules are registered
ensureRulesRegistered();

describe('If Validation Rule', () => {
  describe('Sync Resolver Logic', () => {
    it('should validate using rules returned by resolver', async () => {
      const result = await Validator.validate({
        value: 'invalid-email',
        rules: [Validator.if(({ value }) => ['Email'])],
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain('must be a valid email');
    });

    it('should skip validation when resolver returns empty array', async () => {
      const result = await Validator.validate({
        value: 'invalid-email',
        rules: [Validator.if(() => [])],
      });
      expect(result.success).toBe(true);
    });

    it('should skip validation when resolver returns null', async () => {
      const result = await Validator.validate({
        value: 'invalid',
        rules: [Validator.if(() => null)],
      });
      expect(result.success).toBe(true);
    });

    it('should skip validation when resolver returns undefined', async () => {
      const result = await Validator.validate({
        value: 'invalid',
        rules: [Validator.if(() => undefined)],
      });
      expect(result.success).toBe(true);
    });

    it('should apply logic based on value', async () => {
      // If value starts with "A", must be length 5. Else length 3.
      const resolver: ValidatorIfResolver = ({ value }) => {
        if (typeof value === 'string' && value.startsWith('A')) {
          return [{ Length: [5] }];
        }
        return [{ Length: [3] }];
      };

      expect(
        (
          await Validator.validate({
            value: 'ABCDE',
            rules: [Validator.if(resolver)],
          })
        ).success
      ).toBe(true);
      expect(
        (
          await Validator.validate({
            value: 'ABC',
            rules: [Validator.if(resolver)],
          })
        ).success
      ).toBe(false);
      expect(
        (
          await Validator.validate({
            value: 'BDE',
            rules: [Validator.if(resolver)],
          })
        ).success
      ).toBe(true);
    });

    it('should apply logic based on data (sibling properties)', async () => {
      const resolver: ValidatorIfResolver = ({ data }) => {
        if (data?.type === 'business') {
          return ['Required', { MinLength: [5] }];
        }
        return ['Required'];
      };

      const rules = [Validator.if(resolver)];

      // Business
      expect(
        (
          await Validator.validate({
            value: 'Inc',
            data: { type: 'business' },
            rules,
          })
        ).success
      ).toBe(false); // Too short
      expect(
        (
          await Validator.validate({
            value: 'Corporation',
            data: { type: 'business' },
            rules,
          })
        ).success
      ).toBe(true);

      // Personal
      expect(
        (
          await Validator.validate({
            value: 'Me',
            data: { type: 'personal' },
            rules,
          })
        ).success
      ).toBe(true);
    });

    it('should apply logic based on context', async () => {
      const resolver: ValidatorIfResolver = ({ context }: any) => {
        return context?.isAdmin ? [] : ['Required'];
      };
      const rules = [Validator.if(resolver)];

      // Admin (skipped)
      expect(
        (
          await Validator.validate({
            value: '',
            context: { isAdmin: true },
            rules,
          })
        ).success
      ).toBe(true);
      // User (required)
      expect(
        (
          await Validator.validate({
            value: '',
            context: { isAdmin: false },
            rules,
          })
        ).success
      ).toBe(false);
    });
  });

  describe('Async Resolver Logic', () => {
    it('should resolve rules provided via Promise', async () => {
      const result = await Validator.validate({
        value: 'short',
        rules: [
          Validator.if(async () => {
            await new Promise((r) => setTimeout(r, 5));
            return [{ MinLength: [10] }];
          }),
        ],
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain('at least 10 characters');
    });

    it('should resolve object with message via Promise', async () => {
      const result = await Validator.validate({
        value: 'invalid',
        rules: [
          Validator.if(async () => {
            await new Promise((r) => setTimeout(r, 5));
            return {
              rules: ['Email'],
              message: 'Async custom error',
            };
          }),
        ],
      });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Async custom error');
    });

    it('should handle async resolver errors by returning failure', async () => {
      const result = await Validator.validate({
        value: 'val',
        rules: [
          Validator.if(async () => {
            throw new Error('Resolver failed');
          }),
        ],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Message Configuration', () => {
    it('should use default error message from applied rules when no custom message', async () => {
      const result = await Validator.validate({
        value: 'short',
        rules: [Validator.if(({ value }) => ['Required', { MinLength: [10] }])],
      });
      expect(result.success).toBe(false);
      // "Value must be at least 10 characters long"
      expect(result.message).toMatch(/at least 10 characters/);
    });

    it('should override error message using resolver return object', async () => {
      const result = await Validator.validate({
        value: 'short',
        rules: [
          Validator.if(() => ({
            rules: [{ MinLength: [10] }],
            message: 'Custom static message',
          })),
        ],
      });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Custom static message');
    });

    it('should override error message using dynamic function', async () => {
      const result = await Validator.validate({
        value: 'foo',
        rules: [
          Validator.if(() => ({
            rules: [{ MinLength: [10] }],
            message: ({ value }) => `Dynamic: ${value} is too short`,
          })),
        ],
      });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Dynamic: foo is too short');
    });

    it('should allow i18n in dynamic message', async () => {
      const i18n = I18n.getInstance();
      i18n.registerTranslations({
        en: {
          'error.key': 'Translated: error.key',
        },
      });
      const result = await Validator.validate({
        value: 'val',
        i18n,
        rules: [
          Validator.if(() => ({
            rules: [{ MinLength: [10] }],
            message: ({ i18n }) => i18n!.t('error.key'),
          })),
        ],
      });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Translated: error.key');
    });
  });

  describe('Integration & Factory Method', () => {
    it('should work correctly when nested in OneOf', async () => {
      interface AdminContext {
        isAdmin: boolean;
      }
      // Validate: Either (String AND MinLength 5[if admin]) OR (Number)
      const result = await Validator.validate({
        value: 'abcd', // string, length 4.
        context: { isAdmin: true },
        rules: [
          Validator.oneOf([
            // Path 1: If admin, must be min length 5
            Validator.if<AdminContext>(({ context }) =>
              context?.isAdmin ? [{ MinLength: [5] }] : []
            ),
            // Path 2: Number
            'Number',
          ]),
        ],
      });
      // 'abcd' is not number. Path 1 applies MinLength(5), which fails.
      expect(result.success).toBe(false);
    });

    it('should work correctly when nested in ArrayOf', async () => {
      const rules = [
        Validator.arrayOf([
          Validator.if(({ value }) =>
            typeof value === 'string'
              ? ['String', { MinLength: [3] }]
              : ['Number']
          ),
        ]),
      ];

      // Mixed array
      const result = await Validator.validate({
        value: ['abc', 123, 'de'], // 'de' fails MinLength(3)
        rules,
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain('at least 3 characters');
    });
  });

  describe('@If Decorator Comprehensive', () => {
    it('should enforce strict rules via decorator based on data', async () => {
      class TestStrict {
        @If(({ data }) => (data?.strict ? [{ MinLength: [5] }] : []))
        val: string = '';
        strict?: boolean;
      }
      const t = new TestStrict();
      t.val = 'abc';

      // Strict
      expect(
        (
          await Validator.validateClass(TestStrict, {
            data: { ...t, strict: true },
          })
        ).success
      ).toBe(false);
      // Loose
      expect(
        (
          await Validator.validateClass(TestStrict, {
            data: { ...t, strict: false },
          })
        ).success
      ).toBe(true);
    });

    it('should use custom message defined in decorator resolver', async () => {
      class TestMsg {
        @If(() => ({ rules: ['Required'], message: 'Missing field!' }))
        val?: string;
      }
      const t = new TestMsg();
      const result = await Validator.validateClass(TestMsg, { data: t });
      expect(result.success).toBe(false);
      expect((result as any).errors[0].message).toBe('Missing field!');
    });

    it('should support async decorator resolver', async () => {
      class TestAsync {
        @If(async () => {
          await new Promise((r) => setTimeout(r, 1));
          return ['Required'];
        })
        val?: string;
      }
      const t = new TestAsync();
      const result = await Validator.validateClass(TestAsync, { data: t });
      expect(result.success).toBe(false);
    });

    it('should allow multiple @If decorators on one property', async () => {
      class TestMulti {
        @If(({ data }) => (data?.check1 ? [{ MinLength: [3] }] : []))
        @If(({ data }) => (data?.check2 ? [{ MaxLength: [5] }] : []))
        val: string = '123456'; // length 6

        check1?: boolean;
        check2?: boolean;
      }
      const t = new TestMulti();

      // Check 1 only (Min 3) -> Pass
      t.val = '123456';
      expect(
        (
          await Validator.validateClass(TestMulti, {
            data: { ...t, check1: true, check2: false },
          })
        ).success
      ).toBe(true);

      // Check 2 only (Max 5) -> Fail
      expect(
        (
          await Validator.validateClass(TestMulti, {
            data: { ...t, check1: false, check2: true },
          })
        ).success
      ).toBe(false);
    });
  });
});
