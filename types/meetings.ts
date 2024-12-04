// src/types/meetings.ts
export interface Decision {
  decision: string;
  effect?: string;
  rationale?: string;  // Add this line
  workgroup: string;
  workgroup_id: string;
  date: string;
}

export interface ActionItem {
  text: string;
  assignee?: string;
  dueDate?: string;
  status: string;
  workgroup: string;
  workgroup_id: string;
}

export interface TimestampedVideoSection {
  title?: string;
  content?: string;
}

interface TimestampedVideo {
  intro?: string;
  url?: string;
  timestamps?: string;
  sections?: TimestampedVideoSection[];
}

export interface MeetingSummary {
  meeting_id: string;
  summary: {
    workgroup: string; 
    workgroup_id: string;
    agendaItems: Array<{
      agenda?: string;
      actionItems?: Array<{
        text: string;
        assignee: string;
        dueDate: string;
        status: string;
      }>;
      decisionItems?: Array<{
        decision: string;
        effect: string;
        rationale?: string;
      }>;
      discussionPoints?: string[];
      narrative: string;
      townHallUpdates: string;
      townHallSummary: string;
      meetingTopics: string[];
      issues: string[];
      gameRules: string;
      learningPoints: string[];
      status: string;
    }>;
    meetingInfo: {
      date: string;
      name: string;
      host: string;
      documenter: string;
      peoplePresent: string;
      purpose: string;
      townHallNumber: string;
      googleSlides: string;
      meetingVideoLink: string;
      miroBoardLink: string;
      otherMediaLink: string;
      transcriptLink: string;
      mediaLink: string;
      workingDocs: any[];
      timestampedVideo?: TimestampedVideo;
    };
    tags: {
      topicsCovered: string;
      emotions: string;
      other: string;
    };
    type: string;
  };
  created_at: string;
  updated_at: string;
  confirmed: boolean;
  workgroup_id: string;
  name: string;
}

export interface FilterState {
  workgroup: string;
  status: string;
  search: string;
  date: string;
  dateRange: { start: string; end: string };
  assignee: string;
  effect: string;
}