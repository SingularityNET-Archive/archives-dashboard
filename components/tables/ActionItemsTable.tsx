// components/tables/ActionItemsTable.tsx
import React from 'react';
import type { ActionItem } from '../../types/meetings';
import { formatDate } from '../../utils/dateFormatting';
import HighlightedText from '../common/HighlightedText';
import styles from '../../styles/SharedTable.module.css';

interface ActionItemsTableProps {
  /** The current page of already-filtered items. */
  items: ActionItem[];
  /** Term the results were searched with, used for highlighting. */
  searchTerm: string;
  /** Total matching items across all pages. */
  total: number;
  className?: string;
}

export default function ActionItemsTable({
  items,
  searchTerm,
  total,
  className = ''
}: ActionItemsTableProps) {
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
          {items.map((item, index) => (
            <tr
              key={`${item.meeting_id}-${index}`}
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
                  searchTerm={searchTerm}
                />
              </td>
              <td>
                <HighlightedText
                  text={item.text}
                  searchTerm={searchTerm}
                />
              </td>
              <td>
                {item.assignee ? (
                  <HighlightedText
                    text={item.assignee}
                    searchTerm={searchTerm}
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
          {items.length === 0 && (
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
              Total Items: {total}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
