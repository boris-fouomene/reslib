---
title: All Versions
---

# ResLib Versions

This page lists all documented versions of ResLib.

## Current Version

The current version is always the latest development version.

| Version   | Status     | Release Date   |
| --------- | ---------- | -------------- |
| **2.3.3** | 🚧 Current | In development |

## Stable Versions

Stable versions are production-ready releases.

| Version | Status         | Release Date |
| ------- | -------------- | ------------ |
| 2.3.x   | ✅ Stable      | Dec 2025     |
| 2.2.x   | ⚠️ Maintenance | Oct 2025     |
| 2.1.x   | ❌ Deprecated  | Aug 2025     |
| 2.0.x   | ❌ Deprecated  | Jun 2025     |

## Version Support Policy

| Status         | Description        | Support                 |
| -------------- | ------------------ | ----------------------- |
| 🚧 Current     | Latest development | Full support            |
| ✅ Stable      | Production ready   | Full support + security |
| ⚠️ Maintenance | Previous stable    | Security fixes only     |
| ❌ Deprecated  | End of life        | No support              |

## Creating a New Version

When releasing a new version:

```bash
# In the docs directory
npm run version:new 2.4.0
```

This creates:

- `versioned_docs/version-2.4.0/` - Snapshot of current docs
- `versioned_sidebars/version-2.4.0-sidebars.json` - Sidebar snapshot
- Updates `versions.json` - Version list

## Versioning Strategy

ResLib follows [Semantic Versioning](https://semver.org/):

- **Major (X.0.0)** - Breaking changes
- **Minor (X.Y.0)** - New features, backwards compatible
- **Patch (X.Y.Z)** - Bug fixes, backwards compatible

## Migration Guides

When upgrading between major versions, see the migration guides:

- [Migrating to 2.0](/docs/guides/migration)

## Changelog

For a detailed list of changes, see the [Changelog](https://github.com/boris-fouomene/reslib/blob/main/CHANGELOG.md).
