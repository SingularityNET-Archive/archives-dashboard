// components/filters/AssigneeFilter.tsx
import React, { useMemo } from 'react';
import { useGlobalMeetingSummaries } from '../../context/GlobalMeetingSummariesContext';
import styles from '../../styles/StatusFilter.module.css';

interface AssigneeFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

interface AssigneeOption {
  value: string;      // Normalized (lowercase) value for comparison
  label: string;      // Original casing for display
  count: number;
  workgroups: Set<string>;
  originalNames: Set<string>; // Keep track of all variations of the name
}

export default function AssigneeFilter({ 
  value, 
  onChange,
  className = ''
}: AssigneeFilterProps) {
  const { getActionItems, loading } = useGlobalMeetingSummaries();
  
  const assigneeOptions = useMemo(() => {
    const actionItems = getActionItems();
    const assigneeMap = new Map<string, AssigneeOption>();
    
    // Collection logic remains the same
    actionItems.forEach(item => {
      if (!item.assignee) return;
      
      item.assignee
        .split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0)
        .forEach(name => {
          const normalizedName = name.toLowerCase();
          
          if (assigneeMap.has(normalizedName)) {
            const existing = assigneeMap.get(normalizedName)!;
            existing.count++;
            if (item.workgroup) {
              existing.workgroups.add(item.workgroup);
            }
            existing.originalNames.add(name);
          } else {
            assigneeMap.set(normalizedName, {
              value: normalizedName,
              label: name,
              count: 1,
              workgroups: new Set(item.workgroup ? [item.workgroup] : []),
              originalNames: new Set([name])
            });
          }
        });
    });

    // Convert to array and sort alphabetically first, then by count if names are equal
    return Array.from(assigneeMap.values())
      .sort((a, b) => {
        // Primary sort by label (alphabetically)
        const labelComparison = a.label.toLowerCase().localeCompare(b.label.toLowerCase());
        
        // If labels are the same, sort by count in descending order
        if (labelComparison === 0) {
          return b.count - a.count;
        }
        
        return labelComparison;
      });
  }, [getActionItems]);

  const selectedOption = useMemo(() => 
    assigneeOptions.find(option => option.value === value?.toLowerCase()),
    [assigneeOptions, value]
  );

  // Debug logging for selected value
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && value) {
      console.group('Selected Assignee Debug');
      console.log('Selected value:', value);
      console.log('Normalized value:', value.toLowerCase());
      console.log('Found option:', selectedOption);
      console.log('All options:', assigneeOptions);
      console.groupEnd();
    }
  }, [value, selectedOption, assigneeOptions]);

  if (loading) {
    return (
      <div className={`${styles.filterContainer} ${className}`}>
        <label className={styles.filterLabel}>Assignee</label>
        <select 
          className={`${styles.filterSelect} ${styles.loading}`}
          disabled
        >
          <option>Loading...</option>
        </select>
      </div>
    );
  }

  if (assigneeOptions.length === 0) {
    return (
      <div className={`${styles.filterContainer} ${className}`}>
        <label className={styles.filterLabel}>Assignee</label>
        <select 
          className={`${styles.filterSelect} ${styles.empty}`}
          disabled
        >
          <option>No assignees available</option>
        </select>
      </div>
    );
  }

  const totalItems = assigneeOptions.reduce((sum, option) => sum + option.count, 0);
  const totalAssignees = assigneeOptions.length;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    // Find the option to get the proper casing if needed
    const selectedOpt = assigneeOptions.find(opt => opt.value === newValue.toLowerCase());
    // Pass the properly cased value if found, otherwise use the raw value
    onChange(selectedOpt ? selectedOpt.label : newValue);
  };

  return (
    <div className={`${styles.filterContainer} ${className}`}>
      <label 
        htmlFor="assignee-filter" 
        className={styles.filterLabel}
      >
        Assignee
      </label>
      <select
        id="assignee-filter"
        className={styles.filterSelect}
        value={value}
        onChange={handleChange}
        aria-label="Filter by assignee"
      >
        <option value="">
          All Assignees
        </option>
        {assigneeOptions.map((assignee) => (
          <option 
            key={assignee.value} 
            value={assignee.label}
            aria-selected={assignee.value === value?.toLowerCase()}
          >
            {assignee.label}
          </option>
        ))}
      </select>
    </div>
  );
}