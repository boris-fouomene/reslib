---
sidebar_position: 3
title: TypeScript Setup
---

# TypeScript Setup

Detailed TypeScript configuration for different platforms and build tools.

## Required Configuration

ResLib uses TypeScript decorators which require specific compiler options:

```json title="tsconfig.json"
{
  "compilerOptions": {
    // Required for decorators
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,

    // Recommended settings
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## Platform-Specific Configurations

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="vite" label="Vite / React" default>

```json title="tsconfig.json"
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src"]
}
```

</TabItem>
<TabItem value="nextjs" label="Next.js">

```json title="tsconfig.json"
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

</TabItem>
<TabItem value="nestjs" label="NestJS">

```json title="tsconfig.json"
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

</TabItem>
<TabItem value="expo" label="React Native / Expo">

```json title="tsconfig.json"
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

</TabItem>
<TabItem value="node" label="Node.js">

```json title="tsconfig.json"
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

</TabItem>
</Tabs>

## Troubleshooting

### "reflect-metadata shim is required"

Ensure you import `reflect-metadata` at the very top of your entry file:

```typescript
// ✅ Must be first import
import 'reflect-metadata';

import { ResourceMeta } from 'reslib/resources';
```

### Decorator-related TypeScript errors

Verify these options are set:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Module not found errors

Use correct import paths:

```typescript
// ✅ Correct
import { Validator } from 'reslib/validator';

// ❌ Incorrect
import { Validator } from 'reslib/src/validator';
```

### Type definitions not found

Ensure TypeScript can find the declarations:

```json
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

## ESLint Configuration

If using ESLint, configure it to work with decorators:

```json title=".eslintrc.json"
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": [
      "error",
      { "argsIgnorePattern": "^_" }
    ]
  }
}
```
