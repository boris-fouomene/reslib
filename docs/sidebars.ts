import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

/**
 * ResLib Documentation Sidebar Configuration
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    // Introduction
    {
      type: 'doc',
      id: 'index',
      label: '📖 Introduction',
    },

    // Getting Started
    {
      type: 'category',
      label: '🚀 Getting Started',
      collapsed: false,
      items: [
        'getting-started/installation',
        'getting-started/quick-start',
        'getting-started/typescript-setup',
      ],
    },

    // Modules
    {
      type: 'category',
      label: '📦 Modules',
      collapsed: false,
      link: {
        type: 'doc',
        id: 'modules/index',
      },
      items: [
        'modules/resources/index',
        'modules/validator/index',
        'modules/i18n/index',
        'modules/auth/index',
        'modules/session/index',
        'modules/observable/index',
        'modules/utils/index',
      ],
    },

    // API Reference
    {
      type: 'doc',
      id: 'api/index',
      label: '🔧 API Reference',
    },
  ],
};

export default sidebars;
