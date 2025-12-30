import { BaseException } from '@/exception';

/**
 * Error thrown when authentication fails.
 * Used for invalid credentials, missing users, etc.
 */
export class AuthError extends BaseException {
  name = 'AuthError';
}
