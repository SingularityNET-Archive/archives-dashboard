// components/tables/MeetingsTable.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { Check } from 'lucide-react';
import { useGlobalMeetingSummaries } from '../../context/GlobalMeetingSummariesContext';
import { FilterState, MeetingSummary, TimestampedVideoSection } from '../../types/meetings';
import { formatDate } from '../../utils/dateFormatting';
import HighlightedText from '../common/HighlightedText';
import MeetingDetailsModal from '../modals/MeetingDetailsModal';
import styles from '../../styles/SharedTable.module.css';

interface MeetingsTableProps {
  filters: FilterState;
  className?: string;
}

interface MeetingStats {
  actionItems: number;
  decisions: number;
}

export default function MeetingsTable({ filters, className = '' }: MeetingsTableProps) {
  const { summaries, loading } = useGlobalMeetingSummaries();
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingSummary | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Memoize the content search function
  const searchContent = useCallback((content: string, searchTerm: string): number => {
    if (!searchTerm) return 0;
    const regex = new RegExp(searchTerm, 'gi');
    const matches = content.match(regex);
    return matches ? matches.length : 0;
  }, []);

  // Memoize tag match counting
  const getTagMatchCount = useCallback((meeting: MeetingSummary, searchTerm: string): number => {
    if (!searchTerm) return 0;
    
    const tagsContent = [
      meeting.summary.tags?.topicsCovered,
      meeting.summary.tags?.emotions,
      meeting.summary.tags?.other,
    ].filter(Boolean).join(' ');

    return searchContent(tagsContent, searchTerm);
  }, [searchContent]);

  // Memoize content match counting
  const getContentMatchCount = useCallback((meeting: MeetingSummary, searchTerm: string): number => {
    if (!searchTerm) return 0;
    
    const timestampedContent = [
      meeting.summary.meetingInfo.timestampedVideo?.intro,
      meeting.summary.meetingInfo.timestampedVideo?.timestamps,
      ...(meeting.summary.meetingInfo.timestampedVideo?.sections?.map((section: TimestampedVideoSection) => 
        [section.title, section.content].filter(Boolean)
      ) || [])
    ].filter(Boolean);
    
    const searchableContent = [
      meeting.summary.workgroup,
      meeting.summary.meetingInfo.purpose,
      meeting.summary.meetingInfo.name,
      meeting.summary.meetingInfo.host,
      meeting.summary.meetingInfo.documenter,
      meeting.summary.meetingInfo.peoplePresent,
      ...timestampedContent,
      ...(meeting.summary.agendaItems?.flatMap(item => [
        item.agenda,
        item.narrative,
        item.townHallUpdates,
        item.townHallSummary,
        ...(item.discussionPoints || []),
        ...(item.meetingTopics || []),
        ...(item.issues || []),
        ...(item.gameRules || []),
        ...(item.learningPoints || []),
        ...(item.actionItems?.map(action => [
          action.text,
          action.assignee,
          action.status
        ].filter(Boolean)) || []),
        ...(item.decisionItems?.map(decision => [
          decision.decision,
          decision.effect
        ].filter(Boolean)) || [])
      ]) || [])
    ].filter(Boolean).join(' ');

    return searchContent(searchableContent, searchTerm);
  }, [searchContent]);

  // Memoize meeting stats calculation
  const getMeetingStats = useCallback((meeting: MeetingSummary): MeetingStats => {
    return {
      actionItems: meeting.summary.agendaItems?.reduce(
        (total, item) => total + (item.actionItems?.length || 0), 
        0
      ) || 0,
      decisions: meeting.summary.agendaItems?.reduce(
        (total, item) => total + (item.decisionItems?.length || 0), 
        0
      ) || 0
    };
  }, []);

  // Memoize filtered and sorted meetings
  const filteredMeetings = useMemo(() => {
    return summaries
      .filter(meeting => {
        const searchTerm = filters.search?.toLowerCase() || '';
        const matchesWorkgroup = !filters.workgroup || 
          meeting.summary.workgroup_id === filters.workgroup;
        const matchesDate = !filters.date || 
          (meeting.summary.meetingInfo.date && 
           meeting.summary.meetingInfo.date === filters.date);

        if (matchesWorkgroup && matchesDate && !searchTerm) {
          return true;
        }

        if (!matchesWorkgroup || !matchesDate) {
          return false;
        }

        // Only perform expensive search if other filters pass
        const hasTagMatch = getTagMatchCount(meeting, searchTerm) > 0;
        const hasContentMatch = getContentMatchCount(meeting, searchTerm) > 0;

        return hasTagMatch || hasContentMatch;
      })
      .sort((a, b) => {
        // Sort by date in descending order
        const dateA = new Date(a.summary.meetingInfo.date).getTime();
        const dateB = new Date(b.summary.meetingInfo.date).getTime();
        return dateB - dateA;
      });
  }, [summaries, filters, getTagMatchCount, getContentMatchCount]);

  const handleMeetingClick = useCallback((meeting: MeetingSummary) => {
    //console.log('Meeting clicked:', meeting);
    setSelectedMeeting(meeting);
    setIsModalOpen(true);
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>Loading meetings...</div>
      </div>
    );
  }

  if (!summaries.length) {
    return (
      <div className={styles.emptyContainer}>
        <p>No meetings available.</p>
      </div>
    );
  }

  return (
    <>
      <div className={`${styles.tableContainer} ${className}`}>
        <table className={styles.table} role="grid">
          <thead>
            <tr>
              <th className={styles.dateColumn} scope="col">Date</th>
              <th className={styles.standardColumn} scope="col">Workgroup</th>
              <th className={styles.standardColumn} scope="col">Meeting Name</th>
              {filters.search && (
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
            {filteredMeetings.map((meeting) => {
              const stats = getMeetingStats(meeting);
              const tagMatchCount = filters.search ? 
                getTagMatchCount(meeting, filters.search) : 0;
              const contentMatchCount = filters.search ? 
                getContentMatchCount(meeting, filters.search) : 0;
              
              return (
                <tr key={meeting.meeting_id}>
                  <td className={styles.dateCell}>
                    {formatDate(meeting.summary.meetingInfo.date)}
                  </td>
                  <td>
                    <HighlightedText 
                      text={meeting.summary.workgroup} 
                      searchTerm={filters.search}
                    />
                  </td>
                  <td>
                    <HighlightedText 
                      text={meeting.summary.meetingInfo.name} 
                      searchTerm={filters.search}
                    />
                  </td>
                  {filters.search && (
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
                      aria-label={`View details for ${meeting.summary.meetingInfo.name}`}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredMeetings.length === 0 && (
              <tr>
                <td 
                  colSpan={filters.search ? 8 : 6} 
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
        searchTerm={filters.search}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMeeting(null);
        }}
      />
    </>
  );
}