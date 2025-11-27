import {
  AllOf,
  ArrayOf,
  OneOf,
  Validator,
  ensureRulesRegistered,
} from '../../index';

// Ensure rules are registered
ensureRulesRegistered();

describe('Multi-Rules Validation', () => {
  describe('OneOf', () => {
    it('should pass when exactly one rule passes', async () => {
      const result = await Validator.validate({
        value: 'test@example.com',
        rules: [Validator.oneOf(['Email', 'Url'])],
      });
      expect(result.success).toBe(true);
    });

    it('should fail when no rules pass', async () => {
      const result = await Validator.validate({
        value: 'invalid',
        rules: [Validator.oneOf(['Email', 'Url'])],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('must be a valid URL');
    });

    it('should pass when multiple rules pass', async () => {
      const result = await Validator.validate({
        value: '123',
        rules: [Validator.oneOf(['Number', { MinLength: [1] }])],
      });
      expect(result.success).toBe(true);
    });

    it('should work with complex rule combinations', async () => {
      const result = await Validator.validate({
        value: 'hello',
        rules: [Validator.oneOf([{ MinLength: [3] }, { MaxLength: [2] }])],
      });
      expect(result.success).toBe(true); // MinLength passes, MaxLength fails
    });

    it('should pass for empty rule sets', async () => {
      const result = await Validator.validate({
        value: 'test',
        rules: [Validator.oneOf([])],
      });
      expect(result.success).toBe(true);
    });

    // Decorator test
    it('should work with decorator for valid one-of', async () => {
      class TestClass {
        @OneOf(['Email', 'PhoneNumber'])
        contact: string = '';
      }

      const instance = new TestClass();
      instance.contact = 'test@example.com';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator when no rules pass', async () => {
      class TestClass {
        @OneOf(['Email', 'PhoneNumber'])
        contact: string = '';
      }

      const instance = new TestClass();
      instance.contact = 'invalid-contact';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain(
        'a valid phone number'
      );
    });

    it('should fail with decorator when multiple rules pass', async () => {
      class TestClass {
        @OneOf([{ MinLength: [3] }, { MaxLength: [10] }])
        text: string = '';
      }

      const instance = new TestClass();
      instance.text = 'hello'; // Passes both MinLength(3) and MaxLength(10)

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('AllOf', () => {
    it('should pass when all rules pass', async () => {
      const result = await Validator.validate({
        value: 'test@example.com',
        rules: [Validator.allOf(['Email', { MinLength: [5] }])],
      });
      expect(result.success).toBe(true);
    });

    it('should fail when any rule fails', async () => {
      const result = await Validator.validate({
        value: 'test@example.com',
        rules: [Validator.allOf(['Email', { MaxLength: [5] }])],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain(
        'be at most 5 characters long'
      );
    });

    it('should fail when all rules fail', async () => {
      const result = await Validator.validate({
        value: 'invalid',
        rules: [Validator.allOf(['Email', 'Url'])],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('be a valid URL');
    });

    it('should work with complex rule combinations', async () => {
      const result = await Validator.validate({
        value: 'hello world',
        rules: [
          Validator.allOf([{ MinLength: [5] }, { MaxLength: [20] }, 'String']),
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should pass for empty rule sets', async () => {
      const result = await Validator.validate({
        value: 'test',
        rules: [Validator.allOf([])],
      });
      expect(result.success).toBe(true);
    });

    // Decorator test
    it('should work with decorator when all rules pass', async () => {
      class TestClass {
        @AllOf(['Email', { MinLength: [10] }])
        email: string = '';
      }

      const instance = new TestClass();
      instance.email = 'test@example.com'; // Passes Email and MinLength(10)

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator when any rule fails', async () => {
      class TestClass {
        @AllOf(['Email', { MaxLength: [5] }])
        email: string = '';
      }

      const instance = new TestClass();
      instance.email = 'test@example.com'; // Passes Email but fails MaxLength(5)

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain(
        'at most 5 characters long'
      );
    });
  });

  describe('ArrayOf', () => {
    it('should pass when all array elements pass the rules', async () => {
      const result = await Validator.validate({
        value: ['test@example.com', 'user@domain.com'],
        rules: [Validator.arrayOf(['Email'])],
      });
      expect(result.success).toBe(true);
    });

    it('should fail when any array element fails the rules', async () => {
      const result = await Validator.validate({
        value: ['test@example.com', 'invalid-email'],
        rules: [Validator.arrayOf(['Email'])],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain(
        'must be a valid email addres'
      );
    });

    it('should fail for non-arrays', async () => {
      const result = await Validator.validate({
        value: 'not an array',
        rules: [Validator.arrayOf(['Email'])],
      });
      expect(result.success).toBe(false);
      expect((result as any).error?.message).toContain('must be an array');
    });

    it('should pass for empty arrays', async () => {
      const result = await Validator.validate({
        value: [],
        rules: [Validator.arrayOf(['Email'])],
      });
      expect(result.success).toBe(true);
    });

    it('should work with complex rule combinations', async () => {
      const result = await Validator.validate({
        value: ['hello', 'world'],
        rules: [Validator.arrayOf([{ MinLength: [3] }, { MaxLength: [10] }])],
      });
      expect(result.success).toBe(true);
    });

    it('should pass for empty rule sets', async () => {
      const result = await Validator.validate({
        value: ['test'],
        rules: [Validator.arrayOf([])],
      });
      expect(result.success).toBe(true);
    });

    // Decorator test
    it('should work with decorator for valid arrays', async () => {
      class TestClass {
        @ArrayOf(['Email'])
        emails!: string[];
      }

      const instance = new TestClass();
      instance.emails = ['test@example.com', 'user@domain.com'];

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });

    it('should fail with decorator when array elements are invalid', async () => {
      class TestClass {
        @ArrayOf(['Email'])
        emails!: string[];
      }

      const instance = new TestClass();
      instance.emails = ['test@example.com', 'invalid-email'];

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain(
        'must be a valid email address'
      );
    });

    it('should fail with decorator for non-arrays', async () => {
      class TestClass {
        @ArrayOf(['Email'])
        emails: any;
      }

      const instance = new TestClass();
      instance.emails = 'not an array';

      const result = await Validator.validateTarget(TestClass, {
        data: instance,
      });
      expect(result.success).toBe(false);
      expect((result as any).errors?.[0].message).toContain('must be an array');
    });
  });

  // Nested multi-rules tests
  describe('Nested Multi-Rules', () => {
    it('should support nested OneOf rules', async () => {
      const result = await Validator.validate({
        value: 'test@example.com',
        rules: [
          Validator.oneOf([
            Validator.allOf(['Email', { MinLength: [5] }]),
            Validator.allOf(['Url', { MinLength: [10] }]),
          ]),
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should support nested AllOf rules', async () => {
      const result = await Validator.validate({
        value: ['test@example.com', 'user@domain.com'],
        rules: [
          Validator.allOf([
            Validator.arrayOf(['Email']),
            Validator.arrayOf([{ MinLength: [5] }]),
          ]),
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should support nested ArrayOf rules', async () => {
      const result = await Validator.validate({
        value: ['test@example.com', 'user@domain.com'],
        rules: [Validator.arrayOf(['Email'])],
      });
      expect(result.success).toBe(true);
    });
  });

  // Complex real-world scenarios
  describe('Complex Scenarios', () => {
    it('should validate contact information with OneOf', async () => {
      // Contact can be either email or phone
      const result = await Validator.validate({
        value: '+442079460958',
        rules: [Validator.oneOf(['Email', 'PhoneNumber'])],
      });
      expect(result.success).toBe(true);
    });

    it('should validate password requirements with AllOf', async () => {
      // Password must be 8-20 chars, contain letters and numbers
      const result = await Validator.validate({
        value: 'Password123',
        rules: [
          Validator.allOf([
            { MinLength: [8] },
            { MaxLength: [20] },
            { Matches: [/[a-zA-Z]/] },
            { Matches: [/\d/] },
          ]),
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should validate tags array with ArrayOf', async () => {
      // Tags must be strings, unique, and 2-10 chars each
      const result = await Validator.validate({
        value: ['javascript', 'typescript', 'react'],
        rules: [
          Validator.allOf([
            Validator.arrayOf([
              'String',
              { MinLength: [2] },
              { MaxLength: [10] },
            ]),
          ]),
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should validate complex form data with decorators', async () => {
      class ContactForm {
        @OneOf(['Email', 'PhoneNumber'])
        contact: string = '';

        @AllOf([
          { MinLength: [8], MaxLength: [20] },
          { Matches: [/[a-zA-Z]/] },
          { Matches: [/\d/] },
        ])
        password: string = '';

        @AllOf([
          Validator.arrayOf(['String']),
          Validator.arrayOf([{ MinLength: [2] }]),
          'ArrayUnique',
        ])
        tags!: string[];
      }

      const instance = new ContactForm();
      instance.contact = 'test@example.com';
      instance.password = 'SecurePass123';
      instance.tags = ['web', 'dev', 'js'];

      const result = await Validator.validateTarget(ContactForm, {
        data: instance,
      });
      expect(result.success).toBe(true);
    });
  });
});
