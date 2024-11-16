// components/filters/StatusFilter.tsx
import { useMemo } from 'react';
import { useMeetingSummaries } from '../../context/MeetingSummariesContext';
import styles from '../../styles/StatusFilter.module.css';

interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export default function StatusFilter({ value, onChange }: StatusFilterProps) {
  const { getActionItems } = useMeetingSummaries();
  
  const statusOptions = useMemo(() => {
    const actionItems = getActionItems();
    const uniqueStatuses = new Set(actionItems.map(item => item.status));
    
    return Array.from(uniqueStatuses)
      .filter(Boolean) // Remove any undefined/null values
      .map(status => ({
        value: status,
        label: status
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [getActionItems]);

  return (
    <div className={styles.filterContainer}>
      <label htmlFor="status">Status</label>
      <select
        id="status"
        className={styles.filterSelect}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All Statuses</option>
        {statusOptions.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>
    </div>
  );
}