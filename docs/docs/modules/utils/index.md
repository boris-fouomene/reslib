---
sidebar_position: 1
title: Utilities
---

# Utilities Module

A collection of commonly used utility functions for strings, objects, dates, and more.

## Overview

The Utils module provides:

- 🔤 **String Utilities** - Formatting, validation, manipulation
- 📦 **Object Utilities** - Deep clone, merge, pick, omit
- 📅 **Date Utilities** - Formatting, parsing, comparison
- 🔢 **Number Utilities** - Formatting, validation

## Import

```typescript
import { defaultStr, isEmpty, isEmail, isNumber, debounce } from 'reslib/utils';
```

## String Utilities

### `defaultStr(value, fallback)`

Returns the fallback if value is empty:

```typescript
defaultStr('hello', 'default'); // 'hello'
defaultStr('', 'default'); // 'default'
defaultStr(null, 'default'); // 'default'
defaultStr(undefined, 'default'); // 'default'
```

### `isEmpty(value)`

Checks if a value is empty:

```typescript
isEmpty(''); // true
isEmpty(null); // true
isEmpty(undefined); // true
isEmpty([]); // true
isEmpty({}); // true
isEmpty('hello'); // false
isEmpty([1, 2]); // false
```

### `isEmail(value)`

Validates email format:

```typescript
isEmail('test@example.com'); // true
isEmail('invalid-email'); // false
```

## Object Utilities

### `isObj(value)`

Checks if value is a plain object:

```typescript
isObj({}); // true
isObj({ a: 1 }); // true
isObj([]); // false
isObj(null); // false
isObj('string'); // false
```

## Number Utilities

### `isNumber(value)`

Checks if value is a valid number:

```typescript
isNumber(42); // true
isNumber(3.14); // true
isNumber('42'); // false
isNumber(NaN); // false
isNumber(Infinity); // false
```

## Function Utilities

### `debounce(fn, wait)`

Debounces a function:

```typescript
const search = debounce((query: string) => {
  console.log('Searching:', query);
}, 300);

// Only the last call within 300ms executes
search('h');
search('he');
search('hel');
search('hello'); // Only this one fires
```

## Full API

| Function          | Description              |
| ----------------- | ------------------------ |
| `defaultStr`      | Default string fallback  |
| `defaultVal`      | Default value fallback   |
| `defaultBool`     | Default boolean fallback |
| `defaultArray`    | Default array fallback   |
| `isEmpty`         | Check if empty           |
| `isEmail`         | Validate email           |
| `isNumber`        | Check if number          |
| `isObj`           | Check if object          |
| `isNonNullString` | Check non-null string    |
| `debounce`        | Debounce function        |
| `stringify`       | Safe JSON stringify      |
| `uniqid`          | Generate unique ID       |
