// components/filters/AssigneeFilter.tsx
import React from 'react';
import type { FacetCount } from '../../types/meetings';
import styles from '../../styles/StatusFilter.module.css';

interface AssigneeFilterProps {
  value: string;
  onChange: (value: string) => void;
  /** `value` is the lower-cased name, `label` the display casing. */
  options: FacetCount[];
  className?: string;
}

export default function AssigneeFilter({
  value,
  onChange,
  options,
  className = ''
}: AssigneeFilterProps) {
  if (options.length === 0) {
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

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    // Pass the display casing through so the URL stays readable; the server
    // compares assignees case-insensitively anyway.
    const selected = options.find(opt => opt.value === newValue.toLowerCase());
    onChange(selected ? selected.label : newValue);
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
        {options.map((assignee) => (
          <option
            key={assignee.value}
            value={assignee.label}
            aria-selected={assignee.value === value.toLowerCase()}
          >
            {assignee.label}
          </option>
        ))}
      </select>
    </div>
  );
}
