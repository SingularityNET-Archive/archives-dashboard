// components/tables/DecisionsTable.tsx
import { useMeetingSummaries } from '../../context/MeetingSummariesContext';
import { formatDate } from '../../utils/dateFormatting';
import { formatEffectType } from '../../utils/stringFormatting';
import { isSameDate } from '../../utils/dateUtils';
import { FilterState, MeetingSummary } from '../../types/meetings';
import HighlightedText from '../common/HighlightedText';
import styles from '../../styles/SharedTable.module.css';

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
    const matchesDate = !filters.date || 
      isSameDate(decision.date, filters.date);
    const matchesEffect = !filters.effect || 
      decision.effect === filters.effect;
   
    return matchesWorkgroup && matchesSearch && matchesDate && matchesEffect;
  }).sort((a, b) => {
    // Sort by date in descending order
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.standardColumn}>Workgroup</th>
            <th className={styles.textColumn}>Decision</th>
            <th className={styles.effectColumn}>Effect</th>
            <th className={styles.dateColumn}>Date</th>
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
                  text={formatEffectType(decision.effect || '')} 
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