import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import clsx from 'clsx';
import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs">
            Get Started →
          </Link>
        </div>
      </div>
    </header>
  );
}

function HomepageFeatures() {
  const features = [
    {
      title: '🎯 Decorator-Driven',
      description:
        'Define resources and fields declaratively with TypeScript decorators for clean, expressive code.',
    },
    {
      title: '✅ 70+ Validation Rules',
      description:
        'Comprehensive validation system with decorators, object schemas, async support, and full i18n.',
    },
    {
      title: '🌍 Built-in i18n',
      description:
        'Internationalization with pluralization, interpolation, namespaces, and automatic locale detection.',
    },
    {
      title: '📦 Modular Architecture',
      description:
        'Tree-shakeable modules for resources, validation, i18n, auth, session, and utilities.',
    },
    {
      title: '🔌 Cross-Platform',
      description:
        'Works seamlessly with Web, React Native, Expo, Node.js, NestJS, and Next.js.',
    },
    {
      title: '🛡️ Type-Safe',
      description:
        'Full TypeScript support with comprehensive type definitions and IntelliSense.',
    },
  ];

  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {features.map((feature, idx) => (
            <div key={idx} className={clsx('col col--4', styles.featureItem)}>
              <div className="text--center padding-horiz--md">
                <Heading as="h3">{feature.title}</Heading>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - TypeScript Resource Library`}
      description="A lightweight, production-ready TypeScript library for decorator-based resource management and application utilities."
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <div className="container" style={{ padding: '4rem 0' }}>
          <div className="row">
            <div className="col col--6 col--offset-3">
              <div className="text--center">
                <Heading as="h2">Quick Start</Heading>
                <pre
                  style={{
                    textAlign: 'left',
                    padding: '1rem',
                    borderRadius: '8px',
                  }}
                >
                  <code>npm install reslib reflect-metadata</code>
                </pre>
                <Link
                  className="button button--primary button--lg"
                  to="/docs/getting-started/installation"
                >
                  Read the Docs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
