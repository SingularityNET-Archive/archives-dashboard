// ../components/nav.tsx
import Link from 'next/link';
import { useState, useEffect } from "react";
import { fetchLatestTag } from '../utils/fetchLatestTag';
import styles from '../styles/nav.module.css';

const Nav = () => {
  const [latestTag, setLatestTag] = useState<string>('');
  
  async function getTags() {
    const tag = await fetchLatestTag();
    setLatestTag(tag);
  }

  useEffect(() => {
    getTags(); 
  }, [setLatestTag]); 

  return (
    <nav className={styles.routes}>
      <div className={styles.navLeft}>
        <Link href="/" className={styles.navitems}>
          Home
        </Link>
          <Link href='/search' className={styles.navitems}>
            Search
          </Link>
      </div>
      <div>{latestTag}</div>
    </nav>
  );
};

export default Nav;