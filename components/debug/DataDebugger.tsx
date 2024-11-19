// src/components/debug/DataDebugger.tsx
import { useGlobalMeetingSummaries } from '../../context/GlobalMeetingSummariesContext';
import { useEffect, useRef, memo } from 'react';
import { Decision, ActionItem, FilterState } from '../../types/meetings';

interface DataDebuggerProps {
  filters: FilterState;
}

// Type guards
const isValidDecision = (decision: Partial<Decision>): decision is Decision => {
  return Boolean(
    decision &&
    typeof decision.decision === 'string' &&
    typeof decision.workgroup === 'string' &&
    typeof decision.date === 'string'
  );
};

const isValidActionItem = (item: Partial<ActionItem>): item is ActionItem => {
  return Boolean(
    item &&
    typeof item.text === 'string' &&
    typeof item.workgroup === 'string' &&
    typeof item.status === 'string' &&
    typeof item.workgroup_id === 'string'
  );
};

const DataDebugger = memo(({ filters }: DataDebuggerProps) => {
  const { summaries, getDecisions, getActionItems } = useGlobalMeetingSummaries();
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
    console.log('Total Summaries:', summaries.length);
    console.log('Filter State:', {
      hasWorkgroupFilter: Boolean(filters.workgroup),
      hasSearchFilter: Boolean(filters.search),
      hasStatusFilter: Boolean(filters.status),
      hasDateFilter: Boolean(filters.date),
      hasAssigneeFilter: Boolean(filters.assignee),
      hasEffectFilter: Boolean(filters.effect)
    });
    console.groupEnd();

    console.group('Processed Data');
    const decisions = getDecisions();
    const actionItems = getActionItems();
    
    const filteredDecisions = decisions.filter(decision => {
      if (!isValidDecision(decision)) {
        console.warn('Invalid decision object detected:', decision);
        return false;
      }

      const matchesWorkgroup = !filters.workgroup || decision.workgroup === filters.workgroup;
      const matchesEffect = !filters.effect || decision.effect === filters.effect;
      
      const searchTerm = filters.search?.toLowerCase() || '';
      const matchesSearch = !searchTerm || [
        decision.decision,
        decision.effect,
        decision.rationale,
        decision.workgroup
      ].some(field => 
        typeof field === 'string' && field.toLowerCase().includes(searchTerm)
      );

      // Handle date filtering
      let matchesDate = true;
      if (filters.date || (filters.dateRange.start && filters.dateRange.end)) {
        const decisionDate = new Date(decision.date);
        if (filters.date) {
          // Single date filter
          const filterDate = new Date(filters.date);
          matchesDate = decisionDate.toDateString() === filterDate.toDateString();
        } else {
          // Date range filter
          const startDate = new Date(filters.dateRange.start);
          const endDate = new Date(filters.dateRange.end);
          matchesDate = decisionDate >= startDate && decisionDate <= endDate;
        }
      }
      
      return matchesWorkgroup && matchesSearch && matchesEffect && matchesDate;
    });

    const filteredActionItems = actionItems.filter(item => {
      if (!isValidActionItem(item)) {
        console.warn('Invalid action item detected:', item);
        return false;
      }

      const matchesWorkgroup = !filters.workgroup || item.workgroup === filters.workgroup;
      const matchesStatus = !filters.status || item.status === filters.status;
      const matchesAssignee = !filters.assignee || item.assignee === filters.assignee;
      
      const searchTerm = filters.search?.toLowerCase() || '';
      const matchesSearch = !searchTerm || [
        item.text,
        item.assignee,
        item.workgroup,
        item.status
      ].some(field => 
        typeof field === 'string' && field.toLowerCase().includes(searchTerm)
      );

      // Handle date filtering for action items
      let matchesDate = true;
      if (filters.date || (filters.dateRange.start && filters.dateRange.end)) {
        if (item.dueDate) {
          const dueDate = new Date(item.dueDate);
          if (filters.date) {
            // Single date filter
            const filterDate = new Date(filters.date);
            matchesDate = dueDate.toDateString() === filterDate.toDateString();
          } else {
            // Date range filter
            const startDate = new Date(filters.dateRange.start);
            const endDate = new Date(filters.dateRange.end);
            matchesDate = dueDate >= startDate && dueDate <= endDate;
          }
        } else {
          matchesDate = false;
        }
      }

      return matchesWorkgroup && matchesStatus && matchesSearch && matchesAssignee && matchesDate;
    });

    console.group('Filtering Stats');
    console.log('Total Decisions:', decisions.length);
    console.log('Filtered Decisions:', filteredDecisions.length);
    console.log('Total Action Items:', actionItems.length);
    console.log('Filtered Action Items:', filteredActionItems.length);
    console.groupEnd();

    console.group('Detailed Results');
    console.log('Filtered Decisions:', filteredDecisions);
    console.log('Filtered Action Items:', filteredActionItems);
    console.groupEnd();

    console.groupEnd();
  }, [filters, summaries, getDecisions, getActionItems]);

  // Component doesn't render anything
  return null;
});

DataDebugger.displayName = 'DataDebugger';

export default DataDebugger;