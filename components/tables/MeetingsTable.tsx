import { formatDate } from '../../utils/dateFormatting';
import { useMeetingSummaries } from '../../context/MeetingSummariesContext';
import { FilterState, MeetingSummary } from '../../types/meetings';
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
  
  const filteredMeetings = summaries.filter(meeting => {
    const searchTerm = filters.search?.toLowerCase() || '';
    const matchesWorkgroup = !filters.workgroup || meeting.summary.workgroup_id === filters.workgroup;
    const matchesDate = !filters.date || 
      (meeting.summary.meetingInfo.date && meeting.summary.meetingInfo.date === filters.date);

    const searchableContent = [
        meeting.summary.workgroup,
        meeting.summary.meetingInfo.purpose,
        meeting.summary.meetingInfo.name,
        ...(meeting.summary.agendaItems?.flatMap(item => [
          item.narrative,
          item.townHallUpdates,
          item.townHallSummary,
          ...(item.actionItems?.map(action => action.text) || []),
          ...(item.decisionItems?.map(decision => decision.decision) || [])
        ]) || [])
      ].filter(Boolean).join(' ').toLowerCase();

    const matchesSearch = !searchTerm || searchableContent.includes(searchTerm);

    return matchesWorkgroup && matchesDate && matchesSearch;
  });

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
              <th className={styles.metricsColumn}>Content Overview</th>
              <th className={styles.actionColumn}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMeetings.map((meeting) => {
              const stats = getMeetingStats(meeting);
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
                <td colSpan={5} className={styles.noResults}>
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
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMeeting(null);
        }}
      />
    </>
  );
}