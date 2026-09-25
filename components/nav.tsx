// components/nav.tsx
import Link from 'next/link';
import { useState, useEffect } from "react";
import { fetchLatestTag } from '../utils/fetchLatestTag';
import styles from '../styles/nav.module.css';

const Nav = () => {
  const [latestTag, setLatestTag] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    fetchLatestTag().then((tag: string) => {
      if (!cancelled) setLatestTag(tag);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <nav className={styles.routes}>
      <div className={styles.navLeft}>
          <Link href="/" className={styles.navitems}>
            Home
          </Link>
          <Link href='/search' className={styles.navitems}>
            Search
          </Link>
          <Link href="/charts" className={styles.navitems}>
            Charts
          </Link>
          <Link href="/docs/api" className={styles.navitems}>
            API
          </Link>
      </div>
      <div>{latestTag}</div>
    </nav>
  );
};

export default Nav;
