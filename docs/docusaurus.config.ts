/// <reference types="@docusaurus/module-type-aliases" />

import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

// Get version from parent package.json
const pkg = require('../package.json');

const config: Config = {
  title: 'ResLib',
  tagline:
    'A lightweight, production-ready TypeScript library for decorator-based resource management.',
  favicon: 'img/favicon.ico',

  // Production URL
  url: 'https://reslib.dev',
  baseUrl: '/',

  // GitHub Pages deployment
  organizationName: 'boris-fouomene',
  projectName: 'reslib',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // Mermaid diagrams support
  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/boris-fouomene/reslib/tree/main/docs/',
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,

          // ============================================
          // ENTERPRISE-GRADE VERSIONING
          // ============================================
          // Current version is the latest in development
          lastVersion: 'current',

          // Include all versions in the dropdown
          includeCurrentVersion: true,

          // Version configuration
          versions: {
            current: {
              label: `${pkg.version} 🚧`,
              path: '',
              banner: 'unreleased',
              badge: true,
            },
            // Previous versions are auto-detected from versioned_docs/
            // When you run: npm run version:new 2.3.0
            // It creates: versioned_docs/version-2.3.0/
          },

          // Versioning banners
          onlyIncludeVersions: undefined, // Include all versions

          // Breadcrumbs
          breadcrumbs: true,

          // Admonitions (callouts)
          admonitions: {
            keywords: ['note', 'tip', 'info', 'warning', 'danger', 'caution'],
          },
        },

        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/boris-fouomene/reslib/tree/main/docs/',
          blogTitle: 'ResLib Blog',
          blogDescription: 'Updates, releases, and tutorials for ResLib',
          postsPerPage: 10,
          blogSidebarTitle: 'Recent posts',
          blogSidebarCount: 10,
          feedOptions: {
            type: 'all',
            copyright: `Copyright © ${new Date().getFullYear()} Boris Fouomene`,
          },
        },

        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    // TypeDoc integration for API reference
    // Uncomment when ready to generate API docs:
    // [
    //   'docusaurus-plugin-typedoc',
    //   {
    //     entryPoints: ['../src/index.ts'],
    //     tsconfig: '../tsconfig.json',
    //     out: 'api',
    //   },
    // ],

    // Local search (offline-capable)
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        indexDocs: true,
        indexBlog: true,
        indexPages: true,
        language: ['en'],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        docsRouteBasePath: '/docs',
        blogRouteBasePath: '/blog',
        searchResultLimits: 10,
        searchResultContextMaxLength: 50,
      },
    ],
  ],

  themeConfig: {
    image: 'img/reslib-social-card.jpg',

    // Announcement bar for releases
    announcementBar: {
      id: `release_${pkg.version}`,
      content: `🎉 ResLib <b>${pkg.version}</b> is out! <a href="/blog/releases">See what's new</a>`,
      backgroundColor: '#4f46e5',
      textColor: '#ffffff',
      isCloseable: true,
    },

    navbar: {
      title: 'ResLib',
      logo: {
        alt: 'ResLib Logo',
        src: 'img/logo.svg',
      },
      items: [
        // Docs
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        // API Reference
        {
          to: '/docs/api',
          label: 'API',
          position: 'left',
        },
        // Blog
        {
          to: '/blog',
          label: 'Blog',
          position: 'left',
        },

        // Right side
        // Version dropdown
        {
          type: 'docsVersionDropdown',
          position: 'right',
          dropdownActiveClassDisabled: true,
          dropdownItemsAfter: [
            {
              type: 'html',
              value: '<hr class="dropdown-separator">',
            },
            {
              to: '/versions',
              label: 'All versions',
            },
          ],
        },
        // GitHub
        {
          href: 'https://github.com/boris-fouomene/reslib',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
        // npm
        {
          href: 'https://www.npmjs.com/package/reslib',
          position: 'right',
          className: 'header-npm-link',
          'aria-label': 'npm package',
        },
      ],
    },

    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            { label: 'Getting Started', to: '/docs/getting-started' },
            { label: 'Modules', to: '/docs/modules' },
            { label: 'API Reference', to: '/docs/api' },
          ],
        },
        {
          title: 'Modules',
          items: [
            { label: 'Resources', to: '/docs/modules/resources' },
            { label: 'Validation', to: '/docs/modules/validator' },
            { label: 'i18n', to: '/docs/modules/i18n' },
            { label: 'Utils', to: '/docs/modules/utils' },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/boris-fouomene/reslib',
            },
            {
              label: 'Discussions',
              href: 'https://github.com/boris-fouomene/reslib/discussions',
            },
            {
              label: 'Issues',
              href: 'https://github.com/boris-fouomene/reslib/issues',
            },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'Blog', to: '/blog' },
            {
              label: 'Changelog',
              href: 'https://github.com/boris-fouomene/reslib/blob/main/CHANGELOG.md',
            },
            { label: 'npm', href: 'https://www.npmjs.com/package/reslib' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Boris Fouomene. Built with Docusaurus.`,
    },

    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript', 'tsx', 'diff'],
    },

    // Table of contents
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },

    // Color mode
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },

    // Docs sidebar
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },

    // Mermaid theme
    mermaid: {
      theme: { light: 'neutral', dark: 'dark' },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
