import { useState } from "react";
import type { NextPage } from "next";
import styles from '../styles/admintools.module.css';

const AdminTools: NextPage = () => {
  const [loading, setLoading] = useState(false);

  return (
    <div className={styles.container}>
      {!loading && (
        <div>
          <h1>Admin Tools</h1>
        </div>
      )}
    </div>
  );
};

export default AdminTools;
