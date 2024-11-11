import { useState, useEffect } from "react";
import type { NextPage } from "next";
import styles from '../styles/home.module.css';
import axios from 'axios';

const Home: NextPage = () => {
  const [loading, setLoading] = useState<boolean>(false);
 /*useEffect(() => { // Used for testing the API
    const fetchMeetingSummaries = async () => {
      const SERVER_API_URL = '/api/getMeetingSummaries';
      const API_KEY = process.env.NEXT_PUBLIC_SERVER_API_KEY; 

      setLoading(true); // Start loading
      try {
        const response = await axios.get(SERVER_API_URL, {
          headers: {
            'api_key': API_KEY,
          },
        });

        console.log(response.data);
        // Handle your data here
      } catch (error) {
        console.error('Error fetching meeting summaries:', error);
        // Handle error here
      } finally {
        setLoading(false); // End loading
      }
    };

    fetchMeetingSummaries();
  }, []);*/

  return (
    <div className={styles.container}>
      {!loading && (
        <div>
          <div>
            <h1>Archives Dashboard</h1>
            <h2 className={styles.heading2}>A few things to note when using the Dashboard</h2>
          </div>
          <div>
            <ul>
              <li className={styles.listItem}>Lorem Ipsum</li>
            </ul>
          </div>
          <div>
          <a 
              href="https://github.com/SingularityNET-Archive/archives-dashboard" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.link} // Optional: Add this if you have specific styles for links
            >
              Visit the GitHub Repository for this tool
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
