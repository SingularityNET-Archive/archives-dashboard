// components/tables/MeetingsTable.tsx
import React, { useState, useCallback } from 'react';
import { Check } from 'lucide-react';
import type { MeetingSearchResult, MeetingSummary } from '../../types/meetings';
import { formatDate } from '../../utils/dateFormatting';
import HighlightedText from '../common/HighlightedText';
import MeetingDetailsModal from '../modals/MeetingDetailsModal';
import styles from '../../styles/SharedTable.module.css';

interface MeetingsTableProps {
  /** The current page of already-filtered meetings. */
  items: MeetingSearchResult[];
  /** Term the results were searched with, used for highlighting. */
  searchTerm: string;
  className?: string;
}

interface MeetingStats {
  actionItems: number;
  decisions: number;
}

const getMeetingStats = (meeting: MeetingSummary): MeetingStats => ({
  actionItems: meeting.summary.agendaItems?.reduce(
    (total, item) => total + (item.actionItems?.length || 0),
    0
  ) || 0,
  decisions: meeting.summary.agendaItems?.reduce(
    (total, item) => total + (item.decisionItems?.length || 0),
    0
  ) || 0
});

export default function MeetingsTable({ items, searchTerm, className = '' }: MeetingsTableProps) {
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingSummary | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showMatches = Boolean(searchTerm);

  const handleMeetingClick = useCallback((meeting: MeetingSummary) => {
    setSelectedMeeting(meeting);
    setIsModalOpen(true);
  }, []);

  return (
    <>
      <div className={`${styles.tableContainer} ${className}`}>
        <table className={styles.table} role="grid">
          <thead>
            <tr>
              <th className={styles.dateColumn} scope="col">Date</th>
              <th className={styles.standardColumn} scope="col">Workgroup</th>
              <th className={styles.standardColumn} scope="col">Meeting Name</th>
              {showMatches && (
                <>
                  <th className={styles.standardColumn} scope="col">Tag Matches</th>
                  <th className={styles.standardColumn} scope="col">Content Matches</th>
                </>
              )}
              <th className={styles.metricsColumn} scope="col">Content Overview</th>
              <th className={styles.iconColumn} scope="col">Archived</th>
              <th className={styles.actionColumn} scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((meeting) => {
              const stats = getMeetingStats(meeting);
              const tagMatchCount = meeting.matches?.tags ?? 0;
              const contentMatchCount = meeting.matches?.content ?? 0;

              return (
                <tr key={meeting.meeting_id}>
                  <td className={styles.dateCell}>
                    {formatDate(meeting.summary.meetingInfo?.date)}
                  </td>
                  <td>
                    <HighlightedText
                      text={meeting.summary.workgroup}
                      searchTerm={searchTerm}
                    />
                  </td>
                  <td>
                    <HighlightedText
                      text={meeting.summary.meetingInfo?.name}
                      searchTerm={searchTerm}
                    />
                  </td>
                  {showMatches && (
                    <>
                      <td className={styles.searchMatches}>
                        {tagMatchCount > 0 && (
                          <span className={styles.matchCount}>{tagMatchCount}</span>
                        )}
                      </td>
                      <td className={styles.searchMatches}>
                        {contentMatchCount > 0 && (
                          <span className={styles.matchCount}>{contentMatchCount}</span>
                        )}
                      </td>
                    </>
                  )}
                  <td>
                    <div className={styles.meetingStats}>
                      <span className={styles.statItem}>
                        {stats.actionItems} {stats.actionItems === 1 ? 'Action Item' : 'Action Items'}
                      </span>
                      <span className={styles.statItem}>
                        {stats.decisions} {stats.decisions === 1 ? 'Decision' : 'Decisions'}
                      </span>
                    </div>
                  </td>
                  <td className={styles.archiveStatus}>
                    {meeting.confirmed && (
                      <Check
                        className="text-green-500"
                        size={20}
                        aria-label="Meeting archived"
                      />
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => handleMeetingClick(meeting)}
                      className={styles.viewDetailsButton}
                      aria-label={`View details for ${meeting.summary.meetingInfo?.name ?? 'meeting'}`}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={showMatches ? 8 : 6}
                  className={styles.noResults}
                >
                  No meetings match the current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <MeetingDetailsModal
        meeting={selectedMeeting}
        isOpen={isModalOpen}
        searchTerm={searchTerm}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMeeting(null);
        }}
      />
    </>
  );
}
