// components/tables/DecisionsTable.tsx
import { useMeetingSummaries } from '../../context/MeetingSummariesContext';
import { formatDate } from '../../utils/dateFormatting';
import { FilterState, MeetingSummary } from '../../types/meetings';
import HighlightedText from '../common/HighlightedText';
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
            <tr key={`${decision.workgroup_id}-${index}`}>
              <td>
                <HighlightedText 
                  text={decision.workgroup} 
                  searchTerm={filters.search}
                />
              </td>
              <td>
                <HighlightedText 
                  text={decision.decision} 
                  searchTerm={filters.search}
                />
              </td>
              <td className={styles.effectCell}>
                <HighlightedText 
                  text={decision.effect || ''} 
                  searchTerm={filters.search}
                />
              </td>
              <td className={styles.dateCell}>
                {formatDate(decision.date)}
              </td>
            </tr>
          ))}
          {decisions.length === 0 && (
            <tr>
              <td colSpan={4} className={styles.noResults}>
                No decisions found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}