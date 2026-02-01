---
sidebar_position: 1
title: Observable Module
---

# Observable Module

The Observable module provides an event-driven architecture with subscription patterns.

## Overview

- 👁️ **Event System** - Publish/subscribe pattern
- 🔔 **Subscriptions** - Automatic cleanup
- 🎯 **Type-Safe Events** - Full TypeScript support

## Basic Usage

```typescript
import { observableFactory } from 'reslib/observable';

// Create an observable
const events = observableFactory();

// Subscribe to events
const unsubscribe = events.on('userCreated', (user) => {
  console.log('User created:', user);
});

// Trigger events
events.trigger('userCreated', { id: 1, name: 'John' });

// Unsubscribe when done
unsubscribe();
```

## Typed Events

```typescript
interface AppEvents {
  userCreated: { id: number; name: string };
  userDeleted: { id: number };
  orderPlaced: { orderId: string; total: number };
}

const events = observableFactory<AppEvents>();

// TypeScript knows the event payload types
events.on('userCreated', (user) => {
  // user is typed as { id: number; name: string }
  console.log(user.name);
});

events.on('orderPlaced', (order) => {
  // order is typed as { orderId: string; total: number }
  console.log(`Order ${order.orderId}: $${order.total}`);
});
```

## One-time Subscriptions

```typescript
// Subscribe only once
events.once('userCreated', (user) => {
  console.log('First user created:', user.name);
});

events.trigger('userCreated', { id: 1, name: 'John' }); // Fires
events.trigger('userCreated', { id: 2, name: 'Jane' }); // Does not fire
```

## With Resources

```typescript
import { Resource } from 'reslib/resources';

// Resources have built-in events
Resource.events.on('created', (event) => {
  console.log(`${event.resourceName} created:`, event.record);
});

Resource.events.on('updated', (event) => {
  console.log(`${event.resourceName} updated`);
});

Resource.events.on('deleted', (event) => {
  console.log(`${event.resourceName} deleted:`, event.primaryKey);
});
```
