// components/tables/ActionItemsTable.tsx
import { formatDate } from '../../utils/dateFormatting';
import { isSameDate } from '../../utils/dateUtils';
import { useMeetingSummaries } from '../../context/MeetingSummariesContext';
import { FilterState, MeetingSummary, ActionItem } from '../../types/meetings';
import HighlightedText from '../common/HighlightedText';
import styles from '../../styles/SharedTable.module.css';

interface ActionItemsTableProps {
  filters: FilterState;
  initialData?: MeetingSummary[];
}

const isValidActionItem = (item: Partial<ActionItem>): item is ActionItem => {
  return Boolean(
    item &&
    typeof item.text === 'string' &&
    typeof item.workgroup_id === 'string' &&
    typeof item.status === 'string'
  );
};

export default function ActionItemsTable({ filters }: ActionItemsTableProps) {
  const { getActionItems, loading } = useMeetingSummaries();
  
  const actionItems = getActionItems().filter(item => {
    if (!isValidActionItem(item)) {
      return false;
    }

    const matchesWorkgroup = !filters.workgroup || item.workgroup_id === filters.workgroup;
    const matchesStatus = !filters.status || item.status === filters.status;
    
    const searchTerm = filters.search?.toLowerCase() || '';
    const matchesSearch = !searchTerm || [
      item.text,
      item.assignee,
      item.workgroup
    ].some(field => 
      typeof field === 'string' && field.toLowerCase().includes(searchTerm)
    );

    const matchesDate = !filters.date || 
      (item.dueDate && isSameDate(item.dueDate, filters.date));

    const matchesAssignee = !filters.assignee || 
    (item.assignee && 
     item.assignee.split(',')
       .map(name => name.trim())
       .includes(filters.assignee));
    
    return matchesWorkgroup && matchesStatus && matchesSearch && matchesDate && matchesAssignee;
  }).sort((a, b) => {
    // Sort by due date in descending order
    // If no due date, treat as oldest
    const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
    const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
    return dateB - dateA;
  });
  
  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.dateColumn}>Due Date</th>
            <th className={styles.standardColumn}>Workgroup</th>
            <th className={styles.textColumn}>Action Item</th>
            <th className={styles.standardColumn}>Assignee</th>
            <th className={styles.statusColumn}>Status</th>
          </tr>
        </thead>
        <tbody>
          {actionItems.map((item, index) => (
            <tr key={`${item.workgroup_id}-${index}`}>
              <td className={styles.dateCell}>
                {item.dueDate ? formatDate(item.dueDate) : 'No date set'}
              </td>
              <td>
                <HighlightedText 
                  text={item.workgroup || 'Unknown'} 
                  searchTerm={filters.search}
                />
              </td>
              <td>
                <HighlightedText 
                  text={item.text} 
                  searchTerm={filters.search}
                />
              </td>
              <td>
                <HighlightedText 
                  text={item.assignee || 'N/A'} 
                  searchTerm={filters.search}
                />
              </td>
              <td>
                <span className={`${styles.statusBadge} ${styles[`status${item.status.replace(/\b\w/g, char => char.toUpperCase()).replace(/\s+/g, '')}`]}`}>
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
          {actionItems.length === 0 && (
            <tr>
              <td colSpan={5} className={styles.noResults}>
                No action items found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}