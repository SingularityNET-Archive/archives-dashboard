// ../components/filters/AssigneeFilter.tsx
import { useMemo } from 'react';
import { useMeetingSummaries } from '../../context/MeetingSummariesContext';
import styles from '../../styles/StatusFilter.module.css'; 

interface AssigneeFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export default function AssigneeFilter({ value, onChange }: AssigneeFilterProps) {
  const { getActionItems } = useMeetingSummaries();
  
  const assigneeOptions = useMemo(() => {
    const actionItems = getActionItems();
    
    // Get all assignees and split comma-separated values
    const allAssignees = actionItems
      .filter(item => item.assignee) // Filter out items without assignees
      .flatMap(item => 
        item.assignee!
          .split(',')
          .map(name => name.trim()) // Trim whitespace
          .filter(name => name.length > 0) // Remove empty strings
      );
    
    // Create a Set to get unique values and convert back to array
    const uniqueAssignees = Array.from(new Set(allAssignees))
      .sort((a, b) => a.localeCompare(b));
    
    return uniqueAssignees.map(assignee => ({
      value: assignee,
      label: assignee
    }));
  }, [getActionItems]);

  return (
    <div className={styles.filterContainer}>
      <label htmlFor="assignee">Assignee</label>
      <select
        id="assignee"
        className={styles.filterSelect}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All Assignees</option>
        {assigneeOptions.map((assignee) => (
          <option key={assignee.value} value={assignee.value}>
            {assignee.label}
          </option>
        ))}
      </select>
    </div>
  );
}