/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  buildPropertyDecorator,
  getDecoratedProperties,
} from '@/resources/decorators';
import * as defaultTranslations from '@/translations';
import { Logger } from '@logger';
import { Session as session } from '@session/index';
import { defaultStr } from '@utils/defaultStr';
import { interpolate } from '@utils/interpolate';
import { isNonNullString } from '@utils/isNonNullString';
import { extendObj, flattenObject, isObj } from '@utils/object';
import moment, { LocaleSpecification } from 'moment';
import 'reflect-metadata';

import { isNumber } from '@utils/isNumber';
import { ClassConstructor, Dictionary } from '../types/index';
import {
  I18nFormatter,
  I18nScope,
  I18nTranslateOptions,
  I18nTranslations,
} from './types';

export class I18n {
  constructor(
    translations: I18nTranslations = {},
    options: Partial<I18nOptions> = {}
  ) {
    if (isNonNullString(options.locale)) {
      this.locale = options.locale;
    }
    if (isNonNullString(options.fallbackLocale)) {
      this._fallbackLocale = options.fallbackLocale;
    }
    if (typeof options.interpolate === 'function') {
      this.interpolateFunc = options.interpolate;
    }

    // Register default translations for the default instance mostly
    // But helpful generally
    if (!this._hasDefaultTranslations) {
      this.registerTranslations(defaultTranslations);
      this._hasDefaultTranslations = true;
    }

    if (translations) {
      this.registerTranslations(translations);
    }

    // Load namespaces implicitly if any are set?
    // Usually logic implies explicit load calls or constructor doesn't do async.
    // The original code called loadNamespaces but that is async.
    // We can call it but not await it.
    this.loadNamespaces();
  }
  /**
   * Custom instanceof check. Checks if an object looks like an I18n instance.
   * @param obj The object to check.
   */

  static [Symbol.hasInstance](obj: any) {
    return this.isI18nInstance(obj);
  }

  /**
   * Type guard to check if an object is an instance of I18n.
   * Uses duck typing.
   * @param obj The object to check.
   */

  static isI18nInstance(obj: any): obj is I18n {
    if (!obj || typeof obj !== 'object') return false;
    // Check if it's an actual instance (if created via new I18n)
    // Note: This check might fail across realms/packages if we simply do instanceof I18n
    // So we rely on duck typing primarily.
    if (obj.constructor && obj.constructor.name === 'I18n') return true;

    return (
      typeof obj.getLocale === 'function' &&
      typeof obj.translate === 'function' &&
      typeof obj.translateClass === 'function' &&
      typeof obj.registerTranslations === 'function' &&
      typeof obj.loadNamespace == 'function' &&
      typeof obj.registerNamespaceResolver === 'function' &&
      typeof obj.locale === 'string'
    );
  }

  /**
   * Retrieves the singleton instance of the I18n class.
   * @param options Optional configuration options.
   * @returns The singleton I18n instance.
   */
  static getInstance(options?: Partial<I18nOptions>): I18n {
    if (!I18n.instance) {
      const locale = I18n.getLocaleFromSession();
      // Use "en" as default if session is empty or user didn't specify
      const opts: Partial<I18nOptions> = Object.assign(
        { locale: locale || 'en' },
        options
      );
      I18n.instance = new I18n({}, opts);
    }
    return I18n.instance;
  }

  /**
   * Factory method to create new I18n instances dynamically.
   * @param translations Initial translations.
   * @param options Configuration options.
   * @returns A new I18n instance.
   */
  static createInstance(
    translations: I18nTranslations = {},
    options: Partial<I18nOptions> = {}
  ): I18n {
    return new I18n(translations, options);
  }

  /**
   * Flattens a nested object into a single-level object with dot-notation keys.
   * @param obj Object to flatten.
   */

  static flattenObject(obj: any): Dictionary {
    if (!isObj(obj)) return obj;
    return flattenObject(obj);
  }

  static getLocaleFromSession(): string | undefined {
    const locale = session.get('i18n.locale');
    return isNonNullString(locale) ? locale : undefined;
  }

  static registerMomentLocale(
    locale: string,
    momentLocale: LocaleSpecification
  ): Record<string, LocaleSpecification> {
    if (
      isNonNullString(locale) &&
      isObj(momentLocale) &&
      Array.isArray(momentLocale.months)
    ) {
      this.momentLocales[locale] = extendObj(
        {},
        this.momentLocales[locale],
        momentLocale
      );
    }
    return this.momentLocales;
  }

  static getClassTanslationKeys<T extends ClassConstructor>(
    target: T
  ): Record<keyof T, string> {
    return getDecoratedProperties(target, TRANSLATION_KEY);
  }

  /**
   * Optional custom interpolator.
   */
  public interpolateFunc?: (
    i18n: I18n,
    str: string,
    params: Dictionary
  ) => string;

  /**
   * External missing placeholder handler.
   */
  public missingPlaceholder?: (
    i18n: I18n,
    placeholder: string,
    message: string,
    options?: Dictionary
  ) => string;

  /**
   * Translates a single key or a list of keys with support for pluralization and interpolation.
   *
   * This is the core method for retrieving localized strings. It executes the following logic:
   * 1. **Key Resolution**: Searches for the key in the current locale. If not found, checks for a fallback locale.
   * 2. **Fallback**: If the key is missing, looks for `options.defaultValue` or follows the missing key strategy (returns key).
   * 3. **Pluralization**: If `options.count` is provided, it attempts to find and return the pluralized form (zero, one, other).
   * 4. **Interpolation**: Replaces placeholders (e.g. `%{name}`) with values from `options`.
   *
   * @template T - The expected return type (defaults to `string`).
   * @param scope - The translation key (e.g. "auth.login") or an array of keys to try in order.
   * @param options - Configuration options (interpolation params, `count` for pluralization, `locale`, etc).
   * @returns The resolved translation string (or type `T`), interpolated and formatted.
   *
   * @example
   * // Basic
   * i18n.translate("welcome");
   *
   * @example
   * // Interpolation & Pluralization
   * i18n.translate("messages.inbox", { count: 3, user: "Alice" });
   * // "Alice, you have 3 messages"
   */
  public translate<T = string>(
    scope: I18nScope,
    options?: I18nTranslateOptions
  ): T {
    options = options || {};
    const locale = defaultStr(options?.locale, this.getLocale());

    // 1. Resolve key
    const keys: string[] = Array.isArray(scope) ? scope : [scope];
    let resolvedValue: any = undefined;

    // Simple lookup loop
    for (const key of keys) {
      if (!isNonNullString(key)) continue;
      // Resolve value from storage
      let res = this.lookup(key, locale);

      // If not found, try fallback locale if different
      if (res === undefined && locale !== this._fallbackLocale) {
        res = this.lookup(key, this._fallbackLocale);
      }

      if (res !== undefined) {
        resolvedValue = res;
        break;
      }
    }

    // 2. Handle missing translation
    if (resolvedValue === undefined) {
      if (options.defaultValue !== undefined) {
        return options.defaultValue as unknown as T;
      }
      // Return key as fallback
      // Check if user expected a string result?
      // Usually we return the key.
      return this.missingTranslation(scope, options) as unknown as T;
    }

    // 3. Handle Pluralization if needed
    if (typeof options.count === 'number' && isObj(resolvedValue)) {
      const count = options.count;
      let pluralKey = 'other';
      if (count === 0 && resolvedValue['zero'] !== undefined)
        pluralKey = 'zero';
      else if (count === 1 && resolvedValue['one'] !== undefined)
        pluralKey = 'one';

      if (resolvedValue[pluralKey] !== undefined) {
        resolvedValue = resolvedValue[pluralKey];
      } else if (resolvedValue['other']) {
        resolvedValue = resolvedValue['other'];
      }
    }

    // 4. Interpolation
    if (typeof resolvedValue === 'string') {
      // Format count if present
      if (isNumber(options.count) && !options.countStr) {
        options.countStr =
          typeof options.count?.formatNumber == 'function'
            ? options.count.formatNumber()
            : options.count.toString();
      }

      resolvedValue = this.performInterpolation(resolvedValue, options);
    }

    return resolvedValue as T;
  }

  /**
   * An alias for `translate`.
   *
   * A concise helper method for calling {@link translate}.
   *
   * @see {@link translate}
   * @param scope - The translation key or keys.
   * @param options - Translation options.
   * @returns The translated result.
   */
  public t(scope: I18nScope, options?: I18nTranslateOptions) {
    return this.translate(scope, options);
  }

  /**
   * Checks if a translation exists.
   */
  public has(scope: I18nScope, locale?: string): boolean {
    const l = locale || this.getLocale();
    const keys: string[] = Array.isArray(scope) ? scope : [scope];
    for (const key of keys) {
      if (this.lookup(key, l) !== undefined) return true;
    }
    return false;
  }

  public getLocale(): string {
    return this.locale;
  }

  public async setLocale(
    locale: string,
    forceUpdate: boolean = false
  ): Promise<string> {
    if (
      this.locale === locale &&
      forceUpdate !== true &&
      this._namespacesLoaded[locale]
    ) {
      return this.locale;
    }
    await this.loadNamespaces(locale);
    this.locale = locale;

    if (this.isDefaultInstance()) {
      I18n.setLocaleToSession(locale);
    }
    this.setMomentLocale(locale);
    return this.locale;
  }

  public setLocales(locales: string[]) {
    this._locales = Array.isArray(locales) ? locales : ['en'];
    if (!this._locales.includes('en')) {
      this._locales.push('en');
    }
    return this.getLocales();
  }

  public getLocales(): string[] {
    const definedLocales = Object.keys(this._translations);
    const supported = Array.isArray(this._locales) ? this._locales : ['en'];
    const r = [
      ...definedLocales,
      ...supported.filter((l) => !definedLocales.includes(l)),
    ];
    // Unify
    return Array.from(new Set(r));
  }

  public hasLocale(locale: string) {
    return isNonNullString(locale) && this.getLocales().includes(locale);
  }

  public isDefaultInstance() {
    return this === I18n.instance;
  }

  /**
   * Registers and merges new translations into the global store.
   *
   * This method merges the provided translation object with the existing translations.
   * New keys are added, and existing keys are updated (overwritten).
   *
   * @param translations - The translations to register, grouped by locale.
   * @returns The updated translation store.
   *
   * @example
   * i18n.registerTranslations({
   *   en: { title: "Welcome" },
   *   fr: { title: "Bienvenue" }
   * });
   */
  public registerTranslations(
    translations: I18nTranslations
  ): I18nTranslations {
    this._translations = extendObj({}, this._translations, translations);
    return this._translations;
  }

  /**
   * Retrieves specific translations or the entire store.
   *
   * @param locale - The locale to retrieve translations for. If omitted, returns the entire store.
   * @returns A dictionary of translations (for a locale) or the full store (if no locale provided).
   */
  public getTranslations(locale?: string): Dictionary {
    if (isNonNullString(locale)) {
      return this._translations[locale] || {};
    }
    return this._translations;
  }

  public registerNamespaceResolver(
    namespace: string,
    resolver: (locale: string) => Promise<Dictionary>
  ): void {
    if (!isNonNullString(namespace) || typeof resolver !== 'function') {
      console.warn('Invalid arguments for registerNamespaceResolver.');
      return;
    }
    this.namespaceResolvers[namespace] = resolver;
  }

  public loadNamespace(
    namespace: string,
    locale?: string,
    updateTranslations: boolean = true
  ): Promise<Dictionary> {
    if (!isNonNullString(namespace) || !this.namespaceResolvers[namespace]) {
      return Promise.reject(
        new Error(`Invalid namespace or resolver for namespace "${namespace}".`)
      );
    }
    locale = defaultStr(locale, this.getLocale());
    if (!isNonNullString(locale)) {
      return Promise.reject(
        new Error(`Locale is not set. Cannot load namespace "${namespace}".`)
      );
    }

    return this.namespaceResolvers[namespace](locale).then((translations) => {
      const dict: Dictionary = {};
      dict[locale as string] = Object.assign({}, translations);

      if (isObj(translations)) {
        if (updateTranslations !== false) {
          this.registerTranslations(dict);
        }
      }
      return dict;
    });
  }

  async loadNamespaces(
    locale?: string,
    updateTranslations: boolean = true
  ): Promise<I18nTranslations> {
    locale = defaultStr(locale, this.getLocale());

    const processes = [];
    const collected: Dictionary = {};

    for (const namespace in this.namespaceResolvers) {
      if (
        Object.prototype.hasOwnProperty.call(this.namespaceResolvers, namespace)
      ) {
        processes.push(
          this.namespaceResolvers[namespace](locale).then((trs) => {
            extendObj(collected, trs);
          })
        );
      }
    }
    await Promise.all(processes);
    const dict: I18nTranslations = {};
    dict[locale!] = collected;

    if (updateTranslations !== false) {
      this.registerTranslations(dict);
    }
    this._namespacesLoaded[locale!] = true;

    return dict;
  }

  /**
   * Retrieves a raw translation value or object from the store for a specific scope and locale.
   *
   * This method provides direct access to the translation structure without performing
   * interpolation, pluralization, or missing key fallbacks. It strictly traverses
   * the object tree based on the provided dot-separated scope or array path.
   *
   * It is particularly useful for:
   * - Retrieving entire sections of translations (e.g., a dictionary of validation messages).
   * - Accessing lists/arrays defined in the localization files.
   * - Checking if a specific key or branch exists in the store.
   *
   * Key Resolution:
   * - Dots in the scope string are ALWAYS treated as separators (traversal).
   * - To match keys containing literal dots, use `lookup` internally or ensure your store structure matches.
   *
   * @template T - The expected return type (defaults to `string | Dictionary`).
   * @param scope - The path to the value. Can be a dot-separated string (e.g., "auth.login.title")
   *                or an array of keys (e.g., ["auth", "login"]).
   * @param locale - The locale to search in. Defaults to the current instance locale if omitted.
   * @returns The value at the specified path cast to `T`, or `undefined` if resolution fails.
   *
   * @example
   * // Get a simple string
   * const title = i18n.get("app.title");
   *
   * @example
   * // Get a full dictionary object
   * const validationMessages = i18n.get<Dictionary>("validation");
   * // Result: { required: "Field is required", email: "Invalid email" }
   *
   * @example
   * // Get from a specific locale (e.g. 'fr')
   * const label = i18n.get("button.submit", "fr");
   */
  public get<T = string | Dictionary>(
    scope: I18nScope,
    locale?: string
  ): T | undefined {
    locale = defaultStr(locale, this.getLocale());
    const parts = (
      isNonNullString(scope)
        ? scope.trim().split('.')
        : Array.isArray(scope)
          ? scope
          : []
    ).filter(isNonNullString);

    if (!parts.length) return undefined;

    let result: any = this.getTranslations(locale);
    for (const k of parts) {
      if (isObj(result)) {
        result = result[k];
      } else {
        return undefined;
      }
    }
    return result as T;
  }

  /**
   * Resolves and translates properties decorated with `@Translate` on a specific class.
   *
   * This method uses reflection to find properties on the `target` that have been decorated
   * with the `@Translate` decorator. It retrieves the translation keys stored in the metadata,
   * translates them using the current locale and options, and returns a mapped object.
   *
   * **Note**: This does NOT modify the class itself. It returns a separate object containing
   * the translated values for the decorated properties.
   *
   * Use Cases:
   * - Fetching all localized labels for a specific component or form class.
   * - aggregating static translation requirements for a module.
   *
   * @template T - The constructor type of the target class.
   * @param target - The class constructor to inspect for `@Translate` decorators.
   * @param options - Optional translation options (arguments, locale) to apply to all keys.
   * @returns A dictionary mapping the property names to their translated string values.
   *
   * @example
   * class AuthForm {
   *   @Translate("auth.title")
   *   static formTitle: string;
   *
   *   @Translate("auth.submit")
   *   static submitBtn: string;
   * }
   *
   * const texts = i18n.translateClass(AuthForm);
   * // Returns: { formTitle: "Login", submitBtn: "Sign In" }
   */
  public translateClass<T extends ClassConstructor>(
    target: T,
    options?: I18nTranslateOptions
  ): Record<keyof T, string> {
    const translationKeys = I18n.getClassTanslationKeys(target);

    for (const i in translationKeys) {
      if (isNonNullString(translationKeys[i])) {
        (translationKeys as any)[i] = this.translate(
          translationKeys[i],
          options
        );
      }
    }
    return translationKeys;
  }

  /**
   * Translates the string values of a given object, treating them as translation keys.
   *
   * This method iterates over the provided object's properties. If a property value is a string,
   * it treats that string as a translation scope (key) and attempts to translate it using the
   * current or specified locale.
   *
   * Key Behaviors:
   * - **Shallow Processing**: It processes only the top-level properties of the object. It does not recurse into nested objects.
   * - **Immutability**: It returns a new object with the translated values, ensuring the original object remains unmodified.
   * - **Type Safety**: It is typed to accept objects where values are strings (translation keys).
   * - **Filtering**: Only non-null string values are processed and included in the result. Non-string values are omitted.
   *
   * Use cases:
   * - specific dictionaries of labels (e.g. for dropdown options or map keys).
   * - Batch translating a set of related keys.
   *
   * @template T - The type of the object (must extend Record<string, string>).
   * @param object - The object containing translation keys as values.
   * @param options - Optional translations options (e.g., interpolation parameters) that will be applied to EVERY translation in the object.
   * @returns A new object with the same keys but translated values.
   *
   * @example
   * const keys = {
   *   welcome: "app.welcome",
   *   goodbye: "app.goodbye"
   * };
   *
   * const texts = i18n.translateObject(keys);
   * // Returns: { welcome: "Welcome!", goodbye: "Goodbye!" }
   *
   * @example
   * // Using interpolation parameters for all keys
   * const keys = { msg: "alerts.user_msg" }; // "alerts.user_msg" -> "User: %{user}"
   * const result = i18n.translateObject(keys, { user: "Bob" });
   * // Returns: { msg: "User: Bob" }
   */
  public translateObject<T extends Record<string, string>>(
    object: T,
    options?: I18nTranslateOptions
  ): T {
    if (!isObj(object)) return {} as T;
    const translatedKeys: T = {} as T;
    for (const key in object) {
      const i18nKey = object[key];
      if (isNonNullString(i18nKey)) {
        (translatedKeys as any)[key] = this.translate(i18nKey, options);
      }
    }
    return translatedKeys;
  }

  /**
   * Applies translations to the decorated properties of a target object instance.
   *
   * This method performs a lookup for properties on the `target` object that have been
   * decorated with `@Translate`. For each such property, it resolves the translation
   * using the stored key and overwrites the property's value on the instance.
   *
   * **Side Effect Warning**: This method **mutates** the `target` object in place.
   *
   * Use Cases:
   * - Hydrating a component instance with localized strings after initialization or locale change.
   * - Converting a DTO with annotated fields into a display-ready object.
   *
   * @template T - The type of the target object.
   * @param target - The object instance to apply translations to.
   *
   * @example
   * class Page {
   *   @Translate("page.title")
   *   title: string = "";
   * }
   *
   * const page = new Page();
   * i18n.applyTranslations(page);
   * console.log(page.title); // "My Page Title"
   */
  public applyTranslations<T extends object>(target: T): void {
    try {
      const keys = Object.getOwnPropertyNames(target);
      for (const key of keys) {
        const metadataKey = Reflect.getMetadata(TRANSLATION_KEY, target, key);
        if (metadataKey) {
          try {
            (target as any)[key] = this.translate(metadataKey);
          } catch (error) {
            Logger.error(
              error,
              ' resolving translation for key : ',
              metadataKey,
              ' on object : ',
              target
            );
          }
        }
      }
    } catch (error) {
      Logger.error(error, ' resolving translations for object : ', target);
    }
  }

  // -------------------------------------------------------------------------
  // Instance Properties
  // -------------------------------------------------------------------------

  /**
   * The current locale.
   */
  private locale: string = 'en';

  /**
   * Supported locales.
   */
  private _locales: string[] = ['en'];

  /**
   * Fallback locale.
   */
  private _fallbackLocale: string = 'en';

  /**
   * Dictionary of translations: { locale: { key: "value", ... } }
   */
  private _translations: I18nTranslations = {};

  /**
   * Namespace resolvers.
   */
  private namespaceResolvers: Record<
    string,
    (locale: string) => Promise<Dictionary>
  > = {};

  private _namespacesLoaded: Dictionary = {};
  private _hasDefaultTranslations: boolean = false;

  /**
   * Singleton instance of the I18n class.
   */
  private static instance: I18n;

  /**
   * Fallback method when translation is missing.
   */

  private missingTranslation(
    scope: I18nScope,

    options?: I18nTranslateOptions
  ): string {
    const scopeString = Array.isArray(scope)
      ? scope.filter(isNonNullString).join('.')
      : defaultStr(scope);
    if (typeof this.missingPlaceholder == 'function') {
      return this.missingPlaceholder(
        this,
        scopeString,
        defaultStr(options?.defaultValue),
        options
      );
    }
    return scopeString;
  }

  // Moment locales
  private static momentLocales: Record<string, LocaleSpecification> = {};

  /**
   * Lookup a key in the translations for a locale.
   * Supports dot notation 'a.b.c'.
   */
  private lookup(key: string, locale: string): any {
    const localeTable = this._translations[locale];
    if (!localeTable) return undefined;

    // Direct access first
    if (Object.prototype.hasOwnProperty.call(localeTable, key)) {
      return localeTable[key];
    }

    // Deep access
    const parts = key.split('.');

    let current: any = localeTable;
    for (const part of parts) {
      if (
        isObj(current) &&
        Object.prototype.hasOwnProperty.call(current, part)
      ) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    return current;
  }
  /**
   * Performs the interpolation on a string.
   */
  private performInterpolation(str: string, params: Dictionary): string {
    // Flatten params for nested access (user.name)
    const flatParams = flattenObject(params);

    // Use custom interpolator if defined
    if (this.interpolateFunc) {
      return this.interpolateFunc(this, str, params);
    }

    // Internal default interpolation (%{key}) via utility
    return this.defaultInterpolator(str, flatParams);
  }

  private defaultInterpolator(str: string, params: Dictionary): string {
    return interpolate(str, params, {
      tagRegex: /%\{([^}]+)\}/g,
    });
  }
  // Locale utils
  private static setLocaleToSession(locale: string) {
    session.set('i18n.locale', locale);
  }

  private getMomentLocale(locale: string): LocaleSpecification {
    return I18n.momentLocales[locale];
  }

  private setMomentLocale(locale: string): boolean {
    try {
      moment.updateLocale(locale, this.getMomentLocale(locale));
      return true;
    } catch (error) {
      console.error(error, ' setting moment locale : ', locale);
    }
    return false;
  }
}

// Export singleton
const i18n = I18n.getInstance();
export { i18n };

/**
 * A key to registerTranslations metadata for translations.
 */
const TRANSLATION_KEY = Symbol('TRANSLATION_KEY');

/**
 * A decorator to attach metadata to properties or methods for translation.
 * @param key The translation key in the translations.
 * @returns A property and method decorator.
 * @example
 * ```ts
 *   // Class with translations using the decorator
 *     class MyComponent {
 *         @Translate("greeting")
 *         public greeting: string;
 *
 *         @Translate("nested.example")
 *         public nestedExample: string;
 *
 *         @Translate("farewell")
 *         public sayGoodbye(): string {
 *             return "";
 *         }
 *     }
 * ```
 */
export function Translate(key: string): PropertyDecorator & MethodDecorator {
  return buildPropertyDecorator<string>(TRANSLATION_KEY, key);
}

/**
 * @interface I18nOptions
 * Options for configuring internationalization (i18n) settings.
 *
 * This interface defines the options that can be used to customize
 * the behavior of the i18n system, including the locale, fallback
 * locale, and a custom formatter for string values.
 *
 * @property {string} locale - The primary locale to use for translations.
 * @property {string} [fallbackLocale] - An optional fallback locale to use if the primary locale is not available.
 * @property {I18nFormatter} [formatter] - An optional custom formatter function for formatting strings.
 *
 * @example
 * const i18nOptions: I18nOptions = {
 *     locale: "en",
 *     fallbackLocale: "es",
 *     formatter: (value, params) => value.replace(/{(\w+)}/g, (_, key) => params[key] || '')
 * };
 */
export interface I18nOptions {
  /**
   * The primary locale to use for translations.
   *
   * @type {string}
   * @example
   * const currentLocale = i18nOptions.locale; // "en"
   */
  locale: string;

  /**
   * An optional fallback locale to use if the primary locale is not available.
   *
   * @type {string}
   * @example
   * const fallback = i18nOptions.fallbackLocale; // "es"
   */
  fallbackLocale?: string;

  /**
     * An optional custom formatter function for formatting strings.
     * 
     * @type {I18nFormatter}
     * @example
     * const formattedString = i18nOptions.formatter("Hello, {name}!", { name: "Alice" });
     * // Outputs: "Hello, Alice!"
    ```typescript
     * 
     * @example
     * const i18nOptions: I18nOptions = {
     *     locale: "en",
     *     fallbackLocale: "es",
     *     formatter: (value, params) => value.replace(/{(\w+)}/g, (_, key) => params[key] || '')
     * };
     */
  formatter?: I18nFormatter;

  /**
   * Optional custom interpolation.
   */
  interpolate?: (i18n: I18n, str: string, params: Dictionary) => string;
}
