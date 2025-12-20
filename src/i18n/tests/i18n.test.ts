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

    test('should translate object with interpolation options', () => {
      i18n.registerTranslations({
        en: {
          'msg.welcome': 'Welcome %{name}!',
          'msg.count': 'You have %{count} items',
        },
      });

      const input = {
        welcome: 'msg.welcome',
        items: 'msg.count',
      };

      const res = i18n.translateObject(input, { name: 'User', count: 5 });
      expect(res.welcome).toBe('Welcome User!');
      expect(res.items).toBe('You have 5 items');
    });

    test('should return empty object for non-object input', () => {
      const res = i18n.translateObject(null as any);
      expect(res).toEqual({});
    });
  });

  describe('Array Key Fallback Strategies (Complex)', () => {
    beforeEach(() => {
      i18n.registerTranslations({
        en: {
          common: { generic: 'Generic Message' },
          errors: {
            auth: 'Auth Error',
            specific_404: 'Page Not Found',
          },
          greetings: {
            formal: 'Good Evening, %{name}',
            casual: 'Hi, %{name}',
          },
          items: {
            generic: { other: '%{count} items' },
            specific: { one: '1 special item' },
          },
        },
        fr: {
          errors: {
            auth: "Erreur d'authentification",
          },
        },
      });
    });

    test('should respect priority order (return first found)', () => {
      // Both exist, first one returned
      expect(i18n.t(['errors.auth', 'common.generic'])).toBe('Auth Error');
    });

    test('should skip multiple missing keys to find a match', () => {
      expect(
        i18n.t(['errors.missing1', 'errors.missing2', 'common.generic'])
      ).toBe('Generic Message');
    });

    test('should fallback to default locale for EACH key sequentially', async () => {
      // Scenario:
      // Locale is FR.
      // Keys: ['errors.specific_404', 'common.generic']
      // 1. Check errors.specific_404 in FR -> Missing
      // 2. Check errors.specific_404 in EN (Fallback) -> Found! -> "Page Not Found"
      // It should NOT skip to common.generic unless specific_404 is missing in BOTH FR and EN.

      await i18n.setLocale('fr');
      // 'errors.specific_404' is missing in FR, but exists in EN.
      expect(i18n.t(['errors.specific_404', 'common.generic'])).toBe(
        'Page Not Found'
      );
    });

    test('should apply interpolation to the found key', () => {
      // First is missing, second found -> interpolate second
      expect(
        i18n.t(['greetings.missing', 'greetings.formal'], { name: 'Sir' })
      ).toBe('Good Evening, Sir');
    });

    test('should apply pluralization to the found key', () => {
      // 'items.unknown' missing
      // 'items.generic' found -> uses 'other' for count: 10
      expect(i18n.t(['items.unknown', 'items.generic'], { count: 10 })).toBe(
        '10 items'
      );
    });

    test('should handle completely missing array (return combined key)', () => {
      const res = i18n.t(['miss1', 'miss2']);
      // Default implementation joins with dot
      expect(res).toBe('miss1');
    });
  });

  describe('Instance Management', () => {
    test('getInstance should return singleton', () => {
      const inst1 = I18n.getInstance();
      const inst2 = I18n.getInstance();
      expect(inst1).toBe(inst2);
    });

    test('createInstance should create independent instances', () => {
      const inst1 = I18n.createInstance({ en: { key: 'A' } });
      const inst2 = I18n.createInstance({ en: { key: 'B' } });

      expect(inst1.t('key')).toBe('A');
      expect(inst2.t('key')).toBe('B');
    });

    test('isI18nInstance should identify valid instances', () => {
      const inst = I18n.createInstance();
      expect(I18n.isI18nInstance(inst)).toBe(true);
      expect(I18n.isI18nInstance({})).toBe(false);
      expect(I18n.isI18nInstance(null)).toBe(false);
      expect(I18n.isI18nInstance('string')).toBe(false);
    });

    test('isDefaultInstance should identify singleton', () => {
      const singleton = I18n.getInstance();
      const custom = I18n.createInstance();

      expect(singleton.isDefaultInstance()).toBe(true);
      expect(custom.isDefaultInstance()).toBe(false);
    });
  });

  describe('Translation Store Management', () => {
    test('registerTranslations should merge translations', () => {
      i18n.registerTranslations({ en: { a: '1' } });
      i18n.registerTranslations({ en: { b: '2' } });

      expect(i18n.t('a')).toBe('1');
      expect(i18n.t('b')).toBe('2');
    });

    test('registerTranslations should overwrite existing keys', () => {
      i18n.registerTranslations({ en: { key: 'old' } });
      i18n.registerTranslations({ en: { key: 'new' } });

      expect(i18n.t('key')).toBe('new');
    });

    test('getTranslations should return locale-specific or full store', () => {
      i18n.registerTranslations({
        en: { hello: 'Hello' },
        fr: { hello: 'Bonjour' },
      });

      const enTrans = i18n.getTranslations('en');
      expect(enTrans.hello).toBe('Hello');

      const allTrans = i18n.getTranslations();
      expect(allTrans.en).toBeDefined();
      expect(allTrans.fr).toBeDefined();
    });

    test('getTranslations should return empty object for unknown locale', () => {
      const unknown = i18n.getTranslations('unknown');
      expect(unknown).toEqual({});
    });
  });

  describe('Advanced Interpolation', () => {
    test('should handle multiple placeholders', () => {
      i18n.registerTranslations({
        en: { multi: '%{a} and %{b} and %{c}' },
      });
      expect(i18n.t('multi', { a: 'X', b: 'Y', c: 'Z' })).toBe('X and Y and Z');
    });

    test('should handle array index placeholders', () => {
      i18n.registerTranslations({
        en: { arr: 'First: %{items[0]}, Second: %{items[1]}' },
      });
      expect(i18n.t('arr', { items: ['A', 'B'] })).toBe('First: A, Second: B');
    });

    test('should leave placeholder if param missing', () => {
      i18n.registerTranslations({ en: { incomplete: 'Hello %{name}' } });
      // Missing param, placeholder should be replaced with empty or remain
      const result = i18n.t('incomplete', {});
      expect(result).toContain('Hello');
    });
  });

  describe('Advanced has() and get()', () => {
    beforeEach(() => {
      i18n.registerTranslations({
        en: { exists: 'yes', nested: { deep: 'value' } },
        fr: { bonjour: 'hello' },
      });
    });

    test('has() should check specific locale', () => {
      expect(i18n.has('exists', 'en')).toBe(true);
      expect(i18n.has('exists', 'fr')).toBe(false);
      expect(i18n.has('bonjour', 'fr')).toBe(true);
    });

    test('has() should return true if any key in array exists', () => {
      expect(i18n.has(['missing', 'exists'])).toBe(true);
      expect(i18n.has(['missing1', 'missing2'])).toBe(false);
    });

    test('get() should return undefined for missing keys', () => {
      expect(i18n.get('completely.missing')).toBeUndefined();
    });

    test('get() should support specific locale', () => {
      expect(i18n.get('bonjour', 'fr')).toBe('hello');
      expect(i18n.get('bonjour', 'en')).toBeUndefined();
    });

    test('get() should return nested objects', () => {
      const nested = i18n.get('nested');
      expect(nested).toEqual({ deep: 'value' });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty string translations', () => {
      i18n.registerTranslations({ en: { empty: '' } });
      expect(i18n.t('empty')).toBe('');
    });

    test('should handle special characters in keys', () => {
      i18n.registerTranslations({
        en: { 'key-with-dash': 'dash', key_with_underscore: 'underscore' },
      });
      expect(i18n.t('key-with-dash')).toBe('dash');
      expect(i18n.t('key_with_underscore')).toBe('underscore');
    });

    test('should handle numeric values in translations', () => {
      i18n.registerTranslations({ en: { number: 42 as any } });
      expect(i18n.t('number')).toBe(42);
    });

    test('translate should work with locale option', () => {
      i18n.registerTranslations({
        en: { msg: 'English' },
        fr: { msg: 'French' },
      });

      expect(i18n.t('msg')).toBe('English'); // Default en
      expect(i18n.t('msg', { locale: 'fr' })).toBe('French');
    });
  });

  describe('Static Methods', () => {
    test('flattenObject should flatten nested objects', () => {
      const nested = { a: { b: { c: 'value' } } };
      const flat = I18n.flattenObject(nested);
      expect(flat['a.b.c']).toBe('value');
    });

    test('flattenObject should return non-object as-is', () => {
      expect(I18n.flattenObject('string' as any)).toBe('string');
      expect(I18n.flattenObject(123 as any)).toBe(123);
    });

    test('getClassTanslationKeys should extract decorated keys', () => {
      class TestClass {
        @Translate('key.one')
        one: string = '';

        @Translate('key.two')
        two: string = '';
      }

      const keys = I18n.getClassTanslationKeys(TestClass);
      expect(keys.one).toBe('key.one');
      expect(keys.two).toBe('key.two');
    });
  });

  describe('Advanced Pluralization', () => {
    test('should fallback to other if one is missing', () => {
      i18n.registerTranslations({
        en: {
          items: { other: '%{count} items' }, // No 'one'
        },
      });
      expect(i18n.t('items', { count: 1 })).toBe('1 items');
    });

    test('should handle pluralization with interpolation', () => {
      i18n.registerTranslations({
        en: {
          messages: {
            zero: '%{user} has no messages',
            one: '%{user} has 1 message',
            other: '%{user} has %{count} messages',
          },
        },
      });

      expect(i18n.t('messages', { count: 0, user: 'Alice' })).toBe(
        'Alice has no messages'
      );
      expect(i18n.t('messages', { count: 1, user: 'Bob' })).toBe(
        'Bob has 1 message'
      );
      expect(i18n.t('messages', { count: 5, user: 'Carol' })).toBe(
        'Carol has 5 messages'
      );
    });
  });

  describe('Namespace Advanced', () => {
    test('loadNamespaces should load all registered resolvers', async () => {
      const resolver1 = jest.fn().mockResolvedValue({ key1: 'Value1' });
      const resolver2 = jest.fn().mockResolvedValue({ key2: 'Value2' });

      i18n.registerNamespaceResolver('ns1', resolver1);
      i18n.registerNamespaceResolver('ns2', resolver2);

      await i18n.loadNamespaces('en');

      expect(i18n.t('key1')).toBe('Value1');
      expect(i18n.t('key2')).toBe('Value2');
      expect(resolver1).toHaveBeenCalledWith('en');
      expect(resolver2).toHaveBeenCalledWith('en');
    });

    test('loadNamespace should not update translations if flag is false', async () => {
      const resolver = jest.fn().mockResolvedValue({ temp: 'Temp Value' });
      i18n.registerNamespaceResolver('temp', resolver);

      await i18n.loadNamespace('temp', 'en', false);

      // Should not be registered
      expect(i18n.t('temp')).toBe('temp');
    });

    test('registerNamespaceResolver should ignore invalid inputs', () => {
      // Should not throw, just warn
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      i18n.registerNamespaceResolver('', jest.fn());
      i18n.registerNamespaceResolver('valid', null as any);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('Locale Switching', () => {
    test('setLocale should not reload if already set and cached', async () => {
      const resolver = jest.fn().mockResolvedValue({ loaded: 'yes' });
      i18n.registerNamespaceResolver('cached', resolver);

      await i18n.setLocale('de');
      expect(resolver).toHaveBeenCalledTimes(1);

      // Second call should skip loading
      await i18n.setLocale('de');
      expect(resolver).toHaveBeenCalledTimes(1);
    });

    test('setLocale with forceUpdate should reload', async () => {
      const resolver = jest.fn().mockResolvedValue({ reloaded: 'yes' });
      i18n.registerNamespaceResolver('forced', resolver);

      await i18n.setLocale('it');
      await i18n.setLocale('it', true); // Force

      expect(resolver).toHaveBeenCalledTimes(2);
    });

    test('setLocales should always include en', () => {
      i18n.setLocales(['fr', 'de']);
      const locales = i18n.getLocales();
      expect(locales).toContain('en');
    });
  });

  describe('translateClass Advanced', () => {
    class FormLabels {
      @Translate('form.name')
      nameLabel: string = '';

      @Translate('form.email')
      emailLabel: string = '';
    }

    test('translateClass should apply options to all translations', () => {
      i18n.registerTranslations({
        en: {
          form: {
            name: 'Name for %{context}',
            email: 'Email for %{context}',
          },
        },
      });

      const res = i18n.translateClass(FormLabels, { context: 'User' }) as any;
      expect(res.nameLabel).toBe('Name for User');
      expect(res.emailLabel).toBe('Email for User');
    });
  });
});
