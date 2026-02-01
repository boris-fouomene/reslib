---
sidebar_position: 2
title: Quick Start
---

# Quick Start

Build your first resource with validation in under 5 minutes.

## 1. Define a Resource

```typescript
import 'reflect-metadata';
import { ResourceMeta, FieldMeta, Resource } from 'reslib/resources';
import { IsRequired, IsEmail, MinLength } from 'reslib/validator';

@ResourceMeta({
  name: 'User',
  label: 'User Account',
})
class User extends Resource<'User'> {
  protected name: 'User' = 'User';

  @FieldMeta({ type: 'string', required: true })
  @IsRequired()
  @MinLength(2)
  fullName: string = '';

  @FieldMeta({ type: 'email' })
  @IsRequired()
  @IsEmail()
  email: string = '';

  @FieldMeta({
    type: 'dropdown',
    options: ['admin', 'user', 'guest'],
    defaultValue: 'user',
  })
  role: string = 'user';
}
```

## 2. Validate Data

```typescript
import { Validator } from 'reslib/validator';

const user = new User();
user.fullName = 'J'; // Too short
user.email = 'invalid-email';

const result = await Validator.validateClass(user);

if (!result.success) {
  console.log('Validation errors:');
  for (const [field, errors] of Object.entries(result.errors)) {
    console.log(`  ${field}: ${errors.join(', ')}`);
  }
}
```

**Output:**

```
Validation errors:
  fullName: fullName must be at least 2 characters.
  email: email must be a valid email address.
```

## 3. Object Schema (Alternative)

For plain objects without classes:

```typescript
const userSchema = Validator.object({
  fullName: ['Required', { MinLength: [2] }],
  email: ['Required', 'Email'],
  role: [{ In: [['admin', 'user', 'guest']] }],
});

const data = {
  fullName: 'John Doe',
  email: 'john@example.com',
  role: 'user',
};

const result = await Validator.validateObject(data, userSchema);

if (result.success) {
  console.log('Valid!');
}
```

## 4. Add Internationalization

```typescript
import { I18n } from 'reslib/i18n';

const i18n = I18n.getInstance();

i18n.setTranslations({
  en: {
    welcome: 'Welcome, {{name}}!',
    items: {
      one: 'You have {{count}} item',
      other: 'You have {{count}} items',
    },
  },
});

console.log(i18n.t('welcome', { name: 'John' }));
// "Welcome, John!"

console.log(i18n.t('items', { count: 5 }));
// "You have 5 items"
```

## Complete Example

```typescript
import 'reflect-metadata';
import { ResourceMeta, FieldMeta, Resource } from 'reslib/resources';
import { Validator, IsRequired, IsEmail, MinLength } from 'reslib/validator';
import { I18n } from 'reslib/i18n';

// Setup i18n
const i18n = I18n.getInstance();
i18n.setTranslations({
  en: {
    user: {
      created: 'User {{name}} created successfully!',
    },
  },
});

// Define resource
@ResourceMeta({ name: 'User' })
class User extends Resource<'User'> {
  protected name: 'User' = 'User';

  @FieldMeta({ type: 'string' })
  @IsRequired()
  @MinLength(2)
  fullName: string = '';

  @FieldMeta({ type: 'email' })
  @IsRequired()
  @IsEmail()
  email: string = '';
}

// Create and validate
async function createUser(data: Partial<User>) {
  const user = Object.assign(new User(), data);

  const result = await Validator.validateClass(user);

  if (!result.success) {
    throw new Error(JSON.stringify(result.errors));
  }

  console.log(i18n.t('user.created', { name: user.fullName }));
  return user;
}

// Usage
createUser({
  fullName: 'John Doe',
  email: 'john@example.com',
});
```

## Next Steps

- [Validation Module](/docs/modules/validator) - Learn all 70+ validation rules
- [Resources Module](/docs/modules/resources) - Deep dive into resources
- [I18n Module](/docs/modules/i18n) - Master internationalization
