import { BaseException } from '@/exception';

export class AuthError extends BaseException {
  name = 'AuthError';
}
