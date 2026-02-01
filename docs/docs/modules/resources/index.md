---
sidebar_position: 1
title: Resources
---

# Resources Module

The Resources module provides a decorator-based system for defining and managing application resources with metadata, fields, and lifecycle hooks.

## Overview

Resources in ResLib represent logical entities in your application. They provide:

- 🎨 **Declarative Metadata** - Define resources and fields with decorators
- 🔄 **Lifecycle Hooks** - Before/after CRUD operations
- 📡 **Event System** - Observable events for resource changes
- 🔐 **Authorization** - Action-based permission checks
- 🌍 **i18n Integration** - Built-in translation support

## Quick Example

```typescript
import 'reflect-metadata';
import { Resource, ResourceMeta, FieldMeta } from 'reslib/resources';

@ResourceMeta({
  name: 'User',
  label: 'User Account',
  pluralLabel: 'User Accounts',
})
class UserResource extends Resource<'User'> {
  protected name: 'User' = 'User';

  @FieldMeta({
    type: 'string',
    required: true,
    label: 'Full Name',
  })
  fullName: string;

  @FieldMeta({
    type: 'email',
    label: 'Email Address',
  })
  email: string;

  @FieldMeta({
    type: 'dropdown',
    options: ['admin', 'user', 'guest'],
    defaultValue: 'user',
  })
  role: string;
}
```

## @ResourceMeta Decorator

Defines a class as a resource with metadata.

```typescript
@ResourceMeta({
  name: 'Product',
  label: 'Product',
  pluralLabel: 'Products',
  description: 'Catalog products',
  primaryKey: 'productId',
  actions: {
    create: true,
    read: true,
    update: true,
    delete: true,
  },
})
class ProductResource extends Resource<'Product'> {
  protected name: 'Product' = 'Product';
}
```

### Options

| Option        | Type     | Description                         |
| ------------- | -------- | ----------------------------------- |
| `name`        | `string` | Unique resource identifier          |
| `label`       | `string` | Human-readable singular label       |
| `pluralLabel` | `string` | Human-readable plural label         |
| `description` | `string` | Resource description                |
| `primaryKey`  | `string` | Primary key field (default: `'id'`) |
| `actions`     | `object` | Available CRUD actions              |

## @FieldMeta Decorator

### Field Types

| Type          | Description     |
| ------------- | --------------- |
| `string`      | Text input      |
| `number`      | Numeric input   |
| `email`       | Email input     |
| `phone`       | Phone number    |
| `password`    | Password input  |
| `text`        | Multi-line text |
| `boolean`     | Boolean toggle  |
| `date`        | Date picker     |
| `datetime`    | DateTime picker |
| `dropdown`    | Select dropdown |
| `multiselect` | Multi-select    |
| `file`        | File upload     |
| `image`       | Image upload    |

### Example

```typescript
@FieldMeta({
  type: 'string',
  label: 'Order Number',
  required: true,
  readOnly: true,
})
orderNumber: string

@FieldMeta({
  type: 'dropdown',
  label: 'Status',
  options: [
    { label: 'Pending', value: 'pending' },
    { label: 'Shipped', value: 'shipped' },
  ],
  defaultValue: 'pending',
})
status: string
```

## Lifecycle Hooks

```typescript
@ResourceMeta({ name: 'Order' })
class OrderResource extends Resource<'Order'> {
  protected name: 'Order' = 'Order';

  async beforeCreate(data: Partial<OrderData>): Promise<void> {
    data.orderNumber = await this.generateOrderNumber();
    data.createdAt = new Date();
  }

  async afterCreate(record: OrderData): Promise<void> {
    await this.sendOrderConfirmation(record);
  }

  async beforeUpdate(pk: string, data: Partial<OrderData>): Promise<void> {
    data.updatedAt = new Date();
  }
}
```

## Events

```typescript
import { Resource } from 'reslib/resources';

Resource.events.on('created', (event) => {
  console.log(`${event.resourceName} created:`, event.record);
});

Resource.events.on('updated', (event) => {
  console.log(`${event.resourceName} updated`);
});
```

## Metadata Retrieval

```typescript
import { Resource, getFieldsMetadata } from 'reslib/resources';

// From class
const metadata = Resource.getMetaDataFromClass(UserResource);
console.log(metadata.name); // 'User'

// Get all fields
const fields = getFieldsMetadata(UserResource);
```

## Next Steps

- [@ResourceMeta](/docs/modules/resources/resource-meta)
- [@FieldMeta](/docs/modules/resources/field-meta)
- [Lifecycle Hooks](/docs/modules/resources/lifecycle-hooks)
