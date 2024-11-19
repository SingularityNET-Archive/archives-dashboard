// pages/charts/index.tsx
import React from 'react';
import { useGlobalMeetingSummaries } from '../../context/GlobalMeetingSummariesContext';
import WorkgroupCharts from '../../components/charts/WorkgroupCharts';
import styles from '../../styles/charts.module.css';

export default function ChartPage() {
  const { summaries, loading, error } = useGlobalMeetingSummaries();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>Loading analytics data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>
          <h2>Error Loading Data</h2>
          <p>There was a problem loading the analytics data. Please try again later.</p>
          <p className={styles.errorDetails}>{error.message}</p>
        </div>
      </div>
    );
  }

  if (!summaries.length) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyMessage}>
          <h2>No Data Available</h2>
          <p>There are currently no meeting summaries available to analyze.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chartsContainer}>
      <header className={styles.chartsHeader}>
        <div className={styles.chartsMeta}>
          <span>Total Meetings: {summaries.length}</span>
          <span>Last Updated: {new Date(Math.max(...summaries.map(s => new Date(s.updated_at).getTime()))).toLocaleDateString()}</span>
        </div>
      </header>

      <div className={styles.chartsContent}>
        <WorkgroupCharts />
      </div>
    </div>
  );
}