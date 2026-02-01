---
sidebar_position: 1
title: Internationalization
---

# I18n Module

Built-in internationalization system with pluralization, interpolation, namespaces, and automatic locale detection.

## Overview

The I18n module provides:

- 🌍 **Multi-language Support** - Easily switch between languages
- 📝 **Interpolation** - Dynamic values in translations
- 🔢 **Pluralization** - Handle plural forms correctly
- 📁 **Namespaces** - Organize translations logically
- 🔍 **Fallbacks** - Graceful handling of missing translations

## Quick Example

```typescript
import { I18n } from 'reslib/i18n';

const i18n = I18n.getInstance();

// Set translations
i18n.setTranslations({
  en: {
    greeting: 'Hello, {{name}}!',
    items: {
      one: 'You have {{count}} item',
      other: 'You have {{count}} items',
    },
  },
  fr: {
    greeting: 'Bonjour, {{name}}!',
    items: {
      one: 'Vous avez {{count}} article',
      other: 'Vous avez {{count}} articles',
    },
  },
});

// Use translations
i18n.t('greeting', { name: 'World' });
// "Hello, World!"

i18n.t('items', { count: 5 });
// "You have 5 items"

// Switch locale
await i18n.setLocale('fr');
i18n.t('greeting', { name: 'Monde' });
// "Bonjour, Monde!"
```

## Core API

### `I18n.getInstance()`

Get the singleton instance:

```typescript
const i18n = I18n.getInstance();
```

### `setTranslations(translations)`

Set all translations:

```typescript
i18n.setTranslations({
  en: { key: 'value' },
  fr: { key: 'valeur' },
});
```

### `t(key, options?)`

Translate a key:

```typescript
i18n.t('greeting');
i18n.t('greeting', { name: 'John' });
i18n.t('items', { count: 5 });
```

### `setLocale(locale)`

Change the current locale:

```typescript
await i18n.setLocale('fr');
```

### `getLocale()`

Get the current locale:

```typescript
const locale = i18n.getLocale(); // 'en'
```

## Interpolation

Insert dynamic values using `{{variable}}`:

```typescript
i18n.setTranslations({
  en: {
    welcome: 'Welcome, {{name}}!',
    message: '{{user}} sent you {{count}} messages',
  },
});

i18n.t('welcome', { name: 'John' });
// "Welcome, John!"

i18n.t('message', { user: 'Jane', count: 3 });
// "Jane sent you 3 messages"
```

## Pluralization

Handle plural forms with `count`:

```typescript
i18n.setTranslations({
  en: {
    apples: {
      zero: 'No apples',
      one: 'One apple',
      other: '{{count}} apples',
    },
  },
});

i18n.t('apples', { count: 0 }); // "No apples"
i18n.t('apples', { count: 1 }); // "One apple"
i18n.t('apples', { count: 5 }); // "5 apples"
```

### Plural Rules

| Key     | Used When                               |
| ------- | --------------------------------------- |
| `zero`  | count === 0                             |
| `one`   | count === 1                             |
| `two`   | count === 2                             |
| `few`   | Language-specific (e.g., 2-4 in Slavic) |
| `many`  | Language-specific                       |
| `other` | Default fallback                        |

## Namespaces

Organize translations with nested keys:

```typescript
i18n.setTranslations({
  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
    },
    user: {
      profile: 'Profile',
      settings: 'Settings',
    },
    validation: {
      required: '{{field}} is required',
      email: 'Invalid email address',
    },
  },
});

i18n.t('common.save'); // "Save"
i18n.t('user.profile'); // "Profile"
i18n.t('validation.required', { field: 'Email' });
// "Email is required"
```

## With Validation

The validator automatically uses i18n for error messages:

```typescript
import { Validator } from 'reslib/validator';
import { I18n } from 'reslib/i18n';

const i18n = I18n.getInstance();
i18n.setTranslations({
  en: {
    validator: {
      required: '{{field}} cannot be empty',
      email: '{{field}} must be a valid email',
    },
  },
});

const result = await Validator.validate({
  value: '',
  rules: ['Required'],
  fieldName: 'username',
  i18n,
});
// Error: "username cannot be empty"
```

## Fallbacks

When a translation is missing:

1. Try the translation key in current locale
2. Try fallback locale (if configured)
3. Return the key itself as fallback

```typescript
i18n.setFallbackLocale('en');

// If 'greeting' doesn't exist in 'fr', uses 'en'
await i18n.setLocale('fr');
i18n.t('greeting'); // Falls back to English
```

## Next Steps

- [Setup](/docs/modules/i18n/setup)
- [Translations](/docs/modules/i18n/translations)
- [Pluralization](/docs/modules/i18n/pluralization)
- [Interpolation](/docs/modules/i18n/interpolation)
