# Countries Module

The `reslib/countries` module provides a robust and extensible registry for managing country data within your application. It offers a centralized source for country codes, names, dial codes, flags, currency information, and phone number examples.

## Features

- **Comprehensive Data**: Includes data for over 250 countries (ISO 3166-1 alpha-2).
- **Internationalization (i18n)**: Seamlessly integrates with `reslib/i18n` for translated country names.
- **Helper Methods**: Easy access to flags, currencies, and phone number examples.
- **Validation**: built-in validation for country objects.
- **Extensibility**: Add new countries, modify existing ones, or augment the type definitions with custom properties.
- **Type Safety**: Fully typed with TypeScript.

## Installation / Import

You can import the main registry class and types directly:

```typescript
import { CountryRegistry, Country, CountryCode } from 'reslib/countries';
```

## Basic Usage

### Retrieving Country Data

**Get a single country by code:**

```typescript
const us = CountryRegistry.getCountry('US');
console.log(us);
/* Output:
{
  code: 'US',
  dialCode: '1',
  name: 'United States',
  phoneNumberExample: '(201) 555-0123',
  flag: '🇺🇸',
  currency: { ... }
}
*/
```

**Get all countries:**

```typescript
const allCountries = CountryRegistry.getCountries();
console.log(Object.keys(allCountries)); // ['AF', 'AL', ..., 'US', ...]
```

### accessing Helper Properties

The `CountryRegistry` provides static helper methods to access specific properties safely (handling missing data gracefully):

```typescript
// Get Flag
const flag = CountryRegistry.getFlag('US'); // Returns '🇺🇸' or ''

// Get Phone Number Example
const example = CountryRegistry.getPhoneNumberExample('FR'); // Returns '01 23 45 67 89' or ''

// Get Currency
const currency = CountryRegistry.getCurrency('JP'); // Returns Currency object or undefined
```

## Internationalization (i18n)

The module integrates with `reslib/i18n` to provide translated country names.

1.  **Register Translations**: Use `i18n.registerTranslations` to provide localized names.
2.  **Automatic resolution**: `getCountry` and `getCountries` automatically merge translated names over the default English names.

```typescript
import { i18n } from 'reslib/i18n';
import { CountryRegistry } from 'reslib/countries';

// Register French translations
i18n.registerTranslations({
  fr: {
    countries: {
      US: { name: 'États-Unis' },
      DE: { name: 'Allemagne' },
    },
  },
});

// Assuming current locale is 'fr'
const us = CountryRegistry.getCountry('US');
console.log(us.name); // 'États-Unis'
```

## Extensibility

You can extend the registry at runtime or at the type level.

### Modifying the Registry at Runtime

**Add or Update a Single Country:**

```typescript
CountryRegistry.setCountry({
  code: 'XX', // Custom code
  dialCode: '999',
  name: 'My Custom Country',
  flag: '🏳️',
});
```

**Batch Update:**

```typescript
CountryRegistry.setCountries({
  US: { name: 'USA (Modified)' },
  FR: { dialCode: '33' },
});
```

### Type Augmentation (TypeScript)

To add new countries or properties to the `Country` interface, use TypeScript module augmentation. Create a declaration file (e.g., `countries.d.ts`):

**Adding a New Country Code:**

```typescript
import { Country } from 'reslib/countries';

declare module 'reslib/countries' {
  export interface Countries {
    // Adding a new country with code 'XX'
    XX: Country;
  }
}

// Now 'XX' is a valid CountryCode
const code: CountryCode = 'XX'; // valid
```

**Adding Custom Properties to `Country`:**

If you need to store extra data (e.g., `iso3` code), you can augment the `Country` interface:

```typescript
declare module 'reslib/countries/types' {
  export interface Country {
    iso3?: string;
    region?: string;
  }
}

// Usage
CountryRegistry.setCountry({
  code: 'US',
  dialCode: '1',
  name: 'USA',
  iso3: 'USA', // Valid now
});
```

## API Reference

### `CountryRegistry`

| Method                                                  | Description                                                            |
| :------------------------------------------------------ | :--------------------------------------------------------------------- |
| `getCountry(code: CountryCode): Country \| undefined`   | Retrieves a country by its code, merging with i18n data.               |
| `getCountries(): Countries`                             | Retrieves all countries, merging with i18n data.                       |
| `setCountry(country: Country): void`                    | Adds or updates a country in the registry.                             |
| `setCountries(countries: Partial<Countries>): void`     | Batch updates countres in the registry.                                |
| `isValid(country: unknown): country is Country`         | Checks if an object is a valid country structure (must have a `code`). |
| `getFlag(code: CountryCode): string`                    | Helper to get the flag emoji.                                          |
| `getPhoneNumberExample(code: CountryCode): string`      | Helper to get a phone number example.                                  |
| `getCurrency(code: CountryCode): Currency \| undefined` | Helper to get the currency object.                                     |

### Dial Code Ambiguity Resolution

The `Country` interface includes a `dialCodePriority` property. This is used to resolve cases where multiple countries share the same dial code (e.g., +1 for US/CA). Lower values indicate higher priority. The system preserves this value to allow accurate parsing logic.
