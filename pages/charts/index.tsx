// pages/charts/index.tsx
import React from 'react';
import type { GetServerSideProps } from 'next';
import type { WorkgroupMonthlyStats } from '../../types/meetings';
import { loadMeetingSummaries, buildWorkgroupMonthlyStats } from '../../lib/meetingSummaries';
import WorkgroupCharts from '../../components/charts/WorkgroupCharts';
import { formatDate } from '../../utils/dateFormatting';
import styles from '../../styles/charts.module.css';

export interface ChartPageProps {
  stats: WorkgroupMonthlyStats | null;
  error: string | null;
}

export const getServerSideProps: GetServerSideProps<ChartPageProps> = async ({ res }) => {
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

  try {
    const { rows } = await loadMeetingSummaries();
    return { props: { stats: buildWorkgroupMonthlyStats(rows), error: null } };
  } catch (err) {
    console.error('Failed to load chart data:', err);
    return {
      props: {
        stats: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
    };
  }
};

export default function ChartPage({ stats, error }: ChartPageProps) {
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>
          <h2>Error Loading Data</h2>
          <p>There was a problem loading the analytics data. Please try again later.</p>
          <p className={styles.errorDetails}>{error}</p>
        </div>
      </div>
    );
  }

  if (!stats || stats.totalMeetings === 0) {
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
          <span>Total Meetings: {stats.totalMeetings}</span>
          <span>Last Updated: {stats.lastUpdated ? formatDate(stats.lastUpdated) : 'Unknown'}</span>
        </div>
      </header>

      <div className={styles.chartsContent}>
        <WorkgroupCharts stats={stats} />
      </div>
    </div>
  );
}
