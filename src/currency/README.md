# Currency Module

The `currency` module provides a robust and flexible system for dealing with monetary values. It handles formatting, parsing, precision correction, and global state management for international currencies.

## 1. Features

- **Robust Formatting**: Convert numbers to localized strings (e.g., `1234.5` -> `"$1,234.50"` or `"1.234,50 €"`).
- **Smart Parsing**: robustly extract values from formatted strings (e.g., `"($ 1,234.50)"` -> `-1234.5`).
- **Precision Correction**: Includes a custom `toFixed` implementation that handles IEEE 754 floating-point errors (e.g., `0.615` rounding correctly to `0.62`).
- **Global Context**: Session-based state management to handle the active application currency.
- **Customizable**: Full control over symbols, separators, and format patterns (`%v %s` vs `%s%v`).
- **Extensive Registry**: Built-in definitions for common world currencies (USD, EUR, etc.).

## 2. Architecture

The module exports a master object `CurrencyFormatter` containing all necessary tools.

```ts
import { CurrencyFormatter } from 'reslib/currency';

export const CurrencyFormatter = {
  // Core Functions
  formatMoney,
  unformat, // Alias: parse
  formatNumber,
  toFixed,

  // Helpers
  formatMoneyAsObject,
  prepareOptions,
  parseFormat,
  isCurrency,

  // Data & State
  currencies, // Registry of world currencies
  session, // Global state manager
};
```

---

## 3. Core Concepts

### The Currency Object

A `Currency` instance defines how a monetary value should be displayed.

```ts
interface Currency {
  symbol?: string; // e.g. "$", "€"
  name?: string; // e.g. "US Dollar"
  code?: string; // ISO 4217 code, e.g. "USD"
  decimalDigits?: number; // e.g. 2
  thousandSeparator?: string; // e.g. ","
  decimalSeparator?: string; // e.g. "."
  format?: string; // e.g. "%s%v"
}
```

### Format Tokens

The `format` string property dictates the layout:

| Token  | Meaning             | Example                |
| :----- | :------------------ | :--------------------- |
| `%s`   | The Currency Symbol | `$`                    |
| `%v`   | The Numeric Value   | `10.50`                |
| `.###` | Decimal Precision   | (inferred from string) |

**Examples:**

- `"%s%v"` -> `$10.50`
- `"%v %s"` -> `10.50 $`
- `"%s %v"` -> `$ 10.50`

---

## 4. API Reference

### `formatMoney(number, definitions?)`

The main entry point. Formats a number into a string.

```ts
CurrencyFormatter.formatMoney(1234.56, {
  symbol: '€',
  decimalSeparator: ',',
  thousandSeparator: '.',
});
// Output: "€1.234,56"
```

**Parameters:**

- `number`: The value to format.
- `options`: A `Currency` object OR individual arguments list: `(number, symbol, precision, thousand, decimal, format)`.

### `formatMoneyAsObject(number, definitions?)`

Identical to `formatMoney`, but returns a rich object containing metadata about the conversion. Useful for debugging or advanced UI rendering.

```ts
const result = CurrencyFormatter.formatMoneyAsObject(-1500, 'USD');
/* Output:
{
  formattedValue: "-$1,500.00",
  formattedNumber: "1,500.00",
  usedFormat: "%s%v",
  symbol: "$",
  result: "-$1,500.00"
}
*/
```

### `unformat(value)` / `parse(value)`

Converts a string back into a raw number.

- Strips out text, symbols, and spaces.
- Parses `(100)` as negative `-100`.
- Handles custom decimal separators if provided.

```ts
CurrencyFormatter.unformat('USD 5,000.00'); // 5000
CurrencyFormatter.unformat('($15.50)'); // -15.5
```

### `formatNumber(value, ...)`

Formats a standard number with precision and separators, but **without** currency symbols.

```ts
CurrencyFormatter.formatNumber(12345.6789, 2, ',', '.');
// "12.345,68"
```

### `toFixed(value, precision)`

Solving JavaScript's `0.1 + 0.2` blues. Ensures deterministic rounding for financial calculations.

```ts
// JS Default
(0.015).toFixed(2); // "0.01" (Incorrect for money)

// CurrencyFormatter
CurrencyFormatter.toFixed(0.015, 2); // "0.02" (Standard rounding)
```

### `parseFormat(formatString)`

Reflects on a format string to extract settings.

```ts
CurrencyFormatter.parseFormat('%s %v .###');
// Returns: { format: "%s %v", decimalDigits: 3 }
```

### `isCurrency(obj)`

Type-guard to check if an object satisfies the `Currency` interface.

---

## 5. State Management (`session`)

The `session` object manages the application's global specific currency settings.

### `session.setCurrency(currency)`

Sets the global default currency. All subsequent calls to `formatMoney` will use this currency unless overridden.

```ts
// Switch app to Euro mode
CurrencyFormatter.session.setCurrency('EUR');

// Switch using a code (looks up in registry)
CurrencyFormatter.session.setCurrency('JPY');
```

### `session.getCurrency()`

Retrieves the currently active currency configuration.

```ts
const current = CurrencyFormatter.session.getCurrency();
console.log(current.code); // "JPY"
```

### `session.setFormat(formatString)`

Overrides the **display pattern** globally, regardless of the active currency's default.

```ts
// Force specific spacing for all currencies
CurrencyFormatter.session.setFormat('%s - %v');
```

---

## 6. Data Registry (`currencies`)

The module includes a built-in dictionary of ISO 4217 currencies.

```ts
import { CurrencyFormatter } from 'reslib/currency';

const yen = CurrencyFormatter.currencies.JPY;
/*
{
  code: "JPY",
  symbol: "¥",
  decimalDigits: 0,
  ...
}
*/
```

---

## 7. Formatting Logic & Flow

When `formatMoney` is called, the pipeline is as follows:

1.  **Unformat Source**: The input is first scrubbed to a raw number (resolving any string inputs).
2.  **Resolve Options**:
    - If options are passed, use them.
    - If not, use the `session` (global) currency.
    - If session is empty, fall back to default (USD).
3.  **Parse Format**: Determine if we are using a standard format or specific positive/negative/zero formats.
4.  **Normalize Precision**: Check `decimalDigits` (defaults to 2 if undefined).
5.  **Round & Separate**: Use `toFixed` to round safely, then inject `thousandSeparator` and `decimalSeparator`.
6.  **Apply Template**: Replace `%s` with symbol and `%v` with the formatted number string.

### Negative Handling

The system automatically handles negative numbers.

- If a specific negative format is provided (e.g. `{ pos: "%s%v", neg: "(%s%v)" }`), it is used.
- Otherwise, it defaults to prepending a `-` sign.

---

## 8. Best Practices

- **Use the Session**: Set the currency once at the root of your application (e.g. in a Context Provider or App initialization) rather than passing symbols to every component.
- **Store Raw, Display Formatted**: Always store monetary values as raw numbers (floats or integers) in your value state/database. Only use `formatMoney` at the very last step in the UI layer.
- **Avoid Native `toFixed`**: Always use `CurrencyFormatter.toFixed` when doing manual rounding logic to avoid off-by-one penny errors.

---

## 9. Supported Currencies & Extensibility

The module includes a comprehensive registry of ISO 4217 currencies in `currencies.ts`. Each entry defines the standard symbol, precision, and formatting rules for that currency.

> **Extensibility**: You are not limited to these defaults. You can override any property of a currency (like changing the symbol or precision) at runtime by passing a custom `Currency` object to any formatting function, or by updating the global session.

### Included Currencies (Partial List)

| Code    | Name              | Symbol | Decimal Digits |
| :------ | :---------------- | :----- | :------------- |
| **USD** | US Dollar         | `$`    | 2              |
| **EUR** | Euro              | `€`    | 2              |
| **GBP** | British Pound     | `£`    | 2              |
| **JPY** | Japanese Yen      | `¥`    | 0              |
| **CAD** | Canadian Dollar   | `CA$`  | 2              |
| **AUD** | Australian Dollar | `AU$`  | 2              |
| **CNY** | Chinese Yuan      | `CN¥`  | 2              |
| **INR** | Indian Rupee      | `Rs`   | 2              |
| ...     | ...               | ...    | ...            |

_(See `reslib/currency/currencies.ts` for the full list of 100+ supported currencies)_

---

## 10. Number Prototype Extensions

The module extends JavaScript's native `Number` prototype to provide a fluent, distinct API. This allows you to call formatting methods directly on any number.

To enable these extensions, simply import the module:

```ts
import 'reslib/utils';
```

### `Number.prototype.formatMoney()`

Identical to `CurrencyFormatter.formatMoney`, but called directly on the number.

```ts
(1234.56).formatMoney(); // "$1,234.56"
(100).formatMoney('EUR'); // "€100.00"
```

### `Number.prototype.formatNumber()`

Formats the number with thousands separators and decimals, without currency symbols.

```ts
(1234.567).formatNumber(2, ',', '.'); // "1.234,57"
```

### `Number.prototype.abreviate2FormatMoney()`

Abbreviates large numbers (K, M, B, T) and then applies currency formatting.

```ts
(1500000).abreviate2FormatMoney('USD');
// "$1.5M"
```

### `Number.prototype.abreviate2FormatNumber()`

Abbreviates the number (K, M, B, T) without currency symbols.

```ts
(1200).abreviate2FormatNumber(); // "1.2K"
```

### Dynamic Currency Methods (`format[Code]`)

The module dynamically generates a specific formatter method for **every** supported currency in the registry.

Usage:

```ts
const price = 5000;
price.formatUSD(); // "$5,000.00"
price.formatEUR(); // "€5.000,00"
price.formatJPY(); // "¥5,000"
price.formatCAD(); // "CA$5,000.00"
```

Full list of available methods:

`formatUSD`, `formatCAD`, `formatEUR`, `formatAED`, `formatAFN`, `formatALL`, `formatAMD`, `formatARS`, `formatAUD`, `formatAZN`, `formatBAM`, `formatBDT`, `formatBGN`, `formatBHD`, `formatBIF`, `formatBND`, `formatBOB`, `formatBRL`, `formatBWP`, `formatBYR`, `formatBZD`, `formatCDF`, `formatCHF`, `formatCLP`, `formatCNY`, `formatCOP`, `formatCRC`, `formatCVE`, `formatCZK`, `formatDJF`, `formatDKK`, `formatDOP`, `formatDZD`, `formatEEK`, `formatEGP`, `formatERN`, `formatETB`, `formatGBP`, `formatGEL`, `formatGHS`, `formatGNF`, `formatGTQ`, `formatHKD`, `formatHNL`, `formatHRK`, `formatHUF`, `formatIDR`, `formatILS`, `formatINR`, `formatIQD`, `formatIRR`, `formatISK`, `formatJMD`, `formatJOD`, `formatJPY`, `formatKES`, `formatKHR`, `formatKMF`, `formatKRW`, `formatKWD`, `formatKZT`, `formatLBP`, `formatLKR`, `formatLTL`, `formatLVL`, `formatLYD`, `formatMAD`, `formatMDL`, `formatMGA`, `formatMKD`, `formatMMK`, `formatMOP`, `formatMUR`, `formatMXN`, `formatMYR`, `formatMZN`, `formatNAD`, `formatNGN`, `formatNIO`, `formatNOK`, `formatNPR`, `formatNZD`, `formatOMR`, `formatPAB`, `formatPEN`, `formatPHP`, `formatPKR`, `formatPLN`, `formatPYG`, `formatQAR`, `formatRON`, `formatRSD`, `formatRUB`, `formatRWF`, `formatSAR`, `formatSDG`, `formatSEK`, `formatSGD`, `formatSOS`, `formatSYP`, `formatTHB`, `formatTND`, `formatTOP`, `formatTRY`, `formatTTD`, `formatTWD`, `formatTZS`, `formatUAH`, `formatUGX`, `formatUYU`, `formatUZS`, `formatVEF`, `formatVND`, `formatXAF`, `formatXOF`, `formatYER`, `formatZAR`, `formatZMK`

### Dynamic Abbreviation Methods (`abreviate2Format[Code]`)

Similarly, it generates specific abbreviation methods for every currency.

Usage:

```ts
const bigMoney = 2500000;
bigMoney.abreviate2FormatUSD(); // "$2.5M"
bigMoney.abreviate2FormatEUR(); // "€2.5M"
```

Full list of available methods:

`abreviate2FormatUSD`, `abreviate2FormatCAD`, `abreviate2FormatEUR`, `abreviate2FormatAED`, `abreviate2FormatAFN`, `abreviate2FormatALL`, `abreviate2FormatAMD`, `abreviate2FormatARS`, `abreviate2FormatAUD`, `abreviate2FormatAZN`, `abreviate2FormatBAM`, `abreviate2FormatBDT`, `abreviate2FormatBGN`, `abreviate2FormatBHD`, `abreviate2FormatBIF`, `abreviate2FormatBND`, `abreviate2FormatBOB`, `abreviate2FormatBRL`, `abreviate2FormatBWP`, `abreviate2FormatBYR`, `abreviate2FormatBZD`, `abreviate2FormatCDF`, `abreviate2FormatCHF`, `abreviate2FormatCLP`, `abreviate2FormatCNY`, `abreviate2FormatCOP`, `abreviate2FormatCRC`, `abreviate2FormatCVE`, `abreviate2FormatCZK`, `abreviate2FormatDJF`, `abreviate2FormatDKK`, `abreviate2FormatDOP`, `abreviate2FormatDZD`, `abreviate2FormatEEK`, `abreviate2FormatEGP`, `abreviate2FormatERN`, `abreviate2FormatETB`, `abreviate2FormatGBP`, `abreviate2FormatGEL`, `abreviate2FormatGHS`, `abreviate2FormatGNF`, `abreviate2FormatGTQ`, `abreviate2FormatHKD`, `abreviate2FormatHNL`, `abreviate2FormatHRK`, `abreviate2FormatHUF`, `abreviate2FormatIDR`, `abreviate2FormatILS`, `abreviate2FormatINR`, `abreviate2FormatIQD`, `abreviate2FormatIRR`, `abreviate2FormatISK`, `abreviate2FormatJMD`, `abreviate2FormatJOD`, `abreviate2FormatJPY`, `abreviate2FormatKES`, `abreviate2FormatKHR`, `abreviate2FormatKMF`, `abreviate2FormatKRW`, `abreviate2FormatKWD`, `abreviate2FormatKZT`, `abreviate2FormatLBP`, `abreviate2FormatLKR`, `abreviate2FormatLTL`, `abreviate2FormatLVL`, `abreviate2FormatLYD`, `abreviate2FormatMAD`, `abreviate2FormatMDL`, `abreviate2FormatMGA`, `abreviate2FormatMKD`, `abreviate2FormatMMK`, `abreviate2FormatMOP`, `abreviate2FormatMUR`, `abreviate2FormatMXN`, `abreviate2FormatMYR`, `abreviate2FormatMZN`, `abreviate2FormatNAD`, `abreviate2FormatNGN`, `abreviate2FormatNIO`, `abreviate2FormatNOK`, `abreviate2FormatNPR`, `abreviate2FormatNZD`, `abreviate2FormatOMR`, `abreviate2FormatPAB`, `abreviate2FormatPEN`, `abreviate2FormatPHP`, `abreviate2FormatPKR`, `abreviate2FormatPLN`, `abreviate2FormatPYG`, `abreviate2FormatQAR`, `abreviate2FormatRON`, `abreviate2FormatRSD`, `abreviate2FormatRUB`, `abreviate2FormatRWF`, `abreviate2FormatSAR`, `abreviate2FormatSDG`, `abreviate2FormatSEK`, `abreviate2FormatSGD`, `abreviate2FormatSOS`, `abreviate2FormatSYP`, `abreviate2FormatTHB`, `abreviate2FormatTND`, `abreviate2FormatTOP`, `abreviate2FormatTRY`, `abreviate2FormatTTD`, `abreviate2FormatTWD`, `abreviate2FormatTZS`, `abreviate2FormatUAH`, `abreviate2FormatUGX`, `abreviate2FormatUYU`, `abreviate2FormatUZS`, `abreviate2FormatVEF`, `abreviate2FormatVND`, `abreviate2FormatXAF`, `abreviate2FormatXOF`, `abreviate2FormatYER`, `abreviate2FormatZAR`, `abreviate2FormatZMK`

### `Number.prototype.countDecimals()`

Utility to count the number of decimal places in a number.

```ts
(10.55).countDecimals(); // 2
(100).countDecimals(); // 0
```

---

## 9. Supported Currencies

The module comes with built-in support for the following currencies:

| Code    | Name                                | Symbol  |
| :------ | :---------------------------------- | :------ |
| **USD** | US Dollar                           | `$`     |
| **CAD** | Canadian Dollar                     | `CA$`   |
| **EUR** | Euro                                | `€`     |
| **AED** | United Arab Emirates Dirham         | `AED`   |
| **AFN** | Afghan Afghani                      | `Af`    |
| **ALL** | Albanian Lek                        | `ALL`   |
| **AMD** | Armenian Dram                       | `AMD`   |
| **ARS** | Argentine Peso                      | `AR$`   |
| **AUD** | Australian Dollar                   | `AU$`   |
| **AZN** | Azerbaijani Manat                   | `man.`  |
| **BAM** | Bosnia-Herzegovina Convertible Mark | `KM`    |
| **BDT** | Bangladeshi Taka                    | `Tk`    |
| **BGN** | Bulgarian Lev                       | `BGN`   |
| **BHD** | Bahraini Dinar                      | `BD`    |
| **BIF** | Burundian Franc                     | `FBu`   |
| **BND** | Brunei Dollar                       | `BN$`   |
| **BOB** | Bolivian Boliviano                  | `Bs`    |
| **BRL** | Brazilian Real                      | `R$`    |
| **BWP** | Botswanan Pula                      | `BWP`   |
| **BYR** | Belarusian Ruble                    | `BYR`   |
| **BZD** | Belize Dollar                       | `BZ$`   |
| **CDF** | Congolese Franc                     | `CDF`   |
| **CHF** | Swiss Franc                         | `CHF`   |
| **CLP** | Chilean Peso                        | `CL$`   |
| **CNY** | Chinese Yuan                        | `CN¥`   |
| **COP** | Colombian Peso                      | `CO$`   |
| **CRC** | Costa Rican Colón                   | `₡`     |
| **CVE** | Cape Verdean Escudo                 | `CV$`   |
| **CZK** | Czech Republic Koruna               | `Kč`    |
| **DJF** | Djiboutian Franc                    | `Fdj`   |
| **DKK** | Danish Krone                        | `Dkr`   |
| **DOP** | Dominican Peso                      | `RD$`   |
| **DZD** | Algerian Dinar                      | `DA`    |
| **EEK** | Estonian Kroon                      | `Ekr`   |
| **EGP** | Egyptian Pound                      | `EGP`   |
| **ERN** | Eritrean Nakfa                      | `Nfk`   |
| **ETB** | Ethiopian Birr                      | `Br`    |
| **GBP** | British Pound Sterling              | `£`     |
| **GEL** | Georgian Lari                       | `GEL`   |
| **GHS** | Ghanaian Cedi                       | `GH₵`   |
| **GNF** | Guinean Franc                       | `FG`    |
| **GTQ** | Guatemalan Quetzal                  | `GTQ`   |
| **HKD** | Hong Kong Dollar                    | `HK$`   |
| **HNL** | Honduran Lempira                    | `HNL`   |
| **HRK** | Croatian Kuna                       | `kn`    |
| **HUF** | Hungarian Forint                    | `Ft`    |
| **IDR** | Indonesian Rupiah                   | `Rp`    |
| **ILS** | Israeli New Sheqel                  | `₪`     |
| **INR** | Indian Rupee                        | `Rs`    |
| **IQD** | Iraqi Dinar                         | `IQD`   |
| **IRR** | Iranian Rial                        | `IRR`   |
| **ISK** | Icelandic Króna                     | `Ikr`   |
| **JMD** | Jamaican Dollar                     | `J$`    |
| **JOD** | Jordanian Dinar                     | `JD`    |
| **JPY** | Japanese Yen                        | `¥`     |
| **KES** | Kenyan Shilling                     | `Ksh`   |
| **KHR** | Cambodian Riel                      | `KHR`   |
| **KMF** | Comorian Franc                      | `CF`    |
| **KRW** | South Korean Won                    | `₩`     |
| **KWD** | Kuwaiti Dinar                       | `KD`    |
| **KZT** | Kazakhstani Tenge                   | `KZT`   |
| **LBP** | Lebanese Pound                      | `LB£`   |
| **LKR** | Sri Lankan Rupee                    | `SLRs`  |
| **LTL** | Lithuanian Litas                    | `Lt`    |
| **LVL** | Latvian Lats                        | `Ls`    |
| **LYD** | Libyan Dinar                        | `LD`    |
| **MAD** | Moroccan Dirham                     | `MAD`   |
| **MDL** | Moldovan Leu                        | `MDL`   |
| **MGA** | Malagasy Ariary                     | `MGA`   |
| **MKD** | Macedonian Denar                    | `MKD`   |
| **MMK** | Myanma Kyat                         | `MMK`   |
| **MOP** | Macanese Pataca                     | `MOP$`  |
| **MUR** | Mauritian Rupee                     | `MURs`  |
| **MXN** | Mexican Peso                        | `MX$`   |
| **MYR** | Malaysian Ringgit                   | `RM`    |
| **MZN** | Mozambican Metical                  | `MTn`   |
| **NAD** | Namibian Dollar                     | `N$`    |
| **NGN** | Nigerian Naira                      | `₦`     |
| **NIO** | Nicaraguan Córdoba                  | `C$`    |
| **NOK** | Norwegian Krone                     | `Nkr`   |
| **NPR** | Nepalese Rupee                      | `NPRs`  |
| **NZD** | New Zealand Dollar                  | `NZ$`   |
| **OMR** | Omani Rial                          | `OMR`   |
| **PAB** | Panamanian Balboa                   | `B/.`   |
| **PEN** | Peruvian Nuevo Sol                  | `S/.`   |
| **PHP** | Philippine Peso                     | `₱`     |
| **PKR** | Pakistani Rupee                     | `PKRs`  |
| **PLN** | Polish Zloty                        | `zł`    |
| **PYG** | Paraguayan Guarani                  | `₲`     |
| **QAR** | Qatari Rial                         | `QR`    |
| **RON** | Romanian Leu                        | `RON`   |
| **RSD** | Serbian Dinar                       | `din.`  |
| **RUB** | Russian Ruble                       | `RUB`   |
| **RWF** | Rwandan Franc                       | `RWF`   |
| **SAR** | Saudi Riyal                         | `SR`    |
| **SDG** | Sudanese Pound                      | `SDG`   |
| **SEK** | Swedish Krona                       | `Skr`   |
| **SGD** | Singapore Dollar                    | `S$`    |
| **SOS** | Somali Shilling                     | `Ssh`   |
| **SYP** | Syrian Pound                        | `SY£`   |
| **THB** | Thai Baht                           | `฿`     |
| **TND** | Tunisian Dinar                      | `DT`    |
| **TOP** | Tongan Paʻanga                      | `T$`    |
| **TRY** | Turkish Lira                        | `TL`    |
| **TTD** | Trinidad and Tobago Dollar          | `TT$`   |
| **TWD** | New Taiwan Dollar                   | `NT$`   |
| **TZS** | Tanzanian Shilling                  | `TSh`   |
| **UAH** | Ukrainian Hryvnia                   | `₴`     |
| **UGX** | Ugandan Shilling                    | `USh`   |
| **UYU** | Uruguayan Peso                      | `$U`    |
| **UZS** | Uzbekistan Som                      | `UZS`   |
| **VEF** | Venezuelan Bolívar                  | `Bs.F.` |
| **VND** | Vietnamese Dong                     | `₫`     |
| **XAF** | CFA Franc BEAC                      | `FCFA`  |
| **XOF** | CFA Franc BCEAO                     | `CFA`   |
| **YER** | Yemeni Rial                         | `YR`    |
| **ZAR** | South African Rand                  | `R`     |
| **ZMK** | Zambian Kwacha                      | `ZK`    |
