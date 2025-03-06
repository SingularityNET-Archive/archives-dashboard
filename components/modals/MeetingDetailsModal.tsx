// ../components/modals/MeetingDetailsModal.tsx
import React from 'react';
import { MeetingSummary } from '../../types/meetings';
import { formatDate } from '../../utils/dateFormatting';
import styles from '../../styles/SharedTable.module.css';
import HighlightedText from '../common/HighlightedText';

interface MeetingDetailsModalProps {
  meeting: MeetingSummary | null;
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
}

export default function MeetingDetailsModal({ meeting, isOpen, onClose, searchTerm }: MeetingDetailsModalProps) {
  if (!isOpen || !meeting) return null;
  //console.log(meeting)
  const hasLinks = meeting.summary.meetingInfo.googleSlides ||
    meeting.summary.meetingInfo.meetingVideoLink ||
    meeting.summary.meetingInfo.miroBoardLink ||
    meeting.summary.meetingInfo.transcriptLink ||
    meeting.summary.meetingInfo.mediaLink ||
    meeting.summary.meetingInfo.otherMediaLink;

    const hasTags = meeting.summary.tags?.topicsCovered ||
    meeting.summary.tags?.emotions ||
    meeting.summary.tags?.other;  

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose} />
      <div className={styles.modalContainer}>
        <div className={styles.modalContentWrapper}>
          <div className={styles.modalContent}>
            {/* Header */}
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <HighlightedText 
                  text={meeting.summary.meetingInfo.name} 
                  searchTerm={searchTerm}
                />
              </h2>
              <button className={styles.closeButton} onClick={onClose}>✕</button>
            </div>

            {/* Content */}
            <div className={styles.modalBody}>
              {/* Meeting Info Section */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Meeting Information</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <p className={styles.infoLabel}>Date</p>
                    <p>{formatDate(meeting.summary.meetingInfo.date)}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <p className={styles.infoLabel}>Workgroup</p>
                    <p>
                      <HighlightedText 
                        text={meeting.summary.workgroup} 
                        searchTerm={searchTerm}
                      />
                    </p>
                  </div>
                  {meeting.summary.meetingInfo.host && (
                    <div className={styles.infoItem}>
                      <p className={styles.infoLabel}>Host</p>
                      <p>
                        <HighlightedText 
                          text={meeting.summary.meetingInfo.host} 
                          searchTerm={searchTerm}
                        />
                      </p>
                    </div>
                  )}
                  {meeting.summary.meetingInfo.documenter && (
                    <div className={styles.infoItem}>
                      <p className={styles.infoLabel}>Documenter</p>
                      <p>
                        <HighlightedText 
                          text={meeting.summary.meetingInfo.documenter} 
                          searchTerm={searchTerm}
                        />
                      </p>
                    </div>
                  )}
                  {meeting.summary.meetingInfo.purpose && (
                    <div className={styles.infoItem}>
                      <p className={styles.infoLabel}>Purpose</p>
                      <p>
                        <HighlightedText 
                          text={meeting.summary.meetingInfo.purpose} 
                          searchTerm={searchTerm}
                        />
                      </p>
                    </div>
                  )}
                  {meeting.summary.meetingInfo.peoplePresent && (
                    <div className={styles.infoItem}>
                      <p className={styles.infoLabel}>People Present</p>
                      <p>
                        <HighlightedText 
                          text={meeting.summary.meetingInfo.peoplePresent} 
                          searchTerm={searchTerm}
                        />
                      </p>
                    </div>
                  )}
                  {meeting.summary.meetingInfo.townHallNumber && (
                    <div className={styles.infoItem}>
                      <p className={styles.infoLabel}>Town Hall Number</p>
                      <p>
                        <HighlightedText 
                          text={meeting.summary.meetingInfo.townHallNumber} 
                          searchTerm={searchTerm}
                        />
                      </p>
                    </div>
                  )}
                  {(meeting.summary.canceledSummary || meeting.summary.noSummaryGiven) && (
                    <div className={styles.section}>
                      <p>
                        {meeting.summary.canceledSummary
                          ? meeting.summary.canceledSummaryText
                          : meeting.summary.noSummaryGivenText}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Meeting Links Section */}
              {hasLinks && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Meeting Resources</h3>
                  <div className={styles.infoGrid}>
                    {meeting.summary.meetingInfo.googleSlides && (
                      <div className={styles.infoItem}>
                        <p className={styles.infoLabel}>Google Slides</p>
                        <a href={meeting.summary.meetingInfo.googleSlides} target="_blank" rel="noopener noreferrer" className={styles.viewDetailsButton}>View Slides</a>
                      </div>
                    )}
                    {meeting.summary.meetingInfo.meetingVideoLink && (
                      <div className={styles.infoItem}>
                        <p className={styles.infoLabel}>Meeting Video</p>
                        <a href={meeting.summary.meetingInfo.meetingVideoLink} target="_blank" rel="noopener noreferrer" className={styles.viewDetailsButton}>Watch Video</a>
                      </div>
                    )}
                    {meeting.summary.meetingInfo.miroBoardLink && (
                      <div className={styles.infoItem}>
                        <p className={styles.infoLabel}>Miro Board</p>
                        <a href={meeting.summary.meetingInfo.miroBoardLink} target="_blank" rel="noopener noreferrer" className={styles.viewDetailsButton}>View Board</a>
                      </div>
                    )}
                    {meeting.summary.meetingInfo.transcriptLink && (
                      <div className={styles.infoItem}>
                        <p className={styles.infoLabel}>Transcript</p>
                        <a href={meeting.summary.meetingInfo.transcriptLink} target="_blank" rel="noopener noreferrer" className={styles.viewDetailsButton}>View Transcript</a>
                      </div>
                    )}
                    {meeting.summary.meetingInfo.mediaLink && (
                      <div className={styles.infoItem}>
                        <p className={styles.infoLabel}>Media</p>
                        <a href={meeting.summary.meetingInfo.mediaLink} target="_blank" rel="noopener noreferrer" className={styles.viewDetailsButton}>View Media</a>
                      </div>
                    )}
                    {meeting.summary.meetingInfo.otherMediaLink && (
                      <div className={styles.infoItem}>
                        <p className={styles.infoLabel}>Other Media</p>
                        <a href={meeting.summary.meetingInfo.otherMediaLink} target="_blank" rel="noopener noreferrer" className={styles.viewDetailsButton}>View</a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {meeting.summary.meetingInfo.timestampedVideo && 
                Object.keys(meeting.summary.meetingInfo.timestampedVideo).length > 0 && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Meeting Recording</h3>
                  {meeting.summary.meetingInfo.timestampedVideo.intro && (
                    <p className={styles.videoIntro}>
                      <HighlightedText 
                        text={meeting.summary.meetingInfo.timestampedVideo.intro} 
                        searchTerm={searchTerm}
                      />
                    </p>
                  )}
                  {meeting.summary.meetingInfo.timestampedVideo.url && (
                    <div className={styles.infoItem}>
                      <p className={styles.infoLabel}>Video Link</p>
                      <a 
                        href={meeting.summary.meetingInfo.timestampedVideo.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={styles.viewDetailsButton}
                      >
                        Watch Video
                      </a>
                    </div>
                  )}
                  {meeting.summary.meetingInfo.timestampedVideo.timestamps && (
                    <div className={styles.timestampsContainer}>
                      <p className={styles.infoLabel}>Timestamps</p>
                      <div className={styles.timestamps}>
                        {meeting.summary.meetingInfo.timestampedVideo.timestamps.split('\n').map((timestamp: string, index: number) => {
                          const [time, description] = timestamp.split(' ', 2);
                          const remainingText = timestamp.slice(time.length + description?.length + 2 || 0);
                          
                          return (
                            <div key={index} className={styles.timestamp}>
                              <span className={styles.timestampTime}>{time}</span>
                              {description && remainingText && (
                                <span className={styles.timestampDescription}>
                                  <HighlightedText 
                                    text={description + remainingText} 
                                    searchTerm={searchTerm}
                                  />
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Agenda Items */}
              {meeting.summary.agendaItems?.length > 0 && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Agenda Items</h3>
                  {meeting.summary.agendaItems.map((item, index) => (
                    <div key={index} className={styles.agendaItem}>
                      {item.agenda && (
                        <div className={styles.section}>
                          <h4 className={styles.sectionTitle}>Agenda</h4>
                          <p>
                            <HighlightedText 
                              text={item.agenda} 
                              searchTerm={searchTerm}
                            />
                          </p>
                        </div>
                      )}

                      {item.actionItems && item.actionItems.length > 0 && item.actionItems.some(action => 
                        action.text || action.assignee || action.dueDate
                      ) && (
                        <div className={styles.section}>
                          <h4 className={styles.sectionTitle}>Action Items</h4>
                          <ul className={styles.itemList}>
                            {item.actionItems.filter(action => 
                              action.text || action.assignee || action.dueDate || (action.status && action.status !== '')
                            ).map((action, idx) => (
                              <li key={idx}>
                                <HighlightedText 
                                  text={action.text} 
                                  searchTerm={searchTerm}
                                />
                                {(action.assignee || action.dueDate || action.status) && (
                                  <div className={styles.actionDetails}>
                                    {action.assignee && (
                                      <span className={styles.assignee}>
                                        Assignee: <HighlightedText 
                                          text={action.assignee} 
                                          searchTerm={searchTerm}
                                        />
                                      </span>
                                    )}
                                    {action.dueDate && (
                                      <span className={styles.assignee}>Due: {formatDate(action.dueDate)}</span>
                                    )}
                                    {action.status && action.status !== '' && (
                                      <span className={`${styles.statusBadge} ${styles[`status${action.status}`]}`}>
                                        <HighlightedText 
                                          text={action.status} 
                                          searchTerm={searchTerm}
                                        />
                                      </span>
                                    )}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {item.decisionItems && item.decisionItems.length > 0 && (
                        <div className={styles.section}>
                          <h4 className={styles.sectionTitle}>Decisions</h4>
                          <ul className={styles.itemList}>
                            {item.decisionItems.map((decision, idx) => (
                              <li key={idx}>
                                <HighlightedText 
                                  text={decision.decision} 
                                  searchTerm={searchTerm}
                                />
                                {decision.effect && (
                                  <div className={styles.effectText}>
                                    Effect: <HighlightedText 
                                      text={decision.effect} 
                                      searchTerm={searchTerm}
                                    />
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {item.discussionPoints && item.discussionPoints.length > 0 && (
                        <div className={styles.section}>
                          <h4 className={styles.sectionTitle}>Discussion Points</h4>
                          <ul className={styles.itemList}>
                            {item.discussionPoints.map((point, idx) => (
                              <li key={idx}>
                                <HighlightedText 
                                  text={point} 
                                  searchTerm={searchTerm}
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {item.narrative && (
                        <div className={styles.section}>
                          <h4 className={styles.sectionTitle}>Summary</h4>
                          <p>
                            <HighlightedText 
                              text={item.narrative} 
                              searchTerm={searchTerm}
                            />
                          </p>
                        </div>
                      )}

                      {item.townHallUpdates && (
                        <div className={styles.section}>
                          <h4 className={styles.sectionTitle}>Town Hall Updates</h4>
                          <p>
                            <HighlightedText 
                              text={item.townHallUpdates} 
                              searchTerm={searchTerm}
                            />
                          </p>
                        </div>
                      )}

                      {(item.townHallSummary && item.townHallSummary.trim() !== '') && (
                        <div className={styles.section}>
                          <h4 className={styles.sectionTitle}>Town Hall Summary</h4>
                          <p>
                            <HighlightedText 
                              text={item.townHallSummary} 
                              searchTerm={searchTerm}
                            />
                          </p>
                        </div>
                      )}

                      {item.meetingTopics && item.meetingTopics.length > 0 && (
                        <div className={styles.section}>
                          <h4 className={styles.sectionTitle}>Meeting Topics</h4>
                          <ul className={styles.itemList}>
                            {item.meetingTopics.map((topic, idx) => (
                              <li key={idx}>
                                <HighlightedText 
                                  text={topic} 
                                  searchTerm={searchTerm}
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {item.issues && item.issues.length > 0 && (
                        <div className={styles.section}>
                          <h4 className={styles.sectionTitle}>Issues</h4>
                          <ul className={styles.itemList}>
                            {item.issues.map((issue, idx) => (
                              <li key={idx}>
                                <HighlightedText 
                                  text={issue} 
                                  searchTerm={searchTerm}
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {item.gameRules && item.gameRules.trim() !== '' && (
                        <div className={styles.section}>
                          <h4 className={styles.sectionTitle}>Game Rules</h4>
                          <p>
                            <HighlightedText 
                              text={item.gameRules} 
                              searchTerm={searchTerm}
                            />
                          </p>
                        </div>
                      )}
                      
                      {item.learningPoints && item.learningPoints.length > 0 && (
                        <div className={styles.section}>
                          <h4 className={styles.sectionTitle}>Learning Points</h4>
                          <ul className={styles.itemList}>
                            {item.learningPoints.map((point, idx) => (
                              <li key={idx}>
                                <HighlightedText 
                                  text={point} 
                                  searchTerm={searchTerm}
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tags Section */}
              {hasTags && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Tags</h3>
                  <div className={styles.infoGrid}>
                    {meeting.summary.tags?.topicsCovered && (
                      <div className={styles.infoItem}>
                        <p className={styles.infoLabel}>Topics Covered</p>
                        <p>
                          <HighlightedText 
                            text={meeting.summary.tags.topicsCovered}
                            searchTerm={searchTerm}
                          />
                        </p>
                      </div>
                    )}
                    {meeting.summary.tags?.emotions && (
                      <div className={styles.infoItem}>
                        <p className={styles.infoLabel}>Emotions</p>
                        <p>
                          <HighlightedText 
                            text={meeting.summary.tags.emotions}
                            searchTerm={searchTerm}
                          />
                        </p>
                      </div>
                    )}
                    {meeting.summary.tags?.other && (
                      <div className={styles.infoItem}>
                        <p className={styles.infoLabel}>Other Tags</p>
                        <p>
                          <HighlightedText 
                            text={meeting.summary.tags.other}
                            searchTerm={searchTerm}
                          />
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={styles.modalFooter}>
              <button className={styles.modalCloseButton} onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}