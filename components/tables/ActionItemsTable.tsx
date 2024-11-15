// components/tables/ActionItemsTable.tsx
import { formatDate } from '../../utils/dateFormatting';
import { useMeetingSummaries } from '../../context/MeetingSummariesContext';
import { FilterState, MeetingSummary, ActionItem } from '../../types/meetings';
import HighlightedText from '../common/HighlightedText';
import styles from '../../styles/ActionItemsTable.module.css';

interface ActionItemsTableProps {
  filters: FilterState;
  initialData?: MeetingSummary[];
}

// Type guard to check if an action item is valid
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
    // First check if the item is valid
    if (!isValidActionItem(item)) {
      return false;
    }

    const matchesWorkgroup = !filters.workgroup || item.workgroup_id === filters.workgroup;
    const matchesStatus = !filters.status || item.status === filters.status;
    
    // Safely handle the search matching
    const searchTerm = filters.search?.toLowerCase() || '';
    const matchesSearch = !searchTerm || [
      item.text,
      item.assignee,
      item.workgroup
    ].some(field => 
      typeof field === 'string' && field.toLowerCase().includes(searchTerm)
    );

    return matchesWorkgroup && matchesStatus && matchesSearch;
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Action Item</th>
            <th>Assignee</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Workgroup</th>
          </tr>
        </thead>
        <tbody>
          {actionItems.map((item, index) => (
            <tr key={`${item.workgroup_id}-${index}`}>
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
              <td>{item.dueDate ? formatDate(item.dueDate) : 'No date set'}</td>
              <td>
                <span
                  className={`${styles.statusBadge} ${styles[`status${item.status.replace(/\b\w/g, char => char.toUpperCase()).replace(/\s+/g, '')}`]}`}
                >
                  {item.status}
                </span>
              </td>
              <td>
                <HighlightedText 
                  text={item.workgroup || 'Unknown'} 
                  searchTerm={filters.search}
                />
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