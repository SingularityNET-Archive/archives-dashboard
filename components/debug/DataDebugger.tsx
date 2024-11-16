// src/components/debug/DataDebugger.tsx
import { useMeetingSummaries } from '../../context/MeetingSummariesContext';
import { useEffect } from 'react';
import { Decision, ActionItem } from '../../types/meetings';

interface DataDebuggerProps {
  filters: {
    workgroup: string;
    status: string;
    search: string;
    dateRange: { start: string; end: string; }
  };
}

// Type guards
const isValidDecision = (decision: Partial<Decision>): decision is Decision => {
  return Boolean(
    decision &&
    typeof decision.decision === 'string' &&
    typeof decision.workgroup === 'string'
  );
};

const isValidActionItem = (item: Partial<ActionItem>): item is ActionItem => {
  return Boolean(
    item &&
    typeof item.text === 'string' &&
    typeof item.workgroup === 'string' &&
    typeof item.status === 'string'
  );
};

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
      if (!isValidDecision(decision)) {
        return false;
      }

      const matchesWorkgroup = !filters.workgroup || decision.workgroup === filters.workgroup;
      const searchTerm = filters.search?.toLowerCase() || '';
      const matchesSearch = !searchTerm || 
        (decision.decision && decision.decision.toLowerCase().includes(searchTerm));
      
      return matchesWorkgroup && matchesSearch;
    });

    const filteredActionItems = actionItems.filter(item => {
      if (!isValidActionItem(item)) {
        return false;
      }

      const matchesWorkgroup = !filters.workgroup || item.workgroup === filters.workgroup;
      const matchesStatus = !filters.status || item.status === filters.status;
      const searchTerm = filters.search?.toLowerCase() || '';
      
      const matchesSearch = !searchTerm || [
        item.text,
        item.assignee,
        item.workgroup
      ].some(field => 
        typeof field === 'string' && field.toLowerCase().includes(searchTerm)
      );

      return matchesWorkgroup && matchesStatus && matchesSearch;
    });

    console.log('Filtered Decisions:', filteredDecisions);
    console.log('Filtered Action Items:', filteredActionItems);
    console.groupEnd();
  }, [summaries, filters, getDecisions, getActionItems]);

  return null;
};

export default DataDebugger;