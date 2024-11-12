// src/components/tables/ActionItemsTable.tsx
interface ActionItem {
  id: string;
  text: string;
  assignee: string;
  dueDate: string;
  status: string;
  workgroup: string;
}

interface ActionItemsTableProps {
  filters: {
    workgroup: string;
    status: string;
    search: string;
    dateRange: { start: string; end: string; }
  };
}

export default function ActionItemsTable({ filters }: ActionItemsTableProps) {
  // In a real app, you'd fetch this from Supabase based on filters
  const actionItems: ActionItem[] = [
    {
      id: '1',
      text: 'Set up TypeScript configuration',
      assignee: 'John Doe',
      dueDate: '2024-03-20',
      status: 'in-progress',
      workgroup: 'Treasury Guild',
    },
    // Add more example data
  ];

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
          {actionItems.map((item) => (
            <tr key={item.id}>
              <td>{item.text}</td>
              <td>{item.assignee}</td>
              <td>{new Date(item.dueDate).toLocaleDateString()}</td>
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