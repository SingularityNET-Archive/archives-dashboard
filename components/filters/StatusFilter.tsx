// components/filters/StatusFilter.tsx
import React, { useMemo } from 'react';
import { useGlobalMeetingSummaries } from '../../context/GlobalMeetingSummariesContext';
import styles from '../../styles/StatusFilter.module.css';

interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

interface StatusOption {
  value: string;
  label: string;
  count: number;
}

const STATUS_PRIORITY = {
  'in progress': 1,
  'pending': 2,
  'completed': 3,
  'cancelled': 4
};

export default function StatusFilter({ 
  value, 
  onChange,
  className = ''
}: StatusFilterProps) {
  const { getActionItems, loading } = useGlobalMeetingSummaries();
  
  const statusOptions = useMemo(() => {
    const actionItems = getActionItems();
    const statusMap = new Map<string, StatusOption>();

    // Collect statuses and their counts
    actionItems.forEach(item => {
      if (!item.status) return;
      
      const normalizedStatus = item.status.toLowerCase();
      const formattedLabel = item.status
        .split(/[-\s]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      if (statusMap.has(normalizedStatus)) {
        const existing = statusMap.get(normalizedStatus)!;
        statusMap.set(normalizedStatus, {
          ...existing,
          count: existing.count + 1
        });
      } else {
        statusMap.set(normalizedStatus, {
          value: normalizedStatus,
          label: formattedLabel,
          count: 1
        });
      }
    });

    // Convert to array and sort by priority, then alphabetically
    return Array.from(statusMap.values())
      .sort((a, b) => {
        const priorityA = STATUS_PRIORITY[a.value as keyof typeof STATUS_PRIORITY] || 999;
        const priorityB = STATUS_PRIORITY[b.value as keyof typeof STATUS_PRIORITY] || 999;
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        return a.label.localeCompare(b.label);
      });
  }, [getActionItems]);

  const selectedOption = useMemo(() => 
    statusOptions.find(option => option.value === value),
    [statusOptions, value]
  );

  if (loading) {
    return (
      <div className={`${styles.filterContainer} ${className}`}>
        <label className={styles.filterLabel}>Status</label>
        <select 
          className={`${styles.filterSelect} ${styles.loading}`}
          disabled
        >
          <option>Loading...</option>
        </select>
      </div>
    );
  }

  if (statusOptions.length === 0) {
    return (
      <div className={`${styles.filterContainer} ${className}`}>
        <label className={styles.filterLabel}>Status</label>
        <select 
          className={`${styles.filterSelect} ${styles.empty}`}
          disabled
        >
          <option>No statuses available</option>
        </select>
      </div>
    );
  }

  const totalItems = statusOptions.reduce((sum, option) => sum + option.count, 0);

  return (
    <div className={`${styles.filterContainer} ${className}`}>
      <label 
        htmlFor="status-filter" 
        className={styles.filterLabel}
      >
        Status
      </label>
      <select
        id="status-filter"
        className={styles.filterSelect}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Filter by status"
      >
        <option value="">
          All Statuses
        </option>
        {statusOptions.map((status) => (
          <option 
            key={status.value} 
            value={status.value}
            aria-selected={status.value === value}
          >
            {status.label}
          </option>
        ))}
      </select>
      {selectedOption && (
        <div className={styles.selectionInfo} aria-live="polite">
          Showing {selectedOption.count} items with status "{selectedOption.label}"
        </div>
      )}
    </div>
  );
}