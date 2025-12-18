import {
  BaseException,
  BaseExceptionConstructor,
  BaseExceptionDetails,
  BaseExceptionOptions,
} from './index';

/**
 * Test suite demonstrating the extensibility of the BaseException.from() method
 */

// ==================== Test Case 1: Basic Extension ====================
/**
 * Simple custom exception that adds a custom prefix to messages
 */
class PrefixedException extends BaseException {
  protected static override parseErrorMessage(
    error: unknown,
    options?: BaseExceptionOptions
  ): string {
    const baseMessage = super.parseErrorMessage(error, options);
    return `[PREFIXED] ${baseMessage}`;
  }
}

// ==================== Test Case 2: Custom Detail Extraction ====================
/**
 * Exception that extracts specific fields from API errors
 */
interface ApiErrorDetails extends BaseExceptionDetails {
  endpoint?: string;
  method?: string;
  statusCode?: number;
  requestId?: string;
}

class ApiException extends BaseException<ApiErrorDetails> {
  protected static override parseErrorDetails<
    TDetails extends BaseExceptionDetails = ApiErrorDetails,
  >(
    error: unknown,
    options?: BaseExceptionOptions<TDetails>
  ): BaseExceptionDetails {
    const baseDetails = super.parseErrorDetails(error, options);
    // Extract API-specific fields
    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;
      return {
        ...baseDetails,
        endpoint: typeof err.url === 'string' ? err.url : undefined,
        method: typeof err.method === 'string' ? err.method : undefined,
        requestId:
          typeof err.requestId === 'string' ? err.requestId : undefined,
      };
    }

    return baseDetails;
  }
}

// ==================== Test Case 3: Complete Override ====================
/**
 * Exception that completely customizes the error creation process
 */
interface DatabaseErrorDetails extends BaseExceptionDetails {
  query?: string;
  table?: string;
  constraint?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

class DatabaseException extends BaseException<DatabaseErrorDetails> {
  protected static override createFromError<
    TDetails extends BaseExceptionDetails = DatabaseErrorDetails,
    T extends BaseException<TDetails> = BaseException<TDetails>,
  >(
    this: BaseExceptionConstructor<TDetails, T>,
    error: unknown,
    options?: BaseExceptionOptions<TDetails>
  ): T {
    // Custom logic: Check if it's a database error
    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;

      // Check for common database error patterns
      if (err.code === 'ER_DUP_ENTRY' || err.code === 'SQLITE_CONSTRAINT') {
        const message = 'Database constraint violation';
        return new this(message, {
          ...options,
          code: 'DB_CONSTRAINT_ERROR',
          statusCode: 409,
          details: {
            ...options?.details,
            constraint:
              typeof err.constraint === 'string' ? err.constraint : 'unknown',
            severity: 'high',
          } as unknown as TDetails,
          cause: error,
        });
      }
    }

    // Fall back to base implementation for other errors

    return super.createFromError(error, options) as T;
  }

  protected static override parseErrorMessage(
    error: unknown,
    options?: BaseExceptionOptions
  ): string {
    const message = super.parseErrorMessage(error, options);

    // Add database context to message
    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;
      if (typeof err.table === 'string') {
        return `${message} (table: ${err.table})`;
      }
    }

    return message;
  }
}

// ==================== Test Case 4: Multi-level Inheritance ====================
/**
 * Exception that extends another custom exception
 */
class PostgresException extends DatabaseException {
  protected static override parseErrorDetails<
    TDetails extends BaseExceptionDetails = DatabaseErrorDetails,
  >(
    error: unknown,
    options?: BaseExceptionOptions<TDetails>
  ): BaseExceptionDetails {
    const baseDetails = super.parseErrorDetails(error, options);

    // Add PostgreSQL-specific details
    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;

      return {
        ...baseDetails,
        // Map PostgreSQL error codes
        pgErrorCode: typeof err.code === 'string' ? err.code : undefined,
      };
    }

    return baseDetails;
  }
}

// ==================== Test Case 5: Validation Exception ====================
/**
 * Exception for validation errors with field-specific messages
 */
interface ValidationErrorDetails extends BaseExceptionDetails {
  field?: string;
  value?: unknown;
  rule?: string;
  errors?: Array<{ field: string; message: string }>;
}

class ValidationException extends BaseException<ValidationErrorDetails> {
  protected static override parseErrorMessage(
    error: unknown,
    options?: BaseExceptionOptions
  ): string {
    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;

      // Check if it's a validation error array
      if (Array.isArray(err.errors) && err.errors.length > 0) {
        const firstError = err.errors[0];
        if (typeof firstError === 'object' && firstError !== null) {
          const field = (firstError as Record<string, unknown>).field;
          const message = (firstError as Record<string, unknown>).message;
          if (typeof field === 'string' && typeof message === 'string') {
            return `Validation failed for ${field}: ${message}`;
          }
        }
      }
    }

    return super.parseErrorMessage(error, options);
  }

  protected static override parseErrorDetails<
    TDetails extends BaseExceptionDetails = ValidationErrorDetails,
  >(
    error: unknown,
    options?: BaseExceptionOptions<TDetails>
  ): BaseExceptionDetails {
    const baseDetails = super.parseErrorDetails(error, options);

    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;

      return {
        ...baseDetails,
        field: typeof err.field === 'string' ? err.field : undefined,
        value: err.value,
        rule: typeof err.rule === 'string' ? err.rule : undefined,
        errors: Array.isArray(err.errors)
          ? (err.errors as Array<{ field: string; message: string }>)
          : undefined,
      };
    }

    return baseDetails;
  }
}

// ==================== Test Case 6: Direct from() Override ====================
/**
 * Exception that overrides the from() method directly
 */
class CustomFromException extends BaseException {
  static override from<
    TDetails extends BaseExceptionDetails = BaseExceptionDetails,
    T extends BaseException<TDetails> = BaseException<TDetails>,
  >(
    this: new (message: string, options?: BaseExceptionOptions<TDetails>) => T,
    error: unknown,
    options?: BaseExceptionOptions<TDetails>
  ): T {
    // Custom logic before calling parent
    console.log('[CustomFromException] Processing error:', error);

    // Call parent implementation
    const exception = super.from(error, options);

    // Custom logic after
    if (!exception.code) {
      exception.code = 'CUSTOM_DEFAULT_CODE';
    }

    return exception as T;
  }
}

// ==================== Test Case 7: Completely Custom from() ====================
/**
 * Exception that completely replaces the from() method
 */
interface HttpErrorDetails extends BaseExceptionDetails {
  statusCode: number;
  path?: string;
  method?: string;
}

class HttpException extends BaseException<HttpErrorDetails> {
  static override from<
    TDetails extends BaseExceptionDetails = HttpErrorDetails,
    T extends BaseException<TDetails> = BaseException<TDetails>,
  >(
    this: new (message: string, options?: BaseExceptionOptions<TDetails>) => T,
    error: unknown,
    options?: BaseExceptionOptions<TDetails>
  ): T {
    // Completely custom implementation
    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;

      // Map HTTP status codes to messages
      const statusCode =
        typeof err.statusCode === 'number' ? err.statusCode : 500;
      const statusMessages: Record<number, string> = {
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        500: 'Internal Server Error',
      };

      const message =
        typeof err.message === 'string'
          ? err.message
          : statusMessages[statusCode] || 'HTTP Error';

      return new this(message, {
        ...options,
        code: `HTTP_${statusCode}`,
        statusCode,
        details: {
          ...options?.details,
          statusCode,
          path: typeof err.path === 'string' ? err.path : undefined,
          method: typeof err.method === 'string' ? err.method : undefined,
        } as unknown as TDetails,
        cause: error,
      });
    }

    // Fallback to parent for other error types
    return super.from(error, options) as T;
  }
}

// ==================== Tests ====================

describe('BaseException.from() Extensibility', () => {
  describe('Test Case 6: CustomFromException (Direct from() Override)', () => {
    test('should allow overriding from() method directly', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const error = new Error('Test error');
      const exception = CustomFromException.from(error);

      // Verify custom logic was executed
      expect(consoleSpy).toHaveBeenCalledWith(
        '[CustomFromException] Processing error:',
        error
      );

      // Verify default code was added
      expect(exception.code).toBe('CUSTOM_DEFAULT_CODE');
      expect(exception.message).toBe('Test error');
      expect(exception).toBeInstanceOf(CustomFromException);

      consoleSpy.mockRestore();
    });

    test('should preserve provided code when overriding from()', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const exception = CustomFromException.from('Error', {
        code: 'PROVIDED_CODE',
      });

      expect(exception.code).toBe('PROVIDED_CODE');

      consoleSpy.mockRestore();
    });
  });

  describe('Test Case 7: HttpException (Complete from() Replacement)', () => {
    test('should map HTTP status codes to messages', () => {
      const error = {
        statusCode: 404,
        path: '/api/users/123',
        method: 'GET',
      };

      const exception = HttpException.from(error);

      expect(exception.message).toBe('Not Found');
      expect(exception.code).toBe('HTTP_404');
      expect(exception.statusCode).toBe(404);
      expect(exception.details?.path).toBe('/api/users/123');
      expect(exception.details?.method).toBe('GET');
    });

    test('should handle custom messages', () => {
      const error = {
        message: 'User not authenticated',
        statusCode: 401,
      };

      const exception = HttpException.from(error);

      expect(exception.message).toBe('User not authenticated');
      expect(exception.code).toBe('HTTP_401');
      expect(exception.statusCode).toBe(401);
    });

    test('should handle unknown status codes', () => {
      const error = {
        statusCode: 418,
        message: "I'm a teapot",
      };

      const exception = HttpException.from(error);

      expect(exception.message).toBe("I'm a teapot");
      expect(exception.code).toBe('HTTP_418');
      expect(exception.statusCode).toBe(418);
    });

    test('should fallback for non-object errors', () => {
      const exception = HttpException.from('Simple string error');

      expect(exception.message).toBe('Simple string error');
      expect(exception).toBeInstanceOf(HttpException);
    });
  });
});

// ==================== Tests ====================

describe('BaseException.from() Extensibility (Inheritance Cases)', () => {
  describe('Test Case 1: PrefixedException', () => {
    test('should add prefix to error messages', () => {
      const error = new Error('Something went wrong');
      const exception = PrefixedException.from(error);

      expect(exception.message).toBe('[PREFIXED] Something went wrong');
      expect(exception).toBeInstanceOf(PrefixedException);
      expect(exception).toBeInstanceOf(BaseException);
    });

    test('should add prefix to string errors', () => {
      const exception = PrefixedException.from('Simple error');

      expect(exception.message).toBe('[PREFIXED] Simple error');
    });

    test('should preserve other properties', () => {
      const error = new Error('Test error');
      const details: BaseExceptionDetails = { extra: 'data' };
      const exception = PrefixedException.from(error, {
        code: 'TEST_CODE',
        statusCode: 400,
        details,
      });

      expect(exception.message).toBe('[PREFIXED] Test error');
      expect(exception.code).toBe('TEST_CODE');
      expect(exception.statusCode).toBe(400);

      expect((exception.details as any)?.extra).toBe('data');
    });
  });

  describe('Test Case 2: ApiException', () => {
    test('should extract API-specific fields', () => {
      const apiError = {
        message: 'Request failed',
        url: '/api/users',
        method: 'POST',
        statusCode: 404,
        requestId: 'req-123',
      };

      const exception = ApiException.from(apiError);

      expect(exception.message).toBe('Request failed');
      expect(exception.details?.endpoint).toBe('/api/users');
      expect(exception.details?.method).toBe('POST');
      expect(exception.details?.requestId).toBe('req-123');
    });

    test('should handle errors without API fields', () => {
      const exception = ApiException.from('Generic error');

      expect(exception.message).toBe('Generic error');
      expect(exception.details?.endpoint).toBeUndefined();
    });
  });

  describe('Test Case 3: DatabaseException', () => {
    test('should handle database constraint errors', () => {
      const dbError = {
        message: 'Duplicate entry',
        code: 'ER_DUP_ENTRY',
        constraint: 'unique_email',
        table: 'users',
      };

      const exception = DatabaseException.from(dbError);

      expect(exception.message).toBe(
        'Database constraint violation (table: users)'
      );
      expect(exception.code).toBe('DB_CONSTRAINT_ERROR');
      expect(exception.statusCode).toBe(409);
      expect(exception.details?.constraint).toBe('unique_email');
      expect(exception.details?.severity).toBe('high');
    });

    test('should fall back to base implementation for non-constraint errors', () => {
      const dbError = {
        message: 'Connection timeout',
        code: 'ER_TIMEOUT',
        table: 'products',
      };

      const exception = DatabaseException.from(dbError);

      expect(exception.message).toBe('Connection timeout (table: products)');
      expect(exception.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Test Case 4: PostgresException', () => {
    test('should inherit DatabaseException behavior and add Postgres details', () => {
      const pgError = {
        message: 'Unique violation',
        code: '23505',
        constraint: 'users_email_key',
        table: 'users',
      };

      const exception = PostgresException.from(pgError);

      expect(exception).toBeInstanceOf(PostgresException);
      expect(exception).toBeInstanceOf(DatabaseException);
      expect(exception).toBeInstanceOf(BaseException);
      // pgErrorCode is added dynamically
      expect((exception.details as Record<string, unknown>)?.pgErrorCode).toBe(
        '23505'
      );
    });
  });

  describe('Test Case 5: ValidationException', () => {
    test('should extract validation error details', () => {
      const validationError = {
        errors: [
          { field: 'email', message: 'Invalid email format' },
          { field: 'password', message: 'Too short' },
        ],
      };

      const exception = ValidationException.from(validationError);

      expect(exception.message).toBe(
        'Validation failed for email: Invalid email format'
      );
      expect(exception.details?.errors).toHaveLength(2);
      expect(exception.details?.errors?.[0].field).toBe('email');
    });

    test('should handle single field validation error', () => {
      const validationError = {
        field: 'username',
        message: 'Username already exists',
        rule: 'unique',
        value: 'john_doe',
      };

      const exception = ValidationException.from(validationError);

      expect(exception.message).toBe('Username already exists');
      expect(exception.details?.field).toBe('username');
      expect(exception.details?.rule).toBe('unique');
      expect(exception.details?.value).toBe('john_doe');
    });
  });

  describe('Edge Cases and Type Safety', () => {
    test('should maintain type safety with custom details', () => {
      const error = { message: 'Test', url: '/test', method: 'GET' };
      const exception = ApiException.from(error);

      // TypeScript should allow accessing ApiErrorDetails properties
      expect(exception.details?.endpoint).toBe('/test');
      expect(exception.details?.method).toBe('GET');

      // This should not cause runtime errors
      const json = exception.toJSON();
      expect(json.details).toBeDefined();
    });

    test('should handle null and undefined errors', () => {
      const exception1 = BaseException.from(null);
      const exception2 = BaseException.from(undefined);

      expect(exception1.message).toBe('Unknown Error');
      expect(exception2.message).toBe('Unknown Error');
    });

    test('should not have TypeScript errors when extending methods', () => {
      // This test verifies that the code compiles without @ts-ignore or @ts-expect-error
      // If this compiles, the extensibility is working correctly

      class CustomException extends BaseException {
        protected static override parseErrorMessage(
          error: unknown,
          options?: BaseExceptionOptions
        ): string {
          return `Custom: ${super.parseErrorMessage(error, options)}`;
        }
      }

      const exception = CustomException.from('test');
      expect(exception.message).toBe('Custom: test');
      expect(exception).toBeInstanceOf(CustomException);
    });

    test('should handle already-instantiated exceptions', () => {
      const original = new PrefixedException('Original error');
      const fromExisting = PrefixedException.from(original, {
        code: 'NEW_CODE',
      });

      expect(fromExisting).toBe(original); // Should be the same instance
      expect(fromExisting.code).toBe('NEW_CODE');
      expect(fromExisting.message).toBe('[PREFIXED] Original error'); // Message shouldn't be re-prefixed
    });

    test('should correctly identify serialized subclasses using isBaseException', () => {
      class PaymentException extends BaseException {
        // Custom name
      }
      const ex = new PaymentException('Payment failed');
      const serialized = JSON.parse(JSON.stringify(ex)); // Simulate network transfer
      // Before the fix, this would fail because name is 'PaymentException' != 'BaseException'
      expect(BaseException.isBaseException(serialized)).toBe(true);
    });
  });

  describe('Integration with other BaseException methods', () => {
    test('should work with toJSON()', () => {
      const error = {
        message: 'API Error',
        url: '/api/test',
        method: 'POST',
      };

      const exception = ApiException.from(error);
      const json = exception.toJSON({ stack: false });

      expect(json.message).toBe('API Error');
      expect(json.details).toBeDefined();
      // @ts-expect-error - accessing dynamic detail
      expect(json.details?.endpoint).toBe('/api/test');
    });

    test('should work with toString()', () => {
      const exception = DatabaseException.from({
        message: 'Query failed',
        code: 'ER_SYNTAX',
        table: 'users',
      });

      const str = exception.toString();
      expect(str).toContain('DatabaseException');
      expect(str).toContain('Query failed (table: users)');
    });

    test('should work with static methods like tryCatch', async () => {
      const [error, result] = await ApiException.tryCatch(async () => {
        throw { message: 'Failed', url: '/api/users', method: 'GET' };
      });

      expect(error).toBeInstanceOf(ApiException);
      expect(result).toBeNull();
      expect(error?.details?.endpoint).toBe('/api/users');
    });
  });
});
