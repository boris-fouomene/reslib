/// <reference types="@docusaurus/module-type-aliases" />
/// <reference types="@docusaurus/plugin-content-docs" />
/// <reference types="@docusaurus/theme-common" />

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.css' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  import type { ComponentType, SVGProps } from 'react';
  const ReactComponent: ComponentType<SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}
