// components/tables/DecisionsTable.tsx
import React from 'react';
import type { Decision, DecisionStats } from '../../types/meetings';
import { formatDate } from '../../utils/dateFormatting';
import { formatEffectType } from '../../utils/stringFormatting';
import HighlightedText from '../common/HighlightedText';
import styles from '../../styles/SharedTable.module.css';

interface DecisionsTableProps {
  /** The current page of already-filtered decisions. */
  items: Decision[];
  /** Term the results were searched with, used for highlighting. */
  searchTerm: string;
  /** Stats over the whole filtered set, not just this page. */
  stats: DecisionStats;
  className?: string;
}

export default function DecisionsTable({
  items,
  searchTerm,
  stats,
  className = ''
}: DecisionsTableProps) {
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
          {items.map((decision, index) => (
            <tr
              key={`${decision.meeting_id}-${index}`}
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
                  searchTerm={searchTerm}
                />
              </td>
              <td>
                <HighlightedText
                  text={decision.decision}
                  searchTerm={searchTerm}
                />
              </td>
              <td>
                {decision.rationale ? (
                  <HighlightedText
                    text={decision.rationale}
                    searchTerm={searchTerm}
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
                      searchTerm={searchTerm}
                    />
                  </span>
                ) : (
                  <span className={styles.noContent}>Not specified</span>
                )}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
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
