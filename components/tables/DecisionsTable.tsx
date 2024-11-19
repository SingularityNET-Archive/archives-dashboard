// components/tables/DecisionsTable.tsx
import React, { useMemo, useCallback } from 'react';
import { useGlobalMeetingSummaries } from '../../context/GlobalMeetingSummariesContext';
import { formatDate } from '../../utils/dateFormatting';
import { formatEffectType } from '../../utils/stringFormatting';
import { isSameDate } from '../../utils/dateUtils';
import { FilterState, Decision } from '../../types/meetings';
import HighlightedText from '../common/HighlightedText';
import styles from '../../styles/SharedTable.module.css';

interface DecisionsTableProps {
  filters: FilterState;
  className?: string;
}

const isValidDecision = (decision: Partial<Decision>): decision is Decision => {
  return Boolean(
    decision &&
    typeof decision.decision === 'string' &&
    typeof decision.workgroup === 'string' &&
    typeof decision.workgroup_id === 'string' &&
    typeof decision.date === 'string'
  );
};

export default function DecisionsTable({ 
  filters,
  className = ''
}: DecisionsTableProps) {
  const { getDecisions, loading } = useGlobalMeetingSummaries();

  // Define search matching function
  const checkSearchMatch = useCallback((decision: Decision, searchTerm: string): boolean => {
    if (!searchTerm) return true;
    
    const searchableFields = [
      decision.decision,
      decision.effect,
      decision.rationale,
      decision.workgroup
    ];

    const normalizedSearch = searchTerm.toLowerCase();
    return searchableFields.some(field => 
      typeof field === 'string' && field.toLowerCase().includes(normalizedSearch)
    );
  }, []);

  // Define effect matching function
  const checkEffectMatch = useCallback((decision: Decision, effectFilter: string): boolean => {
    if (!effectFilter) return true;
    return decision.effect === effectFilter;
  }, []);

  // Memoize filtered and sorted decisions
  const filteredDecisions = useMemo(() => {
    const decisions = getDecisions();

    return decisions
      .filter(decision => {
        if (!isValidDecision(decision)) {
          console.warn('Invalid decision detected:', decision);
          return false;
        }

        const matchesWorkgroup = !filters.workgroup || 
          decision.workgroup_id === filters.workgroup;
        const matchesSearch = checkSearchMatch(decision, filters.search);
        const matchesEffect = checkEffectMatch(decision, filters.effect);

        // Handle date filtering
        let matchesDate = true;
        if (filters.date) {
          matchesDate = isSameDate(decision.date, filters.date);
        } else if (filters.dateRange.start && filters.dateRange.end) {
          const decisionDate = new Date(decision.date);
          const startDate = new Date(filters.dateRange.start);
          const endDate = new Date(filters.dateRange.end);
          matchesDate = decisionDate >= startDate && decisionDate <= endDate;
        }

        return matchesWorkgroup && matchesSearch && matchesDate && matchesEffect;
      })
      .sort((a, b) => {
        // Sort by date in descending order
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });
  }, [filters, getDecisions, checkSearchMatch, checkEffectMatch]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredDecisions.length;
    const withRationale = filteredDecisions.filter(d => Boolean(d.rationale)).length;
    const withEffect = filteredDecisions.filter(d => Boolean(d.effect)).length;

    return {
      total,
      withRationale,
      withEffect,
      rationalePercentage: total ? Math.round((withRationale / total) * 100) : 0,
      effectPercentage: total ? Math.round((withEffect / total) * 100) : 0
    };
  }, [filteredDecisions]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>Loading decisions...</div>
      </div>
    );
  }

  return (
    <div className={`${styles.tableContainer} ${className}`}>
      <table className={styles.table} role="grid">
        <thead>
          <tr>
            <th className={styles.dateColumn} scope="col">Date</th>
            <th className={styles.standardColumn} scope="col">Workgroup</th>
            <th className={styles.textColumn} scope="col">Decision</th>
            <th className={styles.textColumn} scope="col">Rationale</th>
            <th className={styles.effectColumn} scope="col">Effect</th>
          </tr>
        </thead>
        <tbody>
          {filteredDecisions.map((decision, index) => (
            <tr 
              key={`${decision.workgroup_id}-${index}`}
              className={decision.effect ? styles[`effect${decision.effect.replace(/\s+/g, '')}`] : ''}
            >
              <td className={styles.dateCell}>
                <time dateTime={decision.date}>
                  {formatDate(decision.date)}
                </time>
              </td>
              <td>
                <HighlightedText 
                  text={decision.workgroup} 
                  searchTerm={filters.search}
                />
              </td>
              <td>
                <HighlightedText 
                  text={decision.decision} 
                  searchTerm={filters.search}
                />
              </td>
              <td>
                {decision.rationale ? (
                  <HighlightedText 
                    text={decision.rationale} 
                    searchTerm={filters.search}
                  />
                ) : (
                  <span className={styles.noContent}>No rationale provided</span>
                )}
              </td>
              <td className={styles.effectCell}>
                {decision.effect ? (
                  <span className={`${styles.effectBadge} ${styles[`effect${decision.effect.replace(/\s+/g, '')}`]}`}>
                    <HighlightedText 
                      text={formatEffectType(decision.effect)} 
                      searchTerm={filters.search}
                    />
                  </span>
                ) : (
                  <span className={styles.noContent}>Not specified</span>
                )}
              </td>
            </tr>
          ))}
          {filteredDecisions.length === 0 && (
            <tr>
              <td colSpan={5} className={styles.noResults}>
                No decisions match the current filters
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} className={styles.tableFooter}>
              <div className={styles.statsContainer}>
                <span>Total Decisions: {stats.total}</span>
                <span>With Rationale: {stats.withRationale} ({stats.rationalePercentage}%)</span>
                <span>With Effect: {stats.withEffect} ({stats.effectPercentage}%)</span>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}