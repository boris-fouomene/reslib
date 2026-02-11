import { Currency } from '@/currency/types';
import { I18n } from '@/i18n';
import { Dictionary } from '@/types';
import { defaultStr } from '@utils/defaultStr';
import { isNonNullString } from '@utils/isNonNullString';
import { extendObj, isObj } from '@utils/object';
import 'reflect-metadata';
import { countries } from './countries';
import { Countries, Country, CountryCode } from './types';
const countriesByDialCodes = {};
Object.keys(countries).map((countryCode) => {
  const country = countries[countryCode as CountryCode];
  (countriesByDialCodes as Dictionary)[country.dialCode] = country.code;
});

export * from './types';

/**
 * Class representing a collection of countries with their associated properties.
 *
 * @example
 * ```typescript
 * CountryRegistry.setCountry({
 *   code: 'US',
 *   dialCode: '+1',
 *   phoneNumberExample: '(123) 456-7890',
 *   flag: '🇺🇸'
 * });
 *
 * const usCountry = CountryRegistry.getCountry('US');
 * console.log(usCountry); // { code: 'US', dialCode: '+1', phoneNumberExample: '(123) 456-7890', flag: '🇺🇸' }
 * ```
 */
export class CountryRegistry {
  private static readonly registryMetaData = Symbol('countries:registry');

  private static get registry(): Countries {
    return Object.assign(
      {},
      Reflect.getMetadata(CountryRegistry.registryMetaData, CountryRegistry)
    );
  }

  private static set registry(countries: Partial<Countries>) {
    Reflect.defineMetadata(
      CountryRegistry.registryMetaData,
      countries,
      CountryRegistry
    );
  }

  /**
   * Checks if a given country object is valid.
   *
   * A country object is considered valid if it is an object and has a non-null string code.
   *
   * @param {Country} country The country object to check.
   * @returns {boolean} True if the country object is valid, false otherwise.
   *
   * @example
   * ```typescript
   * const country: Country = {
   *   code: 'US',
   *   dialCode: '+1',
   *   phoneNumberExample: '(123) 456-7890',
   *   flag: '🇺🇸'
   * };
   * console.log(CountryRegistry.isValid(country)); // true
   * ```
   */
  static isValid(country: unknown): country is Country {
    return isObj(country) && isNonNullString(country.code);
  }

  /**
   * Gets the phone number example for a given country code.
   *
   * @param {CountryCode} code The country code.
   * @returns {string} The phone number example for the given country code, or an empty string if the country code is not found.
   *
   * @example
   * ```typescript
   * console.log(CountryRegistry.getPhoneNumberExample('US')); // '(123) 456-7890'
   * ```
   */
  static getPhoneNumberExample(code: CountryCode): string {
    return defaultStr(CountryRegistry.getCountry(code)?.phoneNumberExample);
  }

  /**
   * Gets the flag for a given country code.
   *
   * @param {CountryCode} code The country code.
   * @returns {string} The flag for the given country code, or an empty string if the country code is not found.
   *
   * @example
   * ```typescript
   * console.log(CountryRegistry.getFlag('US')); // '🇺🇸'
   * ```
   */
  static getFlag(code: CountryCode): string {
    return defaultStr(CountryRegistry.getCountry(code)?.flag);
  }

  /**
   * Gets the currency for a given country code.
   *
   * @param {CountryCode} code The country code.
   * @returns {Currency | undefined} The currency for the given country code, or undefined if the country code is not found.
   *
   * @example
   * ```typescript
   * console.log(CountryRegistry.getCurrency('US')); // { code: 'USD', symbol: '$' }
   * ```
   */
  static getCurrency(code: CountryCode): Currency | undefined {
    return CountryRegistry.getCountry(code)?.currency;
  }

  /**
   * Sets a country object in the internal record.
   *
   * The country object must be valid (i.e., it must be an object with a non-null string code).
   *
   * @param {Country} country The country object to set.
   *
   * @example
   * ```typescript
   * CountryRegistry.setCountry({
   *   code: 'US',
   *   dialCode: '+1',
   *   phoneNumberExample: '(123) 456-7890',
   *   flag: '🇺🇸'
   * });
   * ```
   */
  static setCountry(country: Country): void {
    if (CountryRegistry.isValid(country)) {
      const registry = CountryRegistry.registry;
      registry[country.code] = country;
      CountryRegistry.registry = registry;
    }
  }

  /**
   * Retrieves a country object by its country code.
   *
   * If the provided code is not a non-null string, it returns undefined.
   *
   * @param {CountryCode} code The country code to look up.
   * @returns {Country | undefined} The country object associated with the given code, or undefined if not found.
   *
   * @example
   * ```typescript
   * i18n.registerTranslations({
   *   fr : {
   *    countries : {
   *     US : {name : 'Etats Unis'}
   *  },
   * en : {
   *   countries : {name:'United States'}
   * }
   *  }
   * })
   * const country = CountryRegistry.getCountry('US');
   * console.log(country); // { code: 'US', dialCode: '+1', phoneNumberExample: '(123) 456-7890', flag: '🇺🇸' }
   * ```
   */
  static getCountry(code: CountryCode): Country | undefined {
    if (!isNonNullString(code)) return undefined;
    const i18nCountry = I18n.getInstance().get<Partial<Country>>(
      `countries.${code}`
    );
    const registeredCountry = CountryRegistry.registry[code];
    if (!isObj(i18nCountry) && !isObj(registeredCountry)) {
      return undefined;
    }
    return extendObj<Country>({}, i18nCountry, registeredCountry);
  }

  /**
   * Retrieves all countries stored in the internal record.
   *
   * @returns {Countries} A record of all countries, where each key is a country code and each value is an Country object.
   *
   * @example
   * ```typescript
   * const allCountries = CountryRegistry.getCountries();
   * console.log(allCountries); // { 'US': { code: 'US', ... }, ... }
   * ```
   */
  static getCountries(): Countries {
    const i18nCountries =
      I18n.getInstance().get<Partial<Countries>>('countries');
    return extendObj(
      {},
      countries,
      isObj(i18nCountries) ? i18nCountries : {},
      CountryRegistry.registry
    );
  }

  /**
   * Sets multiple countries in the internal record.
   *
   * This method merges the provided countries with the existing ones in the internal record.
   *
   * If the provided countries object is not an object, it returns the current internal record of countries.
   *
   * @param {Partial<Countries>} countries A partial record of countries to set.
   * @returns {void}
   *
   * @example
   * ```typescript
   * CountryRegistry.setCountries({
   *   'US': {
   *     code: 'US',
   *     dialCode: '+1',
   *     phoneNumberExample: '(123) 456-7890',
   *     flag: '🇺🇸'
   *   },
   *   'CA': {
   *     code: 'CA',
   *     dialCode: '+1',
   *     phoneNumberExample: '(123) 456-7890',
   *     flag: '🇨🇦'
   *   }
   * });
   * ```
   */
  static setCountries(
    countries: Partial<{ [key in CountryCode]: Country }>
  ): void {
    if (!isObj(countries)) return;
    const registry: Countries = CountryRegistry.registry;
    for (const countryCode in countries) {
      const country = countries[countryCode as CountryCode];
      if (CountryRegistry.isValid(country)) {
        registry[countryCode as CountryCode] = extendObj(
          {},
          registry[countryCode as CountryCode],
          country
        );
      }
    }
    CountryRegistry.registry = registry;
  }
}
