// components/tables/ActionItemsTable.tsx
import { formatDate } from '../../utils/dateFormatting';
import { useMeetingSummaries } from '../../context/MeetingSummariesContext';
import { FilterState, MeetingSummary } from '../../types/meetings';

interface ActionItemsTableProps {
  filters: FilterState;
  initialData?: MeetingSummary[];
}

export default function ActionItemsTable({ filters }: ActionItemsTableProps) {
  const { getActionItems, loading } = useMeetingSummaries();
  
  const actionItems = getActionItems().filter(item => {
    const matchesWorkgroup = !filters.workgroup || item.workgroup_id === filters.workgroup;
    const matchesStatus = !filters.status || item.status === filters.status;
    const matchesSearch = !filters.search || 
      item.text.toLowerCase().includes(filters.search.toLowerCase());
    return matchesWorkgroup && matchesStatus && matchesSearch;
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Action Item</th>
            <th>Assignee</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Workgroup</th>
          </tr>
        </thead>
        <tbody>
          {actionItems.map((item, index) => (
            <tr key={index}>
              <td>{item.text}</td>
              <td>{item.assignee}</td>
              <td>{formatDate(item.dueDate)}</td>
              <td>
                <span className={`status-badge status-${item.status}`}>
                  {item.status}
                </span>
              </td>
              <td>{item.workgroup}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}