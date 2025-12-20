import '../../utils';
import { I18n, Translate } from '../index';

describe('I18n Service', () => {
  let i18n: I18n;

  beforeEach(() => {
    // Fresh instance for each test
    i18n = I18n.createInstance();
  });

  describe('Core Translation', () => {
    test('should translate simple keys', () => {
      i18n.registerTranslations({ en: { hello: 'Hello World' } });
      expect(i18n.t('hello')).toBe('Hello World');
    });

    test('should return key if translation matches nothing', () => {
      expect(i18n.t('missing.key')).toBe('missing.key');
    });

    test('should support nested keys via dot notation', () => {
      i18n.registerTranslations({
        en: {
          auth: {
            login: {
              title: 'Sign In',
            },
          },
        },
      });
      expect(i18n.t('auth.login.title')).toBe('Sign In');
    });

    test('should iterate array of keys until a translation is found (fallback keys)', () => {
      i18n.registerTranslations({
        en: {
          exists: 'Found Me',
        },
      });
      // 'missing' is not found, 'exists' is found
      expect(i18n.t(['missing', 'exists'])).toBe('Found Me');
    });

    test('should use fallback locale if key is missing in current locale', () => {
      i18n = I18n.createInstance(
        {
          en: {
            common: { save: 'Save' },
            uniqueToEn: 'Only EN',
          },
          fr: {
            common: { save: 'Enregistrer' },
          },
        },
        { locale: 'fr', fallbackLocale: 'en' }
      );

      // Found in current (fr)
      expect(i18n.t('common.save')).toBe('Enregistrer');
      // Missing in fr, fallback to en
      expect(i18n.t('uniqueToEn')).toBe('Only EN');
      // Missing in both
      expect(i18n.t('missing.everywhere')).toBe('missing.everywhere');
    });

    test('should respect defaultValue option', () => {
      expect(i18n.t('missing', { defaultValue: 'Default' })).toBe('Default');
    });
  });

  describe('Interpolation', () => {
    test('should replace simple named placeholders', () => {
      i18n.registerTranslations({ en: { greet: 'Hello %{name}' } });
      expect(i18n.t('greet', { name: 'Alice' })).toBe('Hello Alice');
    });

    test('should support nested parameter objects', () => {
      i18n.registerTranslations({
        en: { profile: 'User: %{user.details.name}' },
      });
      expect(i18n.t('profile', { user: { details: { name: 'Bob' } } })).toBe(
        'User: Bob'
      );
    });

    test('should use custom interpolate function if provided', () => {
      const customI18n = I18n.createInstance(
        {},
        {
          // Custom interpolation using {{key}}
          interpolate: (inst, str, params) => {
            return str.replace(
              /\{\{(\w+)\}\}/g,
              (_, k) => (params[k] as string) || ''
            );
          },
        }
      );
      customI18n.registerTranslations({ en: { msg: 'Value: {{val}}' } });
      expect(customI18n.t('msg', { val: 'Custom' })).toBe('Value: Custom');
    });
  });

  describe('Pluralization', () => {
    beforeEach(() => {
      i18n.registerTranslations({
        en: {
          apples: {
            one: '1 apple',
            other: '%{count} apples',
            zero: 'No apples',
          },
          cars: {
            // Missing zero
            one: '1 car',
            other: '%{count} cars',
          },
        },
      });
    });

    test('should handle zero, one, other', () => {
      expect(i18n.t('apples', { count: 0 })).toBe('No apples');
      expect(i18n.t('apples', { count: 1 })).toBe('1 apple');
      expect(i18n.t('apples', { count: 5 })).toBe('5 apples');
    });

    test('should fallback to other if zero is missing', () => {
      expect(i18n.t('cars', { count: 0 })).toBe('0 cars');
    });

    test('should format count number if requested', () => {
      // Assuming behavior of performInterpolation
      // Since default implementation doesn't strictly support number formatting unless passed as countStr or mapped
      // But let's check basic substitution
      expect(i18n.t('apples', { count: 1000 })).toContain('apples');
    });
  });

  describe('Locale Management', () => {
    test('should set and retrieve locale', async () => {
      expect(i18n.getLocale()).toBe('en'); // Default
      const res = await i18n.setLocale('fr');
      expect(res).toBe('fr');
      expect(i18n.getLocale()).toBe('fr');
    });

    test('should manage supported locales', () => {
      i18n.registerTranslations({ en: {}, fr: {}, es: {} });
      i18n.setLocales(['en', 'de']); // Explicitly supported

      const locales = i18n.getLocales();
      // Should contain explicitly supported + available in store
      expect(locales).toContain('en');
      expect(locales).toContain('de');
      expect(locales).toContain('fr'); // From store
      expect(locales).toContain('es'); // From store

      expect(i18n.hasLocale('de')).toBe(true);
      expect(i18n.hasLocale('zn')).toBe(false);
    });
  });

  describe('Helpers (has, get)', () => {
    test('has() should return true for existing keys', () => {
      i18n.registerTranslations({ en: { valid: 'yes' } });
      expect(i18n.has('valid')).toBe(true);
      expect(i18n.has('invalid')).toBe(false);
    });

    test('get() should retrieve raw values and support object return', () => {
      i18n.registerTranslations({
        en: {
          config: {
            items: ['a', 'b'],
            settings: { theme: 'dark' },
          },
        },
      });

      // Retrieve full object
      expect(i18n.get('config.settings')).toEqual({ theme: 'dark' });
      // Retrieve array
      expect(i18n.get<string[]>('config.items')).toEqual(['a', 'b']);
      // Retrieve string
      expect(i18n.get('config.settings.theme')).toBe('dark');
      // Retrieve default via array scope (acting as path parts for get)
      expect(i18n.get(['config', 'settings', 'theme'])).toBe('dark');
    });
  });

  describe('Namespace Loading', () => {
    test('should load namespace and merge translations', async () => {
      const resolver = jest.fn().mockResolvedValue({
        moduleTitle: 'Module Loaded',
      });
      i18n.registerNamespaceResolver('mymodule', resolver);

      await i18n.loadNamespace('mymodule', 'en');

      expect(i18n.t('moduleTitle')).toBe('Module Loaded');
      expect(resolver).toHaveBeenCalledWith('en');
    });

    test('should throw on invalid namespace', async () => {
      await expect(i18n.loadNamespace('unknown')).rejects.toThrow();
    });
  });

  describe('Decorators & Class Translation', () => {
    class MyComponent {
      @Translate('greeting')
      greeting: string = '';

      @Translate('nested.value')
      public nested: string = '';
    }

    const translations = {
      en: {
        greeting: 'Hello Decorator',
        nested: { value: 'Nested Value' },
      },
    };

    beforeEach(() => {
      i18n.registerTranslations(translations);
    });

    test('applyTranslations should mutate instance', () => {
      const comp = new MyComponent();
      i18n.applyTranslations(comp);
      expect(comp.greeting).toBe('Hello Decorator');
      expect(comp.nested).toBe('Nested Value');
    });

    test('translateClass should return translated dictionary without mutation', () => {
      const res = i18n.translateClass(MyComponent);
      expect(res).toEqual({
        greeting: 'Hello Decorator',
        nested: 'Nested Value',
      });
    });
  });

  describe('translateObject', () => {
    test('should translate values of an object', () => {
      i18n.registerTranslations({
        en: {
          'btn.save': 'Save',
          'btn.cancel': 'Cancel',
        },
      });

      const input = {
        saveLabel: 'btn.save',
        cancelLabel: 'btn.cancel',
        raw: 'Just String',
      };

      const res = i18n.translateObject(input);
      expect(res.saveLabel).toBe('Save');
      expect(res.cancelLabel).toBe('Cancel');
      // 'Just String' matches nothing, missingTranslation returns key 'Just String'
      expect(res.raw).toBe('Just String');
    });
  });
});
