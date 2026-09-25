// lib/meetingSummaries/index.ts
// Server-only barrel. Do not import this from client components; import it
// only inside API routes or getServerSideProps.
export { loadMeetingSummaries, clearMeetingSummariesCache } from './loader';
export type { LoadResult } from './loader';
export {
  filterMeetings,
  flattenActionItems,
  filterActionItems,
  flattenDecisions,
  filterDecisions,
  decisionStats,
  buildFacets,
  paginate,
} from './search';
export type { Page } from './search';
export { buildWorkgroupMonthlyStats } from './stats';
export {
  ParamError,
  parseMeetingQuery,
  parseActionItemQuery,
  parseDecisionQuery,
  LIMIT_DEFAULT,
  LIMIT_MAX,
} from './params';
export type { RawQuery, ParseOptions } from './params';
export { requireApiKey, extractApiKey } from './auth';
export type { AuthResult } from './auth';
export { withApi, setCors, sendData, sendError, firstParam } from './http';
