// src/components/tables/DecisionsTable.tsx
interface Decision {
  id: string;
  workgroup: string;
  decision: string;
  rationale: string;
  effect: string;
  date: string;
}

interface DecisionsTableProps {
  filters: {
    workgroup: string;
    status: string;
    search: string;
    dateRange: { start: string; end: string; }
  };
}

export default function DecisionsTable({ filters }: DecisionsTableProps) {
  // In a real app, you'd fetch this from Supabase based on filters
  const decisions: Decision[] = [
    {
      id: '1',
      workgroup: 'Treasury Guild',
      decision: 'Adopt TypeScript',
      rationale: 'Better type safety and developer experience',
      effect: 'affectsOnlyThisWorkgroup',
      date: '2024-03-15',
    },
    // Add more example data
  ];

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Workgroup</th>
            <th>Decision</th>
            <th>Rationale</th>
            <th>Effect</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {decisions.map((decision) => (
            <tr key={decision.id}>
              <td>{decision.workgroup}</td>
              <td>{decision.decision}</td>
              <td>{decision.rationale}</td>
              <td>{decision.effect}</td>
              <td>{new Date(decision.date).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}