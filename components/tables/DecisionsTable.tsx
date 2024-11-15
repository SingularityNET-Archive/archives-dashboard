// components/tables/DecisionsTable.tsx
import { useMeetingSummaries } from '../../context/MeetingSummariesContext';
import { formatDate } from '../../utils/dateFormatting';
import { FilterState, MeetingSummary } from '../../types/meetings';
import styles from '../../styles/DecisionsTable.module.css';

interface DecisionsTableProps {
  filters: FilterState;
  initialData?: MeetingSummary[];
}

export default function DecisionsTable({ filters }: DecisionsTableProps) {
  const { getDecisions, loading } = useMeetingSummaries();
  
  const decisions = getDecisions().filter(decision => {
    const matchesWorkgroup = !filters.workgroup || decision.workgroup_id === filters.workgroup;
    const matchesSearch = !filters.search || 
      (decision.decision.toLowerCase().includes(filters.search.toLowerCase()) ||
       decision.effect?.toLowerCase().includes(filters.search.toLowerCase()));
    return matchesWorkgroup && matchesSearch;
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Workgroup</th>
            <th>Decision</th>
            <th>Effect</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {decisions.map((decision, index) => (
            <tr key={index}>
              <td>{decision.workgroup}</td>
              <td>{decision.decision}</td>
              <td className={styles.effectCell}>{decision.effect}</td>
              <td className={styles.dateCell}>{formatDate(decision.date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}