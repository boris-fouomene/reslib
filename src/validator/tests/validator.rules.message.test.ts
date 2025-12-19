import { ensureRulesRegistered } from '@validator/rules';
import { i18n } from '../../i18n';
import { Validator } from '../validator';

ensureRulesRegistered();

describe('Validator Rule Message Override Tests', () => {
  beforeAll(async () => {
    await i18n.setLocale('en');
    i18n.registerTranslations({
      en: {
        validator: {
          required: 'This field is required by default',
          minLength: 'Too short by default',
          maxLength: 'Too long by default',
        },
        custom: {
          error: 'This is a custom translated error',
          parameterized: 'Value %{value} is invalid',
          min: 'Rule Params: %{ruleParams}',
        },
      },
    });
  });

  describe('Static Message Overrides', () => {
    it('should use default message when no override is provided', async () => {
      const result = await Validator.validate({
        value: '',
        rules: ['Required'],
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain('required');
    });

    it('should override default message with static string in rule object', async () => {
      const customMessage = 'Custom required message';
      const result = await Validator.validate({
        value: '',
        rules: [
          {
            Required: {
              params: [],
              message: customMessage,
            },
          },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.message).toBe(customMessage);
    });

    it('should override default message for parameterized rules', async () => {
      const customMessage = 'Must be at least 5 chars custom msg';
      const result = await Validator.validate({
        value: 'abc',
        rules: [
          {
            MinLength: {
              params: [5],
              message: customMessage,
            },
          },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.message).toBe(customMessage);
    });
  });

  describe('i18n Message Overrides', () => {
    it('should translate the override message key', async () => {
      const result = await Validator.validate({
        value: '',
        rules: [
          {
            Required: {
              params: [],
              message: 'custom.error',
            },
          },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.message).toBe('This is a custom translated error');
    });

    it('should handle non-existent i18n keys by returning the key itself', async () => {
      const nonExistentKey = 'non.existent.key';
      const result = await Validator.validate({
        value: '',
        rules: [
          {
            Required: {
              params: [],
              message: nonExistentKey,
            },
          },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.message).toBe(nonExistentKey);
    });
  });

  describe('Legacy vs New Syntax Compatibility', () => {
    it('should support mixed legacy and new syntax in rule list', async () => {
      const result = await Validator.validate({
        value: 'a',
        rules: [
          { MinLength: [5] }, // Legacy
          {
            MaxLength: {
              params: [2],
              message: 'Too long custom',
            },
          },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain('short'); // Default MinLength message
    });
  });

  describe('Edge Cases', () => {
    it('should respect override even if rule returns complex string', async () => {
      const result = await Validator.validate({
        value: 1,
        rules: [
          {
            NumberGT: {
              params: [10],
              message: 'Must be huge',
            },
          },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Must be huge');
    });
  });

  describe('Parameter Interpolation in Custom Messages', () => {
    it('should interpolate %{value} in custom message', async () => {
      const result = await Validator.validate({
        value: 'bad_input',
        rules: [
          {
            Email: {
              params: [],
              message: 'custom.parameterized',
            },
          },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain('Value');
      expect(result.message).toContain('is invalid');
    });

    it('should interpolate rule parameters in custom message', async () => {
      const result = await Validator.validate({
        value: 'a',
        rules: [
          {
            MinLength: {
              params: [5],
              message: 'custom.min',
            },
          },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain('Rule Params:');
    });
  });

  describe('Multiple Rules with Overrides', () => {
    it('should respect the override of the *first* failing rule in a chain', async () => {
      const result = await Validator.validate({
        value: 'abc',
        rules: [
          { MinLength: { params: [2], message: 'Min fail' } }, // Passes
          { MaxLength: { params: [2], message: 'Max fail' } }, // Fails
          { Email: { params: [], message: 'Email fail' } },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Max fail');
    });

    it('should fall back to default if failing rule has no override in a mixed chain', async () => {
      const result = await Validator.validate({
        value: 'abc',
        rules: [
          { MinLength: { params: [2], message: 'Min fail' } },
          { MaxLength: [2] }, // No override
        ],
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain('long'); // Default 'Too long by default'
    });
  });

  describe('Specific Rule Types', () => {
    it('should override message for StartsWithOneOf rule', async () => {
      const result = await Validator.validate({
        value: 'invalid-format',
        rules: [
          {
            StartsWithOneOf: {
              params: ['valid-'],
              message: 'Must start with valid-',
            },
          },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Must start with valid-');
    });

    it('should override message for Email rule', async () => {
      const result = await Validator.validate({
        value: 'not-an-email',
        rules: [
          {
            Email: {
              params: [],
              message: 'Please provide a valid email address',
            },
          },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Please provide a valid email address');
    });
  });
});
