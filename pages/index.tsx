import type { NextPage } from "next";
import styles from '../styles/home.module.css';

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <div>
        <header className={styles.header}>
          <h1 className={styles.title}>Archives Dashboard</h1>
          <p className={styles.subtitle}>
            Access and search through meeting records, decisions, and action items
          </p>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Getting Started</h2>
          <p>
            The Archives Dashboard provides a centralized view of all meeting records. You can:
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>
              Navigate between <strong>Decisions</strong>, <strong>Action Items</strong>, and <strong>Meetings</strong> using the tabs
            </li>
            <li className={styles.listItem}>
              Use the search bar to find specific content across all records
            </li>
            <li className={styles.listItem}>
              Click &quot;View Details&quot; on any item to see complete information
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Using Filters</h2>
          <div className={styles.filtersGrid}>
            <div className={styles.filterItem}>
              <h3 className={styles.filterTitle}>
                Date Filter
              </h3>
              <p className={styles.filterDescription}>Filter meetings by specific dates</p>
            </div>
            <div className={styles.filterItem}>
              <h3 className={styles.filterTitle}>
                Workgroup Filter
              </h3>
              <p className={styles.filterDescription}>View items from specific workgroups</p>
            </div>
            <div className={styles.filterItem}>
              <h3 className={styles.filterTitle}>
                Status Filter
              </h3>
              <p className={styles.filterDescription}>Filter action items by their current status</p>
            </div>
            <div className={styles.filterItem}>
              <h3 className={styles.filterTitle}>
                Content Type
              </h3>
              <p className={styles.filterDescription}>Switch between decisions, actions, and meetings</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Additional Resources</h2>
          <div className={styles.resourcesSection}>
            <p>
              For technical documentation and source code, visit our GitHub repository:
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