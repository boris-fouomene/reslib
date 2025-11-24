/**
 * A type alias for a dictionary-like object where keys are strings and values can be of any type.
 * This provides a flexible way to represent objects with dynamic string keys.
 *
 * @example
 * ```typescript
 * const user: Dictionary = { name: 'John', age: 25 };
 * const config: Dictionary = { theme: 'dark', enabled: true };
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Dictionary = Record<string, any>;

/**
 * A utility type that capitalizes the first character of a string type.
 * If the string is empty, it returns the same string.
 *
 * @typeParam S - The string type to capitalize. Must extend `string`.
 *
 * @example
 * ```typescript
 * type Greeting = UcFirst<'hello'>; // Results in 'Hello'
 * type Empty = UcFirst<''>; // Results in ''
 * type AlreadyCapitalized = UcFirst<'World'>; // Results in 'World'
 * ```
 */
export type UcFirst<S extends string> = S extends `${infer F}${infer R}`
  ? `${Uppercase<F>}${R}`
  : S;
