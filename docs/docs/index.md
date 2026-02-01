---
slug: /
sidebar_position: 1
title: Introduction
---

# ResLib

**ResLib** is a lightweight, production-ready TypeScript library for decorator-based resource management and application utilities.

<div className="hero-badges" style={{marginBottom: '2rem'}}>

[![npm version](https://img.shields.io/npm/v/reslib.svg?style=flat-square)](https://www.npmjs.com/package/reslib)
[![npm downloads](https://img.shields.io/npm/dm/reslib.svg?style=flat-square)](https://www.npmjs.com/package/reslib)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg?style=flat-square)](https://www.typescriptlang.org/)

</div>

## Features

<div className="grid-2">
  <div className="feature-card">
    <h3>🎯 Decorator-Driven</h3>
    <p>Define resources and fields declaratively with TypeScript decorators for clean, expressive code.</p>
  </div>
  <div className="feature-card">
    <h3>✅ 70+ Validation Rules</h3>
    <p>Comprehensive validation system with decorators, object schemas (Zod-like), async support, and full i18n.</p>
  </div>
  <div className="feature-card">
    <h3>🌍 Built-in i18n</h3>
    <p>Internationalization with pluralization, interpolation, namespaces, and automatic locale detection.</p>
  </div>
  <div className="feature-card">
    <h3>📦 Modular Architecture</h3>
    <p>Tree-shakeable modules for resources, validation, i18n, auth, session, and utilities.</p>
  </div>
  <div className="feature-card">
    <h3>🔌 Cross-Platform</h3>
    <p>Works seamlessly with Web, React Native, Expo, Node.js, NestJS, and Next.js.</p>
  </div>
  <div className="feature-card">
    <h3>🛡️ Type-Safe</h3>
    <p>Full TypeScript support with comprehensive type definitions and IntelliSense.</p>
  </div>
</div>

## Quick Example

```typescript
import 'reflect-metadata';
import { ResourceMeta, FieldMeta } from 'reslib/resources';
import { Validator, IsRequired, IsEmail } from 'reslib/validator';

@ResourceMeta({ name: 'User' })
class User {
  @FieldMeta({ type: 'string' })
  @IsRequired()
  name: string;

  @FieldMeta({ type: 'email' })
  @IsEmail()
  email: string;
}

// Validate
const user = new User();
user.name = '';
user.email = 'invalid';

const result = await Validator.validateClass(user);
// { success: false, errors: { name: [...], email: [...] } }
```

## Modules

| Module                                 | Description                         |
| -------------------------------------- | ----------------------------------- |
| [Resources](/docs/modules/resources)   | Decorator-based resource management |
| [Validation](/docs/modules/validator)  | 70+ validation rules with i18n      |
| [I18n](/docs/modules/i18n)             | Internationalization system         |
| [Auth](/docs/modules/auth)             | Authentication utilities            |
| [Session](/docs/modules/session)       | Session management                  |
| [Observable](/docs/modules/observable) | Event system                        |
| [Utils](/docs/modules/utils)           | Utility functions                   |

## Platform Support

| Platform            | Status          |
| ------------------- | --------------- |
| Web Browsers        | ✅ Full support |
| React Native / Expo | ✅ Full support |
| Node.js             | ✅ Full support |
| NestJS              | ✅ Full support |
| Next.js             | ✅ Full support |

## Getting Started

```bash
npm install reslib reflect-metadata
```

[Get Started →](/docs/getting-started/installation)
