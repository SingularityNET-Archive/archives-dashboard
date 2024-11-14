// src/components/filters/WorkgroupFilter.tsx
import React from 'react';
import { useMeetingSummaries } from '../../context/MeetingSummariesContext';

interface WorkgroupFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const WorkgroupFilter = ({ value, onChange }: WorkgroupFilterProps) => {
  const { summaries } = useMeetingSummaries();
  
  // Extract unique workgroups from summaries
  const uniqueWorkgroups = React.useMemo(() => {
    const workgroups = summaries
      .map(summary => ({
        id: summary.summary.workgroup_id,
        name: summary.summary.workgroup
      }))
      .filter((workgroup): workgroup is { id: string; name: string } => 
        Boolean(workgroup.id && workgroup.name)
      );

    // Remove duplicates by workgroup_id
    return Array.from(
      new Map(workgroups.map(item => [item.id, item])).values()
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [summaries]);

  return (
    <div className="filter-container">
      <label 
        htmlFor="workgroup" 
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Workgroup
      </label>
      <select
        id="workgroup"
        className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
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