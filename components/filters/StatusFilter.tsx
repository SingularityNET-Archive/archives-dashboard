// components/filters/StatusFilter.tsx
import React from 'react';
import type { FacetCount } from '../../types/meetings';
import styles from '../../styles/StatusFilter.module.css';

interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  /** Already sorted and labelled by the server (see buildFacets). */
  options: FacetCount[];
  className?: string;
}

export default function StatusFilter({
  value,
  onChange,
  options,
  className = ''
}: StatusFilterProps) {
  if (options.length === 0) {
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
        {options.map((status) => (
          <option
            key={status.value}
            value={status.value}
            aria-selected={status.value === value}
          >
            {status.label}
          </option>
        ))}
      </select>
    </div>
  );
}
