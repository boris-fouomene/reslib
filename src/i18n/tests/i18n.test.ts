import '../../utils';
import { I18n, Translate } from '../index';
import { I18nTranslation } from '../types';

describe('I18n', () => {
  let i18n: I18n;

  beforeEach(() => {
    // Reset singleton instance for fresh tests if possible,
    // or just use a new instance via createInstance
    i18n = I18n.createInstance();
    i18n.registerTranslations({
      en: {
        resources: {},
        validator: {
          length: 'This field must be exactly %{length} characters long',
          lengthRange:
            'This field must be between %{minLength} and %{maxLength} characters long',
          numberLTE:
            'This field must be less than or equal to %{ruleParams[0]}',
          numberLT: 'This field must be less than %{ruleParams[0]}',
          numberGTE:
            'This field must be greater than or equal to %{ruleParams[0]}',
          numberGT: 'This field must be greater than %{ruleParams[0]}',
          noteEquals: 'This field must be different from %{ruleParams[0]}',
          numberIsDifferentFrom:
            'This field must be different from %{ruleParams[0]}',
          numberEquals: 'This field must be equal to %{ruleParams[0]}',
        },
      },
    });
  });

  test('should return correct translation from validator length rules', () => {
    expect(i18n.t('validator.length', { length: 10 })).toBe(
      'This field must be exactly 10 characters long'
    );
    expect(
      i18n.t('validator.lengthRange', { minLength: 5, maxLength: 10 })
    ).toBe('This field must be between 5 and 10 characters long');
    expect(i18n.t('validator.numberLTE', { ruleParams: [10] })).toBe(
      'This field must be less than or equal to 10'
    );
    expect(i18n.t('validator.numberLT', { ruleParams: [10] })).toBe(
      'This field must be less than 10'
    );
  });

  test('exported default instance must be recognized as I18n', () => {
    // Check basic API existence
    const instance = I18n.getInstance();
    expect(typeof instance.getLocale).toBe('function');
    expect(typeof instance.translate).toBe('function');

    // Check instanceof
    const created = I18n.createInstance();
    expect(I18n.isI18nInstance(created)).toBe(true);
    // Duck typing
    expect((I18n as any)[Symbol.hasInstance](created)).toBe(true);
  });

  test('should register and retrieve translations', async () => {
    const translations: I18nTranslation = {
      en: {
        greeting: 'Hello, %{name}!',
        farewell: 'Goodbye!',
      },
      fr: {
        greeting: 'Bonjour, %{name}!',
      },
    };
    i18n.registerTranslations(translations);

    expect(i18n.t('greeting', { name: 'John' })).toBe('Hello, John!');
    expect(i18n.t('farewell')).toBe('Goodbye!');

    // Switch locale
    await i18n.setLocale('fr');
    expect(i18n.t('greeting', { name: 'Pierre' })).toBe('Bonjour, Pierre!');
  });

  test('should load namespace and update translations', async () => {
    const namespaceResolver = jest.fn().mockResolvedValue({
      greeting: 'Hello, %{name}!',
    });
    i18n.registerNamespaceResolver('common', namespaceResolver);
    const translations = await i18n.loadNamespace('common', 'en');
    expect(translations).toEqual({ en: { greeting: 'Hello, %{name}!' } });
    expect(i18n.t('greeting', { name: 'John' })).toBe('Hello, John!');
  });

  test('should handle invalid namespace', async () => {
    await expect(i18n.loadNamespace('invalid')).rejects.toThrow();
  });

  // Decorator Tests
  class MyComponent {
    @Translate('greeting')
    greeting: string = '';

    @Translate('nested.example')
    public nestedExample: string = '';
  }

  const translationsV: I18nTranslation = {
    en: {
      greeting: 'Hello Decorator!',
      nested: {
        example: 'Nested Decorator',
      },
    },
  };

  test('should resolve translations using decorator', () => {
    i18n.registerTranslations(translationsV);
    const component = new MyComponent();
    i18n.applyTranslations(component);
    expect(component.greeting).toBe('Hello Decorator!');
    expect(component.nestedExample).toBe('Nested Decorator');
  });

  it('Expect translated options of my component', () => {
    i18n.registerTranslations(translationsV);
    const translatedOptions = i18n.translateClass(MyComponent);
    expect(translatedOptions).toEqual({
      greeting: 'Hello Decorator!',
      nestedExample: 'Nested Decorator',
    });
  });

  test('should set and get locale', async () => {
    await i18n.setLocale('fr');
    expect(i18n.getLocale()).toBe('fr');
  });

  test('should support pluralization', () => {
    const instance = I18n.createInstance(
      {
        en: {
          apples: {
            one: '1 apple',
            other: '%{count} apples',
            zero: 'No apple',
          },
        },
      },
      { locale: 'en' }
    );

    expect(instance.translate('apples', { count: 1 })).toBe('1 apple');
    expect(instance.translate('apples', { count: 5 })).toBe('5 apples');
    expect(instance.translate('apples', { count: 0 })).toBe('No apple');
  });

  test('should fallback to other if zero/one missing', () => {
    const instance = I18n.createInstance(
      {
        en: {
          cars: {
            other: '%{count} cars',
          },
        },
      },
      { locale: 'en' }
    );
    expect(instance.translate('cars', { count: 1 })).toBe('1 cars');
  });

  test('get should resolve deep paths', () => {
    const inst = I18n.createInstance(
      {
        en: {
          nested: {
            deep: {
              value: 'X',
            },
          },
        },
      },
      { locale: 'en' }
    );

    expect(inst.get('nested.deep.value')).toBe('X');
    expect(inst.get(['nested', 'deep', 'value'])).toBe('X');
  });

  test('translateObject should translate values', () => {
    const inst = I18n.createInstance({
      en: {
        'lbl.name': 'Name',
        'lbl.age': 'Age',
      },
    });

    const input = {
      nameLabel: 'lbl.name',
      ageLabel: 'lbl.age',
      ignore: 'missing.key',
    };

    const res: any = inst.translateObject(input);
    expect(res.nameLabel).toBe('Name');
    expect(res.ageLabel).toBe('Age');
    expect(res.ignore).toBe('missing.key');
  });
});
