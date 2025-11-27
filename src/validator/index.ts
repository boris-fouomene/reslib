import 'reflect-metadata';
import { ArrayOf, ensureRulesRegistered, OneOf } from './rules';
import { Validator } from './validator';
// Ensure rules are loaded
ensureRulesRegistered();
export * from './rules';
export * from './types';
export * from './validator';

class Address {
  street: string = '';
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class User {
  @ArrayOf(['Array', 'ArrayAllNumbers'])
  @OneOf([
    'NonNullString',
    { MinLength: [10] },
    Validator.validateNested<typeof Address>(Address),
  ])
  address: Address = new Address();
}
