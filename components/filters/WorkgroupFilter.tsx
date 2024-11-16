// components/filters/WorkgroupFilter.tsx
import React from 'react';
import { useMeetingSummaries } from '../../context/MeetingSummariesContext';
import styles from '../../styles/WorkgroupFilter.module.css';

interface WorkgroupFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const WorkgroupFilter = ({ value, onChange }: WorkgroupFilterProps) => {
  const { summaries } = useMeetingSummaries();
  
  const uniqueWorkgroups = React.useMemo(() => {
    const workgroups = summaries
      .map(summary => ({
        id: summary.summary.workgroup_id,
        name: summary.summary.workgroup
      }))
      .filter((workgroup): workgroup is { id: string; name: string } => 
        Boolean(workgroup.id && workgroup.name)
      );

    return Array.from(
      new Map(workgroups.map(item => [item.id, item])).values()
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [summaries]);

  return (
    <div className={styles.filterContainer}>
      <label 
        htmlFor="workgroup" 
        className={styles.filterLabel}
      >
        Workgroup
      </label>
      <select
        id="workgroup"
        className={styles.filterSelect}
        value={value}
        onChange={(e) => onChange(e.target.value)}
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

export default WorkgroupFilter;