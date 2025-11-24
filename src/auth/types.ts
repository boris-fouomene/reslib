import {
  ResourceActionName,
  ResourceActionTuple,
  ResourceName,
} from '@resources/types';
import { Dictionary } from '../types/dictionary';
/**
 * @interface AuthUser
 * Represents an authenticated user in the application.
 *
 * The `AuthUser ` interface defines the structure for an authenticated
 * user object, which includes an identifier, an optional timestamp
 * for when the authentication session was created, and an optional
 * permissions map that specifies the actions the user can perform
 * on various resources.
 *
 * ### Properties
 *
 * - `id` (string | number): A unique identifier for the user. This
 *   can be either a string or a number, depending on the implementation.
 *
 * - `authSessionCreatedAt` (number, optional): An optional property
 *   that stores the timestamp (in milliseconds) of when the
 *   authentication session was created. This can be useful for
 *   tracking session duration or expiration.
 *
 * - `perms` (IAuthPerms , optional):
 *   An optional property that maps resource names to an array of
 *   actions that the user is permitted to perform on those resources.
 *   This allows for fine-grained control over user permissions within
 *   the application.
 *
 * ### Example Usage
 *
 * Here is an example of how the `AuthUser ` interface can be used:
 *
 * ```typescript
 * const user: AuthUser  = {
 *     id: "user123",
 *     authSessionCreatedAt: Date.now(),
 *     perms: {
 *         documents: ["read", "create", "update"],
 *         users: ["read", "delete"]
 *     }
 * };
 *
 * // Function to check if a user has permission to perform an action
 * function hasPermission(user: AuthUser , resource: ResourceName, action: ResourceActionName): boolean {
 *     return user.perms?.[resource]?.includes(action) ?? false;
 * }
 *
 * // Example of checking permissions
 * const canReadDocuments = hasPermission(user, "documents", "read"); // true
 * const canDeleteUsers = hasPermission(user, "users", "delete"); // true
 * ```
 *
 * In this example, the `AuthUser ` interface is used to define a user
 * object with an ID, session creation timestamp, and a permissions map.
 * The `hasPermission` function checks if the user has the specified
 * permission for a given resource, demonstrating how the `perms`
 * property can be utilized in permission management.
 * @see {@link ResourceName} for the `ResourceName` type.
 * @see {@link ResourceActionName} for the `ResourceActionName` type.
 * @see {@link IAuthPerms} for the `IAuthPerms` type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface AuthUser extends Record<string, any> {
  id: string | number;
  authSessionCreatedAt?: number;
  perms?: IAuthPerms;
  /**
   * The authentication token associated with the user.
   */
  token?: string;

  roles?: AuthRole[];
}

/**
 * Interface representing an authorization role.
 *
 * @description This interface defines the structure of an authorization role,
 *              which consists of a name and a set of permissions.
 *
 * @example
 * ```typescript
 * const adminRole: AuthRole = {
 *   name: 'admin',
 *   perms: {
 *     // permissions for the admin role
 *     "documents": ["read", "create", "update"],
 *     "users": ["read", "delete"],
 *     "posts": ["read", "create"],
 *   }
 * };
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface AuthRole extends Record<string, any> {
  /**
   * The name of the authorization role.
   *
   * @description This property represents the unique identifier of the role.
   * @example 'admin', 'moderator', 'user'
   */
  name: string;

  /**
   * The set of permissions associated with the role.
   *
   * @description This property represents the permissions that are granted to the role.
   * @see {@link IAuthPerms} for the `IAuthPerms` type.
   * @example
   * ```typescript
   * const perms: IAuthPerms = {
   *   // permissions for the role
   *   "documents": ["read", "create", "update"],
   *   "users": ["read", "delete"],
   *   "posts": ["read", "create"],
   * };
   * ```
   */
  perms: IAuthPerms;
}
/**
 * @interface IAuthSessionStorage
 * Interface for managing authentication session storage.
 *
 * The `IAuthSessionStorage` interface defines methods for storing and
 * retrieving session data associated with authenticated users. This
 * interface provides a structured way to manage session data, ensuring
 * that it can be easily accessed and manipulated.
 *
 * ### Methods
 *
 * - `get(key?: string): any`: Retrieves the value of the session
 *   associated with the specified key. If no key is provided, it
 *   returns the entire session value.
 *
 *   @param {string} key - The key of the value to retrieve.
 *   @returns {any} The value associated with the specified key, or
 *   undefined if the key does not exist.
 *
 * - `set(key?: string | Dictionary, value?: any): any`: Persists a value
 *   in the session storage. This can either be a single key-value
 *   pair or an object containing multiple session data.
 *
 *   @param {string | Dictionary} key - The key of the value to persist, or
 *   an object containing session data.
 *   @param {any} value - The value to persist. This can be of any type.
 *
 * - `getData(): Dictionary`: Retrieves all session data associated with
 *   the session name defined in the `sessionName` property.
 *
 *   @returns {Dictionary} An object containing all session data.
 *
 * - `getKey(): string`: Returns the key associated with the session
 *   name defined in the `sessionName` property.
 *
 *   @returns {string} The session key.
 *
 * ### Properties
 *
 * - `sessionName` (string, optional): The name of the session used by
 *   the session manager. This can be used to identify the session
 *   context in which the storage operates.
 */
export interface IAuthSessionStorage {
  /**
   * Retrieves the value of the session associated with the specified key.
   *
   * @param {string} key - The key of the value to retrieve.
   * @returns {any} The value associated with the specified key, or undefined if the key does not exist.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get: (key?: string) => any;

  /**
   * Persists a value in the session storage.
   *
   * @param {string | Dictionary} key - The key of the value to persist, or an object containing session data.
   * @param {any} value - The value to persist. This can be of any type.
   * @returns {any} The result of the persistence operation.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set: (key?: string | Dictionary, value?: any) => any;

  /**
   * Retrieves all session data associated with the session name.
   *
   * @returns {Dictionary} An object containing all session data.
   */
  getData: () => Dictionary;

  /**
   * Returns the key associated with the session name.
   *
   * @returns {string} The session key.
   */
  getKey: () => string;

  /**
   * The name of the session used by the session manager.
   */
  sessionName?: string;
}

/**
 * @interface AuthPerm
 * Represents the type associated with the `perm` property, used to evaluate 
 * whether a user has access to a resource.
 * 
 * The `AuthPerm` type can take on different forms to define permissions 
 * for accessing resources in an application, including a function that returns a boolean,
 * a boolean value, a single resource action tuple, or an array of resource action tuples. This flexibility allows 
 * for both simple string-based permissions and more complex logic 
 * through functions.
 * @template TResourceName - The name of the resource. Defaults to `ResourceName`.
 
 * ### Possible Values:
 * 
 * - **Function**: If `AuthPerm` is a function, it must return a boolean 
 *   value that determines whether access to the resource should be 
 *   granted to the user. This allows for dynamic permission checks 
 *   based on custom logic.
 * 
 * - **False**: The value `false` indicates that no permission is 
 *   granted for the resource.
 * - **Resource Action Tuple**: A resource action tuple is an array of two elements: the resource name and the action name. This tuple represents a specific action on a resource and can be used to check if a user has permission to perform that action.
 * - **Array of Resource Action Tuples**: An array of resource action tuples allows for checking if a user has permission to perform multiple actions on a resource. This can be useful when you want to check if a user has permission to perform multiple actions on a resource, such as creating, updating, or deleting a resource.
 * - **
 * 
 * ### Example Usage:
 * 
 * Here are some examples of how the `AuthPerm` type can be used:
 * 
 * ```typescript
 * // Example of a dynamic permission check using a function
 * const dynamicPermission: AuthPerm = (user: AuthUser) => {
 *     const userRole = getUserRole(user); // Assume this function retrieves the user's role
 *     return userRole === 'admin'; // Grant access if the user is an admin
 * };
 * 
 * // Example of no permission
 * const noPermission: AuthPerm = false;
 * 
 *  * // Using a single resource action tuple
 * const perm: AuthPerm = ["users", "read"];
 * 
 * // Using an array of resource action tuples
 * const perm: AuthPerm = [["users", "read"], ["users", "create"],{"resourceName": "users", "action": "update"}];
 * ```
 * 
 * In these examples, the `AuthPerm` type is used to define various 
 * permissions for accessing resources, demonstrating its flexibility 
 * and utility in permission management.
 * ```
 * 
 * 
 * @see {@link ResourceName} for the `ResourceName` type.
 * @typedef {((user: AuthUser) => boolean) | false | ResourceActionTuple<TResourceName> | ResourceActionTuple<TResourceName>[]} AuthPerm
 */
export type AuthPerm<TResourceName extends ResourceName = ResourceName> =
  | ((user: AuthUser) => boolean)
  | false
  | ResourceActionTuple<TResourceName>
  | ResourceActionTuple<TResourceName>[];

/**
 * Represents a mapping of authentication permissions for resources.
 * The `IAuthPerms` type defines a structure that maps resource names
 * to an array of actions that can be performed on those resources.
 * This type is useful for managing user permissions in an application,
 * allowing for fine-grained control over what actions users can take
 * on various resources.
 *
 *
 * ### Structure
 *
 * The `IAuthPerms` type is defined as a `Record` where:
 * - The keys are of type `ResourceName`, representing the names of
 *   the resources (e.g., "documents", "users").
 * - The values are arrays of `ResourceActionName`, representing the
 *   actions that can be performed on the corresponding resource (e.g.,
 *   ["read", "create", "update"]).
 *
 * ### Example Usage
 *
 * Here is an example of how the `IAuthPerms` type can be used:
 *
 * ```typescript
 * // Example of defining user permissions using IAuthPerms
 * const userPermissions: IAuthPerms = {
 *     documents: ["read", "create", "update"],
 *     users: ["read", "delete"],
 *     posts: ["read", "create"]
 * };
 * ```
 *
 * In this example, the `IAuthPerms` type is used to define a permissions
 * object for a user, mapping resources to the actions they are allowed
 * to perform.
 * @typedef {Partial<{ [TResourceName in ResourceName]: Partial<ResourceActionName<TResourceName>[]> }>} IAuthPerms
 */
export type IAuthPerms = Partial<{
  [TResourceName in ResourceName]: Partial<ResourceActionName<TResourceName>[]>;
}>;

/**
 * Interface representing a mapping of authentication-related events.
 * 
 * This interface defines the various events that can occur during the 
 * authentication process, allowing for event-driven handling of user 
 * authentication actions.
 * 
 * @example
 * // Example of using IAuthEventMap
 * const authEvents: IAuthEventMap = {
 *     SIGN_IN: 'User  has signed in.',
 *     SIGN_OUT: 'User  has signed out.',
 *     SIGN_UP: 'User  has signed up.'
 * };
 * 
 * // Triggering an event
 * function triggerAuthEvent(event: IAuthEvent) {
 *     console.log(authEvents[event]); // Outputs the corresponding event message
 * }
 * 
 * triggerAuthEvent('SIGN_IN'); // Outputs: User has signed in.
 * @example 
 * // Example of augmenting IAuthEventMap with additional events
 * declare module "reslib" {
 *     interface IAuthEventMap {
 *         SOME_OTHER_EVENT: string;
 *     }
 * }
   const testAuthEvent : IAuthEvent = 'SOME_OTHER_EVENT';
 */
export interface IAuthEventMap {
  /**
   * Event triggered when a user signs in.
   *
   * This event is emitted when a user successfully logs into the system.
   * It can be used to trigger actions such as updating the user interface
   * or logging the sign-in activity.
   *
   * @example
   * // Example of handling the SIGN_IN event
   * eventEmitter.on('SIGN_IN', () => {
   *     console.log('User  signed in, updating UI...');
   * });
   */
  SIGN_IN: string;

  /**
   * Event triggered when a user signs out.
   *
   * This event is emitted when a user successfully logs out of the system.
   * It can be used to trigger actions such as clearing user data or
   * redirecting to the login page.
   *
   * @example
   * // Example of handling the SIGN_OUT event
   * eventEmitter.on('SIGN_OUT', () => {
   *     console.log('User  signed out, redirecting to login...');
   * });
   */
  SIGN_OUT: string;

  /**
   * Event triggered when a user signs up.
   *
   * This event is emitted when a new user successfully registers for an account.
   * It can be used to trigger actions such as sending a welcome email or
   * redirecting the user to a confirmation page.
   *
   * @example
   * // Example of handling the SIGN_UP event
   * eventEmitter.on('SIGN_UP', () => {
   *     console.log('New user signed up, sending welcome email...');
   * });
   */
  SIGN_UP: string;
}

/**
 * Type representing the keys of the IAuthEventMap interface.
 *
 * This type is a union of string literals corresponding to the event names
 * defined in the IAuthEventMap interface. It allows for type-safe handling
 * of authentication events throughout the application.
 *
 * @example
 * // Example of using IAuthEvent
 * function handleAuthEvent(event: IAuthEvent) {
 *     switch (event) {
 *         case 'SIGN_IN':
 *             console.log('Handling sign-in event...');
 *             break;
 *         case 'SIGN_OUT':
 *             console.log('Handling sign-out event...');
 *             break;
 *         case 'SIGN_UP':
 *             console.log('Handling sign-up event...');
 *             break;
 *     }
 * }
 */
export type IAuthEvent = keyof IAuthEventMap;
