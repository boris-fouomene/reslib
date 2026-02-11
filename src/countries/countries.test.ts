import { i18n } from '@/i18n';
import { CountryRegistry } from './index';
import { Countries, Country, CountryCode } from './types';

describe('CountryRegistry', () => {
  let originalRegistry: Countries;

  beforeAll(() => {
    i18n.registerTranslations({
      countries: {
        US: {
          name: 'États-Unis',
        },
      },
    });
    // Access private property for backup

    originalRegistry = { ...(CountryRegistry as any).registry };
  });

  afterEach(() => {
    // Access private property for restore

    (CountryRegistry as any).registry = { ...originalRegistry };
    jest.clearAllMocks();
  });

  describe('Static Methods', () => {
    describe('isValid', () => {
      it('should return true for a valid country object', () => {
        const validCountry: Country = {
          code: 'US',
          dialCode: '1',
          name: 'United States',
        };
        expect(CountryRegistry.isValid(validCountry)).toBe(true);
      });

      it('should return false for null', () => {
        expect(CountryRegistry.isValid(null as any)).toBe(false);
      });

      it('should return false for undefined', () => {
        expect(CountryRegistry.isValid(undefined as any)).toBe(false);
      });

      it('should return false for a non-object (number)', () => {
        expect(CountryRegistry.isValid(123 as any)).toBe(false);
      });

      it('should return false for a non-object (string)', () => {
        expect(CountryRegistry.isValid('US' as any)).toBe(false);
      });

      it('should return false for an object without a "code" property', () => {
        const invalidCountry = {
          dialCode: '1',
          name: 'United States',
        };
        expect(CountryRegistry.isValid(invalidCountry as any)).toBe(false);
      });

      it('should return false for an object with a null "code"', () => {
        const invalidCountry = {
          code: null,
          dialCode: '1',
        };
        expect(CountryRegistry.isValid(invalidCountry as any)).toBe(false);
      });

      it('should return false for an object with an empty string "code"', () => {
        // Technically isNonNullString checks for empty string too usually?
        // Let's assume validation requires non-empty code.
        const invalidCountry = {
          code: '',
          dialCode: '1',
          name: 'Invalid',
        };
        expect(CountryRegistry.isValid(invalidCountry as any)).toBe(false);
      });

      it('should return true even if name is missing', () => {
        const invalidCountry = {
          code: 'US',
          dialCode: '1',
        };
        expect(CountryRegistry.isValid(invalidCountry as any)).toBe(true);
      });

      it('should return true even if dialCode is missing', () => {
        const invalidCountry = {
          code: 'US',
          name: 'US',
        };
        expect(CountryRegistry.isValid(invalidCountry as any)).toBe(true);
      });

      it('should preserve dialCodePriority', () => {
        // Validation check for existing field
        const country = CountryRegistry.getCountry('US');
        expect(country?.dialCodePriority).toBe(0);
      });
    });

    describe('setCountry', () => {
      it('should add a new country to the registry', () => {
        const newCountry: Country = {
          code: 'XX' as CountryCode,
          dialCode: '999',
          name: 'Test Land',
          dialCodePriority: 0,
        };

        CountryRegistry.setCountry(newCountry);

        const retrieved = CountryRegistry.getCountry('XX' as CountryCode);
        expect(retrieved).toEqual(newCountry);
      });

      it('should update an existing country in the registry', () => {
        const updatedUS: Country = {
          code: 'US',
          dialCode: '1',
          name: 'USA Updated',
          flag: '🇺🇸',
        };

        CountryRegistry.setCountry(updatedUS);

        const retrieved = CountryRegistry.getCountry('US');
        expect(retrieved?.name).toBe('USA Updated');
      });

      it('should not mutate the registry if the input is invalid', () => {
        const initialCount = Object.keys(CountryRegistry.getCountries()).length;

        // Invalid input
        CountryRegistry.setCountry({ dialCode: '123' } as any);

        const finalCount = Object.keys(CountryRegistry.getCountries()).length;
        expect(finalCount).toBe(initialCount);
      });
    });

    describe('setCountries', () => {
      it('should update multiple countries at once', () => {
        CountryRegistry.setCountries({
          US: {
            code: 'US',
            dialCode: '1',
            name: 'United States Modified',
          },
          FR: {
            code: 'FR',
            dialCode: '33',
            name: 'France Modified',
          },
        });

        const us = CountryRegistry.getCountry('US');
        const fr = CountryRegistry.getCountry('FR');

        expect(us?.name).toBe('United States Modified');
        expect(fr?.name).toBe('France Modified');
      });

      it('should gracefully handle invalid entries within the batch', () => {
        const originalGB = CountryRegistry.getCountry('GB');

        CountryRegistry.setCountries({
          GB: { dialCode: '44' } as any, // Invalid, missing code
          DE: { code: 'DE', dialCode: '49', name: 'Germany Modified' },
        });

        // GB should be unchanged
        expect(CountryRegistry.getCountry('GB')).toEqual(originalGB);
        // DE should be updated
        expect(CountryRegistry.getCountry('DE')?.name).toBe('Germany Modified');
      });
    });

    describe('getCountry', () => {
      it('should retrieve a country by valid code', () => {
        const country = CountryRegistry.getCountry('US');
        expect(country).toBeDefined();
        expect(country?.code).toBe('US');
        expect(country?.name).toContain('United States');
      });

      it('should return undefined for invalid or missing code', () => {
        expect(CountryRegistry.getCountry('ZZ' as CountryCode)).toBeUndefined();
        expect(CountryRegistry.getCountry('' as CountryCode)).toBeUndefined();
        expect(CountryRegistry.getCountry(null as any)).toBeUndefined();
      });

      it('should integrate with i18n if translation exists', () => {
        i18n.registerTranslations({
          en: {
            countries: {
              US: {
                name: 'États-Unis',
              },
            },
          },
        });
        const country = CountryRegistry.getCountry('US');
        expect(country?.name).toBe('États-Unis');
      });

      it('should NOT fail if i18n returns null/undefined', () => {
        const country = CountryRegistry.getCountry('US');
        expect(country).toBeDefined();
        expect(country?.code).toBe('US');
      });
    });

    describe('getCountries', () => {
      it('should return all countries', () => {
        const all = CountryRegistry.getCountries();
        expect(all).toBeDefined();
        expect(Object.keys(all).length).toBeGreaterThan(0);
        expect(all['US']).toBeDefined();
        expect(all['FR']).toBeDefined();
      });

      it('should integrate with i18n for batch retrieval', () => {
        i18n.registerTranslations({
          en: {
            countries: {
              US: { name: 'USA I18n' },
              JP: { name: 'Japan I18n' },
            },
          },
        });

        const all = CountryRegistry.getCountries();
        expect(all['US'].name).toBe('USA I18n');
        expect(all['JP'].name).toBe('Japan I18n');
        // Ensure other data is preserved
        expect(all['US'].dialCode).toBe('1');

        CountryRegistry.setCountries({
          US: {
            code: 'US',
            dialCode: '1',
            name: 'New USA',
          },
          JP: {
            code: 'JP',
            dialCode: '81',
            name: 'New Japan',
          },
        });

        const all2 = CountryRegistry.getCountries();
        expect(all2['US'].name).toBe('New USA');
        expect(all2['JP'].name).toBe('New Japan');
        // Ensure other data is preserved
        expect(all2['US'].dialCode).toBe('1');
      });
    });

    describe('getPhoneNumberExample', () => {
      it('should return example if present', () => {
        CountryRegistry.setCountry({
          code: 'US',
          dialCode: '1',
          name: 'US',
          phoneNumberExample: '(201) 555-0123',
        });
        expect(CountryRegistry.getPhoneNumberExample('US')).toBe(
          '(201) 555-0123'
        );
      });

      it('should fall back to empty string if missing', () => {
        CountryRegistry.setCountry({
          code: 'XX' as CountryCode,
          dialCode: '999',
          name: 'No Example',
          // no phoneNumberExample
        });
        expect(CountryRegistry.getPhoneNumberExample('XX' as CountryCode)).toBe(
          ''
        );
      });

      it('should return empty string if country not found', () => {
        expect(CountryRegistry.getPhoneNumberExample('ZZ' as CountryCode)).toBe(
          ''
        );
      });
    });

    describe('getFlag', () => {
      it('should return flag if present', () => {
        CountryRegistry.setCountry({
          code: 'US',
          dialCode: '1',
          name: 'US',
          flag: '🇺🇸',
        });
        expect(CountryRegistry.getFlag('US')).toBe('🇺🇸');
      });

      it('should return empty string if flag missing', () => {
        CountryRegistry.setCountry({
          code: 'XX' as CountryCode,
          dialCode: '999',
          name: 'No Flag',
        });
        expect(CountryRegistry.getFlag('XX' as CountryCode)).toBe('');
      });

      it('should return empty string if country not found', () => {
        expect(CountryRegistry.getFlag('ZZ' as CountryCode)).toBe('');
      });
    });

    describe('getCurrency', () => {
      it('should return currency object if present', () => {
        const currencyData = {
          code: 'USD',
          symbol: '$',
          name: 'Dollar',
          symbolNative: '$',
          decimalDigits: 2,
          rounding: 0,
          namePlural: 'Dollars',
        };
        CountryRegistry.setCountry({
          code: 'US',
          dialCode: '1',
          name: 'US',
          currency: currencyData,
        });

        expect(CountryRegistry.getCurrency('US')).toEqual(currencyData);
      });

      it('should return undefined if currency missing', () => {
        CountryRegistry.setCountry({
          code: 'XX' as CountryCode,
          dialCode: '999',
          name: 'No Currency',
        });
        expect(
          CountryRegistry.getCurrency('XX' as CountryCode)
        ).toBeUndefined();
      });

      it('should return undefined if country not found', () => {
        expect(
          CountryRegistry.getCurrency('ZZ' as CountryCode)
        ).toBeUndefined();
      });
    });
  });

  describe('Augmentation and Extensibility', () => {
    it('should support adding arbitrary properties via runtime augmentation', () => {
      // Simulate an augmented country object
      const augmentedCountry = {
        code: 'US',
        dialCode: '1',
        name: 'US Augmented',
        customProperty: 'custom-value', // This property doesn't exist on Country type by default
      };

      // We prefer using 'any' here to simulate TypeScript augmentation "working" at runtime

      CountryRegistry.setCountry(augmentedCountry as Country);

      const retrieved = CountryRegistry.getCountry('US');

      // Check if standard properties are valid
      expect(retrieved?.name).toBe('US Augmented');

      // Check if custom property persisted

      expect((retrieved as any).customProperty).toBe('custom-value');
    });

    it('should support adding completely new countries that are not in standard ISO list', () => {
      // This simulates dynamic country loading or external plugins adding regions
      const fantasyCountry = {
        code: 'NARNIA' as CountryCode, // Cast to bypass strict type check for this test
        dialCode: '777',
        name: 'Narnia',
        dialCodePriority: 0,
        flag: '🦁',
      };

      CountryRegistry.setCountry(fantasyCountry);

      const retrieved = CountryRegistry.getCountry('NARNIA' as CountryCode);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Narnia');
      expect(retrieved?.dialCode).toBe('777');
    });
  });
});
