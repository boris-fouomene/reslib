import { Currency } from './types';

/**
 *
 * Checks if the provided object is a valid currency object.
 * A valid currency object must be a non-null object with the following properties:
 * - `name`: A string representing the name of the currency.
 * - `symbol`: A string representing the symbol of the currency.
 *
 * @param {any} obj - The object to be validated as a currency.
 * @returns {boolean} Returns `true` if the object is a valid currency, otherwise `false`.
 *
 * @example
 * const usd = { name: "US Dollar", symbol: "$" };
 * console.log(isCurrency(usd)); // Output: true
 *
 * const invalidCurrency = { name: "Invalid Currency" };
 * console.log(isCurrency(invalidCurrency)); // Output: false
 *
 * const notAnObject = "Not an object";
 * console.log(isCurrency(notAnObject)); // Output: false
 *
 * const arrayInput = ["$"];
 * console.log(isCurrency(arrayInput)); // Output: false
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isCurrency = (obj: any): obj is Currency =>
  obj &&
  typeof obj === 'object' &&
  !Array.isArray(obj) &&
  obj.name &&
  typeof obj.name === 'string' &&
  obj.symbol &&
  typeof obj.symbol === 'string';
