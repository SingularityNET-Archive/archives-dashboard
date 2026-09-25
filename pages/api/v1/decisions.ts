// pages/api/v1/decisions.ts
// GET /api/v1/decisions — flattened decisions across all meetings.
import {
  withApi,
  sendData,
  parseDecisionQuery,
  loadMeetingSummaries,
  flattenDecisions,
  filterDecisions,
  decisionStats,
  paginate,
} from '../../../lib/meetingSummaries';

export default withApi(async (req, res) => {
  const params = parseDecisionQuery(req.query);
  const { rows, loadedAt } = await loadMeetingSummaries();
  const filtered = filterDecisions(flattenDecisions(rows), params);
  const { data, ...page } = paginate(filtered, params.limit, params.offset);
  sendData(res, data, { ...page, loadedAt, stats: decisionStats(filtered) });
});
