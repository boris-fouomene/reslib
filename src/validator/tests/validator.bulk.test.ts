import { I18n, i18n } from '../../i18n';
import {
  ensureRulesRegistered,
  IsEmail,
  IsNumberGTE,
  IsOptional,
  IsRequired,
  MinLength,
  Validator,
  ValidatorBulkError,
  ValidatorBulkSuccess,
} from '../index';

ensureRulesRegistered();

/**
 * Test DTO for bulk validation
 */
class UserDto {
  @IsRequired()
  @MinLength(3)
  name: string = '';

  @IsRequired()
  @IsEmail()
  email: string = '';
}

/**
 * Product DTO for more complex rules
 */
class ProductDto {
  @IsRequired()
  name: string = '';

  @IsNumberGTE(0)
  price: number = 0;

  @IsOptional()
  tags?: string[];
}

/** Decorators for advanced tests defined outside classes to behave correctly with factories */
const IsContextCheck = Validator.buildRuleDecorator<any>(
  ({ value, context }: any) => {
    return value === context.allowedValue || `Value ${value} not allowed`;
  },
  'ContextCheck' as any
);

const IsDelayCheck = Validator.buildRuleDecorator<any>(
  async ({ value, ruleParams }: any) => {
    const delays = ruleParams as number[];
    await new Promise((resolve) =>
      setTimeout(resolve, delays[value as number])
    );
    return value !== 1 || 'Failed mid';
  },
  'DelayCheck' as any
);

const IsNestedRule = Validator.buildRuleDecorator<any>(async function ({
  value,
}) {
  class SubDto {
    @IsRequired()
    type: string = '';
  }
  const res = await Validator.validateClass(SubDto, { data: value });
  return res.success || res.message;
}, 'Nested' as any);

describe('Validator.validateBulk', () => {
  beforeAll(async () => {
    await i18n.setLocale('en');

    // Ensure translation keys are registered for consistent testing
    i18n.registerTranslations({
      en: {
        validator: {
          invalidBulkData: 'Invalid bulk data: an array is required',
          bulkValidationFailed: {
            one: 'Bulk validation failed: 1 of %{totalCount} items failed',
            other:
              'Bulk validation failed: %{failureCount} of %{totalCount} items failed',
          },
          bulkValidationAllFailed: {
            one: 'Validation failed for the single item',
            other: 'All %{totalCount} items failed validation',
          },
        },
      },
    });
  });

  describe('Success Scenarios', () => {
    it('should validate a list of valid users successfully', async () => {
      const data = [
        { name: 'Alice', email: 'alice@example.com' },
        { name: 'Bob Smith', email: 'bob@example.com' },
      ];

      const result = await Validator.validateBulk(UserDto, { data });

      expect(result.success).toBe(true);
      const success = result as ValidatorBulkSuccess<typeof UserDto>;
      expect(success.data).toEqual(data);
      expect(success.status).toBe('success');
      expect(success.name).toBe('ValidatorSuccessResult');
      expect(success.validatedAt).toBeInstanceOf(Date);
      expect(typeof success.duration).toBe('number');
    });

    it('should handle empty arrays as a success', async () => {
      const data: any[] = [];
      const result = await Validator.validateBulk(UserDto, { data });

      expect(result.success).toBe(true);
      const success = result as ValidatorBulkSuccess<typeof UserDto>;
      expect(success.data).toEqual([]);
      expect(success.duration).toBeGreaterThanOrEqual(0);
    });

    it('should validate large datasets efficiently', async () => {
      const data = Array.from({ length: 100 }, (_, i) => ({
        name: `User ${i}`,
        email: `user${i}@example.com`,
      }));

      const result = await Validator.validateBulk(UserDto, { data });
      expect(result.success).toBe(true);
      const success = result as ValidatorBulkSuccess<typeof UserDto>;
      expect(success.data).toHaveLength(100);
    });

    it('should work with classes having optional fields', async () => {
      const data = [
        { name: 'Widget', price: 10, tags: ['tool', 'home'] },
        { name: 'Gadget', price: 20 }, // Missing tags is fine
      ];

      const result = await Validator.validateBulk(ProductDto, { data });
      expect(result.success).toBe(true);
      const success = result as ValidatorBulkSuccess<typeof ProductDto>;
      expect(success.data).toEqual(data);
    });

    it('should maintain item references in result data', async () => {
      const item1 = { name: 'Alice', email: 'alice@example.com' };
      const data = [item1];

      const result = await Validator.validateBulk(UserDto, { data });
      expect(result.success).toBe(true);
      const success = result as ValidatorBulkSuccess<typeof UserDto>;
      expect(success.data[0]).toBe(item1);
    });
  });

  describe('Failure Scenarios', () => {
    it('should report correct statistics for partial failure', async () => {
      const data = [
        { name: 'Alice', email: 'alice@example.com' }, // OK
        { name: 'Bo', email: 'bad-email' }, // Multiple errors
        { name: 'Charlie', email: 'charlie@example.com' }, // OK
      ];

      const result = await Validator.validateBulk(UserDto, { data });

      expect(result.success).toBe(false);
      const error = result as ValidatorBulkError<typeof UserDto>;
      expect(error.failureCount).toBe(1);
      expect(error.totalCount).toBe(3);
      expect(error.message).toBe('Bulk validation failed: 1 of 3 items failed');
      expect(error.failures).toHaveLength(1);
      expect(error.failures[0].index).toBe(2);
      expect(error.failures[0].success).toBe(false);
      expect(error.failures[0].errors.length).toBeGreaterThanOrEqual(1);
    });

    it('should report correct statistics for total failure', async () => {
      const data = [
        { name: 'A', email: 'a' },
        { name: 'B', email: 'b' },
      ];

      const result = await Validator.validateBulk(UserDto, { data });

      expect(result.success).toBe(false);
      const error = result as ValidatorBulkError<typeof UserDto>;
      expect(error.failureCount).toBe(2);
      expect(error.totalCount).toBe(2);
      expect(error.message).toBe('All 2 items failed validation');
    });

    it('should have specific output for single item failure', async () => {
      const data = [{ name: 'A', email: 'a' }];

      const result = await Validator.validateBulk(UserDto, { data });

      expect(result.success).toBe(false);
      const error = result as ValidatorBulkError<typeof UserDto>;
      expect(error.message).toBe('Validation failed for the single item');
    });

    it('should report multiple errors within one failing item', async () => {
      const data = [{ name: 'X', email: 'not-an-email' }];

      const result = await Validator.validateBulk(UserDto, { data });
      expect(result.success).toBe(false);
      const error = result as ValidatorBulkError<typeof UserDto>;
      const failure = error.failures[0];

      expect(failure.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ propertyName: 'name' }),
          expect.objectContaining({ propertyName: 'email' }),
        ])
      );
    });

    it('should handle non-array input by returning a failed result', async () => {
      const result = await Validator.validateBulk(UserDto, { data: {} as any });

      expect(result.success).toBe(false);
      const error = result as ValidatorBulkError<typeof UserDto>;
      expect(error.message).toBe('Invalid bulk data: an array is required');
      expect(error.failureCount).toBe(0);
      expect(error.failures).toEqual([]);
    });
  });

  describe('Context and Locale Handling', () => {
    it('should propagate context to all validation rules in bulk', async () => {
      class ContextCheckDto {
        @IsContextCheck()
        val: string = '';
      }

      const data = [{ val: 'A' }, { val: 'B' }, { val: 'A' }];
      const result = await Validator.validateBulk(ContextCheckDto, {
        data,
        context: { allowedValue: 'A' },
      });

      expect(result.success).toBe(false);
      const error = result as ValidatorBulkError<typeof ContextCheckDto>;
      expect(error.failureCount).toBe(1);
      expect(error.failures[0].index).toBe(2);
    });

    it('should respect custom i18n provided in options', async () => {
      const customI18n = new I18n();
      customI18n.registerTranslations({
        en: {
          validator: {
            bulkValidationFailed: {
              one: 'CUSTOM ONE',
              other: 'CUSTOM %{failureCount} OF %{totalCount}',
            },
          },
        },
      });

      const data = [
        { name: 'Alice', email: 'alice@example.com' },
        { name: 'X', email: 'x' },
      ];
      const result = await Validator.validateBulk(UserDto, {
        data,
        i18n: customI18n,
      });

      expect(result.success).toBe(false);
      const error = result as ValidatorBulkError<typeof UserDto>;
      expect(error.message).toBe('CUSTOM ONE');
    });
  });

  describe('Parallelism and Performance', () => {
    it('should validate all items concurrently and preserve order', async () => {
      const delays: number[] = [100, 10, 50];
      class DelayDto {
        @IsDelayCheck(delays)
        id: number = 0;
      }

      const data = [{ id: 0 }, { id: 1 }, { id: 2 }];
      const startTime = Date.now();
      const result = await Validator.validateBulk(DelayDto, { data });
      const duration = Date.now() - startTime;

      // Parallel execution should take approx max(delays) not sum(delays)
      // We use a safe margin for CI
      expect(duration).toBeLessThan(delays.reduce((a, b) => a + b, 0));

      expect(result.success).toBe(false);
      const error = result as ValidatorBulkError<typeof DelayDto>;
      expect(error.failures[0].index).toBe(2); // Item at index 1 (id: 1)
    });
  });

  describe('Nesting and Complexity', () => {
    it('should handle nested class validation within bulk processing', async () => {
      class MainDto {
        @IsNestedRule()
        sub: any;
      }

      const data = [
        { sub: { type: 'A' } },
        { sub: { type: '' } }, // Fails
      ];

      const result = await Validator.validateBulk(MainDto, { data });
      expect(result.success).toBe(false);
      const error = result as ValidatorBulkError<typeof MainDto>;
      expect(error.failures[0].index).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle primitive objects if they have decorators (rare but possible)', async () => {
      // Just testing robust input handling
      const data = [null, undefined, 123, 'string'];
      const result = await Validator.validateBulk(UserDto, {
        data: data as any,
      });

      expect(result.success).toBe(false);
      const error = result as ValidatorBulkError<typeof UserDto>;
      expect(error.failureCount).toBe(4);
    });

    it('should correctly calculate duration when custom startTime is passed', async () => {
      const customStart = Date.now() - 5000;
      const result = await Validator.validateBulk(UserDto, {
        data: [{ name: 'John Doe', email: 'john@example.com' }],
        startTime: customStart,
      });

      expect(result.duration).toBeGreaterThanOrEqual(5000);
    });

    it('should successfully validate items with extra properties not defined in DTO', async () => {
      const data = [
        { name: 'John Doe', email: 'john@example.com', extra: 'prop' },
      ];

      const result = await Validator.validateBulk(UserDto, { data });
      expect(result.success).toBe(true);
      const success = result as ValidatorBulkSuccess<typeof UserDto>;
      expect((success.data[0] as any).extra).toBe('prop');
    });

    it('should return many failures correctly indexed in a large mixed dataset', async () => {
      const data = Array.from({ length: 20 }, (_, i) => ({
        name: i % 2 === 0 ? 'Valid Name' : 'X', // Every odd index fails (1, 3, 5...)
        email: i % 2 === 0 ? 'valid@email.com' : 'bad',
      }));

      const result = await Validator.validateBulk(UserDto, { data });
      expect(result.success).toBe(false);
      const error = result as ValidatorBulkError<typeof UserDto>;
      expect(error.failureCount).toBe(10);
      expect(error.totalCount).toBe(20);

      // Check first few failure indices
      expect(error.failures[0].index).toBe(2);
      expect(error.failures[1].index).toBe(4);
      expect(error.failures[9].index).toBe(20);
    });
  });
});
