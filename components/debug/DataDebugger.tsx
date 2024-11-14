// src/components/debug/DataDebugger.tsx
import { useMeetingSummaries } from '../../context/MeetingSummariesContext';
import { useEffect } from 'react';

interface DataDebuggerProps {
  filters: {
    workgroup: string;
    status: string;
    search: string;
    dateRange: { start: string; end: string; }
  };
}

const DataDebugger = ({ filters }: DataDebuggerProps) => {
  const { getDecisions, getActionItems, summaries } = useMeetingSummaries();
  
  useEffect(() => {
    // Log raw summaries data
    console.group('Raw Meeting Summaries Data');
    console.log('All summaries:', summaries);
    console.groupEnd();

    // Log processed data
    console.group('Processed Data');
    const decisions = getDecisions();
    const actionItems = getActionItems();
    
    console.log('All Decisions:', decisions);
    console.log('All Action Items:', actionItems);
    
    // Log filtered data
    const filteredDecisions = decisions.filter(decision => {
      const matchesWorkgroup = !filters.workgroup || decision.workgroup === filters.workgroup;
      const matchesSearch = !filters.search || 
        decision.decision.toLowerCase().includes(filters.search.toLowerCase());
      return matchesWorkgroup && matchesSearch;
    });

    const filteredActionItems = actionItems.filter(item => {
      const matchesWorkgroup = !filters.workgroup || item.workgroup === filters.workgroup;
      const matchesStatus = !filters.status || item.status === filters.status;
      const matchesSearch = !filters.search || 
        item.text.toLowerCase().includes(filters.search.toLowerCase());
      return matchesWorkgroup && matchesStatus && matchesSearch;
    });

    console.log('Filtered Decisions:', filteredDecisions);
    console.log('Filtered Action Items:', filteredActionItems);
    console.groupEnd();
  }, [summaries, filters, getDecisions, getActionItems]);

  return null;
};

export default DataDebugger;