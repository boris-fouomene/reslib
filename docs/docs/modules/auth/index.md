---
sidebar_position: 1
title: Auth Module
---

# Authentication Module

The Auth module provides utilities for user authentication and authorization.

## Overview

- 🔐 **AuthUser Interface** - Standardized user representation
- 🛡️ **Permission Checking** - Action-based authorization
- 🔑 **Token Utilities** - JWT and session token helpers

## AuthUser Interface

```typescript
import { AuthUser } from 'reslib/auth';

interface AuthUser {
  id: string | number;
  email?: string;
  name?: string;
  roles?: string[];
  permissions?: string[];
}
```

## Usage with Resources

```typescript
import { Resource, ResourceMeta } from 'reslib/resources';
import { AuthUser } from 'reslib/auth';

@ResourceMeta({
  name: 'AdminSettings',
  actions: {
    read: (user: AuthUser) => user.roles?.includes('admin'),
    update: (user: AuthUser) => user.roles?.includes('admin'),
    delete: false,
  },
})
class AdminSettings extends Resource<'AdminSettings'> {
  protected name: 'AdminSettings' = 'AdminSettings';
}
```

## Permission Checking

```typescript
const user: AuthUser = {
  id: 1,
  name: 'John',
  roles: ['user'],
  permissions: ['read:posts', 'write:posts'],
};

function hasPermission(user: AuthUser, permission: string): boolean {
  return user.permissions?.includes(permission) ?? false;
}

hasPermission(user, 'read:posts'); // true
hasPermission(user, 'delete:posts'); // false
```
