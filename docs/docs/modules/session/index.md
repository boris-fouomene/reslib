---
sidebar_position: 1
title: Session Module
---

# Session Module

The Session module provides cross-platform session management with storage abstraction.

## Overview

- 💾 **Storage Abstraction** - Works with any storage backend
- 🔄 **Session Lifecycle** - Create, update, destroy sessions
- 🌐 **Cross-Platform** - Browser, React Native, Node.js

## Basic Usage

```typescript
import { Session } from 'reslib/session';

// Create a session
const session = new Session({
  storage: localStorage, // or any Storage-compatible object
  prefix: 'myapp_',
});

// Set values
session.set('user', { id: 1, name: 'John' });
session.set('token', 'abc123');

// Get values
const user = session.get('user');
const token = session.get('token');

// Remove values
session.remove('token');

// Clear all session data
session.clear();
```

## Custom Storage

```typescript
// React Native AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

const session = new Session({
  storage: {
    getItem: (key) => AsyncStorage.getItem(key),
    setItem: (key, value) => AsyncStorage.setItem(key, value),
    removeItem: (key) => AsyncStorage.removeItem(key),
  },
});
```

## Session with Expiration

```typescript
session.set(
  'tempData',
  { value: 'expires soon' },
  {
    expiresIn: 3600, // 1 hour in seconds
  }
);

// Automatically removed after expiration
const data = session.get('tempData'); // null after 1 hour
```
