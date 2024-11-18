// src/components/debug/DataDebugger.tsx
import { useMeetingSummaries } from '../../context/MeetingSummariesContext';
import { useEffect, useRef, memo } from 'react';
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

const DataDebugger = memo(({ filters }: DataDebuggerProps) => {
  const { getDecisions, getActionItems, summaries } = useMeetingSummaries();
  const previousFiltersRef = useRef<string>('');
  const previousSummariesRef = useRef<string>('');
  
  useEffect(() => {
    // Convert current values to strings for comparison
    const currentFiltersString = JSON.stringify(filters);
    const currentSummariesString = JSON.stringify(summaries);

    // Check if either filters or summaries have actually changed
    if (
      previousFiltersRef.current === currentFiltersString && 
      previousSummariesRef.current === currentSummariesString
    ) {
      return;
    }

    // Update refs with current values
    previousFiltersRef.current = currentFiltersString;
    previousSummariesRef.current = currentSummariesString;

    // Perform logging
    console.group('Data Debugger Output');
    
    console.group('Raw Data');
    console.log('Current Filters:', filters);
    console.log('All Summaries:', summaries);
    console.groupEnd();

    console.group('Processed Data');
    const decisions = getDecisions();
    const actionItems = getActionItems();
    
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

    console.log('All Decisions:', decisions);
    console.log('Filtered Decisions:', filteredDecisions);
    console.log('All Action Items:', actionItems);
    console.log('Filtered Action Items:', filteredActionItems);
    console.groupEnd();

    console.groupEnd();
  }, [filters, summaries, getDecisions, getActionItems]);

  // Component doesn't render anything
  return null;
});

DataDebugger.displayName = 'DataDebugger';

export default DataDebugger;