import { formatDate } from '../../utils/dateFormatting';
import { useMeetingSummaries } from '../../context/MeetingSummariesContext';
import { FilterState, MeetingSummary, TimestampedVideoSection } from '../../types/meetings';
import HighlightedText from '../common/HighlightedText';
import MeetingDetailsModal from '../modals/MeetingDetailsModal';
import { useState } from 'react';
import styles from '../../styles/SharedTable.module.css';

interface MeetingsTableProps {
  filters: FilterState;
  initialData?: MeetingSummary[];
}

export default function MeetingsTable({ filters }: MeetingsTableProps) {
  const { summaries, loading } = useMeetingSummaries();
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingSummary | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const getTagMatchCount = (meeting: MeetingSummary, searchTerm: string): number => {
    if (!searchTerm) return 0;
    
    const tagsContent = [
      meeting.summary.tags?.topicsCovered,
      meeting.summary.tags?.emotions,
      meeting.summary.tags?.other,
    ].filter(Boolean).join(' ');

    const regex = new RegExp(searchTerm, 'gi');
    const matches = tagsContent.match(regex);
    return matches ? matches.length : 0;
  };

  const getContentMatchCount = (meeting: MeetingSummary, searchTerm: string): number => {
    if (!searchTerm) return 0;
    
    // Get timestamped video content if it exists
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

    const regex = new RegExp(searchTerm, 'gi');
    const matches = searchableContent.match(regex);
    return matches ? matches.length : 0;
  };

  const filteredMeetings = summaries.filter(meeting => {
    const searchTerm = filters.search?.toLowerCase() || '';
    const matchesWorkgroup = !filters.workgroup || meeting.summary.workgroup_id === filters.workgroup;
    const matchesDate = !filters.date || 
      (meeting.summary.meetingInfo.date && meeting.summary.meetingInfo.date === filters.date);

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
      meeting.summary.tags?.topicsCovered,
      meeting.summary.tags?.emotions,
      meeting.summary.tags?.other,
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
    ].filter(Boolean).join(' ').toLowerCase();

    const matchesSearch = !searchTerm || searchableContent.includes(searchTerm);

    return matchesWorkgroup && matchesDate && matchesSearch;
  }).sort((a, b) => {
    // Sort by date in descending order
    const dateA = new Date(a.summary.meetingInfo.date).getTime();
    const dateB = new Date(b.summary.meetingInfo.date).getTime();
    return dateB - dateA;
  });

  // Rest of the component remains the same...
  const getMeetingStats = (meeting: MeetingSummary) => {
    const stats = {
      actionItems: 0,
      decisions: 0
    };
  
    meeting.summary.agendaItems?.forEach(item => {
      stats.actionItems += item.actionItems?.length || 0;
      stats.decisions += item.decisionItems?.length || 0;
    });
  
    return stats;
  };

  const handleMeetingClick = (meeting: MeetingSummary) => {
    setSelectedMeeting(meeting);
    setIsModalOpen(true);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.dateColumn}>Date</th>
              <th className={styles.standardColumn}>Workgroup</th>
              <th className={styles.standardColumn}>Meeting Name</th>
              {filters.search && (
                <>
                  <th className={styles.standardColumn}>Tag Matches</th>
                  <th className={styles.standardColumn}>Content Matches</th>
                </>
              )}
              <th className={styles.metricsColumn}>Content Overview</th>
              <th className={styles.actionColumn}>View Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredMeetings.map((meeting) => {
              const stats = getMeetingStats(meeting);
              const tagMatchCount = getTagMatchCount(meeting, filters.search);
              const contentMatchCount = getContentMatchCount(meeting, filters.search);
              
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
                        {tagMatchCount} matches
                      </td>
                      <td className={styles.searchMatches}>
                        {contentMatchCount} matches
                      </td>
                    </>
                  )}
                  <td>
                    <div className={styles.meetingStats}>
                      <span>{stats.actionItems} Action Items</span>
                      <span>{stats.decisions} Decisions</span>
                    </div>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleMeetingClick(meeting)}
                      className={styles.viewDetailsLink}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredMeetings.length === 0 && (
              <tr>
                <td colSpan={filters.search ? 7 : 5} className={styles.noResults}>
                  No meetings found
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