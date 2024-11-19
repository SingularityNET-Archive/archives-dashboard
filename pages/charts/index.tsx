// pages/charts/index.tsx
import { GetServerSideProps } from 'next';
import { MeetingSummary } from '../../types/meetings';
import { MeetingSummariesPageProvider } from '../../components/providers/MeetingSummariesPageProvider';
import WorkgroupCharts from '../../components/charts/WorkgroupCharts';
import styles from '../../styles/charts.module.css';

interface ChartPageProps {
  initialData: MeetingSummary[];
}

export default function ChartPage({ 
  initialData
}: ChartPageProps) {
  return (
    <MeetingSummariesPageProvider initialData={initialData}>
      <div className={styles.chartsContainer}>
        <h1>Analytics Dashboard</h1>
        <WorkgroupCharts />
      </div>
    </MeetingSummariesPageProvider>
  );
}

export const getServerSideProps: GetServerSideProps<ChartPageProps> = async () => {
  const API_KEY = process.env.NEXT_PUBLIC_SERVER_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${baseUrl}/api/getMeetingSummaries`, {
      headers: {
        'api_key': API_KEY || '',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      props: {
        initialData: data,
      },
    };
  } catch (error) {
    console.error('Error fetching meeting summaries:', error);
    return {
      props: {
        initialData: [],
      },
    };
  }
};