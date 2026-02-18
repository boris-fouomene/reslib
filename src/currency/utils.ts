import { Currency } from './types';

/**
 *
 * Checks if the provided object is a valid currency object.
 * A valid currency object must be a non-null object with the following properties:
 * - `name`: A string representing the name of the currency.
 * - `symbol`: A string representing the symbol of the currency.
 *
 * @param {unknown} obj - The object to be validated as a currency.
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

export const isCurrency = (obj: unknown): obj is Currency =>
  (obj as Currency) !== null &&
  (obj as Currency) !== undefined &&
  typeof obj === 'object' &&
  !Array.isArray(obj) &&
  (obj as Currency).name !== null &&
  (obj as Currency).name !== undefined &&
  typeof (obj as Currency).name === 'string' &&
  (obj as Currency).symbol !== null &&
  (obj as Currency).symbol !== undefined &&
  typeof (obj as Currency).symbol === 'string';
