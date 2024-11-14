// components/tables/DecisionsTable.tsx
import { useMeetingSummaries } from '../../context/MeetingSummariesContext';
import { formatDate } from '../../utils/dateFormatting';
import { Decision, FilterState } from '../../types/meetings';

interface DecisionsTableProps {
  filters: FilterState;
  initialData?: any;
}

export default function DecisionsTable({ filters }: DecisionsTableProps) {
  const { getDecisions, loading } = useMeetingSummaries();
  
  const decisions = getDecisions().filter(decision => {
    const matchesWorkgroup = !filters.workgroup || decision.workgroup_id === filters.workgroup;
    const matchesSearch = !filters.search || 
      decision.decision.toLowerCase().includes(filters.search.toLowerCase());
    return matchesWorkgroup && matchesSearch;
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Workgroup</th>
            <th>Decision</th>
            <th>Effect</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {decisions.map((decision, index) => (
            <tr key={index}>
              <td>{decision.workgroup}</td>
              <td>{decision.decision}</td>
              <td>{decision.effect}</td>
              <td>{formatDate(decision.date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}