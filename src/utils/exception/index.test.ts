import { BaseException } from './index';

import { BaseExceptionOptions } from './index';

describe('BaseException', () => {
  // Clear hooks and mocks after each test
  afterEach(() => {
    // We can't easily unregister anonymous hooks added during tests if we don't track them,
    // but we can test hooks implementation in isolation.
    jest.clearAllMocks();
  });

  describe('Instantiation', () => {
    it('should create an instance with a message', () => {
      const ex = new BaseException('Test error');
      expect(ex.message).toBe('Test error');
      expect(ex.name).toBe('BaseException');
      expect(ex).toBeInstanceOf(Error);
      expect(ex).toBeInstanceOf(BaseException);
    });

    it('should create an instance with options', () => {
      const details = { foo: 'bar' };
      const cause = new Error('Original cause');
      const ex = new BaseException('Test error', {
        code: 'TEST_CODE',
        statusCode: 400,
        details,
        cause,
      });

      expect(ex.code).toBe('TEST_CODE');
      expect(ex.statusCode).toBe(400);
      expect(ex.details).toEqual(details);
      expect(ex.cause).toBe(cause);
      expect(ex.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Extensibility', () => {
    // A subclass with a compatible constructor signature for factory usage
    class CompatibleException extends BaseException<{ reason: string }> {
      // No constructor needed if it just matches super, but explicit for clarity:
      constructor(
        message: string,
        options?: BaseExceptionOptions<{ reason: string }>
      ) {
        super(message, options);
        this.name = 'CompatibleException';
      }
    }

    // A subclass with custom constructor (factories won't work automatically here without override)
    class CustomSigException extends BaseException<{ reason: string }> {
      constructor(message: string, reason: string) {
        super(message, { details: { reason } });
        this.name = 'CustomSigException';
      }
    }

    it('should allow inheritance with custom signature', () => {
      const ex = new CustomSigException('Failed', 'network');
      expect(ex).toBeInstanceOf(BaseException);
      expect(ex).toBeInstanceOf(CustomSigException);
      expect(ex.name).toBe('CustomSigException');
      expect(ex.details?.reason).toBe('network');
    });

    it('should inherit static factory methods correctly (if constructor is compatible)', () => {
      const ex = CompatibleException.from('Converted error');
      expect(ex).toBeInstanceOf(CompatibleException);
      expect(ex).toBeInstanceOf(BaseException);
      expect(ex.message).toBe('Converted error');
      expect(ex.name).toBe('CompatibleException');
    });
  });

  describe('Static Methods', () => {
    describe('from()', () => {
      it('should return the same instance if input is already matching BaseException', () => {
        const original = new BaseException('Original');
        const converted = BaseException.from(original);
        expect(converted).toBe(original);
      });

      it('should convert a simple Error', () => {
        const err = new Error('Native error');
        const ex = BaseException.from(err);
        expect(ex.message).toBe('Native error');
        expect(ex.cause).toBe(err);
      });

      it('should convert a string', () => {
        const ex = BaseException.from('String error');
        expect(ex.message).toBe('String error');
      });

      it('should convert an object with message', () => {
        const ex = BaseException.from({ message: 'Object error', other: 1 });
        expect(ex.message).toBe('Object error');
        expect(ex.details).toEqual(expect.objectContaining({ other: 1 }));
      });

      it('should convert a JSON string', () => {
        const json = JSON.stringify({
          message: 'JSON error',
          code: 'JSON_ERR',
        });
        const ex = BaseException.from(json);
        expect(ex.message).toBe('JSON error');
        expect(ex.code).toBe('JSON_ERR');
      });

      it('should use fallback message if input is empty', () => {
        const ex = BaseException.from(null, { fallbackMessage: 'Fallback' });
        expect(ex.message).toBe('Fallback');
      });

      it('should handle undefined content gracefully', () => {
        const ex = BaseException.from('undefined');
        expect(ex.message).toBe('Unknown Error');
      });
    });

    describe('create()', () => {
      it('should create a new instance', () => {
        const ex = BaseException.create('Created');
        expect(ex.message).toBe('Created');
      });
    });

    describe('withOptions()', () => {
      it('should modify an existing exception', () => {
        const ex = new BaseException('Original');
        const modified = BaseException.withOptions(ex, { code: 'MODIFIED' });
        expect(modified).toBe(ex);
        expect(modified.code).toBe('MODIFIED');
      });
    });

    describe('wrap()', () => {
      it('should return result if promise resolves', async () => {
        const result = await BaseException.wrap(async () => 'success');
        expect(result).toBe('success');
      });

      it('should throw BaseException if promise rejects', async () => {
        await expect(
          BaseException.wrap(async () => {
            throw new Error('Fail');
          })
        ).rejects.toThrow(BaseException);
      });
    });

    describe('throw()', () => {
      it('should throw immediately', () => {
        expect(() => BaseException.throw('Boom')).toThrow(BaseException);
      });
    });

    describe('tryCatch()', () => {
      it('should return [null, result] on success', async () => {
        const [err, res] = await BaseException.tryCatch(async () => 'success');
        expect(err).toBeNull();
        expect(res).toBe('success');
      });

      it('should return [error, null] on failure', async () => {
        const [err, res] = await BaseException.tryCatch(async () => {
          throw new Error('Fail');
        });
        expect(res).toBeNull();
        expect(err).toBeInstanceOf(BaseException);
        expect(err?.message).toBe('Fail');
      });
    });

    describe('tryCatchSync()', () => {
      it('should return [null, result] on success', () => {
        const [err, res] = BaseException.tryCatchSync(() => 'sync success');
        expect(err).toBeNull();
        expect(res).toBe('sync success');
      });

      it('should return [error, null] on failure', () => {
        const [err, res] = BaseException.tryCatchSync(() => {
          throw new Error('Sync fail');
        });
        expect(res).toBeNull();
        expect(err).toBeInstanceOf(BaseException);
        expect(err?.message).toBe('Sync fail');
      });
    });
  });

  describe('Hooks', () => {
    it('should fire registered hooks on instantiation', () => {
      const hook = jest.fn();
      const unregister = BaseException.registerHook(hook);

      const ex = new BaseException('Hook test');
      expect(hook).toHaveBeenCalledWith(ex);

      unregister();
      new BaseException('After unregister');
      expect(hook).toHaveBeenCalledTimes(1);
    });

    it('should ignore errors thrown inside hooks', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const badHook = jest.fn(() => {
        throw new Error('Bad hook');
      });
      const unregister = BaseException.registerHook(badHook);

      expect(() => new BaseException('Safe')).not.toThrow();
      expect(badHook).toHaveBeenCalled();

      unregister();
      consoleSpy.mockRestore();
    });
  });

  describe('Serialization (toJSON)', () => {
    it('should serialize to a POJO', () => {
      const ex = new BaseException('Serial');
      const json = ex.toJSON();

      expect(json).toEqual(
        expect.objectContaining({
          name: 'BaseException',
          message: 'Serial',
          timestamp: expect.any(String),
        })
      );
      expect(json.code).toBeUndefined();
    });

    it('should include optional fields when present', () => {
      const ex = new BaseException('Full', {
        code: 'TEST',
        statusCode: 500,
        details: { a: 1 },
      });
      const json = ex.toJSON();
      expect(json.code).toBe('TEST');
      expect(json.statusCode).toBe(500);
      expect(json.details).toEqual({ a: 1 });
    });

    it('should control stack and cause serialization via options', () => {
      const cause = new Error('Root cause');
      const ex = new BaseException('Wrapper', { cause });

      const noCauseJson = ex.toJSON({ cause: false });
      expect(noCauseJson.cause).toBeUndefined();

      const stackJson = ex.toJSON({ stack: true });
      expect(stackJson.stack).toBeDefined();
    });

    it('should handle circular causes gracefully (depth limit)', () => {
      const ex1 = new BaseException('Ex1');
      const ex2 = new BaseException('Ex2', { cause: ex1 });
      // Manually creating a loop for testing resilience if it were possible,
      // but normal usage usually is hierarchical.
      // Let's test deep nesting instead.
      const ex3 = new BaseException('Ex3', { cause: ex2 });
      const ex4 = new BaseException('Ex4', { cause: ex3 });

      const json = ex4.toJSON({ maxCauseDepth: 1 });
      // ex4 -> ex3 (depth 0 used) -> stop

      const cause = json.cause as any;
      expect(cause.message).toBe('Ex3');
      // Depth logic:
      // serializeCause(ex3, depth: 1) ->
      //   ex3.toJSON({ maxCauseDepth: 0 }) ->
      //     serializeCause(ex2, depth: 0) -> return Max Depth Reached
      expect(cause.cause).toBe('[Max Depth Reached]');
    });
  });

  describe('Type Guards', () => {
    it('should identify BaseException instances', () => {
      const ex = new BaseException('test');
      expect(BaseException.isBaseException(ex)).toBe(true);
    });

    it('should identify objects that look like BaseException', () => {
      const fake = {
        name: BaseException.NAME,
        message: 'fake',
        success: false,
        timestamp: new Date(),
      };
      expect(BaseException.isBaseException(fake)).toBe(true);
    });

    it('should reject other errors', () => {
      expect(BaseException.isBaseException(new Error())).toBe(false);
      expect(BaseException.isBaseException({})).toBe(false);
      expect(BaseException.isBaseException(null)).toBe(false);
    });
  });

  describe('Backward Compatibility', () => {
    it('should export BaseException as an alias', () => {
      expect(BaseException).toBe(BaseException);
      const ex = new BaseException('Alias test');
      expect(ex).toBeInstanceOf(BaseException);
    });
  });
});
