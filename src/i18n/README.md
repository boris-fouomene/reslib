# I18n Module Documentation

The `reslib/i18n` module is a comprehensive, framework-agnostic internationalization library for TypeScript/JavaScript applications. It provides a robust set of features for managing translations, pluralization, interpolation, and locale state, with specific support for class-based architectures via decorators.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Configuration & Instance Management](#configuration--instance-management)
3. [Translation Basics](#translation-basics)
   - [Simple Keys](#simple-keys)
   - [Nested Keys](#nested-keys)
   - [Fallback Keys](#fallback-keys)
4. [Interpolation](#interpolation)
   - [Basic Placeholders](#basic-placeholders)
   - [Nested Data Access](#nested-data-access)
   - [Custom Interpolators](#custom-interpolators)
5. [Pluralization](#pluralization)
6. [Advanced Data Access (`get`)](#advanced-data-access-get)
7. [Locale Management](#locale-management)
   - [Session Persistence](#session-persistence)
   - [Moment.js Integration](#momentjs-integration)
8. [Class & Property Translation](#class--property-translation)
   - [The `@Translate` Decorator](#the-translate-decorator)
   - [Static Translation (`translateClass`)](#static-translation-translateclass)
   - [Instance Hydration (`applyTranslations`)](#instance-hydration-applytranslations)
9. [Utilities](#utilities)
   - [`translateObject`](#translateobject)
   - [`has`](#has)
10. [Lazy Loading & Namespaces](#lazy-loading--namespaces)

---

## Quick Start

Initialize the singleton i18n instance and register your first translations.

```typescript
import { I18n } from 'reslib/i18n';

// 1. Get the singleton instance (auto-created if not exists)
const i18n = I18n.getInstance({
  locale: 'en',
  fallbackLocale: 'en',
});

// 2. Register translations
i18n.registerTranslations({
  en: {
    greeting: 'Hello World',
    auth: {
      login: 'Sign In',
    },
  },
  fr: {
    greeting: 'Bonjour le monde',
    auth: {
      login: 'Se connecter',
    },
  },
});

// 3. Translate
console.log(i18n.t('greeting')); // "Hello World"
console.log(i18n.t('auth.login')); // "Sign In"

// 4. Switch Locale
await i18n.setLocale('fr');
console.log(i18n.t('greeting')); // "Bonjour le monde"
```

---

## Configuration & Instance Management

### Singleton vs. New Instance

For most applications, the **singleton** pattern is sufficient. It allows you to configure `I18n` once and import it anywhere.

```typescript
// Access global singleton
const i18n = I18n.getInstance();
```

However, if you need isolated contexts (e.g., server-side rendering per request, or isolated testing), create a fresh instance:

```typescript
const isolatedI18n = I18n.createInstance(
  // Initial translations
  { en: { title: 'Isolated' } },
  // Options
  {
    locale: 'en',
    fallbackLocale: 'es',
    // Custom interpolate function override
    interpolate: (i18n, str, params) => str,
  }
);
```

### Options

| Option           | Type       | Default     | Description                                             |
| :--------------- | :--------- | :---------- | :------------------------------------------------------ |
| `locale`         | `string`   | `'en'`      | The active locale.                                      |
| `fallbackLocale` | `string`   | `'en'`      | Locale to use if a key is missing in the active locale. |
| `interpolate`    | `Function` | `undefined` | Custom function to handle string interpolation.         |

---

## Translation Basics

### Simple Keys

Keys are case-sensitive strings mapping to values in your translation store.

```typescript
i18n.registerTranslations({ en: { save: 'Save' } });
i18n.t('save'); // "Save"
```

### Nested Keys

You can organize translations into nested objects and access them using dot notation. This is ideal for grouping validation messages, page content, etc.

```typescript
i18n.registerTranslations({
  en: {
    validation: {
      required: 'This field is required',
      length: {
        min: 'Too short',
      },
    },
  },
});

i18n.t('validation.required'); // "This field is required"
i18n.t('validation.length.min'); // "Too short"
```

### Fallback Keys

If you are unsure if a specific key exists (e.g., dynamic error codes), you can provide an array of keys. `I18n` treats this as a **priority list**: it checks each key in order and returns the translation for the **first key found**.

```typescript
// "api.errors.500" does not exist
// "api.errors.generic" exists -> "An error occurred"
i18n.t(['api.errors.500', 'api.errors.generic']); // "An error occurred"
```

**Missing Key Behavior**:
If **none** of the keys in the array are found (and no default value is provided), `I18n` returns the **first key** in the array as the fallback.

```typescript
// Both missing
i18n.t(['miss1', 'miss2']); // Returns "miss1"
```

---

## Interpolation

Interpolation allows you to inject dynamic values into your translations.

### Basic Placeholders

Use `%{variableName}` syntax by default.

```typescript
i18n.registerTranslations({
  en: { welcome: 'Welcome, %{name}!' },
});

i18n.t('welcome', { name: 'John' }); // "Welcome, John!"
```

### Nested Data Access

You can pass complex objects and access their properties using dot notation in the placeholder.

```typescript
i18n.registerTranslations({
  en: {
    updated_by: 'Last updated by %{user.profile.name} on %{date}',
  },
});

const userObj = {
  profile: { name: 'Admin' },
};

i18n.t('updated_by', {
  user: userObj,
  date: '2023-01-01',
});
// "Last updated by Admin on 2023-01-01"
```

### Custom Interpolators

If you prefer a different syntax (e.g., `{{name}}`), you can override the interpolation logic.

```typescript
const i18n = I18n.createInstance(
  {},
  {
    interpolate: (i18n, message, params) => {
      // Simple regex for {{key}}
      return message.replace(/\{\{(\w+)\}\}/g, (_, k) => params[k] || '');
    },
  }
);
```

---

## Pluralization

I18n supports basic pluralization out of the box using `zero`, `one`, and `other` keys.

**Rules:**

1. If `count` is passed in options, I18n looks for a sub-object at the key.
2. If `count === 0`, it tries `zero`.
3. If `count === 1`, it tries `one`.
4. Otherwise, it uses `other`.
5. Fallback: If `zero` or `one` is missing, it falls back to `other`.

```typescript
i18n.registerTranslations({
  en: {
    inbox: {
      zero: 'You have no new messages',
      one: 'You have 1 new message',
      other: 'You have %{count} new messages',
    },
  },
});

i18n.t('inbox', { count: 0 }); // "You have no new messages"
i18n.t('inbox', { count: 1 }); // "You have 1 new message"
i18n.t('inbox', { count: 5 }); // "You have 5 new messages"
```

---

## Advanced Data Access (`get`)

Sometimes you need to retrieve raw data structures (like arrays of options or configuration objects) rather than a translated string. The `get` method is designed for this.

**Signature covers:** `get<T>(scope: string | string[], locale?: string): T | undefined`

```typescript
i18n.registerTranslations({
  en: {
    roles: ['Admin', 'Editor', 'Viewer'],
    ui: {
      colors: { primary: '#000', secondary: '#FFF' },
    },
  },
});

// 1. Retrieve an Array
const roles = i18n.get<string[]>('roles');
// ["Admin", "Editor", "Viewer"]

// 2. Retrieve an Object
const theme = i18n.get<Dictionary>('ui.colors');
// { primary: "#000", secondary: "#FFF" }

// 3. Check for existence (returns undefined if missing)
const missing = i18n.get('ui.fonts');
// undefined
```

> **Note**: `get()` does **not** perform interpolation or pluralization. It is strictly a store accessor.

---

## Locale Management

### Setting the Locale

Changing the locale is an asynchronous operation because it may trigger the lazy loading of namespaces.

```typescript
// 1. Sets internal state
// 2. Loads namespaces (if configured)
// 3. Updates Moment.js locale (if registered)
// 4. Persists to session
await i18n.setLocale('es');
```

### Supported Locales

You can define which locales your application supports explicitly.

```typescript
i18n.setLocales(['en', 'fr', 'es']);

// Returns supported + any others found in the store
const available = i18n.getLocales();
```

### Session Persistence

The singleton instance automatically attempts to persist the locale to the `Session` storage (using key `i18n.locale`). When `getInstance()` is called, it checks this storage first.

### Moment.js Integration

If your app uses Moment.js, you can sync it with `I18n`. This ensures dates are formatted correctly when the language changes.

```typescript
import moment from 'moment';

// Register specific moment configuration
I18n.registerMomentLocale('fr', {
  months: 'janvier_février_mars...'.split('_'),
  longDateFormat: { LT: 'HH:mm', L: 'DD/MM/YYYY' },
});

// Now, setting locale to 'fr' updates moment too
await i18n.setLocale('fr');
console.log(moment().format('L')); // 20/12/2025
```

---

## Class & Property Translation

One of the unique features of this library is the ability to define translations on class properties using decorators. This is excellent for defining schemas, DTOs, or component models.

### The `@Translate` Decorator

Marks a property with a translation key.

```typescript
import { Translate } from 'reslib/i18n';

class UserProfile {
  @Translate('user.fields.firstName')
  firstNameLabel: string = '';

  @Translate('user.fields.lastName')
  lastNameLabel: string = '';
}
```

### Static Translation (`translateClass`)

Resolves the decorated keys into a dictionary of translated values. This **does not modify** the class or instance. It's useful for generating UI labels without instantiating the class.

```typescript
// Returns: { firstNameLabel: "First Name", lastNameLabel: "Last Name" }
const labels = i18n.translateClass(UserProfile);
```

### Instance Hydration (`applyTranslations`)

Mutates an instance by resolving the keys and assigning the translated values to the properties.

```typescript
const profile = new UserProfile();
// profile.firstNameLabel is ""

i18n.applyTranslations(profile);

// profile.firstNameLabel is now "First Name" (or whatever the translation is)
```

---

## Utilities

### `translateObject`

Takes an object where values are translation keys, and returns a new object with translated values. It is **shallow** (does not traverse nested objects).

```typescript
const menuItems = {
  home: 'menu.home', // key exists -> "Home"
  about: 'menu.about', // key exists -> "About Us"
  url: '/home', // no key match -> "/home" (or key itself)
};

const translatedMenu = i18n.translateObject(menuItems);
// { home: "Home", about: "About Us", url: "/home" }
```

### `has`

Checks if a translation exists for a key.

```typescript
if (i18n.has('feature.flag')) {
  // do something
}
```

---

## Lazy Loading & Namespaces

For large applications, loading all translations at startup is inefficient. I18n supports **namespaces** (chunks) that can be loaded lazily via resolvers.

### 1. Registering Resolvers

You register a resolver function for a specific namespace. This functions as a "recipe" for fetching translations. Use `registerNamespaceResolver` to define how to load a specific chunk.

```typescript
// Register a resolver function for 'account_module'
i18n.registerNamespaceResolver('account_module', async (locale) => {
  // Simulate API call or dynamic import
  const result = await fetch(`/locales/${locale}/account.json`);
  return result.json();
});
```

### 2. Loading Namespaces

Resolvers are **lazy**. They don't run until you explicitly ask for them (or when the locale changes).

```typescript
// Manually load a namespace (e.g., when a component mounts)
await i18n.loadNamespace('account_module');

// Now keys are merged and available
console.log(i18n.t('account_module.title'));
```

### 3. Automatic Reloading on Locale Change

When you call `setLocale('fr')`, `I18n` automatically triggers **all registered resolvers** for the new locale. This ensures that any namespaces you've "subscribed" to (by registering them) are kept in sync with the active language.

**Performance Note**: Since `setLocale` awaits all resolvers, keep your chunks granular and avoid registering resolvers that aren't needed for the current session.
