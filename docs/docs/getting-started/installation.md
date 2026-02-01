---
sidebar_position: 1
title: Installation
---

# Installation

Get ResLib set up in your project in just a few minutes.

## Prerequisites

- **Node.js** 18.0 or higher
- **TypeScript** 5.0 or higher (recommended)

## Package Installation

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="npm" label="npm" default>

```bash
npm install reslib reflect-metadata
```

</TabItem>
<TabItem value="yarn" label="yarn">

```bash
yarn add reslib reflect-metadata
```

</TabItem>
<TabItem value="pnpm" label="pnpm">

```bash
pnpm add reslib reflect-metadata
```

</TabItem>
</Tabs>

### Platform-Specific

<Tabs>
<TabItem value="expo" label="React Native / Expo" default>

```bash
npx expo install reslib reflect-metadata
```

</TabItem>
<TabItem value="nestjs" label="NestJS">

```bash
npm install reslib reflect-metadata @nestjs/common
```

:::note
NestJS typically already has `reflect-metadata` installed.
:::

</TabItem>
</Tabs>

## TypeScript Configuration

ResLib requires decorator support. Add these options to your `tsconfig.json`:

```json title="tsconfig.json"
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "target": "ES2020",
    "module": "ESNext",
    "strict": true
  }
}
```

## Entry Point Setup

:::warning Critical Step
You **must** import `reflect-metadata` at the very top of your application's entry point.
:::

```typescript title="src/index.ts"
// This MUST be the first import
import 'reflect-metadata';

// Then import ResLib and your code
import { ResourceMeta, FieldMeta } from 'reslib/resources';
import { Validator, IsRequired } from 'reslib/validator';
```

## Module Imports

ResLib uses subpath exports for optimal tree-shaking:

```typescript
// ✅ Recommended: Import specific modules
import { Resource, ResourceMeta, FieldMeta } from 'reslib/resources';
import { Validator, IsRequired, IsEmail } from 'reslib/validator';
import { I18n } from 'reslib/i18n';
import { Session } from 'reslib/session';
import { observableFactory } from 'reslib/observable';
import { defaultStr, isEmail, isEmpty } from 'reslib/utils';
```

## Verify Installation

Create a test file:

```typescript title="test-reslib.ts"
import 'reflect-metadata';
import { Validator } from 'reslib/validator';

async function test() {
  const result = await Validator.validate({
    value: '',
    rules: ['Required'],
    fieldName: 'testField',
  });

  if (!result.success) {
    console.log('✅ ResLib is working!');
    console.log('Error:', result.error.message);
  }
}

test();
```

Run it:

```bash
npx tsx test-reslib.ts
```

Expected output:

```
✅ ResLib is working!
Error: testField is required.
```

## Next Steps

- [Quick Start](/docs/getting-started/quick-start) - Build your first resource
- [TypeScript Setup](/docs/getting-started/typescript-setup) - Detailed configuration
- [Platform Guides](/docs/platforms/react-vite) - Framework-specific setup
