// src/components/filters/WorkgroupFilter.tsx
interface WorkgroupFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export default function WorkgroupFilter({ value, onChange }: WorkgroupFilterProps) {
  // In a real app, you'd fetch this from Supabase
  const workgroups = [
    { id: '1', name: 'Treasury Guild' },
    { id: '2', name: 'Marketing Guild' },
    { id: '3', name: 'Writers Workgroup' },
  ];

  return (
    <div className="filter-container">
      <label htmlFor="workgroup">Workgroup</label>
      <select
        id="workgroup"
        className="filter-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All Workgroups</option>
        {workgroups.map((workgroup) => (
          <option key={workgroup.id} value={workgroup.id}>
            {workgroup.name}
          </option>
        ))}
      </select>
    </div>
  );
}