// components/filters/WorkgroupFilter.tsx
import React, { useMemo } from 'react';
import { useGlobalMeetingSummaries } from '../../context/GlobalMeetingSummariesContext';
import styles from '../../styles/WorkgroupFilter.module.css';

interface WorkgroupFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

interface Workgroup {
  id: string;
  name: string;
  itemCount: number;
}

const WorkgroupFilter: React.FC<WorkgroupFilterProps> = ({ 
  value, 
  onChange,
  className = ''
}) => {
  const { summaries, loading } = useGlobalMeetingSummaries();
  
  const uniqueWorkgroups = useMemo(() => {
    const workgroupMap = new Map<string, Workgroup>();

    summaries.forEach(summary => {
      const id = summary.summary.workgroup_id;
      const name = summary.summary.workgroup;

      if (id && name) {
        if (workgroupMap.has(id)) {
          const existing = workgroupMap.get(id)!;
          workgroupMap.set(id, {
            ...existing,
            itemCount: existing.itemCount + 1
          });
        } else {
          workgroupMap.set(id, {
            id,
            name,
            itemCount: 1
          });
        }
      }
    });

    return Array.from(workgroupMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [summaries]);

  // If there's only one workgroup, auto-select it
  React.useEffect(() => {
    if (uniqueWorkgroups.length === 1 && !value) {
      onChange(uniqueWorkgroups[0].id);
    }
  }, [uniqueWorkgroups, value, onChange]);

  if (loading) {
    return (
      <div className={`${styles.filterContainer} ${className}`}>
        <label className={styles.filterLabel}>
          Workgroup
        </label>
        <select 
          className={`${styles.filterSelect} ${styles.loading}`} 
          disabled
        >
          <option>Loading...</option>
        </select>
      </div>
    );
  }

  if (uniqueWorkgroups.length === 0) {
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
        {uniqueWorkgroups.map((workgroup) => (
          <option key={workgroup.id} value={workgroup.id}>
            {workgroup.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default React.memo(WorkgroupFilter);