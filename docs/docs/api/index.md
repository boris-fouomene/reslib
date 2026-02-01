---
sidebar_position: 1
title: API Reference
---

# API Reference

This section contains the auto-generated API documentation from ResLib source code.

:::info Auto-generated
API documentation is automatically generated from TypeScript source code using [TypeDoc](https://typedoc.org/).
:::

## Modules

- **Resources** - Resource management classes and decorators
- **Validator** - Validation rules and utilities
- **I18n** - Internationalization system
- **Auth** - Authentication utilities
- **Session** - Session management
- **Observable** - Event system
- **Utils** - Utility functions
- **Types** - TypeScript type definitions

## Generating API Docs

To regenerate the API docs locally:

```bash
cd docs
npm run api:generate
```

## Contributing to API Docs

All API documentation comes from JSDoc comments in the source code. To improve the docs:

1. Add or improve JSDoc comments in source files
2. Run `npm run api:generate`
3. Submit a PR

### JSDoc Example

````typescript
/**
 * Validates a single value against one or more rules.
 *
 * @param options - The validation options
 * @param options.value - The value to validate
 * @param options.rules - Array of validation rules
 * @param options.fieldName - Name of the field being validated
 * @returns A promise that resolves to the validation result
 *
 * @example
 * ```typescript
 * const result = await Validator.validate({
 *   value: 'test@example.com',
 *   rules: ['Required', 'Email'],
 *   fieldName: 'email',
 * })
 * ```
 */
static async validate(options: ValidatorOptions): Promise<ValidatorResult> {
  // ...
}
````
