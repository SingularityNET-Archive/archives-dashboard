// components/filters/WorkgroupFilter.tsx
import React from 'react';
import type { Facets } from '../../types/meetings';
import styles from '../../styles/WorkgroupFilter.module.css';

interface WorkgroupFilterProps {
  value: string;
  onChange: (value: string) => void;
  options: Facets['workgroups'];
  className?: string;
}

const WorkgroupFilter: React.FC<WorkgroupFilterProps> = ({
  value,
  onChange,
  options,
  className = ''
}) => {
  // If there's only one workgroup, auto-select it
  React.useEffect(() => {
    if (options.length === 1 && !value) {
      onChange(options[0].id);
    }
  }, [options, value, onChange]);

  if (options.length === 0) {
    return (
      <div className={`${styles.filterContainer} ${className}`}>
        <label className={styles.filterLabel}>
          Workgroup
        </label>
        <select
          className={`${styles.filterSelect} ${styles.empty}`}
          disabled
        >
          <option>No workgroups available</option>
        </select>
      </div>
    );
  }

  return (
    <div className={`${styles.filterContainer} ${className}`}>
      <label
        htmlFor="workgroup-filter"
        className={styles.filterLabel}
      >
        Workgroup
      </label>
      <select
        id="workgroup-filter"
        className={styles.filterSelect}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Select workgroup"
      >
        <option value="">All Workgroups</option>
        {options.map((workgroup) => (
          <option key={workgroup.id} value={workgroup.id}>
            {workgroup.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default React.memo(WorkgroupFilter);
