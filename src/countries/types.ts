import { Currency } from '@/currency/types';
/**
 * @typedef CountryCode
 *
 * Represents the unique ISO 3166-1 alpha-2 code for a country.
 *
 * This type is derived from the keys of the `Countries` interface, ensuring that
 * any value of type `CountryCode` corresponds to a defined country in the system.
 *
 * It is used throughout the application to identify countries in a standardized format.
 *
 * @example
 * // Valid country codes
 * const us: CountryCode = 'US';
 * const fr: CountryCode = 'FR';
 * const in: CountryCode = 'IN';
 *
 * // Invalid country code (if not defined in Countries)
 * // const mars: CountryCode = 'MARS'; // Error
 *
 * @see {@link Countries} for the map of available countries.
 */
export type CountryCode = keyof Countries;

/**
 * Interface representing a country with its associated properties.
 *
 * @example
 * ```typescript
 * const country: Country = {
 *   code: 'US',
 *   dialCode: '+1',
 *   phoneNumberExample: '(123) 456-7890',
 *   flag: '🇺🇸'
 * };
 * ```
 */
export interface Country {
  /**
   * The unique code of the country.
   *
   * @type {CountryCode}
   * @example 'US'
   */
  code: CountryCode;

  /***
   * The name of the country.
   */
  name: string;

  /****
   * The currency of the country.
   */
  currency?: Currency;

  /**
   * The dial code of the country.
   *
   * @type {string}
   * @example '+1'
   */
  dialCode: string;

  /**
   * An example of a phone number in the country.
   *
   * @type {string}
   * @example '(123) 456-7890'
   */
  phoneNumberExample?: string;

  /**
   * The flag of the country (optional).
   * This string can be a Unicode emoji, or a data URI or a URL to an image file.
   *
   * @type {string}
   * @optional
   * @example '🇺🇸'
   */
  flag?: string;

  /**
   * The priority of the country in relation to its dial code.
   *
   * This property is specifically used to resolve ambiguity when multiple countries share the same `dialCode`
   * (e.g., +1 is used by the US, Canada, and various Caribbean nations).
   *
   * A lower value (typically 0) indicates a higher priority, meaning this country is the "default" or most likely
   * choice for that dial code.
   *
   * This name is specific to avoid confusion with other types of "priority" or "ordering" that might be added via augmentation.
   *
   * @type {number}
   * @optional
   * @example 0
   */
  dialCodePriority?: number;
}

/**
 * Interface representing the collection of all available countries.
 *
 * This interface serves as a registry for all supported countries.
 * It can be augmented by external modules to add new countries or modify existing ones.
 *
 * @example
 * // Augmenting the Countries interface to add a new country
 * // In your custom type definition file (e.g., countries.d.ts):
 *
 * import { Country } from 'reslib/countries';
 *
 * declare module 'reslib/countries' {
 *   export interface Countries {
 *     // Adding a new country with code 'XX'
 *     XX: Country;
 *   }
 * }
 *
 * // Now you can use 'XX' as a valid CountryCode
 * const myCountryCode: CountryCode = 'XX';
 */
export interface Countries {
  AF: Country;
  AL: Country;
  DZ: Country;
  AS: Country;
  AD: Country;
  AO: Country;
  AI: Country;
  AG: Country;
  AR: Country;
  AM: Country;
  AW: Country;
  AU: Country;
  AT: Country;
  AZ: Country;
  BS: Country;
  BH: Country;
  BD: Country;
  BB: Country;
  BY: Country;
  BE: Country;
  BZ: Country;
  BJ: Country;
  BM: Country;
  BT: Country;
  BO: Country;
  BA: Country;
  BW: Country;
  BR: Country;
  IO: Country;
  VG: Country;
  BN: Country;
  BG: Country;
  BF: Country;
  BI: Country;
  KH: Country;
  CM: Country;
  CA: Country;
  CV: Country;
  BQ: Country;
  KY: Country;
  CF: Country;
  TD: Country;
  CL: Country;
  CN: Country;
  CX: Country;
  CC: Country;
  CO: Country;
  KM: Country;
  CD: Country;
  CG: Country;
  CK: Country;
  CR: Country;
  CI: Country;
  HR: Country;
  CU: Country;
  CW: Country;
  CY: Country;
  CZ: Country;
  DK: Country;
  DJ: Country;
  DM: Country;
  DO: Country;
  EC: Country;
  EG: Country;
  SV: Country;
  GQ: Country;
  ER: Country;
  EE: Country;
  ET: Country;
  FK: Country;
  FO: Country;
  FJ: Country;
  FI: Country;
  FR: Country;
  GF: Country;
  PF: Country;
  GA: Country;
  GM: Country;
  GE: Country;
  DE: Country;
  GH: Country;
  GI: Country;
  GR: Country;
  GL: Country;
  GD: Country;
  GP: Country;
  GU: Country;
  GT: Country;
  GG: Country;
  GN: Country;
  GW: Country;
  GY: Country;
  HT: Country;
  HN: Country;
  HK: Country;
  HU: Country;
  IS: Country;
  IN: Country;
  ID: Country;
  IR: Country;
  IQ: Country;
  IE: Country;
  IM: Country;
  IL: Country;
  IT: Country;
  JM: Country;
  JP: Country;
  JE: Country;
  JO: Country;
  KZ: Country;
  KE: Country;
  KI: Country;
  KW: Country;
  KG: Country;
  LA: Country;
  LV: Country;
  LB: Country;
  LS: Country;
  LR: Country;
  LY: Country;
  LI: Country;
  LT: Country;
  LU: Country;
  MO: Country;
  MK: Country;
  MG: Country;
  MW: Country;
  MY: Country;
  MV: Country;
  ML: Country;
  MT: Country;
  MH: Country;
  MQ: Country;
  MR: Country;
  MU: Country;
  YT: Country;
  MX: Country;
  FM: Country;
  MD: Country;
  MC: Country;
  MN: Country;
  ME: Country;
  MS: Country;
  MA: Country;
  MZ: Country;
  MM: Country;
  NA: Country;
  NR: Country;
  NP: Country;
  NL: Country;
  NC: Country;
  NZ: Country;
  NI: Country;
  NE: Country;
  NG: Country;
  NU: Country;
  NF: Country;
  KP: Country;
  MP: Country;
  NO: Country;
  OM: Country;
  PK: Country;
  PW: Country;
  PS: Country;
  PA: Country;
  PG: Country;
  PY: Country;
  PE: Country;
  PH: Country;
  PL: Country;
  PT: Country;
  PR: Country;
  QA: Country;
  RE: Country;
  RO: Country;
  RU: Country;
  RW: Country;
  BL: Country;
  SH: Country;
  KN: Country;
  LC: Country;
  MF: Country;
  PM: Country;
  VC: Country;
  WS: Country;
  SM: Country;
  ST: Country;
  SA: Country;
  SN: Country;
  RS: Country;
  SC: Country;
  SL: Country;
  SG: Country;
  SX: Country;
  SK: Country;
  SI: Country;
  SB: Country;
  SO: Country;
  ZA: Country;
  KR: Country;
  SS: Country;
  ES: Country;
  LK: Country;
  SD: Country;
  SR: Country;
  SJ: Country;
  SZ: Country;
  SE: Country;
  CH: Country;
  SY: Country;
  TW: Country;
  TJ: Country;
  TZ: Country;
  TH: Country;
  TL: Country;
  TG: Country;
  TK: Country;
  TO: Country;
  TT: Country;
  TN: Country;
  TR: Country;
  TM: Country;
  TC: Country;
  TV: Country;
  VI: Country;
  UG: Country;
  UA: Country;
  AE: Country;
  GB: Country;
  US: Country;
  UY: Country;
  UZ: Country;
  VU: Country;
  VA: Country;
  VE: Country;
  VN: Country;
  WF: Country;
  EH: Country;
  YE: Country;
  ZM: Country;
  ZW: Country;
  AX: Country;
}
