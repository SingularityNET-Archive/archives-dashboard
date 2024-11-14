// src/types/meetings.ts
export interface ActionItem {
  text: string;
  assignee: string;
  dueDate: string;
  status: string;
  workgroup: string;
  workgroup_id: string;
}

export interface Decision {
  decision: string;
  effect: string;
  workgroup: string;
  workgroup_id: string;
  date: string;
}

export interface MeetingSummary {
  meeting_id: string;
  summary: {
    workgroup: string; 
    workgroup_id: string;
    agendaItems: Array<{
      actionItems?: Array<{
        text: string;
        assignee: string;
        dueDate: string;
        status: string;
      }>;
      decisionItems?: Array<{
        decision: string;
        effect: string;
      }>;
      discussionPoints?: string[];
      status: string;
    }>;
    meetingInfo: {
      date: string;
      name: string;
      host: string;
      documenter: string;
      peoplePresent: string;
      purpose: string;
      workingDocs: any[];
      timestampedVideo: Record<string, any>;
    };
    tags: {
      topicsCovered: string;
      emotions: string;
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
  dateRange: {
    start: string;
    end: string;
  };
}