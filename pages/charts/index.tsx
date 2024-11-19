// pages/charts/index.tsx
import { MeetingSummary } from '../../types/meetings';
import { MeetingSummariesPageProvider } from '../../components/providers/MeetingSummariesPageProvider';
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
        Charts
      </div>
    </MeetingSummariesPageProvider>
  );
}