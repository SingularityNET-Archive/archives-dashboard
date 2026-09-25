// pages/docs/api.tsx
// Renders docs/API.md at build time so the published documentation always
// matches the code it ships with.
import fs from 'fs';
import path from 'path';
import Head from 'next/head';
import type { GetStaticProps } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from '../../styles/docs.module.css';

export interface ApiDocsProps {
  markdown: string;
}

export const getStaticProps: GetStaticProps<ApiDocsProps> = async () => {
  const markdown = fs.readFileSync(path.join(process.cwd(), 'docs', 'API.md'), 'utf8');
  return { props: { markdown } };
};

export default function ApiDocsPage({ markdown }: ApiDocsProps) {
  return (
    <>
      <Head>
        <title>API Documentation | Archives Dashboard</title>
        <meta
          name="description"
          content="How to query the SingularityNET Ambassador Program meeting archive: authentication, endpoints, filters and examples."
        />
      </Head>
      <div className={styles.docsPage}>
        <article className={styles.prose}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </article>
      </div>
    </>
  );
}
