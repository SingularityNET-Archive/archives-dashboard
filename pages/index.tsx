// pages/index.tsx
import type { NextPage } from "next";
import { useRouter } from "next/router";
import styles from '../styles/home.module.css';

const Home: NextPage = () => {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div>
        <header className={styles.header}>
          <h1 className={styles.title}>Archives Dashboard</h1>
          <p className={styles.subtitle}>
            Access and search through meeting records, decisions, and action items
          </p>
          <div className={styles.navigation}>
            <button 
              onClick={() => router.push('/search')}
              className={styles.navButton}
            >
              Search Archives
            </button>
            <button 
              onClick={() => router.push('/charts')}
              className={styles.navButton}
            >
              View Charts
            </button>
          </div>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Getting Started</h2>
          <p>
            The Archives Dashboard provides a centralized view of all archived meeting records. You can:
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>
              Navigate between <strong>Decisions</strong>, <strong>Action Items</strong>, and <strong>Meetings</strong> using the tabs on the Search page
            </li>
            <li className={styles.listItem}>
              Use the search bar to find specific content across all records
            </li>
            <li className={styles.listItem}>
            Click &quot;View Details&quot; in the Meetings tab on any item to see meeting information and highlighted text from search bar results
            </li>
          </ul>
        </section>

        <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Using Filters</h2>
              <div className={styles.filtersGrid}>
                <div className={styles.filterItem}>
                  <h3 className={styles.filterTitle}>Content Tabs</h3>
                  <p className={styles.filterDescription}>Switch between decisions, actions, and meetings</p>
                </div>
                <div className={styles.filterItem}>
                  <h3 className={styles.filterTitle}>Search Bar</h3>
                  <p className={styles.filterDescription}>Filter meetings containing specific words</p>
                </div>
                <div className={styles.filterItem}>
                  <h3 className={styles.filterTitle}>Date Filter</h3>
                  <p className={styles.filterDescription}>Filter meetings by specific dates</p>
                </div>
                <div className={styles.filterItem}>
                  <h3 className={styles.filterTitle}>Workgroup Filter</h3>
                  <p className={styles.filterDescription}>View items from specific workgroups</p>
                </div>
              </div>
            </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Additional Resources</h2>
          <div className={styles.resourcesSection}>
            <p>
              For the source code, visit our GitHub repository:
            </p>
            <a 
              href="https://github.com/SingularityNET-Archive/archives-dashboard" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.link}
            >
              View GitHub Repository
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;