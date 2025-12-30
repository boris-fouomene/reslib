# Auth Module - Complete Documentation

**Version:** 2.0.0  
**Package:** `reslib/auth`  
**License:** MIT

---

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Core Concepts](#core-concepts)
5. [API Reference](#api-reference)
6. [Configuration](#configuration)
7. [Authentication Flows](#authentication-flows)
8. [Permission System](#permission-system)
9. [Event System](#event-system)
10. [Secure Storage](#secure-storage)
11. [Error Handling](#error-handling)
12. [TypeScript Support](#typescript-support)
13. [Module Augmentation](#module-augmentation) ⚠️ **REQUIRED FOR TYPE SAFETY**
14. [Best Practices](#best-practices)
15. [Examples](#examples)
16. [Migration Guide](#migration-guide)
17. [Troubleshooting](#troubleshooting)

---

## Overview

The Auth module is a comprehensive, type-safe authentication and authorization library for JavaScript/TypeScript applications. It provides:

- ✅ **User Authentication** - Sign in, sign out, session management
- ✅ **Authorization** - Fine-grained permission checking
- ✅ **Role-Based Access Control (RBAC)** - Support for user roles and permissions
- ✅ **Secure Storage** - Platform-agnostic secure storage with encryption
- ✅ **Session Management** - Automatic session expiration and validation
- ✅ **Event System** - React to authentication state changes
- ✅ **TypeScript First** - Full type safety and IntelliSense support
- ✅ **Platform Agnostic** - Works in web, React Native, Node.js

### Key Features

- **🔐 Secure by Default** - Uses platform-native secure storage (iOS Keychain, Android KeyStore, Web Crypto API)
- **⚡ Async-First** - All methods are asynchronous for compatibility with modern secure storage APIs
- **🎯 Type-Safe** - Full TypeScript support with comprehensive type definitions
- **📡 Event-Driven** - Built-in observable pattern for authentication events
- **🔄 Session Management** - Automatic session expiration and refresh
- **🛡️ Permission System** - Flexible permission checking with support for resources, actions, and roles
- **🚀 Zero Dependencies** - No external dependencies for core functionality

---

## Installation

```bash
# npm
npm install reslib

# yarn
yarn add reslib

# pnpm
pnpm add reslib
```

### Import

```typescript
// Import the Auth class
import { Auth } from 'reslib/auth';

// Import types
import type { AuthUser, AuthConfig, AuthPerm } from 'reslib/auth';

// Import errors
import { AuthError, SessionExpiredError } from 'reslib/auth';
```

---

## Quick Start

> ⚠️ **IMPORTANT:** Before using the Auth module, you **MUST** set up module augmentation for type safety. See [Module Augmentation](#module-augmentation) section.

### Step 1: Define Your Resources (Required for TypeScript)

Create a type definition file to define your application's resources:

```typescript
// src/types/auth.types.ts
import { ResourceAction, ResourceBase } from 'reslib/resources';

declare module 'reslib/resources' {
  interface Resources {
    documents: ResourceBase;
    users: ResourceBase;
    media: {
      actions: {
        upload: ResourceAction;
        download: ResourceAction;
      };
    };
  }
}

// Optionally extend AuthUser
declare module 'reslib/auth' {
  interface AuthUser {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  }
}
```

### Step 2: Import Types in Your App

```typescript
// src/index.ts or src/app.ts
import './types/auth.types'; // ← Load type augmentations
import { Auth } from 'reslib/auth';
```

### Step 3: Configure Auth (Optional)

```typescript
import { Auth } from 'reslib/auth';

// Configure once at app startup
Auth.configure({
  sessionTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
  masterAdminCheck: async (user) => user?.roles?.includes('admin'),
});
```

### Step 4: Use Authentication

```typescript
// Sign in a user
const user = await Auth.signIn({
  id: 'user-123',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  perms: {
    documents: ['read', 'create'],
    users: ['read'],
  },
});

// Check if user is authenticated
const currentUser = await Auth.getSignedUser();
if (currentUser) {
  console.log('User is authenticated:', currentUser.id);
}

// Check permissions (now type-safe!)
const canEditDocs = await Auth.isAllowed({
  resourceName: 'documents', // ← Autocomplete works!
  action: 'update', // ← Autocomplete works!
});

// Sign out
await Auth.signOut();
```

---

## Core Concepts

### AuthUser

The `AuthUser` interface represents an authenticated user:

```typescript
interface AuthUser {
  // Required: Unique identifier (string or number)
  id: string | number;

  // Optional: Direct permissions assigned to the user
  perms?: AuthPerms;

  // Optional: Roles with inherited permissions
  roles?: AuthRole[];

  // Auto-generated: Session creation timestamp
  sessionCreatedAt?: number;

  // Custom: Any additional user properties
  [key: string]: any;
}
```

### Permissions (AuthPerms)

Permissions are organized by resource and action:

```typescript
interface AuthPerms {
  documents?: ResourceActionName<'documents'>[];
  users?: ResourceActionName<'users'>[];
  // ... other resources
}

// Example
const userPerms: AuthPerms = {
  documents: ['read', 'create', 'update'],
  users: ['read'],
  admin: ['all'], // Special: grants all permissions
};
```

### Roles (AuthRole)

Roles group permissions for reusability:

```typescript
interface AuthRole {
  name: string;
  label?: string;
  perms: AuthPerms;
}

// Example
const editorRole: AuthRole = {
  name: 'editor',
  label: 'Content Editor',
  perms: {
    documents: ['read', 'create', 'update'],
    media: ['read', 'upload'],
  },
};
```

### Permission Types (AuthPerm)

The `AuthPerm` type supports multiple formats for flexibility:

```typescript
type AuthPerm<T> =
  | boolean // Direct grant/deny
  | ((user: AuthUser) => boolean) // Function-based
  | [ResourceName, ActionName] // Tuple format
  | { resourceName: T; action: string } // Object format
  | AuthPerm<T>[]; // Array (OR logic)

// Examples
const perm1: AuthPerm = true; // Always allow
const perm2: AuthPerm = (user) => user.id === 'admin'; // Custom logic
const perm3: AuthPerm = ['documents', 'read']; // Tuple
const perm4: AuthPerm = { resourceName: 'documents', action: 'update' }; // Object
const perm5: AuthPerm = [perm3, perm4]; // Any of these
```

---

## API Reference

### Static Properties

#### `Auth.events`

Observable for authentication events.

```typescript
static events: Observable<AuthEvent>

// Usage
Auth.events.on('SIGN_IN', (user) => {
  console.log('User signed in:', user);
});

Auth.events.on('SIGN_OUT', () => {
  console.log('User signed out');
});
```

#### `Auth.isMasterAdmin`

Optional function to check if a user is a master admin (bypasses all permission checks).

```typescript
static isMasterAdmin?: (user?: AuthUser) => Promise<boolean> | boolean

// Usage
Auth.isMasterAdmin = async (user) => {
  // Custom logic - can be async
  const adminRoles = await getAdminRoles();
  return adminRoles.includes(user?.id);
};
```

---

### Configuration

#### `Auth.configure(options)`

Configure the Auth module with custom settings.

```typescript
static configure(options: AuthConfig): void

interface AuthConfig {
  sessionTTL?: number;                  // Session duration in milliseconds
  storage?: AuthSecureStorage;          // Custom secure storage
  masterAdminCheck?: (user?: AuthUser) => Promise<boolean> | boolean;
}
```

**Parameters:**

- `sessionTTL` - Session time-to-live in milliseconds (default: 24 hours)
- `storage` - Custom secure storage implementation
- `masterAdminCheck` - Function to determine master admin status

**Example:**

```typescript
Auth.configure({
  sessionTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
  storage: new CustomSecureStorage(),
  masterAdminCheck: (user) => user?.roles?.includes('super_admin'),
});
```

---

### Authentication Methods

#### `Auth.signIn(user, triggerEvent?)`

Sign in a user and establish a session.

```typescript
static async signIn(
  user: AuthUser,
  triggerEvent: boolean = true
): Promise<AuthUser>
```

**Parameters:**

- `user` - User object to authenticate
- `triggerEvent` - Whether to trigger `SIGN_IN` event (default: true)

**Returns:** The authenticated user with `sessionCreatedAt` timestamp

**Example:**

```typescript
const user = await Auth.signIn({
  id: 'user-123',
  email: 'user@example.com',
  perms: { documents: ['read'] },
});

console.log('User signed in:', user.id);
console.log('Session created:', new Date(user.sessionCreatedAt!));
```

---

#### `Auth.signOut(triggerEvent?)`

Sign out the current user and clear the session.

```typescript
static async signOut(triggerEvent: boolean = true): Promise<void>
```

**Parameters:**

- `triggerEvent` - Whether to trigger `SIGN_OUT` event (default: true)

**Example:**

```typescript
await Auth.signOut();
console.log('User signed out');
```

---

#### `Auth.getSignedUser()`

Retrieve the currently authenticated user.

```typescript
static async getSignedUser(): Promise<AuthUser | null>
```

**Returns:** Current user or `null` if not authenticated or session expired

**Example:**

```typescript
const user = await Auth.getSignedUser();

if (user) {
  console.log('Current user:', user.id);
} else {
  console.log('No user signed in');
}
```

**Session Validation:**

- Automatically validates session expiration
- Clears cache if session is expired
- Returns `null` for expired sessions

---

#### `Auth.setSignedUser(user, triggerEvent?)`

Manually set the authenticated user (advanced usage).

```typescript
static async setSignedUser(
  user: AuthUser | null,
  triggerEvent?: boolean
): Promise<AuthUser | null>
```

**Parameters:**

- `user` - User to set (or `null` to clear)
- `triggerEvent` - Whether to trigger events

**Returns:** The stored user

**Example:**

```typescript
// Update user data
const updatedUser = { ...currentUser, email: 'new@example.com' };
await Auth.setSignedUser(updatedUser, false);

// Clear session
await Auth.setSignedUser(null);
```

---

#### `Auth.refreshSignedUser()`

Force refresh user data from storage, clearing cache.

```typescript
static async refreshSignedUser(): Promise<AuthUser | null>
```

**Returns:** Refreshed user or `null`

**Example:**

```typescript
// Force reload from storage
const freshUser = await Auth.refreshSignedUser();
```

---

### Permission Methods

#### `Auth.isAllowed(perm, user?)`

Check if a user has permission to perform an action.

```typescript
static async isAllowed<T extends ResourceName = ResourceName>(
  perm: AuthPerm<T>,
  user?: AuthUser | null
): Promise<boolean>
```

**Parameters:**

- `perm` - Permission to check (various formats supported)
- `user` - User to check (default: current signed-in user)

**Returns:** `true` if allowed, `false` otherwise

**Examples:**

```typescript
// Boolean permission
await Auth.isAllowed(true); // true
await Auth.isAllowed(false); // false

// Function permission
await Auth.isAllowed((user) => user.id === 'admin');

// Resource-action tuple
await Auth.isAllowed(['documents', 'read']);

// Resource-action object
await Auth.isAllowed({ resourceName: 'documents', action: 'update' });

// Array (OR logic - any match grants permission)
await Auth.isAllowed([
  { resourceName: 'documents', action: 'read' },
  { resourceName: 'documents', action: 'create' },
]);

// With specific user
const hasPermission = await Auth.isAllowed(
  { resourceName: 'users', action: 'delete' },
  specificUser
);
```

---

#### `Auth.checkUserPermission(user, resource, action?)`

Check if a user has permission for a specific resource and action.

```typescript
static checkUserPermission<T extends ResourceName = ResourceName>(
  user: AuthUser,
  resource: T,
  action: ResourceActionName<T> = 'read'
): boolean
```

**Parameters:**

- `user` - User to check
- `resource` - Resource name
- `action` - Action name (default: 'read')

**Returns:** `true` if user has permission

**Examples:**

```typescript
const user = await Auth.getSignedUser();

// Check read permission (default)
const canRead = Auth.checkUserPermission(user, 'documents');

// Check specific action
const canUpdate = Auth.checkUserPermission(user, 'documents', 'update');
const canDelete = Auth.checkUserPermission(user, 'users', 'delete');
```

---

#### `Auth.checkPermission(perms, resource, action?)`

Low-level permission checking against a permission object.

```typescript
static checkPermission<T extends ResourceName = ResourceName>(
  perms: AuthPerms,
  resource: T,
  action: ResourceActionName<T> = 'read'
): boolean
```

**Parameters:**

- `perms` - Permission object to check
- `resource` - Resource name
- `action` - Action name (default: 'read')

**Returns:** `true` if permission object grants access

**Examples:**

```typescript
const perms: AuthPerms = {
  documents: ['read', 'create'],
  users: ['all'],
};

// Check permission
const canReadDocs = Auth.checkPermission(perms, 'documents', 'read'); // true
const canDeleteDocs = Auth.checkPermission(perms, 'documents', 'delete'); // false
const canDoAnythingWithUsers = Auth.checkPermission(perms, 'users', 'delete'); // true ('all' grants everything)
```

---

### Utility Methods

#### `Auth.isValidUser(user)`

Type guard to check if an object is a valid AuthUser.

```typescript
static isValidUser(user: unknown): user is AuthUser
```

**Parameters:**

- `user` - Object to validate

**Returns:** `true` if valid `AuthUser`

**Example:**

```typescript
const data = await fetchUserData();

if (Auth.isValidUser(data)) {
  // TypeScript knows data is AuthUser here
  await Auth.signIn(data);
}
```

---

## Configuration

### Session Time-to-Live (TTL)

Configure how long sessions remain valid:

```typescript
Auth.configure({
  sessionTTL: 30 * 24 * 60 * 60 * 1000, // 30 days
});
```

**Recommendations:**

- **Web Apps:** 7-14 days
- **Mobile Apps:** 30-90 days
- **Admin Panels:** 1-2 hours
- **Banking/Finance:** 15-30 minutes

---

### Custom Secure Storage

Provide platform-specific secure storage implementation:

```typescript
interface AuthSecureStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}
```

**Examples:**

#### Expo Secure Store

```typescript
import * as SecureStore from 'expo-secure-store';

const expoStorage: AuthSecureStorage = {
  async get(key) {
    return await SecureStore.getItemAsync(key);
  },
  async set(key, value) {
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key) {
    await SecureStore.deleteItemAsync(key);
  },
};

Auth.configure({ storage: expoStorage });
```

#### React Native Keychain

```typescript
import * as Keychain from 'react-native-keychain';

const keychainStorage: AuthSecureStorage = {
  async get(key) {
    const credentials = await Keychain.getGenericPassword({ service: key });
    return credentials ? credentials.password : null;
  },
  async set(key, value) {
    await Keychain.setGenericPassword('auth', value, { service: key });
  },
  async remove(key) {
    await Keychain.resetGenericPassword({ service: key });
  },
};

Auth.configure({ storage: keychainStorage });
```

#### Browser (Web Crypto API)

```typescript
const webCryptoStorage: AuthSecureStorage = {
  async get(key) {
    return localStorage.getItem(key);
  },
  async set(key, value) {
    localStorage.setItem(key, value);
  },
  async remove(key) {
    localStorage.removeItem(key);
  },
};

Auth.configure({ storage: webCryptoStorage });
```

---

### Master Admin Configuration

Set up master admin detection:

```typescript
// Synchronous check
Auth.configure({
  masterAdminCheck: (user) => {
    return user?.roles?.includes('super_admin');
  },
});

// Asynchronous check (e.g., API call)
Auth.configure({
  masterAdminCheck: async (user) => {
    const adminIds = await fetchAdminIds();
    return adminIds.includes(user?.id);
  },
});
```

**Master Admin Benefits:**

- ✅ Bypasses ALL permission checks
- ✅ Always returns `true` for `isAllowed()`
- ✅ Useful for super administrators or system accounts

---

## Authentication Flows

### Standard Sign-In Flow

```typescript
async function signIn(credentials: LoginCredentials) {
  try {
    // 1. Authenticate with your backend
    const response = await api.post('/auth/login', credentials);

    // 2. Extract user data
    const userData: AuthUser = {
      id: response.userId,
      email: response.email,
      perms: response.permissions,
      roles: response.roles,
    };

    // 3. Sign in with Auth module
    const user = await Auth.signIn(userData);

    // 4. Handle post-sign-in logic
    console.log('Signed in successfully:', user.id);
    router.push('/dashboard');

    return user;
  } catch (error) {
    console.error('Sign-in failed:', error);
    throw error;
  }
}
```

### OAuth/Social Sign-In

```typescript
async function handleOAuthCallback(authCode: string) {
  try {
    // 1. Exchange authorization code for tokens
    const tokens = await exchangeCodeForToken(authCode);

    // 2. Fetch user profile
    const profile = await fetchUserProfile(tokens.access_token);

    // 3. Map to AuthUser
    const user: AuthUser = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      perms: await fetchUserPermissions(profile.id),
      provider: 'google',
    };

    // 4. Sign in
    await Auth.signIn(user);

    router.push('/dashboard');
  } catch (error) {
    console.error('OAuth sign-in failed:', error);
    router.push('/login?error=oauth_failed');
  }
}
```

### Silent Authentication

For apps that need to check authentication status on load:

```typescript
async function initializeApp() {
  try {
    // Check if user is authenticated
    const user = await Auth.getSignedUser();

    if (user) {
      console.log('User already authenticated:', user.id);
      // Optionally validate with backend
      await validateSessionWithBackend(user);
    } else {
      console.log('No authenticated user');
      router.push('/login');
    }
  } catch (error) {
    console.error('Auth initialization failed:', error);
    router.push('/login');
  }
}
```

### Token Refresh Flow

```typescript
async function refreshAuthToken() {
  try {
    const user = await Auth.getSignedUser();
    if (!user) throw new Error('No user to refresh');

    // Refresh token with backend
    const newToken = await api.post('/auth/refresh', {
      userId: user.id,
    });

    // Update user with new token
    const updatedUser = { ...user, token: newToken };
    await Auth.setSignedUser(updatedUser, false);

    return updatedUser;
  } catch (error) {
    // Refresh failed - sign out
    await Auth.signOut();
    throw error;
  }
}
```

---

## Permission System

### Direct User Permissions

Assign permissions directly to a user:

```typescript
const user: AuthUser = {
  id: 'user-123',
  perms: {
    documents: ['read', 'create', 'update'],
    users: ['read'],
    media: ['read', 'upload'],
  },
};

await Auth.signIn(user);

// Check permissions
console.log(await Auth.isAllowed(['documents', 'read'])); // true
console.log(await Auth.isAllowed(['documents', 'delete'])); // false
```

### Role-Based Permissions

Use roles to group permissions:

```typescript
const user: AuthUser = {
  id: 'user-123',
  perms: {
    profile: ['read', 'update'], // Direct permissions
  },
  roles: [
    {
      name: 'editor',
      perms: {
        documents: ['read', 'create', 'update'],
        media: ['read', 'upload'],
      },
    },
    {
      name: 'moderator',
      perms: {
        comments: ['read', 'update', 'delete'],
        users: ['read', 'suspend'],
      },
    },
  ],
};

await Auth.signIn(user);

// User has permissions from both direct and role-based sources
console.log(await Auth.isAllowed(['profile', 'update'])); // true (direct)
console.log(await Auth.isAllowed(['documents', 'create'])); // true (editor role)
console.log(await Auth.isAllowed(['comments', 'delete'])); // true (moderator role)
```

### Wildcard Permissions

Use `'all'` for universal permissions:

```typescript
const adminUser: AuthUser = {
  id: 'admin-123',
  perms: {
    // Admin has all permissions on these resources
    users: ['all'],
    system: ['all'],

    // But limited permissions on documents
    documents: ['read', 'create'],
  },
};

console.log(Auth.checkUserPermission(adminUser, 'users', 'delete')); // true
console.log(Auth.checkUserPermission(adminUser, 'system', 'configure')); // true
console.log(Auth.checkUserPermission(adminUser, 'documents', 'delete')); // false
```

### Function-Based Permissions

Dynamic permissions using functions:

```typescript
// Check permission based on custom logic
const canEditOwnDocument = await Auth.isAllowed(
  (user) => user.id === document.authorId
);

// Check permission based on user properties
const canAccessPremium = await Auth.isAllowed(
  (user) => user.subscription === 'premium'
);

// Combine with resource permissions
const canEditDocument = await Auth.isAllowed([
  ['documents', 'update'], // Has update permission
  (user) => user.id === document.authorId, // Or is the author
]);
```

### Permission Checking Patterns

#### Guard Pattern

```typescript
async function requirePermission(
  resource: ResourceName,
  action: ResourceActionName
) {
  const allowed = await Auth.isAllowed({ resourceName: resource, action });

  if (!allowed) {
    throw new Error(`Permission denied: ${action} on ${resource}`);
  }
}

// Usage
async function deleteDocument(id: string) {
  await requirePermission('documents', 'delete');
  // Proceed with deletion
}
```

#### Helper Functions

```typescript
async function can(
  resource: ResourceName,
  action: ResourceActionName = 'read'
) {
  return await Auth.isAllowed({ resourceName: resource, action });
}

async function cannot(
  resource: ResourceName,
  action: ResourceActionName = 'read'
) {
  return !(await can(resource, action));
}

// Usage
if (await can('documents', 'update')) {
  showEditButton();
}

if (await cannot('users', 'delete')) {
  hideDeleteButton();
}
```

---

## Event System

### Available Events

```typescript
type AuthEventType = 'SIGN_IN' | 'SIGN_OUT' | 'SIGN_UP';

interface AuthEvent {
  type: AuthEventType;
  user?: AuthUser;
}
```

### Subscribing to Events

```typescript
// Sign-in event
Auth.events.on('SIGN_IN', (user: AuthUser) => {
  console.log('User signed in:', user.id);

  // Initialize user-specific features
  initializeUserPreferences(user);
  loadUserDashboard(user);
  trackAnalytics('user_signin', { userId: user.id });
});

// Sign-out event
Auth.events.on('SIGN_OUT', () => {
  console.log('User signed out');

  // Cleanup
  clearUserData();
  redirectToLogin();
  trackAnalytics('user_signout');
});

// Sign-up event
Auth.events.on('SIGN_UP', (user: AuthUser) => {
  console.log('New user registered:', user.id);

  // Welcome flow
  showWelcomeModal();
  sendWelcomeEmail(user.email);
});
```

### Unsubscribing from Events

```typescript
const handleSignIn = (user: AuthUser) => {
  console.log('User signed in:', user.id);
};

// Subscribe
Auth.events.on('SIGN_IN', handleSignIn);

// Unsubscribe
Auth.events.off('SIGN_IN', handleSignIn);

// Unsubscribe all listeners for an event
Auth.events.offAll('SIGN_IN');
```

### React Integration

```typescript
import { useEffect, useState } from 'react';
import { Auth, AuthUser } from 'reslib/auth';

function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial user
    Auth.getSignedUser().then((user) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const handleSignIn = (user: AuthUser) => setUser(user);
    const handleSignOut = () => setUser(null);

    Auth.events.on('SIGN_IN', handleSignIn);
    Auth.events.on('SIGN_OUT', handleSignOut);

    // Cleanup
    return () => {
      Auth.events.off('SIGN_IN', handleSignIn);
      Auth.events.off('SIGN_OUT', handleSignOut);
    };
  }, []);

  return { user, loading };
}

// Usage in component
function App() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <LoginPage />;

  return <Dashboard user={user} />;
}
```

---

## Secure Storage

### Default Storage

By default, the Auth module uses `DefaultAuthStorage` which is a basic session storage implementation. For production applications, **you MUST configure a secure storage implementation** to ensure user data is encrypted and protected.

> ⚠️ **WARNING:** The default storage is NOT secure and should only be used for development/testing.

### Storage Interface

All secure storage implementations must implement the `AuthSecureStorage` interface:

```typescript
interface AuthSecureStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}
```

**How the Auth module uses storage:**

- `get(key)` - Retrieves encrypted user session data
- `set(key, value)` - Stores user session data (Auth handles serialization)
- `remove(key)` - Clears user session data on sign out

---

### Complete Setup Guide

#### 1. Choose Your Platform Storage

**For Expo/React Native:**

- ✅ **Recommended:** `expo-secure-store` (uses iOS Keychain & Android Keystore)
- Alternative: `react-native-keychain`

**For Web/Browser:**

- ✅ **Recommended:** IndexedDB with encryption
- Alternative: localStorage with encryption (less secure)

**For Node.js/Server:**

- ✅ **Recommended:** File system with encryption
- Alternative: In-memory with Redis backup

#### 2. Implement the Interface

#### 3. Configure Auth Module

```typescript
import { Auth } from 'reslib/auth';

Auth.configure({
  storage: yourSecureStorage,
  sessionTTL: 7 * 24 * 60 * 60 * 1000, // Optional
});
```

---

### Platform-Specific Implementations

#### Expo Secure Store (Recommended for Expo/React Native)

**Installation:**

```bash
npx expo install expo-secure-store
```

**Implementation:**

```typescript
// src/services/secure-storage.ts
import * as SecureStore from 'expo-secure-store';
import type { AuthSecureStorage } from 'reslib/auth';

export const expoSecureStorage: AuthSecureStorage = {
  async get(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStore get error:', error);
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('SecureStore set error:', error);
      throw error;
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStore remove error:', error);
      throw error;
    }
  },
};
```

**Usage in your app:**

```typescript
// App.tsx or index.ts
import { Auth } from 'reslib/auth';
import { expoSecureStorage } from './services/secure-storage';

// Configure before any Auth operations
Auth.configure({
  storage: expoSecureStorage,
  sessionTTL: 30 * 24 * 60 * 60 * 1000, // 30 days
});

// Now all Auth operations use secure storage
export default function App() {
  // Your app code
}
```

---

#### React Native Keychain

**Installation:**

```bash
npm install react-native-keychain
# or
yarn add react-native-keychain
```

**Implementation:**

```typescript
import * as Keychain from 'react-native-keychain';
import type { AuthSecureStorage } from 'reslib/auth';

export const keychainStorage: AuthSecureStorage = {
  async get(key: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: key,
      });

      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Keychain get error:', error);
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      await Keychain.setGenericPassword('auth', value, {
        service: key,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
      });
    } catch (error) {
      console.error('Keychain set error:', error);
      throw error;
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await Keychain.resetGenericPassword({ service: key });
    } catch (error) {
      console.error('Keychain remove error:', error);
    }
  },
};

// Usage
Auth.configure({ storage: keychainStorage });
```

---

#### Web/Browser (IndexedDB)

**Installation:**

```bash
npm install idb
```

**Implementation:**

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { AuthSecureStorage } from 'reslib/auth';

interface AuthDB extends DBSchema {
  auth: {
    key: string;
    value: string;
  };
}

class IndexedDBStorage implements AuthSecureStorage {
  private dbPromise: Promise<IDBPDatabase<AuthDB>>;

  constructor() {
    this.dbPromise = openDB<AuthDB>('auth-storage', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('auth')) {
          db.createObjectStore('auth');
        }
      },
    });
  }

  async get(key: string): Promise<string | null> {
    try {
      const db = await this.dbPromise;
      const value = await db.get('auth', key);
      return value || null;
    } catch (error) {
      console.error('IndexedDB get error:', error);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      const db = await this.dbPromise;
      await db.put('auth', value, key);
    } catch (error) {
      console.error('IndexedDB set error:', error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const db = await this.dbPromise;
      await db.delete('auth', key);
    } catch (error) {
      console.error('IndexedDB remove error:', error);
    }
  }
}

export const idbStorage = new IndexedDBStorage();

// Usage
Auth.configure({ storage: idbStorage });
```

---

#### Browser (LocalStorage with Encryption)

**⚠️ Note:** Less secure than IndexedDB, but simpler for development.

```typescript
import type { AuthSecureStorage } from 'reslib/auth';

// Simple XOR encryption (use proper encryption in production!)
function simpleEncrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return btoa(result); // Base64 encode
}

function simpleDecrypt(encrypted: string, key: string): string {
  const text = atob(encrypted); // Base64 decode
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return result;
}

// ⚠️ In production, use a proper encryption key from environment variables
const ENCRYPTION_KEY = process.env.REACT_APP_STORAGE_KEY || 'your-secret-key';

export const encryptedLocalStorage: AuthSecureStorage = {
  async get(key: string): Promise<string | null> {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      return simpleDecrypt(encrypted, ENCRYPTION_KEY);
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      const encrypted = simpleEncrypt(value, ENCRYPTION_KEY);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Storage set error:', error);
      throw error;
    }
  },

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  },
};

// Usage
Auth.configure({ storage: encryptedLocalStorage });
```

---

#### AsyncStorage with Encryption (React Native without Expo)

**Installation:**

```bash
npm install @react-native-async-storage/async-storage
```

**Implementation:**

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthSecureStorage } from 'reslib/auth';

// You would implement proper encryption here
// For example, using react-native-crypto or similar

export const asyncSecureStorage: AuthSecureStorage = {
  async get(key: string): Promise<string | null> {
    try {
      const encrypted = await AsyncStorage.getItem(key);
      if (!encrypted) return null;

      // Decrypt the value (implement your decryption)
      return decryptData(encrypted);
    } catch (error) {
      console.error('AsyncStorage get error:', error);
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      // Encrypt the value (implement your encryption)
      const encrypted = await encryptData(value);
      await AsyncStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('AsyncStorage set error:', error);
      throw error;
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('AsyncStorage remove error:', error);
    }
  },
};

// Helper functions (implement these with proper encryption library)
async function encryptData(data: string): Promise<string> {
  // Use react-native-crypto or similar
  // This is a placeholder
  return data;
}

async function decryptData(data: string): Promise<string> {
  // Use react-native-crypto or similar
  // This is a placeholder
  return data;
}
```

---

### Complete App Setup Example

Here's how to set up secure storage in a complete app:

```typescript
// src/config/auth.config.ts
import { Auth } from 'reslib/auth';
import { Platform } from 'react-native'; // if React Native
import { expoSecureStorage } from '../services/secure-storage';

export function configureAuth() {
  Auth.configure({
    // Use secure storage
    storage: expoSecureStorage,

    // Session expires after 30 days
    sessionTTL: 30 * 24 * 60 * 60 * 1000,

    // Master admin check
    masterAdminCheck: async (user) => {
      // Could also check against API
      return user?.roles?.some(role => role.name === 'super_admin') ?? false;
    },
  });
}

// App.tsx
import { configureAuth } from './config/auth.config';
import './types/auth.types'; // Load type augmentations

// Configure auth BEFORE rendering
configureAuth();

export default function App() {
  return <YourApp />;
}
```

---

### Security Best Practices

1. **Use Platform-Native Storage:**
   - **iOS:** Use Keychain via `expo-secure-store` or `react-native-keychain`
   - **Android:** Use Keystore (via `expo-secure-store`) or EncryptedSharedPreferences
   - **Web:** Use IndexedDB with encryption or sessionStorage (for temporary sessions)

2. **Encrypt Sensitive Data:**
   - Always encrypt user data before storage
   - Use strong encryption (AES-256-GCM recommended)
   - Never store encryption keys in code - use environment variables

3. **Implement Proper Key Management:**

   ```typescript
   // ✅ Good - from environment
   const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY;

   // ❌ Bad - hardcoded
   const ENCRYPTION_KEY = 'my-secret-key-123';
   ```

4. **Handle Storage Errors Gracefully:**

   ```typescript
   const storage: AuthSecureStorage = {
     async set(key, value) {
       try {
         await actualStorage.set(key, value);
       } catch (error) {
         // Handle quota exceeded
         if (error.name === 'QuotaExceededError') {
           await clearOldData();
           await actualStorage.set(key, value);
         } else {
           // Log and rethrow
           console.error('Storage error:', error);
           throw error;
         }
       }
     },
     // ... other methods
   };
   ```

5. **Clear Storage on Sign Out:**

   ```typescript
   // The Auth module handles this automatically
   await Auth.signOut(); // Calls storage.remove() automatically
   ```

6. **Test Storage Quota:**
   ```typescript
   // Implement monitoring
   async function checkStorageQuota() {
     if ('storage' in navigator && 'estimate' in navigator.storage) {
       const estimate = await navigator.storage.estimate();
       const percentUsed = (estimate.usage! / estimate.quota!) * 100;

       if (percentUsed > 80) {
         console.warn(
           'Storage quota nearly full:',
           percentUsed.toFixed(2) + '%'
         );
       }
     }
   }
   ```

---

### Testing Your Storage Implementation

```typescript
// __tests__/secure-storage.test.ts
import { expoSecureStorage } from '../services/secure-storage';

describe('SecureStorage', () => {
  it('should store and retrieve data', async () => {
    const key = 'test-key';
    const value = 'test-value';

    await expoSecureStorage.set(key, value);
    const retrieved = await expoSecureStorage.get(key);

    expect(retrieved).toBe(value);
  });

  it('should remove data', async () => {
    const key = 'test-key';
    const value = 'test-value';

    await expoSecureStorage.set(key, value);
    await expoSecureStorage.remove(key);
    const retrieved = await expoSecureStorage.get(key);

    expect(retrieved).toBeNull();
  });

  it('should handle non-existent keys', async () => {
    const retrieved = await expoSecureStorage.get('non-existent-key');
    expect(retrieved).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    // Test error scenarios
    await expect(
      expoSecureStorage.set('key', 'x'.repeat(10000000)) // Very large value
    ).rejects.toThrow();
  });
});
```

---

## Error Handling

### Error Types

```typescript
import { AuthError, SessionExpiredError } from 'reslib/auth';

// Base error class
class AuthError extends BaseException {
  name = 'AuthError';
}

// Session expired error
class SessionExpiredError extends AuthError {
  name = 'SessionExpiredError';
}
```

### Error Handling Patterns

#### Try-Catch Pattern

```typescript
async function handleLogin(credentials: LoginCredentials) {
  try {
    const userData = await authenticateWithAPI(credentials);
    const user = await Auth.signIn(userData);
    return { success: true, user };
  } catch (error) {
    if (error instanceof AuthError) {
      console.error('Authentication error:', error.message);
      return { success: false, error: 'Invalid credentials' };
    }
    throw error;
  }
}
```

#### Session Expiration Handling

```typescript
async function fetchProtectedData() {
  try {
    const user = await Auth.getSignedUser();

    if (!user) {
      // Session expired or not authenticated
      redirectToLogin();
      return null;
    }

    // Fetch data
    return await api.getData();
  } catch (error) {
    console.error('Failed to fetch data:', error);
    return null;
  }
}
```

#### Global Error Handler

```typescript
class AuthErrorHandler {
  static async handle(error: unknown) {
    if (error instanceof AuthError) {
      // Auth-specific error handling
      await Auth.signOut(false);
      showErrorToast('Authentication failed');
      redirectToLogin();
    } else {
      // Generic error handling
      console.error('Unexpected error:', error);
    }
  }
}

// Usage
try {
  await someAuthOperation();
} catch (error) {
  await AuthErrorHandler.handle(error);
}
```

---

## TypeScript Support

### Type-Safe Permission Checking

```typescript
import type { ResourceName, ResourceActionName } from 'reslib/auth';

// Define your resources
declare module 'reslib/auth' {
  interface IResourceMap {
    documents: ResourceBase<'documents'>;
    users: ResourceBase<'users'>;
    media: ResourceBase<'media'>;
  }
}

// Now you have type-safe resource names
async function checkDocumentPermission(
  action: ResourceActionName<'documents'>
) {
  return await Auth.isAllowed({ resourceName: 'documents', action });
}

// TypeScript will error if you use invalid resources or actions
// checkDocumentPermission('invalid'); // ❌ Type error
checkDocumentPermission('read'); // ✅ OK
```

### Custom User Properties

```typescript
// Extend AuthUser with custom properties
interface MyAuthUser extends AuthUser {
  firstName: string;
  lastName: string;
  avatar?: string;
  subscription: 'free' | 'premium' | 'enterprise';
}

// Type-safe sign-in
const user: MyAuthUser = {
  id: 'user-123',
  firstName: 'John',
  lastName: 'Doe',
  subscription: 'premium',
  perms: { documents: ['read'] },
};

await Auth.signIn(user);

// Type-safe retrieval
const currentUser = (await Auth.getSignedUser()) as MyAuthUser | null;
if (currentUser) {
  console.log(currentUser.firstName); // ✅ Type-safe
}
```

### Generic Permission Helper

```typescript
function createPermissionChecker<T extends ResourceName>(resource: T) {
  return {
    async can(
      action: ResourceActionName<T>,
      user?: AuthUser
    ): Promise<boolean> {
      return await Auth.isAllowed({ resourceName: resource, action }, user);
    },

    async cannot(
      action: ResourceActionName<T>,
      user?: AuthUser
    ): Promise<boolean> {
      return !(await this.can(action, user));
    },

    async require(
      action: ResourceActionName<T>,
      user?: AuthUser
    ): Promise<void> {
      if (!(await this.can(action, user))) {
        throw new Error(`Permission denied: ${action} on ${resource}`);
      }
    },
  };
}

// Usage
const DocumentPerms = createPermissionChecker('documents');

await DocumentPerms.can('read'); // ✅ Type-safe
await DocumentPerms.require('update'); // ✅ Throws if no permission
```

---

## Module Augmentation

**⚠️ IMPORTANT:** To use type-safe permissions with your custom resources and actions, you **must** augment the `Resources` interface from `reslib/resources`.

### Why Module Augmentation?

Module augmentation allows you to extend the type system with your application-specific resources and actions. This provides:

- ✅ **Type Safety** - TypeScript autocomplete for resource and action names
- ✅ **Compile-Time Checks** - Catch typos and invalid permissions at build time
- ✅ **Better DX** - IntelliSense support in your IDE
- ✅ **Refactoring Safety** - Rename resources/actions with confidence

### Basic Module Augmentation

Create a `types.d.ts` file (or any `.ts` file) in your project:

```typescript
// types.d.ts or app-types.ts
import { ResourceAction, ResourceBase } from 'reslib/resources';

declare module 'reslib/resources' {
  interface Resources {
    // Simple resources (uses default actions: read, create, update, delete)
    documents: ResourceBase;
    users: ResourceBase;
    articles: ResourceBase;

    // Resources with custom actions
    media: {
      actions: {
        upload: ResourceAction;
        download: ResourceAction;
        edit: ResourceAction;
      };
    };

    // More custom resources
    comments: ResourceBase;
    settings: ResourceBase;
  }
}
```

### Resources with Custom Actions

If you need custom actions beyond the defaults (`read`, `create`, `update`, `delete`):

```typescript
declare module 'reslib/resources' {
  interface Resources {
    // Product resource with custom actions
    products: {
      actions: {
        view: ResourceAction;
        edit: ResourceAction;
        publish: ResourceAction;
        archive: ResourceAction;
        export: ResourceAction;
      };
    };

    // Workflow resource with approval actions
    workflows: {
      actions: {
        view: ResourceAction;
        submit: ResourceAction;
        approve: ResourceAction;
        reject: ResourceAction;
        cancel: ResourceAction;
      };
    };

    // Reports with specific permissions
    reports: {
      actions: {
        view: ResourceAction;
        generate: ResourceAction;
        export: ResourceAction;
        schedule: ResourceAction;
      };
    };
  }
}
```

### Real-World Example

```typescript
// src/types/auth.types.ts
import { ResourceAction, ResourceBase } from 'reslib/resources';

declare module 'reslib/resources' {
  interface Resources {
    // Core resources
    documents: {
      actions: {
        read: ResourceAction;
        create: ResourceAction;
        update: ResourceAction;
        delete: ResourceAction;
        publish: ResourceAction;
        share: ResourceAction;
      };
    };

    users: {
      actions: {
        read: ResourceAction;
        create: ResourceAction;
        update: ResourceAction;
        delete: ResourceAction;
        suspend: ResourceAction;
        activate: ResourceAction;
      };
    };

    // Simple resources with default actions
    profile: ResourceBase;
    settings: ResourceBase;
    notifications: ResourceBase;

    // Admin resources
    admin: {
      actions: {
        access: ResourceAction;
        configure: ResourceAction;
        audit: ResourceAction;
      };
    };

    // Billing resources
    billing: {
      actions: {
        read: ResourceAction;
        manage: ResourceAction;
        export: ResourceAction;
      };
    };
  }
}

// You can also extend AuthUser if needed
declare module 'reslib/auth' {
  interface AuthUser {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    department?: string;
    subscription?: 'free' | 'pro' | 'enterprise';
  }
}
```

### Using Augmented Types

Once you've augmented the modules, you'll get full type safety:

```typescript
import { Auth } from 'reslib/auth';

// ✅ Type-safe - 'documents' and 'publish' are defined
const canPublish = await Auth.isAllowed({
  resourceName: 'documents',
  action: 'publish',
});

// ❌ TypeScript Error - 'invalid' resource doesn't exist
const invalid = await Auth.isAllowed({
  resourceName: 'invalid', // Type error!
  action: 'read',
});

// ❌ TypeScript Error - 'invalidAction' doesn't exist on 'documents'
const invalidAction = await Auth.isAllowed({
  resourceName: 'documents',
  action: 'invalidAction', // Type error!
});

// ✅ Autocomplete works!
const user: AuthUser = {
  id: '123',
  perms: {
    documents: ['read', 'create'], // ← Autocomplete shows all document actions
    users: ['read', 'suspend'], // ← Autocomplete shows all user actions
  },
};
```

### Project Structure Recommendation

```
your-app/
├── src/
│   ├── types/
│   │   ├── auth.types.ts          # Auth & Resource augmentations
│   │   └── index.ts               # Export all type augmentations
│   ├── services/
│   │   └── auth.service.ts        # Auth logic
│   └── app.ts
└── tsconfig.json
```

**auth.types.ts:**

```typescript
import { ResourceAction, ResourceBase } from 'reslib/resources';

declare module 'reslib/resources' {
  interface Resources {
    documents: ResourceBase;
    users: ResourceBase;
    // ... your resources
  }
}

declare module 'reslib/auth' {
  interface AuthUser {
    firstName?: string;
    lastName?: string;
    // ... your custom properties
  }
}
```

**app.ts:**

```typescript
// Import types first (this loads the augmentations)
import './types';
import { Auth } from 'reslib/auth';

// Now you have full type safety!
```

### Common Patterns

#### 1. Multi-Module Project

If you have multiple modules/features:

```typescript
// src/features/documents/types.ts
declare module 'reslib/resources' {
  interface Resources {
    documents: {
      actions: {
        read: ResourceAction;
        create: ResourceAction;
        update: ResourceAction;
        delete: ResourceAction;
        publish: ResourceAction;
      };
    };
  }
}

// src/features/users/types.ts
declare module 'reslib/resources' {
  interface Resources {
    users: {
      actions: {
        read: ResourceAction;
        create: ResourceAction;
        update: ResourceAction;
        suspend: ResourceAction;
      };
    };
  }
}

// TypeScript will merge all declarations automatically!
```

#### 2. Environment-Specific Resources

```typescript
// src/types/resources.base.ts
declare module 'reslib/resources' {
  interface Resources {
    documents: ResourceBase;
    users: ResourceBase;
  }
}

// src/types/resources.admin.ts (only in admin builds)
declare module 'reslib/resources' {
  interface Resources {
    admin: {
      actions: {
        access: ResourceAction;
        configure: ResourceAction;
        audit: ResourceAction;
      };
    };
    system: ResourceBase;
    logs: ResourceBase;
  }
}
```

#### 3. Resource Actions from Constants

```typescript
// src/constants/permissions.ts
export const DOCUMENT_ACTIONS = [
  'read',
  'create',
  'update',
  'delete',
  'publish',
  'archive',
] as const;

export type DocumentAction = (typeof DOCUMENT_ACTIONS)[number];

// src/types/auth.types.ts
import { ResourceAction } from 'reslib/resources';
import type { DocumentAction } from '../constants/permissions';

declare module 'reslib/resources' {
  interface Resources {
    documents: {
      actions: {
        [K in DocumentAction]: ResourceAction;
      };
    };
  }
}
```

### Testing Your Augmentations

Verify your type augmentations work correctly:

```typescript
// test-types.ts
import { Auth } from 'reslib/auth';
import type { ResourceName, ResourceActionName } from 'reslib/auth';

// This should compile without errors
async function testTypes() {
  // Resource names should be type-safe
  const resource: ResourceName = 'documents'; // ✅
  // const invalid: ResourceName = 'invalid'; // ❌ Should error

  // Actions should be type-safe
  const action: ResourceActionName<'documents'> = 'read'; // ✅
  // const invalidAction: ResourceActionName<'documents'> = 'invalid'; // ❌ Should error

  // Permission checking should be type-safe
  const allowed = await Auth.isAllowed({
    resourceName: 'documents', // ✅ Autocomplete
    action: 'publish', // ✅ Autocomplete
  });
}
```

### Troubleshooting

**Issue:** Types not updating after adding augmentations

**Solution:**

1. Restart TypeScript server in your IDE (VS Code: `Cmd+Shift+P` → "TypeScript: Restart TS Server")
2. Make sure your augmentation file is imported somewhere in your app
3. Check your `tsconfig.json` includes the augmentation file

**Issue:** Augmentations not working in tests

**Solution:**

```typescript
// jest.config.js or vitest.config.js
export default {
  setupFilesAfterEnv: ['<rootDir>/src/types/index.ts'],
};
```

**Issue:** Circular dependency warnings

**Solution:** Keep type augmentations in separate files from implementation:

```typescript
// ✅ Good - types only
// src/types/auth.types.ts
declare module 'reslib/resources' {
  interface Resources {
    documents: ResourceBase;
  }
}

// ❌ Bad - implementation and types mixed
// src/services/documents.service.ts
import { Auth } from 'reslib/auth';

declare module 'reslib/resources' {
  interface Resources {
    documents: ResourceBase;
  }
}

export class DocumentService {
  // implementation
}
```

---

## Best Practices

### 1. Configure on App Initialization

```typescript
// app.ts or index.ts
import { Auth } from 'reslib/auth';

// Configure once at app startup
Auth.configure({
  sessionTTL: 7 * 24 * 60 * 60 * 1000,
  storage: new PlatformSecureStorage(),
  masterAdminCheck: async (user) => await isAdmin(user),
});
```

### 2. Use Event Listeners for Side Effects

```typescript
// Don't do this
await Auth.signIn(user);
initializeApp(); // ❌ Tightly coupled

// Do this instead
Auth.events.on('SIGN_IN', (user) => {
  initializeApp(user); // ✅ Loose coupling
});

await Auth.signIn(user);
```

### 3. Create Permission Helper Functions

```typescript
// permissions.ts
export async function requireAuth() {
  const user = await Auth.getSignedUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export async function requirePermission(
  resource: ResourceName,
  action: ResourceActionName
) {
  const allowed = await Auth.isAllowed({ resourceName: resource, action });
  if (!allowed) {
    throw new Error(`Permission denied: ${action} on ${resource}`);
  }
}

// Usage
async function deleteDocument(id: string) {
  await requireAuth();
  await requirePermission('documents', 'delete');
  // Proceed with deletion
}
```

### 4. Handle Session Expiration Gracefully

```typescript
async function withAuth<T>(operation: () => Promise<T>): Promise<T> {
  const user = await Auth.getSignedUser();

  if (!user) {
    // Session expired - redirect to login
    router.push('/login?expired=true');
    throw new Error('Session expired');
  }

  return await operation();
}

// Usage
const data = await withAuth(() => fetchUserData());
```

### 5. Implement Permission Caching (if needed)

```typescript
class PermissionCache {
  private cache = new Map<string, { value: boolean; expires: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes

  async get(key: string): Promise<boolean | undefined> {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }
    this.cache.delete(key);
    return undefined;
  }

  set(key: string, value: boolean): void {
    this.cache.set(key, {
      value,
      expires: Date.now() + this.ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

const permCache = new PermissionCache();

async function canCached(resource: ResourceName, action: ResourceActionName) {
  const key = `${resource}:${action}`;

  let result = await permCache.get(key);
  if (result === undefined) {
    result = await Auth.isAllowed({ resourceName: resource, action });
    permCache.set(key, result);
  }

  return result;
}

// Clear cache on sign-out
Auth.events.on('SIGN_OUT', () => permCache.clear());
```

### 6. Use TypeScript for Type Safety

Always leverage TypeScript's type system:

```typescript
// ❌ Don't do this
const canDelete = await Auth.isAllowed({ resourceName: 'doc', action: 'del' });

// ✅ Do this - type-safe
const canDelete = await Auth.isAllowed({
  resourceName: 'documents',
  action: 'delete',
});
```

### 7. Separate Concerns

```typescript
// auth.service.ts - Authentication logic
export class AuthService {
  static async login(credentials: LoginCredentials) {
    const userData = await api.login(credentials);
    return await Auth.signIn(userData);
  }

  static async logout() {
    await api.logout();
    await Auth.signOut();
  }
}

// permissions.service.ts - Permission logic
export class PermissionsService {
  static async can(resource: ResourceName, action: ResourceActionName) {
    return await Auth.isAllowed({ resourceName: resource, action });
  }
}

// app.ts - Use services
Auth.events.on('SIGN_IN', (user) => {
  console.log('User signed in:', user.id);
});

await AuthService.login(credentials);
```

---

## Examples

### Complete React App Example

```typescript
// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { Auth, AuthUser } from 'reslib/auth';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user on mount
    Auth.getSignedUser().then((user) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for changes
    const handleSignIn = (user: AuthUser) => setUser(user);
    const handleSignOut = () => setUser(null);

    Auth.events.on('SIGN_IN', handleSignIn);
    Auth.events.on('SIGN_OUT', handleSignOut);

    return () => {
      Auth.events.off('SIGN_IN', handleSignIn);
      Auth.events.off('SIGN_OUT', handleSignOut);
    };
  }, []);

  const signIn = async (userData: AuthUser) => {
    return await Auth.signIn(userData);
  };

  const signOut = async () => {
    return await Auth.signOut();
  };

  return { user, loading, signIn, signOut };
}

// hooks/usePermission.ts
export function usePermission(
  resource: ResourceName,
  action: ResourceActionName
) {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Auth.isAllowed({ resourceName: resource, action }).then((result) => {
      setAllowed(result);
      setLoading(false);
    });
  }, [resource, action]);

  return { allowed, loading };
}

// components/ProtectedRoute.tsx
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return <>{children}</>;
}

// components/PermissionGate.tsx
interface PermissionGateProps {
  resource: ResourceName;
  action: Resource ActionName;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function PermissionGate({
  resource,
  action,
  children,
  fallback = null
}: PermissionGateProps) {
  const { allowed, loading } = usePermission(resource, action);

  if (loading) return null;
  if (!allowed) return <>{fallback}</>;

  return <>{children}</>;
}

// Usage
function DocumentPage() {
  return (
    <ProtectedRoute>
      <div>
        <h1>Documents</h1>

        <PermissionGate resource="documents" action="create">
          <button>Create New Document</button>
        </PermissionGate>

        <DocumentList />
      </div>
    </ProtectedRoute>
  );
}
```

---

## Migration Guide

### From Version 1.x to 2.0

#### Breaking Changes

1. **All methods are now async**

   ```typescript
   // v1.x
   const user = Auth.getSignedUser(); // ❌ Sync
   Auth.setSignedUser(user);

   // v2.0
   const user = await Auth.getSignedUser(); // ✅ Async
   await Auth.setSignedUser(user);
   ```

2. **Removed client-side encryption**

   ```typescript
   // v1.x
   Auth.configure({
     encryptionKey: 'my-key', // ❌ Removed
   });

   // v2.0
   Auth.configure({
     storage: new SecureStorage(), // ✅ Use secure storage
   });
   ```

#### Migration Steps

1. **Update all Auth method calls to use `await`:**

   ```bash
   # Find all Auth method calls
   git grep -n "Auth\\.get" # Review and add await
   git grep -n "Auth\\.set" # Review and add await
   git grep -n "Auth\\.sign" # Review and add await
   git grep -n "Auth\\.isAllowed" # Review and add await
   ```

2. **Configure secure storage:**

   ```typescript
   // Add to app initialization
   import { Auth } from 'reslib/auth';
   import { createSecureStorage } from './secure-storage';

   Auth.configure({
     storage: await createSecureStorage(),
   });
   ```

3. **Update error handling:**

   ```typescript
   // Replace SessionExpiredError checks with null checks
   const user = await Auth.getSignedUser();
   if (!user) {
     // Handle no user
   }
   ```

---

## Troubleshooting

### Common Issues

#### Issue: "Cannot read property of undefined"

**Cause:** Trying to access properties on a null user

**Solution:**

```typescript
const user = await Auth.getSignedUser();
if (!user) {
  console.log('No user authenticated');
  return;
}

// Now safe to access user properties
console.log(user.id);
```

#### Issue: Permissions not working

**Cause:** Either no user signed in or incorrect permission format

**Solution:**

```typescript
// 1. Check if user is signed in
const user = await Auth.getSignedUser();
console.log('Current user:', user);

// 2. Check user permissions
console.log('User permissions:', user?.perms);

// 3. Verify permission format
const allowed = await Auth.isAllowed({
  resourceName: 'documents', // Must match your resource names
  action: 'read', // Must match your action names
});
console.log('Permission check result:', allowed);
```

#### Issue: Session expires too quickly

**Cause:** Default session TTL is 24 hours

**Solution:**

```typescript
// Increase session TTL
Auth.configure({
  sessionTTL: 30 * 24 * 60 * 60 * 1000, // 30 days
});
```

#### Issue: Storage errors

**Cause:** Storage quota exceeded or unavailable

**Solution:**

```typescript
const storage: AuthSecureStorage = {
  async set(key, value) {
    try {
      await actualStorage.set(key, value);
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        // Handle quota exceeded
        await clearOldData();
        await actualStorage.set(key, value);
      }
      throw error;
    }
  },
  // ... other methods
};
```

---

## FAQ

**Q: Is the Auth module secure?**

A: The Auth module delegates security to your configured secure storage implementation. Always use platform-native secure storage (iOS Keychain, Android Keystore, Web Crypto API) for production applications.

**Q: Can I use this with any backend?**

A: Yes! The Auth module is backend-agnostic. It only manages the frontend authentication state. You're responsible for authenticating with your backend and passing the user data to `Auth.signIn()`.

**Q: How do I handle multi-tenant applications?**

A: You can include tenant information in the `AuthUser` object and use it in permission checks:

```typescript
interface MyAuthUser extends AuthUser {
  tenantId: string;
}

const user: MyAuthUser = {
  id: 'user-123',
  tenantId: 'tenant-abc',
  perms: { documents: ['read'] },
};

// Check tenant-specific permissions
const allowed = await Auth.isAllowed((user) => {
  return user.tenantId === currentTenantId;
});
```

**Q: How do I sync auth state across browser tabs?**

A: Listen to storage events:

```typescript
window.addEventListener('storage', async (event) => {
  if (event.key === 'user-session') {
    // Session changed in another tab
    await Auth.refreshSignedUser();
  }
});
```

**Q: Can I use custom permission logic?**

A: Yes! Use function-based permissions:

```typescript
const allowed = await Auth.isAllowed((user) => {
  // Your custom logic
  return myCustomPermissionCheck(user);
});
```

---

## License

MIT © 2024

---

## Support

For issues, questions, or contributions:

- 📧 Email: support@reslib.dev
- 🐛 Issues: [GitHub Issues](https://github.com/reslib/reslib/issues)
- 📚 Docs: [Documentation](https://docs.reslib.dev)

---

**Documentation Version:** 2.0.0  
**Last Updated:** 2024-12-30
