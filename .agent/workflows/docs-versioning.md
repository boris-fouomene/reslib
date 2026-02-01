---
description: How to create and manage documentation versions for ResLib
---

# Documentation Versioning Workflow

This workflow describes how to manage documentation versions for ResLib using Docusaurus's built-in versioning system.

## Prerequisites

- Ensure you're in the `docs/` directory
- Have npm installed and dependencies ready (`npm install`)

## Creating a New Version

When you're ready to release a new version of ResLib:

### 1. Update package version

First, update the version in the main `package.json`:

```bash
cd ..
npm version 2.4.0
```

### 2. Create docs version snapshot

```bash
cd docs
npm run version:new 2.4.0
```

This command:

- Creates `versioned_docs/version-2.4.0/` with a snapshot of current docs
- Creates `versioned_sidebars/version-2.4.0-sidebars.json`
- Updates `versions.json` with the new version

### 3. Verify the version

```bash
npm run dev
```

Check that the version dropdown shows the new version.

## File Structure After Versioning

```
docs/
├── docs/                          # Current/next version (unreleased)
│   ├── index.md
│   ├── getting-started/
│   └── modules/
├── versioned_docs/
│   ├── version-2.3.0/             # Snapshot of 2.3.0 docs
│   │   ├── index.md
│   │   └── ...
│   └── version-2.2.0/             # Snapshot of 2.2.0 docs
├── versioned_sidebars/
│   ├── version-2.3.0-sidebars.json
│   └── version-2.2.0-sidebars.json
└── versions.json                   # List of all versions
```

## Editing Versioned Docs

### Current/Next Version

Edit files in `docs/docs/` - these are for the upcoming release.

### Previous Versions

Edit files in `versioned_docs/version-X.X.X/` - but only for:

- Critical bug fixes
- Security updates
- Typo corrections

**Do NOT add new features to old versions.**

## Version Configuration

The version behavior is configured in `docusaurus.config.ts`:

```typescript
docs: {
  lastVersion: 'current',
  versions: {
    current: {
      label: '2.4.0 🚧',
      path: '',
      banner: 'unreleased',
    },
    '2.3.0': {
      label: '2.3.0',
      banner: 'none',
    },
    '2.2.0': {
      label: '2.2.0',
      banner: 'unmaintained',
    },
  },
}
```

### Banner Types

| Banner         | Description                  |
| -------------- | ---------------------------- |
| `none`         | No banner (stable version)   |
| `unreleased`   | Shows "unreleased" warning   |
| `unmaintained` | Shows "unmaintained" warning |

## Removing Old Versions

To remove a deprecated version:

1. Delete `versioned_docs/version-X.X.X/`
2. Delete `versioned_sidebars/version-X.X.X-sidebars.json`
3. Remove the version from `versions.json`

## Best Practices

1. **Version after release** - Create version snapshots after npm publish
2. **Keep current clean** - `docs/docs/` should always reflect the next version
3. **Limit active versions** - Keep only 2-3 versions actively documented
4. **Add migration guides** - When making breaking changes
5. **Update README badges** - Point to the correct version
