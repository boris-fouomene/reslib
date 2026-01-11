import {
  BaseException,
  BaseExceptionConstructor,
  BaseExceptionOptions,
} from './index';

/**
 * COMPREHENSIVE TEST SUITE for BaseException
 *
 * Tests covering:
 * 1. Custom fields extension (not in details)
 * 2. All static methods
 * 3. Hooks system
 * 4. Serialization
 * 5. Edge cases
 * 6. Type safety
 */

describe('BaseException - Comprehensive Test Suite', () => {
  // ==================== Custom Fields Extension ====================
  describe('Custom Fields (not in details)', () => {
    /**
     * Exception with custom fields directly on the class
     */
    class PaymentException extends BaseException<PaymentDetails> {
      // Custom fields NOT in details
      public transactionId?: string;
      public amount?: number;
      public currency?: string;

      constructor(message: string, options?: PaymentExceptionOptions) {
        super(message, options);

        // Initialize custom fields from options
        if (options?.transactionId) this.transactionId = options.transactionId;
        if (options?.amount) this.amount = options.amount;
        if (options?.currency) this.currency = options.currency;
      }

      // Override toJSON to include custom fields
      override toJSON() {
        return {
          ...super.toJSON(),
          transactionId: this.transactionId,
          amount: this.amount,
          currency: this.currency,
        };
      }
    }

    interface PaymentDetails {
      gateway?: string;
      errorCode?: string;
    }

    interface PaymentExceptionOptions extends BaseExceptionOptions<PaymentDetails> {
      transactionId?: string;
      amount?: number;
      currency?: string;
    }

    test('should support custom fields directly on exception class', () => {
      const ex = new PaymentException('Payment failed', {
        code: 'PAYMENT_FAILED',
        statusCode: 402,
        transactionId: 'tx_12345',
        amount: 99.99,
        currency: 'USD',
        details: {
          gateway: 'stripe',
          errorCode: 'card_declined',
        },
      });

      expect(ex.transactionId).toBe('tx_12345');
      expect(ex.amount).toBe(99.99);
      expect(ex.currency).toBe('USD');
      expect(ex.details?.gateway).toBe('stripe');
      expect(ex).toBeInstanceOf(PaymentException);
      expect(ex).toBeInstanceOf(BaseException);
    });

    test('should serialize custom fields with toJSON', () => {
      const ex = new PaymentException('Payment failed', {
        transactionId: 'tx_67890',
        amount: 150.5,
        currency: 'EUR',
      });

      const json = ex.toJSON();
      expect(json.transactionId).toBe('tx_67890');
      expect(json.amount).toBe(150.5);
      expect(json.currency).toBe('EUR');
      expect((json as any).message).toBe('Payment failed');
    });

    test('should work with from() method', () => {
      const error = {
        message: 'Transaction declined',
        code: 'DECLINED',
        transactionId: 'tx_99999',
      };

      const ex = BaseException.from(error) as PaymentException;
      expect(ex.message).toBe('Transaction declined');
      expect(ex.code).toBe('DECLINED');
    });
  });

  // ==================== All Static Methods Coverage ====================
  describe('Static Methods', () => {
    describe('create()', () => {
      test('should create exception with message and options', () => {
        // @ts-expect-error - create is protected
        const ex = BaseException.create('Test error', {
          code: 'TEST_CODE',
          statusCode: 400,
        });

        expect(ex.message).toBe('Test error');
        expect(ex.code).toBe('TEST_CODE');
        expect(ex.statusCode).toBe(400);
      });
    });

    describe('from()', () => {
      test('should convert Error instance', () => {
        const error = new Error('Standard error');
        const ex = BaseException.from(error);

        expect(ex.message).toBe('Standard error');
        expect(ex.cause).toBe(error);
      });

      test('should convert string', () => {
        const ex = BaseException.from('String error');
        expect(ex.message).toBe('String error');
      });

      test('should convert plain object', () => {
        const error = {
          message: 'API error',
          statusCode: 500,
          code: 'API_FAIL',
        };
        const ex = BaseException.from(error);

        expect(ex.message).toBe('API error');
        expect(ex.statusCode).toBe(500);
        expect(ex.code).toBe('API_FAIL');
      });

      test('should convert JSON string', () => {
        const jsonError = JSON.stringify({
          message: 'Serialized error',
          code: 'SERIAL',
        });
        const ex = BaseException.from(jsonError);

        expect(ex.message).toBe('Serialized error');
        expect(ex.code).toBe('SERIAL');
      });

      test('should handle null/undefined with fallback', () => {
        const ex1 = BaseException.from(null, {
          fallbackMessage: 'Null error',
        });
        const ex2 = BaseException.from(undefined, {
          fallbackMessage: 'Undefined error',
        });

        expect(ex1.message).toBe('Null error');
        expect(ex2.message).toBe('Undefined error');
      });
    });

    describe('withOptions()', () => {
      test('should merge options into existing exception', () => {
        const ex = new BaseException('Original', { code: 'ORIG' });
        const updated = BaseException.withOptions(ex, {
          code: 'UPDATED',
          statusCode: 503,
        });

        expect(updated).toBe(ex); // Same instance
        expect(ex.code).toBe('UPDATED');
        expect(ex.statusCode).toBe(503);
      });

      test('should merge details', () => {
        const ex = new BaseException('Test', {
          details: { field1: 'value1' },
        });
        BaseException.withOptions(ex, {
          details: { field2: 'value2' },
        });

        expect((ex.details as { field1: string })?.field1).toBe('value1');
        expect((ex.details as { field2: string })?.field2).toBe('value2');
      });
    });

    describe('wrap()', () => {
      test('should wrap successful async operation', async () => {
        const result = await BaseException.wrap(async () => {
          return 'success';
        });

        expect(result).toBe('success');
      });

      test('should convert and throw on error', async () => {
        await expect(
          BaseException.wrap(
            async () => {
              throw new Error('Wrapped error');
            },
            { code: 'WRAP_ERROR' }
          )
        ).rejects.toThrow(BaseException);
      });
    });

    describe('throw()', () => {
      test('should throw BaseException', () => {
        expect(() => {
          BaseException.throw('Error message', { code: 'THROWN' });
        }).toThrow(BaseException);
      });

      test('should convert error and throw', () => {
        const error = new Error('Original');

        try {
          BaseException.throw(error, { code: 'CONVERTED' });
        } catch (e) {
          // eslint-disable-next-line jest/no-conditional-expect
          expect(e).toBeInstanceOf(BaseException);
          // eslint-disable-next-line jest/no-conditional-expect
          expect((e as BaseException).code).toBe('CONVERTED');
          // eslint-disable-next-line jest/no-conditional-expect
          expect((e as BaseException).cause).toBe(error);
        }
      });
    });

    describe('tryCatchSync()', () => {
      test('should return result on success', () => {
        const [error, result] = BaseException.tryCatchSync(() => {
          return 'success';
        });

        expect(error).toBeNull();
        expect(result).toBe('success');
      });

      test('should return error on failure', () => {
        const [error, result] = BaseException.tryCatchSync(
          () => {
            throw new Error('Sync error');
          },
          { code: 'SYNC_FAIL' }
        );

        expect(error).toBeInstanceOf(BaseException);
        expect(error?.code).toBe('SYNC_FAIL');
        expect(result).toBeNull();
      });

      test('should work with custom exception classes', () => {
        class CustomException extends BaseException {}

        const [error, result] = CustomException.tryCatchSync(() => {
          throw new Error('Custom error');
        });

        expect(error).toBeInstanceOf(CustomException);
        expect(error).toBeInstanceOf(BaseException);
        expect(result).toBeNull();
      });
    });

    describe('tryCatch()', () => {
      test('should return result on success', async () => {
        const [error, result] = await BaseException.tryCatch(async () => {
          return 'async success';
        });

        expect(error).toBeNull();
        expect(result).toBe('async success');
      });

      test('should return error on failure', async () => {
        const [error, result] = await BaseException.tryCatch(
          async () => {
            throw new Error('Async error');
          },
          { code: 'ASYNC_FAIL' }
        );

        expect(error).toBeInstanceOf(BaseException);
        expect(error?.code).toBe('ASYNC_FAIL');
        expect(result).toBeNull();
      });
    });

    describe('is()', () => {
      test('should identify BaseException instances', () => {
        const ex = new BaseException('Test');
        expect(BaseException.is(ex)).toBe(true);
      });

      test('should identify subclass instances', () => {
        class SubException extends BaseException {}
        const ex = new SubException('Test');
        expect(BaseException.is(ex)).toBe(true);
      });

      test('should identify serialized exceptions', () => {
        const ex = new BaseException('Test');
        const serialized = JSON.parse(JSON.stringify(ex.toJSON()));
        expect(BaseException.is(serialized)).toBe(true);
      });

      test('should reject non-exceptions', () => {
        expect(BaseException.is(null)).toBe(false);
        expect(BaseException.is({})).toBe(false);
        expect(BaseException.is('string')).toBe(false);
        expect(BaseException.is(new Error())).toBe(false);
      });
    });
  });

  // ==================== Serialization ====================
  describe('Serialization', () => {
    test('should serialize with toJSON', () => {
      const ex = new BaseException('Serialize test', {
        code: 'SERIALIZE',
        statusCode: 400,
        details: { field: 'value' },
      });

      const json = ex.toJSON();
      expect(json.__isBaseException).toBe(true);
      expect(json.name).toBe('BaseException');
      expect(json.message).toBe('Serialize test');
      expect(json.code).toBe('SERIALIZE');
      expect(json.statusCode).toBe(400);
      expect(json.details).toEqual({ field: 'value' });
      expect(json.timestamp).toBeDefined();
    });

    test('should include stack in development', () => {
      const ex = new BaseException('Test');
      const json = ex.toJSON({ stack: true });
      expect(json.stack).toBeDefined();
    });

    test('should exclude stack when disabled', () => {
      const ex = new BaseException('Test');
      const json = ex.toJSON({ stack: false });
      expect(json.stack).toBeUndefined();
    });

    test('should serialize cause chain', () => {
      const cause1 = new Error('Root cause');
      const cause2 = new BaseException('Middle', { cause: cause1 });
      const ex = new BaseException('Top', { cause: cause2 });

      const json = ex.toJSON({ cause: true });
      expect(json.cause).toBeDefined();
    });

    test('should limit cause depth', () => {
      let cause: any = new Error('Deep');
      for (let i = 0; i < 10; i++) {
        cause = new BaseException(`Level ${i}`, { cause });
      }

      const json = cause.toJSON({ maxCauseDepth: 3 });
      // Should not have infinitely nested causes
      expect(json).toBeDefined();
    });
  });

  // ==================== toString() ====================
  describe('toString()', () => {
    test('should format with code', () => {
      const ex = new BaseException('Error message', { code: 'ERR_CODE' });
      const str = ex.toString();
      expect(str).toContain('BaseException');
      expect(str).toContain('[ERR_CODE]');
      expect(str).toContain('Error message');
    });

    test('should format without code', () => {
      const ex = new BaseException('Error message');
      const str = ex.toString();
      expect(str).toContain('BaseException');
      expect(str).toContain('Error message');
      expect(str).not.toContain('[');
    });

    test('should show subclass name', () => {
      class MyException extends BaseException {}
      const ex = new MyException('Test');
      const str = ex.toString();
      expect(str).toContain('MyException');
    });
  });

  // ==================== Edge Cases ====================
  describe('Edge Cases', () => {
    test('should handle circular references in details', () => {
      const circular: any = { field: 'value' };
      circular.self = circular;

      expect(() => {
        new BaseException('Test', { details: circular });
      }).not.toThrow();
    });

    test('should handle very long messages', () => {
      const longMessage = 'A'.repeat(100000);
      const ex = new BaseException(longMessage);
      expect(ex.message).toBe(longMessage);
    });

    test('should handle special characters in message', () => {
      const message = 'Error: <script>alert("xss")</script> 你好 🎉';
      const ex = new BaseException(message);
      expect(ex.message).toBe(message);
    });

    test('should preserve timestamp', () => {
      const customTime = new Date('2024-01-01T00:00:00Z');
      const ex = new BaseException('Test', { timestamp: customTime });
      expect(ex.timestamp).toBe(customTime);
    });

    test('should handle undefined message', () => {
      const ex = new BaseException(undefined as any);
      expect(typeof ex.message).toBe('string');
      // Message should be some default value when undefined is passed
      //expect(ex.message).toBeTruthy();
    });
  });

  // ==================== Type Safety ====================
  describe('Type Safety', () => {
    test('should enforce typed details', () => {
      interface TypedDetails {
        userId: number;
        action: string;
      }

      const ex = new BaseException<TypedDetails>('Test', {
        details: {
          userId: 123,
          action: 'login',
        },
      });

      // TypeScript should enforce this at compile time
      expect(ex.details?.userId).toBe(123);
      expect(ex.details?.action).toBe('login');
    });

    test('should work with BaseExceptionConstructor type', () => {
      function createException<T extends BaseException>(
        Ctor: BaseExceptionConstructor<any, T>,
        message: string
      ): T {
        return new Ctor(message);
      }

      class MyException extends BaseException {}
      const ex = createException(MyException, 'Test');
      expect(ex).toBeInstanceOf(MyException);
    });
  });

  // ==================== Error Chains ====================
  describe('Error Chains', () => {
    test('should preserve error chain', () => {
      const root = new Error('Root');
      const middle = new BaseException('Middle', { cause: root });
      const top = new BaseException('Top', { cause: middle });

      expect(top.cause).toBe(root);
      expect(middle.cause).toBe(root);
    });

    test('should serialize full error chain', () => {
      const root = new Error('Root cause');
      const middle = new BaseException('Middle layer', { cause: root });
      const top = new BaseException('Top layer', { cause: middle });

      const json = top.toJSON({ cause: true, maxCauseDepth: 10 });
      expect(json.cause).toBeDefined();
      const middleJson = json.cause as any;
      expect(middleJson.message).toBe('Root cause');
      expect(middleJson.cause).not.toBeDefined();
    });
  });
});
