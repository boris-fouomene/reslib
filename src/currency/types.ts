/**
 * @interface Currency
 *
 * Represents a currency with its associated properties for formatting and display.
 *
 * This type provides essential details about a currency, including its symbol,
 * name, formatting options, and how it should be displayed. It is useful for
 * applications that require currency management, such as financial applications,
 * e-commerce platforms, and accounting software.
 *
 * @example
 * // Example of a currency object for US Dollar
 * const usd: Currency = {
 *   symbol: "$",
 *   name: "United States Dollar",
 *   symbolNative: "$",
 *   decimalDigits: 2,
 *   rounding: 2,
 *   code: "USD",
 *   namePlural: "US dollars",
 *   format: "%v %s", // Displays value followed by the symbol
 *   decimalSeparator: ".",
 *   thousandSeparator: ","
 * };
 */
export type Currency = {
  /**
   * The symbol of the currency (e.g., "$", "FCFA").
   *
   * Represents the visual symbol used to denote the currency.
   *
   * @example
   * `$` or `FCFA`
   */
  symbol?: string;

  /**
   * The full name of the currency (e.g., "Euro", "United States Dollar").
   *
   * Provides the complete name for the currency as it is recognized globally.
   *
   * @example
   * `Euro`
   */
  name?: string;

  /**
   * The native symbol of the currency (e.g., "€" for Euro).
   *
   * This symbol may differ from the standard currency symbol and is used in
   * the currency's country of origin.
   *
   * @example
   * `€`
   */
  symbolNative?: string;

  /**
   * The number of decimal places for the currency (e.g., 2 for most currencies, 0 for some).
   *
   * Indicates how many decimal places are used when displaying the currency amount.
   *
   * @example
   * `2`
   */
  decimalDigits?: number;

  /**
   * The rounding value for the currency (e.g., 2 for rounding to 2 decimal places).
   *
   * Specifies how the currency amounts should be rounded.
   *
   * @example
   * `2`
   */
  rounding?: number;

  /**
   * The ISO 4217 code for the currency (e.g., "USD" for United States Dollar).
   *
   * This code is used internationally to represent currencies in a standardized format.
   *
   * @example
   * `USD`
   */
  code?: string;

  /**
   * The plural name of the currency (e.g., "US dollars").
   *
   * Used for indicating the currency when referring to multiple units.
   *
   * @example
   * `US dollars`
   */
  namePlural?: string;

  /**
   * The display format for the currency (e.g., `%v %s` for "123.45 USD").
   *
   * This optional property defines how the currency value is formatted when displayed.
   *
   * @example
   * `%v %s` // Value followed by symbol
   */
  format?: string;

  /**
   * The decimal separator for the currency (e.g., "." for most currencies).
   *
   * Specifies the character used to separate the integer part from the fractional part
   * of a currency amount.
   *
   * @example
   * `.`
   */
  decimalSeparator?: string;

  /**
   * The thousands separator for the currency (e.g., " " for some European currencies).
   *
   * Indicates the character used to group thousands in large numbers for improved readability.
   *
   * @example
   * ` `
   */
  thousandSeparator?: string;
};

/**
 * 
 * @interface CurrencyFormatter
 * Dynamically formats a number into a string based on currency properties (like symbol and decimal places)
 * retrieved from a predefined currency object.
 *
 * This function does **not** require passing the currency details manually; instead, it retrieves them
 * automatically based on the dynamically generated formatter (e.g., `formatUSD`).
 *
 * @param decimalDigits - (Optional) The number of decimal digits to include. If not provided, the function will default to the currency's predefined decimal digits.
 * @param thousandSeparator - (Optional) The character used as a thousand separator. If not provided, defaults to ','.
 * @param decimalSeparator - (Optional) The character used as a decimal separator. If not provided, defaults to '.'.
 * @param format - (Optional) A format string where `%s` is replaced with the currency symbol and `%v` with the formatted value. If not provided, defaults to the currency's format.
 * 
 * @returns The formatted string representation of the number based on the currency settings.
 *
 * @example
 * // Formatting in US dollars, pulling currency data from the internal USD object:
 * const formattedUSD = (123456.789).formatUSD();
 * // Result: "$123,456.79"
 * 
 * @example
 * // Formatting in Canadian dollars with a custom separator and decimal places:
 * const formattedCAD = (123456.789).formatCAD(3, '.', ',');
 * // Result: "CA$123.456,789"
 * 
 * @example
 * // Custom format using Euro currency (retrieved from EUR object):
 * const formattedEUR = (123456.789).formatEUR(2, ' ', ',', '%v %s');
 * // Result: "123 456,79 €"
 * @description 
 * How the Dynamic Formatter Works
 * In this story, imagine you're setting up a formatter for currencies, but you don't need to pass the currency details every time. The function, let's say formatUSD, magically knows how US dollars should be formatted because it retrieves the currency details (like symbol, decimal digits, and format) from an internal object that has already defined them.
 * You, the developer, simply call the formatter like this:
 * ```ts
 *  const formattedUSD = (123456.789).formatUSD();
    console.log(formattedUSD); // "$123,456.79"
    // Assuming `formatUSD` and `formatEUR` are dynamically created functions based on a currency object

    // Basic usage with USD defaults
    const result1 = formatUSD(123456.789); 
    console.log(result1); // Output: "$123,456.79"

    // Custom decimal digits and separators for USD
    const result2 = formatUSD(123456.789, 3, '.', ',');
    console.log(result2); // Output: "$123.456,789"

    // Using a custom format string for EUR
    const result3 = formatEUR(123456.789, 2, ',', '.', '%v %s');
    console.log(result3); // Output: "123,456.79 €"
 * ```
 */
export type CurrencyFormatter = (
  decimalDigits?: number,
  thousandSeparator?: string,
  decimalSeparator?: string,
  format?: string
) => string;

/**
 *
 * @interface
 * A string template type representing the dynamic formatter function names.
 *
 * This type constructs the keys for the formatter functions by combining the `format` prefix
 * with the currency codes from the `currencies` object (e.g., `formatUSD`, `formatCAD`).
 *
 * The currency codes are derived dynamically from the keys of the `currencies` object, ensuring
 * that the formatters correspond to the available currencies.
 *
 * @example
 * // If `currencies` contains { USD, CAD, EUR }, the keys will be:
 * // 'formatUSD', 'formatCAD', 'formatEUR'
 */
export type CurrencyFormatName = `format${CurrencyCode}`;

/**
 *
 * Represents a string template type for dynamically generating keys for abbreviated currency formatters.
 *
 * The `CurrencyAbbreviateFormatName` type constructs keys by combining the `abreviate2Format` prefix
 * with the keys of the `Currencies` interface. This allows for the creation of dynamic formatter keys
 * specific to each currency.
 *
 * @template CurrencyCode - The keys of the `Currencies` interface, representing ISO currency codes.
 *
 * @example
 * ```typescript
 * // Assuming the `Currencies` interface contains the following keys:
 * // { USD, CAD, EUR }
 *
 * type AbbreviatedFormatKeys = CurrencyAbbreviateFormatName;
 *
 * // The resulting type will include:
 * // 'abreviate2FormatUSD', 'abreviate2FormatCAD', 'abreviate2FormatEUR'
 *
 * const formatKey: CurrencyAbbreviateFormatName = "abreviate2FormatUSD";
 * console.log(formatKey); // Output: "abreviate2FormatUSD"
 * ```
 *
 * @remarks
 * - This type is useful for defining dynamic keys for currency-specific formatting functions.
 * - It ensures that the keys are consistent with the currencies defined in the `Currencies` interface.
 *
 * @see {@link Currencies} for the structure of the currencies interface.
 * @see {@link CurrencyFormatName} for a similar type used for general currency formatters.
 */
export type CurrencyAbbreviateFormatName = `abreviate2Format${CurrencyCode}`;

/**
 *
 * Represents a collection of dynamically generated currency formatter functions.
 *
 * Each key is a string formed by combining the `format` prefix with a currency code
 * (e.g., `formatUSD`, `formatCAD`), and the value is a function that formats numbers
 * according to the respective currency's settings (e.g., symbol, decimal digits).
 *
 * The formatters automatically retrieve currency properties (like symbols, decimal places, etc.)
 * from the `currencies` object.
 *
 * @example
 * // Assuming the `currencies` object contains USD and CAD:
 * const formatters: CurrencyFormatters = {
 *   formatUSD: (value) => `$${value.toFixed(2)}`,
 *   formatCAD: (value) => `CA$${value.toFixed(2)}`,
 *
 * };
 *
 * // Usage of the dynamically generated formatters:
 * const formattedUSD = formatters.formatUSD(123456.789);
 * console.log(formattedUSD); // Output: "$123,456.79"
 *
 * const formattedCAD = formatters.formatCAD(123456.789);
 * console.log(formattedCAD); // Output: "CA$123,456.79"
 */
export type CurrencyFormatters = Record<
  CurrencyFormatName | CurrencyAbbreviateFormatName,
  CurrencyFormatter
>;

/**
 * @interface Currencies
 * Represents a collection of currencies, with each currency identified by its ISO code.
 * Each currency is associated with the `Currency` interface, which defines its attributes such as symbol, name, and formatting options.
 * This interface allows for easy management of various currencies by providing a
 * centralized structure. Each currency is identified by its ISO 4217 code, and
 * contains detailed information such as symbol, name, and formatting options.
 * This is particularly useful in applications dealing with multiple currencies,
 * such as e-commerce platforms, financial applications, and accounting software.
 *
 * @example
 * // Example of an Currencies object containing multiple currencies
 * const currencies: Currencies = {
 *     USD: {
 *         symbol: "$",
 *         name: "United States Dollar",
 *         symbolNative: "$",
 *         decimalDigits: 2,
 *         rounding: 2,
 *         code: "USD",
 *         namePlural: "US dollars",
 *         format: "%v %s",
 *         decimalSeparator: ".",
 *         thousandSeparator: ","
 *     },
 *     CAD: {
 *         symbol: "CA$",
 *         name: "Canadian Dollar",
 *         symbolNative: "$",
 *         decimalDigits: 2,
 *         rounding: 2,
 *         code: "CAD",
 *         namePlural: "Canadian dollars",
 *         format: "%s %v",
 *         decimalSeparator: ".",
 *         thousandSeparator: ","
 *     },
 *     EUR: {
 *         symbol: "€",
 *         name: "Euro",
 *         symbolNative: "€",
 *         decimalDigits: 2,
 *         rounding: 0,
 *         code: "EUR",
 *         namePlural: "euros",
 *         format: "%s %v",
 *         decimalSeparator: ",",
 *         thousandSeparator: "."
 *     },
 *     // ... additional currencies
 * };
 */
export interface Currencies {
  /**
   * The United States Dollar (USD).
   *
   * @type {Currency}
   */
  USD: Currency;

  /**
   * The Canadian Dollar (CAD).
   *
   * @type {Currency}
   */
  CAD: Currency;

  /**
   * The Euro (EUR).
   *
   * @type {Currency}
   */
  EUR: Currency;

  /**
   * The United Arab Emirates Dirham (AED).
   *
   * @type {Currency}
   */
  AED: Currency;

  /**
   * The Afghan Afghani (AFN).
   *
   * @type {Currency}
   */
  AFN: Currency;

  /**
   * The Albanian Lek (ALL).
   *
   * @type {Currency}
   */
  ALL: Currency;

  /**
   * The Armenian Dram (AMD).
   *
   * @type {Currency}
   */
  AMD: Currency;

  /**
   * The Argentine Peso (ARS).
   *
   * @type {Currency}
   */
  ARS: Currency;

  /**
   * The Australian Dollar (AUD).
   *
   * @type {Currency}
   */
  AUD: Currency;

  /**
   * The Azerbaijani Manat (AZN).
   *
   * @type {Currency}
   */
  AZN: Currency;

  /**
   * The Bosnia and Herzegovina Convertible Mark (BAM).
   *
   * @type {Currency}
   */
  BAM: Currency;

  /**
   * The Bangladeshi Taka (BDT).
   *
   * @type {Currency}
   */
  BDT: Currency;

  /**
   * The Bulgarian Lev (BGN).
   *
   * @type {Currency}
   */
  BGN: Currency;

  /**
   * The Bahraini Dinar (BHD).
   *
   * @type {Currency}
   */
  BHD: Currency;

  /**
   * The Burundian Franc (BIF).
   *
   * @type {Currency}
   */
  BIF: Currency;

  /**
   * The Brunei Dollar (BND).
   *
   * @type {Currency}
   */
  BND: Currency;

  /**
   * The Bolivian Boliviano (BOB).
   *
   * @type {Currency}
   */
  BOB: Currency;

  /**
   * The Brazilian Real (BRL).
   *
   * @type {Currency}
   */
  BRL: Currency;

  /**
   * The Botswana Pula (BWP).
   *
   * @type {Currency}
   */
  BWP: Currency;

  /**
   * The Belarusian Ruble (BYR).
   *
   * @type {Currency}
   */
  BYR: Currency;

  /**
   * The Belize Dollar (BZD).
   *
   * @type {Currency}
   */
  BZD: Currency;

  /**
   * The Congolese Franc (CDF).
   *
   * @type {Currency}
   */
  CDF: Currency;

  /**
   * The Swiss Franc (CHF).
   *
   * @type {Currency}
   */
  CHF: Currency;

  /**
   * The Chilean Peso (CLP).
   *
   * @type {Currency}
   */
  CLP: Currency;

  /**
   * The Chinese Yuan Renminbi (CNY).
   *
   * @type {Currency}
   */
  CNY: Currency;

  /**
   * The Colombian Peso (COP).
   *
   * @type {Currency}
   */
  COP: Currency;

  /**
   * The Costa Rican Colón (CRC).
   *
   * @type {Currency}
   */
  CRC: Currency;

  /**
   * The Cape Verdean Escudo (CVE).
   *
   * @type {Currency}
   */
  CVE: Currency;

  /**
   * The Czech Koruna (CZK).
   *
   * @type {Currency}
   */
  CZK: Currency;

  /**
   * The Djiboutian Franc (DJF).
   *
   * @type {Currency}
   */
  DJF: Currency;

  /**
   * The Danish Krone (DKK).
   *
   * @type {Currency}
   */
  DKK: Currency;

  /**
   * The Dominican Peso (DOP).
   *
   * @type {Currency}
   */
  DOP: Currency;

  /**
   * The Algerian Dinar (DZD).
   *
   * @type {Currency}
   */
  DZD: Currency;

  /**
   * The Estonian Kroon (EEK).
   *
   * @type {Currency}
   */
  EEK: Currency;

  /**
   * The Egyptian Pound (EGP).
   *
   * @type {Currency}
   */
  EGP: Currency;

  /**
   * The Eritrean Nakfa (ERN).
   *
   * @type {Currency}
   */
  ERN: Currency;

  /**
   * The Ethiopian Birr (ETB).
   *
   * @type {Currency}
   */
  ETB: Currency;

  /**
   * The British Pound Sterling (GBP).
   *
   * @type {Currency}
   */
  GBP: Currency;

  /**
   * The Georgian Lari (GEL).
   *
   * @type {Currency}
   */
  GEL: Currency;

  /**
   * The Ghanaian Cedi (GHS).
   *
   * @type {Currency}
   */
  GHS: Currency;

  /**
   * The Guinean Franc (GNF).
   *
   * @type {Currency}
   */
  GNF: Currency;

  /**
   * The Guatemalan Quetzal (GTQ).
   *
   * @type {Currency}
   */
  GTQ: Currency;

  /**
   * The Hong Kong Dollar (HKD).
   *
   * @type {Currency}
   */
  HKD: Currency;

  /**
   * The Honduran Lempira (HNL).
   *
   * @type {Currency}
   */
  HNL: Currency;

  /**
   * The Croatian Kuna (HRK).
   *
   * @type {Currency}
   */
  HRK: Currency;

  /**
   * The Hungarian Forint (HUF).
   *
   * @type {Currency}
   */
  HUF: Currency;

  /**
   * The Indonesian Rupiah (IDR).
   *
   * @type {Currency}
   */
  IDR: Currency;

  /**
   * The Israeli New Shekel (ILS).
   *
   * @type {Currency}
   */
  ILS: Currency;

  /**
   * The Indian Rupee (INR).
   *
   * @type {Currency}
   */
  INR: Currency;

  /**
   * The Iraqi Dinar (IQD).
   *
   * @type {Currency}
   */
  IQD: Currency;

  /**
   * The Iranian Rial (IRR).
   *
   * @type {Currency}
   */
  IRR: Currency;

  /**
   * The Icelandic Króna (ISK).
   *
   * @type {Currency}
   */
  ISK: Currency;

  /**
   * The Jamaican Dollar (JMD).
   *
   * @type {Currency}
   */
  JMD: Currency;

  /**
   * The Jordanian Dinar (JOD).
   *
   * @type {Currency}
   */
  JOD: Currency;

  /**
   * The Japanese Yen (JPY).
   *
   * @type {Currency}
   */
  JPY: Currency;

  /**
   * The Kenyan Shilling (KES).
   *
   * @type {Currency}
   */
  KES: Currency;

  /**
   * The Cambodian Riel (KHR).
   *
   * @type {Currency}
   */
  KHR: Currency;

  /**
   * The Comorian Franc (KMF).
   *
   * @type {Currency}
   */
  KMF: Currency;

  /**
   * The South Korean Won (KRW).
   *
   * @type {Currency}
   */
  KRW: Currency;

  /**
   * The Kuwaiti Dinar (KWD).
   *
   * @type {Currency}
   */
  KWD: Currency;

  /**
   * The Kazakhstani Tenge (KZT).
   *
   * @type {Currency}
   */
  KZT: Currency;

  /**
   * The Lebanese Pound (LBP).
   *
   * @type {Currency}
   */
  LBP: Currency;

  /**
   * The Sri Lankan Rupee (LKR).
   *
   * @type {Currency}
   */
  LKR: Currency;

  /**
   * The Lithuanian Litas (LTL).
   *
   * @type {Currency}
   */
  LTL: Currency;

  /**
   * The Latvian Lats (LVL).
   *
   * @type {Currency}
   */
  LVL: Currency;

  /**
   * The Libyan Dinar (LYD).
   *
   * @type {Currency}
   */
  LYD: Currency;

  /**
   * The Moroccan Dirham (MAD).
   *
   * @type {Currency}
   */
  MAD: Currency;

  /**
   * The Moldovan Leu (MDL).
   *
   * @type {Currency}
   */
  MDL: Currency;

  /**
   * The Malagasy Ariary (MGA).
   *
   * @type {Currency}
   */
  MGA: Currency;

  /**
   * The Macedonian Denar (MKD).
   *
   * @type {Currency}
   */
  MKD: Currency;

  /**
   * The Myanmar Kyat (MMK).
   *
   * @type {Currency}
   */
  MMK: Currency;

  /**
   * The Macanese Pataca (MOP).
   *
   * @type {Currency}
   */
  MOP: Currency;

  /**
   * The Mauritian Rupee (MUR).
   *
   * @type {Currency}
   */
  MUR: Currency;

  /**
   * The Mexican Peso (MXN).
   *
   * @type {Currency}
   */
  MXN: Currency;

  /**
   * The Malaysian Ringgit (MYR).
   *
   * @type {Currency}
   */
  MYR: Currency;

  /**
   * The Mozambican Metical (MZN).
   *
   * @type {Currency}
   */
  MZN: Currency;

  /**
   * The Namibian Dollar (NAD).
   *
   * @type {Currency}
   */
  NAD: Currency;

  /**
   * The Nigerian Naira (NGN).
   *
   * @type {Currency}
   */
  NGN: Currency;

  /**
   * The Nicaraguan Córdoba (NIO).
   *
   * @type {Currency}
   */
  NIO: Currency;

  /**
   * The Norwegian Krone (NOK).
   *
   * @type {Currency}
   */
  NOK: Currency;

  /**
   * The Nepalese Rupee (NPR).
   *
   * @type {Currency}
   */
  NPR: Currency;

  /**
   * The New Zealand Dollar (NZD).
   *
   * @type {Currency}
   */
  NZD: Currency;

  /**
   * The Omani Rial (OMR).
   *
   * @type {Currency}
   */
  OMR: Currency;

  /**
   * The Panamanian Balboa (PAB).
   *
   * @type {Currency}
   */
  PAB: Currency;

  /**
   * The Peruvian Sol (PEN).
   *
   * @type {Currency}
   */
  PEN: Currency;

  /**
   * The Philippine Peso (PHP).
   *
   * @type {Currency}
   */
  PHP: Currency;

  /**
   * The Pakistani Rupee (PKR).
   *
   * @type {Currency}
   */
  PKR: Currency;

  /**
   * The Polish Zloty (PLN).
   *
   * @type {Currency}
   */
  PLN: Currency;

  /**
   * The Paraguayan Guarani (PYG).
   *
   * @type {Currency}
   */
  PYG: Currency;

  /**
   * The Qatari Rial (QAR).
   *
   * @type {Currency}
   */
  QAR: Currency;

  /**
   * The Romanian Leu (RON).
   *
   * @type {Currency}
   */
  RON: Currency;

  /**
   * The Serbian Dinar (RSD).
   *
   * @type {Currency}
   */
  RSD: Currency;

  /**
   * The Russian Ruble (RUB).
   *
   * @type {Currency}
   */
  RUB: Currency;

  /**
   * The Rwandan Franc (RWF).
   *
   * @type {Currency}
   */
  RWF: Currency;

  /**
   * The Saudi Riyal (SAR).
   *
   * @type {Currency}
   */
  SAR: Currency;

  /**
   * The Sudanese Pound (SDG).
   *
   * @type {Currency}
   */
  SDG: Currency;

  /**
   * The Swedish Krona (SEK).
   *
   * @type {Currency}
   */
  SEK: Currency;

  /**
   * The Singapore Dollar (SGD).
   *
   * @type {Currency}
   */
  SGD: Currency;

  /**
   * The Somali Shilling (SOS).
   *
   * @type {Currency}
   */
  SOS: Currency;

  /**
   * The Syrian Pound (SYP).
   *
   * @type {Currency}
   */
  SYP: Currency;

  /**
   * The Thai Baht (THB).
   *
   * @type {Currency}
   */
  THB: Currency;

  /**
   * The Tunisian Dinar (TND).
   *
   * @type {Currency}
   */
  TND: Currency;

  /**
   * The Tongan Paʻanga (TOP).
   *
   * @type {Currency}
   */
  TOP: Currency;

  /**
   * The Turkish Lira (TRY).
   *
   * @type {Currency}
   */
  TRY: Currency;

  /**
   * The Trinidad and Tobago Dollar (TTD).
   *
   * @type {Currency}
   */
  TTD: Currency;

  /**
   * The New Taiwan Dollar (TWD).
   *
   * @type {Currency}
   */
  TWD: Currency;

  /**
   * The Tanzanian Shilling (TZS).
   *
   * @type {Currency}
   */
  TZS: Currency;

  /**
   * The Ukrainian Hryvnia (UAH).
   *
   * @type {Currency}
   */
  UAH: Currency;

  /**
   * The Ugandan Shilling (UGX).
   *
   * @type {Currency}
   */
  UGX: Currency;

  /**
   * The Uruguayan Peso (UYU).
   *
   * @type {Currency}
   */
  UYU: Currency;

  /**
   * The Uzbek Som (UZS).
   *
   * @type {Currency}
   */
  UZS: Currency;

  /**
   * The Venezuelan Bolívar (VEF).
   *
   * @type {Currency}
   */
  VEF: Currency;

  /**
   * The Vietnamese Dong (VND).
   *
   * @type {Currency}
   */
  VND: Currency;

  /**
   * The Central African CFA Franc (XAF).
   *
   * @type {Currency}
   */
  XAF: Currency;

  /**
   * The West African CFA Franc (XOF).
   *
   * @type {Currency}
   */
  XOF: Currency;

  /**
   * The Yemeni Rial (YER).
   *
   * @type {Currency}
   */
  YER: Currency;

  /**
   * The South African Rand (ZAR).
   *
   * @type {Currency}
   */
  ZAR: Currency;

  /**
   * The Zambian Kwacha (ZMK).
   *
   * @type {Currency}
   */
  ZMK: Currency;
}

/**
 *
 * Represents the ISO 4217 currency codes available in the currencies collection.
 *
 * This type is derived from the keys of the `Currencies` interface, ensuring that
 * only valid currency codes are accepted. It provides type safety when working
 * with currency codes throughout the application.
 *
 * @example
 * ```typescript
 * const currencyCode: CurrencyCode = "USD"; // Valid
 * const invalidCode: CurrencyCode = "INVALID"; // TypeScript error
 * ```
 */
export type CurrencyCode = keyof Currencies;

/**
 *
 * Represents the currency symbols for all available currencies.
 *
 * This type extracts the symbol property from each currency in the `Currencies`
 * interface, providing a union type of all possible currency symbols. It's useful
 * for type-safe operations involving currency symbols.
 *
 * @example
 * ```typescript
 * const symbol: CurrencySymbol = "$"; // Valid (USD symbol)
 * const euroSymbol: CurrencySymbol = "€"; // Valid (EUR symbol)
 * ```
 */
export type CurrencySymbol = Currencies[CurrencyCode]['symbol'];
