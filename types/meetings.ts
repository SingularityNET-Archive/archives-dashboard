// types/meetings.ts
export interface Decision {
  decision: string;
  effect?: string;
  rationale?: string;
  opposing?: string;
  workgroup: string;
  workgroup_id: string;
  date: string;
  meeting_id: string;
}

export interface ActionItem {
  text: string;
  assignee?: string;
  dueDate?: string;
  status: string;
  workgroup: string;
  workgroup_id: string;
  meeting_id: string;
  meetingDate: string;
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
    canceledSummary: boolean;
    canceledSummaryText: string;
    noSummaryGiven: boolean;
    noSummaryGivenText: string;
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
        opposing?: string;
      }>;
      discussion?: string;
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
      workingDocs: { title: string; link: string }[];
      timestampedVideo?: TimestampedVideo;
    };
    tags: {
      topicsCovered: string;
      emotions: string;
      other: string;
      gamesPlayed?: string;
    };
    type: string;
  };
  created_at: string;
  updated_at: string;
  confirmed: boolean;
  workgroup_id: string;
  name: string;
  date: string;
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

// ---------------------------------------------------------------------------
// Search API types (shared by lib/meetingSummaries, the API routes and pages)
// ---------------------------------------------------------------------------

export type SearchTab = 'meetings' | 'actions' | 'decisions';
export type SortOrder = 'asc' | 'desc';

export interface BaseQuery {
  /** Case-insensitive substring search. */
  q?: string;
  /** Matches workgroup_id exactly or the workgroup name case-insensitively. */
  workgroup?: string;
  /** Exact meeting date, YYYY-MM-DD. */
  date?: string;
  /** Inclusive meeting-date range, YYYY-MM-DD. */
  dateFrom?: string;
  dateTo?: string;
  order: SortOrder;
  limit: number;
  offset: number;
}

export interface MeetingQuery extends BaseQuery {
  sort: 'date' | 'updated_at';
  tag?: string;
  type?: string;
  confirmed?: boolean;
  host?: string;
  /** Meetings containing at least one action item assigned to this person. */
  assignee?: string;
}

export interface ActionItemQuery extends BaseQuery {
  sort: 'dueDate' | 'date';
  status?: string;
  assignee?: string;
  /** Exact due date, YYYY-MM-DD. */
  due?: string;
  /** Inclusive due-date range, YYYY-MM-DD. */
  dueFrom?: string;
  dueTo?: string;
}

export interface DecisionQuery extends BaseQuery {
  sort: 'date';
  effect?: string;
}

export interface MeetingSearchResult extends MeetingSummary {
  /** Present only when the query included `q`. */
  matches?: { tags: number; content: number };
}

export interface DecisionStats {
  total: number;
  withRationale: number;
  withEffect: number;
  rationalePercentage: number;
  effectPercentage: number;
}

export interface FacetCount {
  /** Normalised value to send back as a filter parameter. */
  value: string;
  /** Display label. */
  label: string;
  count: number;
}

export interface Facets {
  workgroups: { id: string; name: string; count: number }[];
  statuses: FacetCount[];
  assignees: FacetCount[];
  effects: FacetCount[];
  tags: FacetCount[];
  types: FacetCount[];
}

export interface PageMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  /** ISO timestamp of when the underlying dataset was last loaded from Supabase. */
  loadedAt: string;
}

export interface WorkgroupMonthlyStats {
  workgroups: string[];
  decisions: { current: number[]; last: number[] };
  actions: { current: number[]; last: number[] };
  monthNames: { current: string; last: string };
  totalMeetings: number;
  lastUpdated: string | null;
}
