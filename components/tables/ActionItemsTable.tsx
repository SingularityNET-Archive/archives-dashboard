// components/tables/ActionItemsTable.tsx
import React, { useMemo, useCallback } from 'react';
import { useGlobalMeetingSummaries } from '../../context/GlobalMeetingSummariesContext';
import { FilterState, ActionItem } from '../../types/meetings';
import { formatDate } from '../../utils/dateFormatting';
import { isSameDate } from '../../utils/dateUtils';
import HighlightedText from '../common/HighlightedText';
import styles from '../../styles/SharedTable.module.css';

interface ActionItemsTableProps {
  filters: FilterState;
  className?: string;
}

const isValidActionItem = (item: Partial<ActionItem>): item is ActionItem => {
  return Boolean(
    item &&
    typeof item.text === 'string' &&
    typeof item.workgroup === 'string' &&
    typeof item.workgroup_id === 'string' &&
    typeof item.status === 'string'
  );
};

export default function ActionItemsTable({ 
  filters, 
  className = '' 
}: ActionItemsTableProps) {
  const { getActionItems, loading } = useGlobalMeetingSummaries();

  // Define search matching function outside of useMemo
  const checkSearchMatch = useCallback((item: ActionItem, searchTerm: string): boolean => {
    if (!searchTerm) return true;
    
    const searchableFields = [
      item.text,
      item.assignee,
      item.workgroup,
      item.status
    ];

    return searchableFields.some(field => 
      typeof field === 'string' && field.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, []);

  // Define assignee matching function outside of useMemo
  const checkAssigneeMatch = useCallback((item: ActionItem, assigneeFilter: string): boolean => {
    if (!assigneeFilter) return true;
    if (!item.assignee) return false;
  
    // Normalize both the filter and the assignees for case-insensitive comparison
    const normalizedFilter = assigneeFilter.toLowerCase();
    const normalizedAssignees = item.assignee
      .split(',')
      .map(name => name.trim().toLowerCase());
  
    return normalizedAssignees.includes(normalizedFilter);
  }, []);

  // Memoize filtered and sorted action items
  const filteredActionItems = useMemo(() => {
    const items = getActionItems();

    return items
      .filter(item => {
        if (!isValidActionItem(item)) {
          console.warn('Invalid action item detected:', item);
          return false;
        }

        const matchesWorkgroup = !filters.workgroup || item.workgroup_id === filters.workgroup;
        const matchesStatus = !filters.status || item.status === filters.status;
        const matchesSearch = checkSearchMatch(item, filters.search);
        const matchesAssigneeFilter = checkAssigneeMatch(item, filters.assignee);
        
        // Handle date filtering
        let matchesDate = true;
        if (filters.date && item.dueDate) {
          matchesDate = isSameDate(item.dueDate, filters.date);
        } else if (filters.dateRange.start && filters.dateRange.end && item.dueDate) {
          const dueDate = new Date(item.dueDate);
          const startDate = new Date(filters.dateRange.start);
          const endDate = new Date(filters.dateRange.end);
          matchesDate = dueDate >= startDate && dueDate <= endDate;
        }

        return matchesWorkgroup && 
               matchesStatus && 
               matchesSearch && 
               matchesDate && 
               matchesAssigneeFilter;
      })
      .sort((a, b) => {
        // Then sort by due date
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return dateB - dateA;
      });
  }, [filters, getActionItems, checkSearchMatch, checkAssigneeMatch]);

  // Rest of the component remains the same...
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>Loading action items...</div>
      </div>
    );
  }

  return (
    <div className={`${styles.tableContainer} ${className}`}>
      <table className={styles.table} role="grid">
        <thead>
          <tr>
            <th className={styles.dateColumn} scope="col">Due Date</th>
            <th className={styles.standardColumn} scope="col">Workgroup</th>
            <th className={styles.textColumn} scope="col">Action Item</th>
            <th className={styles.standardColumn} scope="col">Assignee</th>
            <th className={styles.statusColumn} scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredActionItems.map((item, index) => (
            <tr 
              key={`${item.workgroup_id}-${index}`}
              className={styles[`status${item.status.replace(/\s+/g, '')}`]}
            >
              <td className={styles.dateCell}>
                {item.dueDate ? (
                  <time dateTime={item.dueDate}>
                    {formatDate(item.dueDate)}
                  </time>
                ) : (
                  <span className={styles.noDate}>No date set</span>
                )}
              </td>
              <td>
                <HighlightedText 
                  text={item.workgroup} 
                  searchTerm={filters.search}
                />
              </td>
              <td>
                <HighlightedText 
                  text={item.text} 
                  searchTerm={filters.search}
                />
              </td>
              <td>
                {item.assignee ? (
                  <HighlightedText 
                    text={item.assignee} 
                    searchTerm={filters.search}
                  />
                ) : (
                  <span className={styles.unassigned}>Unassigned</span>
                )}
              </td>
              <td>
                <span 
                  className={`${styles.statusBadge} ${
                    styles[`status${item.status.replace(/\b\w/g, char => char.toUpperCase()).replace(/\s+/g, '')}`]
                  }`}
                  aria-label={`Status: ${item.status}`}
                >
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
          {filteredActionItems.length === 0 && (
            <tr>
              <td colSpan={5} className={styles.noResults}>
                No action items match the current filters
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} className={styles.tableFooter}>
              Total Items: {filteredActionItems.length}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}