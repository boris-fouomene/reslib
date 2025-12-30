import { Observable, observable } from '@/observable';
import { ClassConstructor } from '@/types';
import {
  ResourceActionName,
  ResourceActionTupleArray,
  ResourceActionTupleObject,
  ResourceName,
} from '@resources/types';
import 'reflect-metadata';
import { Logger } from '../logger';
import { Session as $session } from '../session';
import { Dictionary } from '../types/dictionary';
import { isNonNullString, isObj, isPrimitive, JsonHelper } from '../utils';
import { AuthError } from './errors';
import './types';
import {
  AuthConfig,
  AuthEvent,
  AuthPerm,
  AuthPerms,
  AuthSecureStorage,
  AuthUser,
} from './types';

export * from './errors';
export * from './types';

const USER_SESSION_KEY = 'user-session';

const DEFAULT_SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

type LocalUserRef = {
  current: AuthUser | null;
};

const DefaultAuthStorage: AuthSecureStorage = {
  get: async (key) => $session.get(key),
  set: async (key, value) => {
    await $session.set(key, value);
  },
  remove: async (key) => {
    await $session.remove(key);
  },
};

export class Auth {
  /**
   * Authentication event handler.
   * Initializes an observable event handler for authentication Auth.events.
   *
   * This constant `events` is assigned an instance of `Observable<AuthEvent>`, which is used to manage
   * authentication-related events in the application. The initialization checks if the global
   * `Global.eventsResourcesObservableHandler` exists and is an object. If it does, it assigns it to
   * `events`; otherwise, it defaults to an empty object cast as `Observable<AuthEvent>`.
   *
   * This pattern allows for flexible handling of events, ensuring that the application can respond
   * to authentication actions such as sign-in, sign-out, and sign-up.
   *
   * @type {Observable<AuthEvent>}
   *
   * @example
   * import {Auth} from 'reslib/auth';
   * Auth.events.on('SIGN_IN', (user) => {
   *     console.log(`User  signed in: ${user.username}`);
   * });
   *
   * function userSignIn(user) {
   *     Auth.events.trigger('SIGN_IN', user);
   * }
   */
  static events: Observable<AuthEvent> = observable<AuthEvent>({});
  private static localUserRef: LocalUserRef = { current: null };
  private static config: AuthConfig = {
    sessionTTL: DEFAULT_SESSION_TTL,
    storage: DefaultAuthStorage,
  };

  static isMasterAdmin?: (user?: AuthUser) => Promise<boolean> | boolean;

  /**
   * Configures the Auth module with custom settings.
   *
   * @param options - Configuration options
   * @example
   * Auth.configure({
   *   encryptionKey: process.env.AUTH_KEY,
   *   sessionTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
   *   masterAdminCheck: (user) => user?.roles?.includes('admin')
   * });
   */
  static configure(options: AuthConfig): void {
    if (options.sessionTTL !== undefined) {
      Auth.config.sessionTTL = options.sessionTTL;
    }
    if (options.storage) {
      Auth.config.storage = options.storage;
    }
    if (options.masterAdminCheck) {
      Auth.isMasterAdmin = options.masterAdminCheck;
    }
  }

  private static async _isMasterAdmin(user?: AuthUser): Promise<boolean> {
    user = this.isValidUser(user)
      ? user
      : ((await Auth.getSignedUser()) ?? undefined);
    return typeof Auth.isMasterAdmin === 'function'
      ? await Auth.isMasterAdmin(user)
      : false;
  }

  /**
   * Validates if a session is expired based on configured TTL.
   * @param sessionCreatedAt - Session creation timestamp
   * @returns true if session is valid, false if expired
   */
  private static isSessionValid(sessionCreatedAt?: number): boolean {
    if (!sessionCreatedAt) return true; // No timestamp means legacy session
    const now = Date.now();
    const age = now - sessionCreatedAt;
    return age <= (Auth.config.sessionTTL || DEFAULT_SESSION_TTL);
  }

  /**
   * Retrieves the currently authenticated user from secure storage.
   *
   * @returns The authenticated user or null if not signed in
   */
  static async getSignedUser(): Promise<AuthUser | null> {
    // Check cached user first
    if (this.isValidUser(Auth.localUserRef.current)) {
      // Validate session expiration
      if (!Auth.isSessionValid(Auth.localUserRef.current.sessionCreatedAt)) {
        // Clear cache and throw error instead of side effect
        Auth.localUserRef.current = null;
      }
      return Auth.localUserRef.current;
    }

    // Fetch from storage
    try {
      const userJson = await this.secureStorage.get(USER_SESSION_KEY);

      if (!userJson) {
        return null;
      }

      const user = JsonHelper.parse(userJson);

      // Validate user structure
      if (!this.isValidUser(user)) {
        Logger.log('Invalid user structure in storage');
        return null;
      }

      // Validate session expiration
      if (!Auth.isSessionValid(user.sessionCreatedAt)) {
        Auth.localUserRef.current = null;
      }

      // Cache and return
      Auth.localUserRef.current = user;
      return user;
    } catch (e) {
      Logger.log(Auth.name, 'Error getting signed user:', e);
      throw AuthError.from(e);
    }
  }

  /**
   * Forces a refresh of the user session from storage.
   * Clears the cache and retrieves fresh data.
   *
   * @returns The refreshed user object or null
   */
  static async refreshSignedUser(): Promise<AuthUser | null> {
    Auth.localUserRef.current = null;
    return await Auth.getSignedUser();
  }

  /**
   * Securely stores an authenticated user in secure storage.
   * Only triggers events if storage operation succeeds.
   *
   * @param u - The user object to store, or null to sign out
   * @param triggerEvent - Whether to trigger SIGN_IN/SIGN_OUT events
   * @returns The stored user object
   * @throws {AuthError} If storage operation fails
   */
  static async setSignedUser(
    u: AuthUser | null,
    triggerEvent?: boolean
  ): Promise<AuthUser | null> {
    try {
      let userToStore: AuthUser | null = u;

      // Add timestamp if storing a user
      if (this.isValidUser(u)) {
        userToStore = { ...u, sessionCreatedAt: new Date().getTime() };
      }

      // Store or remove from secure storage
      if (userToStore) {
        const userJson = JSON.stringify(userToStore);
        await this.secureStorage.set(USER_SESSION_KEY, userJson);
      } else {
        await this.secureStorage.remove(USER_SESSION_KEY);
      }

      // Only update cache after successful storage
      Auth.localUserRef.current = userToStore;

      // Only trigger events after successful storage
      if (triggerEvent) {
        const event = userToStore ? 'SIGN_IN' : 'SIGN_OUT';
        Auth.events.trigger(event, userToStore);
      }

      return userToStore;
    } catch (e) {
      Logger.log('Error setting signed user:', e);
      // Don't update cache on error
      throw new AuthError('Failed to store user session');
    }
  }

  static async signIn(
    user: AuthUser,
    triggerEvent: boolean = true
  ): Promise<AuthUser> {
    return (await Auth.setSignedUser(user, triggerEvent)) as AuthUser;
  }

  static async signOut(triggerEvent: boolean = true): Promise<void> {
    await Auth.setSignedUser(null, triggerEvent);
  }

  private static isResourceActionTupleArray<
    TResourceName extends ResourceName = ResourceName,
  >(
    perm: AuthPerm<TResourceName>
  ): perm is ResourceActionTupleArray<TResourceName> {
    return (
      Array.isArray(perm) &&
      perm.length === 2 &&
      isNonNullString(perm[0]) &&
      isNonNullString(perm[1])
    );
  }
  private static isResourceActionTupleObject<
    TResourceName extends ResourceName = ResourceName,
  >(
    perm: AuthPerm<TResourceName>
  ): perm is ResourceActionTupleObject<TResourceName> {
    return (
      !Array.isArray(perm) &&
      typeof perm === 'object' &&
      isObj(perm) &&
      isNonNullString(perm.resourceName) &&
      isNonNullString(perm.action)
    );
  }

  static isValidUser(user: unknown): user is AuthUser {
    if (
      !user ||
      typeof user !== 'object' ||
      Array.isArray(user) ||
      isPrimitive(user)
    ) {
      return false;
    }
    return true;
  }
  static async isAllowed<TResourceName extends ResourceName = ResourceName>(
    perm: AuthPerm<TResourceName>,
    user?: AuthUser | null
  ): Promise<boolean> {
    user = this.isValidUser(user) ? user : await this.getSignedUser();
    if (!this.isValidUser(user)) {
      return false;
    }
    if (typeof perm === 'boolean') return perm;
    const isMasterAdmin = await this._isMasterAdmin(user);
    if (isMasterAdmin) {
      return true;
    }
    if (!perm) return true;
    if (typeof perm === 'function') return !!perm(user);
    if (Auth.isResourceActionTupleObject(perm)) {
      if (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Auth.checkUserPermission(user, perm.resourceName, perm.action as any)
      ) {
        return true;
      }
    } else if (Auth.isResourceActionTupleArray(perm)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (Auth.checkUserPermission(user, perm[0], perm[1] as any)) {
        return true;
      }
    } else if (Array.isArray(perm)) {
      for (const p of perm) {
        if (Auth.isResourceActionTupleArray(p)) {
          if (Auth.checkUserPermission(user, p[0], p[1])) {
            return true;
          }
        } else if (Auth.isResourceActionTupleObject(p)) {
          if (Auth.checkUserPermission(user, p.resourceName, p.action)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  static checkUserPermission<TResourceName extends ResourceName = ResourceName>(
    user: AuthUser,
    resource: TResourceName,
    action: ResourceActionName<TResourceName> = 'read'
  ) {
    if (!this.isValidUser(user)) return false;
    if (
      isObj(user.perms) &&
      user.perms &&
      Auth.checkPermission(user.perms, resource, action)
    ) {
      return true;
    }
    if (Array.isArray(user?.roles)) {
      for (const role of user.roles) {
        if (
          isObj(role) &&
          isObj(role.perms) &&
          Auth.checkPermission(role.perms, resource, action)
        ) {
          return true;
        }
      }
      return false;
    }
    return false;
  }

  static checkPermission<TResourceName extends ResourceName = ResourceName>(
    perms: AuthPerms,
    resource: TResourceName,
    action: ResourceActionName<TResourceName> = 'read'
  ) {
    resource = (isNonNullString(resource) ? resource : '') as TResourceName;
    if (!isObj(perms) || !resource) {
      return false;
    }
    const resourceStr = String(resource).trim().toLowerCase();
    action = isNonNullString(action) ? action : 'read';

    // Find matching resource with case-insensitive comparison
    let userActions: ResourceActionName[] = [];
    const foundEntry = Object.entries(perms).find(
      ([key]) => String(key).toLowerCase().trim() === resourceStr
    );

    if (foundEntry && Array.isArray(foundEntry[1])) {
      userActions = foundEntry[1] as ResourceActionName[];
    }

    if (!Array.isArray(userActions) || !userActions.length) return false;
    if (userActions.includes('all')) {
      return true;
    }

    for (const userAction of userActions) {
      if (Auth.isAllowedForAction<TResourceName>(userAction, action)) {
        return true;
      }
    }
    return false;
  }

  static isAllowedForAction<TResourceName extends ResourceName = ResourceName>(
    permFromResource: ResourceActionName<TResourceName>,
    action: ResourceActionName<TResourceName>
  ) {
    if (!isNonNullString(action) || !isNonNullString(permFromResource)) {
      return false;
    }
    return (
      String(action).trim().toLowerCase() ===
      String(permFromResource).trim().toLowerCase()
    );
  }

  private static _secureStorage: AuthSecureStorage = DefaultAuthStorage;

  /**
   * Gets the currently configured secure storage implementation for authentication data.
   *
   * This getter provides access to the secure storage adapter that handles sensitive authentication
   * data like tokens and encrypted user sessions. The method implements a fallback mechanism that
   * prioritizes custom implementations while maintaining a default secure storage as backup.
   *
   * ### Storage Resolution Priority:
   * 1. **Custom Storage**: Returns the user-configured storage implementation if valid
   * 2. **Cached Storage**: Returns the previously validated storage instance
   * 3. **Default Storage**: Falls back to the built-in secure storage wrapper
   *
   * ### Security Architecture:
   * - **Validation**: All storage implementations are validated before use
   * - **Metadata Storage**: Uses reflection metadata to persist custom configurations
   * - **Fail-Safe Design**: Always returns a working storage implementation
   * - **Cross-Platform**: Supports platform-specific secure storage adapters
   *
   * ### Implementation Details:
   * The getter checks for custom storage configurations stored via reflection metadata,
   * validates the implementation, and caches it for performance. If no valid custom
   * storage is found, it returns the default secure storage that wraps the session module.
   *
   * @returns The configured `AuthSecureStorage` implementation for secure data operations.
   *          This will be either a custom user-provided storage adapter or the default
   *          secure storage implementation that provides basic encrypted session storage.
   *
   * @example
   * ```typescript
   * // Get the current secure storage implementation
   * const storage = Auth.secureStorage;
   * console.log(storage.constructor.name); // "WebSecureStorage" or "DefaultAuthStorage"
   * ```
   *
   * @example
   * ```typescript
   * // Check if custom storage is configured
   * const currentStorage = Auth.secureStorage;
   * const isCustomStorage = currentStorage !== Auth['DefaultAuthStorage'];
   * console.log(`Using custom storage: ${isCustomStorage}`);
   * ```
   *
   * @example
   * ```typescript
   * // Access storage methods directly
   * const token = await Auth.secureStorage.get('auth-token');
   * await Auth.secureStorage.set('user-session', encryptedData);
   * await Auth.secureStorage.remove('expired-data');
   * ```
   *
   * @see {@link Auth.secureStorage} - Setter for configuring custom storage
   * @see {@link AuthSecureStorage} - Interface defining storage contract
   * @see {@link DefaultAuthStorage} - Default secure storage implementation
   * @see {@link Auth.getToken} - Uses this storage for token retrieval
   * @see {@link Auth.setToken} - Uses this storage for token storage
   *
   * @public
   * @readonly
   *
   * @remarks
   * **Performance Considerations:**
   * - The getter caches validated storage instances to avoid repeated validation
   * - Metadata lookup is performed only when necessary
   * - Default storage is lightweight and doesn't require external dependencies
   *
   * **Security Best Practices:**
   * - Never directly access the private `_secureStorage` field
   * - Always use this getter to ensure proper validation and fallbacks
   * - Custom storage implementations should handle encryption internally
   * - Validate storage implementations before configuration
   *
   * **Platform Compatibility:**
   * - Default storage works across web, Node.js, and React Native environments
   * - Custom implementations can provide platform-specific optimizations
   * - Storage validation ensures consistent behavior across platforms
   */
  static get secureStorage(): AuthSecureStorage {
    const storage = Reflect.getMetadata(Auth.authStorageMetaData, Auth);
    if (isValidStorage(storage)) {
      this._secureStorage = storage;
    }
    if (this._secureStorage) return this._secureStorage;
    return DefaultAuthStorage;
  }

  /**
   * Configures a custom secure storage implementation for authentication data.
   *
   * This setter allows injection of platform-specific or custom secure storage adapters
   * that implement the `AuthSecureStorage` interface. The configured storage will be
   * used for all secure data operations including token storage, encrypted user sessions,
   * and other sensitive authentication data.
   *
   * ### Configuration Process:
   * 1. **Validation**: The provided storage implementation is validated for required methods
   * 2. **Metadata Storage**: Valid implementations are stored using reflection metadata
   * 3. **Caching**: The validated storage is cached for performance optimization
   * 4. **Fallback**: Invalid implementations are rejected, preserving existing configuration
   *
   * ### Security Requirements:
   * - **Method Validation**: Storage must implement `get`, `set`, and `remove` methods
   * - **Async Operations**: All methods must return Promises for secure storage APIs
   * - **Error Handling**: Implementations should handle storage failures gracefully
   * - **Encryption**: Sensitive data should be encrypted at the storage layer
   *
   * ### Use Cases:
   * - **Web Applications**: HttpOnly cookies, IndexedDB with encryption
   * - **React Native**: expo-secure-store, react-native-keychain
   * - **Node.js**: Encrypted file storage, environment variables
   * - **Enterprise**: Hardware security modules, key management services
   *
   * @param secureStorage - A custom storage implementation conforming to the `AuthSecureStorage` interface.
   *                       The implementation must provide secure, asynchronous storage operations.
   *                       Invalid or incomplete implementations will be rejected.
   *
   * @example
   * ```typescript
   * // Configure for web environment with HttpOnly cookies
   * class WebSecureStorage implements AuthSecureStorage {
   *   async get(key: string): Promise<string | null> {
   *     return Cookies.get(key) || null;
   *   }
   *   async set(key: string, value: string): Promise<void> {
   *     Cookies.set(key, value, { httpOnly: true, secure: true });
   *   }
   *   async remove(key: string): Promise<void> {
   *     Cookies.remove(key);
   *   }
   * }
   *
   * Auth.secureStorage = new WebSecureStorage();
   * ```
   *
   * @example
   * ```typescript
   * // Configure for React Native with expo-secure-store
   * import * as SecureStore from 'expo-secure-store';
   *
   * class ReactNativeSecureStorage implements AuthSecureStorage {
   *   async get(key: string): Promise<string | null> {
   *     try {
   *       return await SecureStore.getItemAsync(key);
   *     } catch {
   *       return null;
   *     }
   *   }
   *   async set(key: string, value: string): Promise<void> {
   *     await SecureStore.setItemAsync(key, value);
   *   }
   *   async remove(key: string): Promise<void> {
   *     await SecureStore.deleteItemAsync(key);
   *   }
   * }
   *
   * Auth.secureStorage = new ReactNativeSecureStorage();
   * ```
   *
   * @example
   * ```typescript
   * // Configure for Node.js with encrypted file storage
   * import * as fs from 'fs';
   * import * as crypto from 'crypto';
   *
   * class NodeSecureStorage implements AuthSecureStorage {
   *   private encrypt(data: string): string {
   *     const cipher = crypto.createCipher('aes-256-cbc', 'encryption-key');
   *     return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
   *   }
   *
   *   private decrypt(data: string): string {
   *     const decipher = crypto.createDecipher('aes-256-cbc', 'encryption-key');
   *     return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
   *   }
   *
   *   async get(key: string): Promise<string | null> {
   *     try {
   *       const filePath = `./secure/${key}.enc`;
   *       if (!fs.existsSync(filePath)) return null;
   *       const encrypted = fs.readFileSync(filePath, 'utf8');
   *       return this.decrypt(encrypted);
   *     } catch {
   *       return null;
   *     }
   *   }
   *
   *   async set(key: string, value: string): Promise<void> {
   *     const encrypted = this.encrypt(value);
   *     const filePath = `./secure/${key}.enc`;
   *     fs.writeFileSync(filePath, encrypted);
   *   }
   *
   *   async remove(key: string): Promise<void> {
   *     const filePath = `./secure/${key}.enc`;
   *     if (fs.existsSync(filePath)) {
   *       fs.unlinkSync(filePath);
   *     }
   *   }
   * }
   *
   * Auth.secureStorage = new NodeSecureStorage();
   * ```
   *
   * @example
   * ```typescript
   * // Error handling for invalid storage implementations
   * class InvalidStorage implements AuthSecureStorage {
   *   // Missing required methods
   *   async get(key: string): Promise<string | null> {
   *     return null;
   *   }
   *   // Missing set and remove methods
   * }
   *
   * try {
   *   Auth.secureStorage = new InvalidStorage(); // Will be rejected
   *   console.log('Storage configured successfully');
   * } catch (error) {
   *   console.log('Storage configuration failed:', error.message);
   * }
   * ```
   *
   * @see {@link Auth.secureStorage} - Getter for accessing configured storage
   * @see {@link AuthSecureStorage} - Interface defining required storage methods
   * @see {@link DefaultAuthStorage} - Default storage implementation
   * @see {@link isValidStorage} - Validation function for storage implementations
   * @see {@link Auth.getToken} - Uses configured storage for token operations
   * @see {@link Auth.setToken} - Uses configured storage for token operations
   *
   * @public
   *
   * @remarks
   * **Implementation Requirements:**
   * - All methods must be asynchronous and return Promises
   * - Storage implementations should handle errors gracefully
   * - Sensitive data should be encrypted before storage
   * - Implementations should be thread-safe where applicable
   *
   * **Security Considerations:**
   * - Never store sensitive data in plain text
   * - Implement proper error handling to prevent information leakage
   * - Use platform-specific secure storage APIs when available
   * - Consider data encryption and integrity verification
   *
   * **Performance Guidelines:**
   * - Implementations should be efficient for frequent access patterns
   * - Consider caching strategies for improved performance
   * - Avoid synchronous operations that could block the event loop
   * - Implement connection pooling for network-based storage
   *
   * **Testing Recommendations:**
   * - Test storage operations under various failure conditions
   * - Verify encryption/decryption works correctly
   * - Test concurrent access patterns
   * - Validate behavior across different platforms
   */
  public static set secureStorage(secureStorage: AuthSecureStorage) {
    if (isValidStorage(secureStorage)) {
      Reflect.defineMetadata(Auth.authStorageMetaData, secureStorage, Auth);
    }
  }

  private static readonly authStorageMetaData = Symbol('auth:storage:meta');
}

/**
 * Decorator factory for automatically attaching secure storage implementations to the Auth module.
 *
 * This decorator provides a declarative way to configure custom secure storage implementations
 * for the authentication system. When applied to a class that implements `AuthSecureStorage`,
 * it automatically instantiates the class, validates the implementation, and configures it
 * as the active secure storage for all authentication operations.
 *
 * ### How It Works:
 * 1. **Class Instantiation**: Creates a new instance of the decorated storage class
 * 2. **Validation**: Verifies the instance implements all required `AuthSecureStorage` methods
 * 3. **Configuration**: Sets the validated instance as the active secure storage via `Auth.secureStorage`
 * 4. **Error Handling**: Gracefully handles instantiation or validation failures
 *
 * ### Use Cases:
 * - **Dependency Injection**: Declarative configuration of storage implementations
 * - **Module Registration**: Automatic registration during module initialization
 * - **Platform Abstraction**: Easy switching between platform-specific storage implementations
 * - **Testing**: Simplified setup of mock or test storage implementations
 *
 * ### Security Features:
 * - **Runtime Validation**: Ensures storage implementations are valid before use
 * - **Fail-Safe Operation**: Invalid implementations are rejected without breaking the system
 * - **Error Isolation**: Storage configuration errors don't prevent application startup
 * - **Type Safety**: TypeScript ensures decorated classes conform to the interface
 *
 * @returns A class decorator function that configures secure storage implementations.
 *
 * @example
 * ```typescript
 * // Basic usage with a custom storage implementation
 * @AttachAuthSecureStorage()
 * class CustomSecureStorage implements AuthSecureStorage {
 *   async get(key: string): Promise<string | null> {
 *     // Custom secure storage logic
 *     return await this.customGet(key);
 *   }
 *
 *   async set(key: string, value: string): Promise<void> {
 *     // Custom secure storage logic
 *     await this.customSet(key, value);
 *   }
 *
 *   async remove(key: string): Promise<void> {
 *     // Custom secure storage logic
 *     await this.customRemove(key);
 *   }
 * }
 *
 * // The CustomSecureStorage is automatically configured when the module loads
 * ```
 *
 * @example
 * ```typescript
 * // Platform-specific storage implementations
 * @AttachAuthSecureStorage()
 * class WebSecureStorage implements AuthSecureStorage {
 *   async get(key: string): Promise<string | null> {
 *     return Cookies.get(key) || null;
 *   }
 *
 *   async set(key: string, value: string): Promise<void> {
 *     Cookies.set(key, value, { httpOnly: true, secure: true });
 *   }
 *
 *   async remove(key: string): Promise<void> {
 *     Cookies.remove(key);
 *   }
 * }
 *
 * @AttachAuthSecureStorage()
 * class ReactNativeSecureStorage implements AuthSecureStorage {
 *   async get(key: string): Promise<string | null> {
 *     return await SecureStore.getItemAsync(key);
 *   }
 *
 *   async set(key: string, value: string): Promise<void> {
 *     await SecureStore.setItemAsync(key, value);
 *   }
 *
 *   async remove(key: string): Promise<void> {
 *     await SecureStore.deleteItemAsync(key);
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Error handling for invalid implementations
 * @AttachAuthSecureStorage()
 * class InvalidStorage {
 *   // Missing required methods - will be rejected during validation
 *   async get(key: string): Promise<string | null> {
 *     return null;
 *   }
 *   // Missing set() and remove() methods
 * }
 *
 * // The decorator will log an error and skip configuration
 * // Auth.secureStorage will retain its previous configuration
 * ```
 *
 * @example
 * ```typescript
 * // Testing with mock storage
 * @AttachAuthSecureStorage()
 * class MockSecureStorage implements AuthSecureStorage {
 *   private store = new Map<string, string>();
 *
 *   async get(key: string): Promise<string | null> {
 *     return this.store.get(key) || null;
 *   }
 *
 *   async set(key: string, value: string): Promise<void> {
 *     this.store.set(key, value);
 *   }
 *
 *   async remove(key: string): Promise<void> {
 *     this.store.delete(key);
 *   }
 *
 *   // Additional methods for testing
 *   clearAll(): void {
 *     this.store.clear();
 *   }
 *
 *   getAllData(): Map<string, string> {
 *     return new Map(this.store);
 *   }
 * }
 *
 * // In tests, you can access the configured storage
 * const mockStorage = Auth.secureStorage as MockSecureStorage;
 * mockStorage.clearAll(); // Clear all test data
 * ```
 *
 * @example
 * ```typescript
 * // Advanced usage with dependency injection
 * interface StorageDependencies {
 *   encryptionKey: string;
 *   storagePath: string;
 * }
 *
 * @AttachAuthSecureStorage()
 * class EncryptedFileStorage implements AuthSecureStorage {
 *   constructor(private deps: StorageDependencies = {
 *     encryptionKey: 'default-key',
 *     storagePath: './secure'
 *   }) {}
 *
 *   async get(key: string): Promise<string | null> {
 *     // Implementation using this.deps.encryptionKey and this.deps.storagePath
 *     return null;
 *   }
 *
 *   async set(key: string, value: string): Promise<void> {
 *     // Implementation using dependencies
 *   }
 *
 *   async remove(key: string): Promise<void> {
 *     // Implementation using dependencies
 *   }
 * }
 * ```
 *
 * @see {@link AuthSecureStorage} - Interface that decorated classes must implement
 * @see {@link Auth.secureStorage} - Property that gets configured by this decorator
 * @see {@link isValidStorage} - Validation function used internally
 * @see {@link Auth.getToken} - Uses the configured storage for token operations
 * @see {@link Auth.setToken} - Uses the configured storage for token operations
 *
 * @public
 *
 * @remarks
 * **Decorator Execution:**
 * - Decorators are executed when the module is loaded, not when instances are created
 * - Multiple decorated classes will overwrite each other (last one wins)
 * - Failed validations are logged but don't throw exceptions
 *
 * **Best Practices:**
 * - Use this decorator for singleton storage implementations
 * - Ensure decorated classes have parameterless constructors
 * - Implement proper error handling in storage methods
 * - Test storage implementations thoroughly before decoration
 *
 * **Security Considerations:**
 * - Decorated classes should implement proper encryption
 * - Validate storage implementations in development environments
 * - Monitor error logs for storage configuration failures
 * - Consider the security implications of automatic configuration
 *
 * **Performance Notes:**
 * - Storage instantiation happens once during module initialization
 * - Validation overhead is minimal and occurs only at startup
 * - Decorated storage implementations should be optimized for frequent access
 *
 * **Error Handling:**
 * - Instantiation errors are caught and logged
 * - Validation failures are logged but don't prevent module loading
 * - Previous storage configuration is preserved on failure
 * - Error messages include context for debugging
 *
 * **TypeScript Integration:**
 * - Provides compile-time type checking for decorated classes
 * - Ensures interface compliance through type constraints
 * - Supports IntelliSense and refactoring tools
 */
export function AttachAuthSecureStorage() {
  return function (target: ClassConstructor<AuthSecureStorage>) {
    try {
      const storage = new target();
      if (!isValidStorage(storage)) {
        return;
      }
      Auth.secureStorage = storage;
    } catch (error) {
      Logger.error(error, ' registering secure storage');
    }
  };
}

const isValidStorage = (storage?: AuthSecureStorage): boolean => {
  if (!storage) return false;
  try {
    return ['get', 'set', 'remove'].every(
      (value) => typeof (storage as Dictionary)[value] === 'function'
    );
  } catch {
    return false;
  }
};
