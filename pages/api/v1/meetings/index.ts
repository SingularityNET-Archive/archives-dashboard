// pages/api/v1/meetings/index.ts
// GET /api/v1/meetings — search and filter meeting summaries.
import {
  withApi,
  sendData,
  parseMeetingQuery,
  loadMeetingSummaries,
  filterMeetings,
  paginate,
} from '../../../../lib/meetingSummaries';

export default withApi(async (req, res) => {
  const params = parseMeetingQuery(req.query);
  const { rows, loadedAt } = await loadMeetingSummaries();
  const { data, ...page } = paginate(filterMeetings(rows, params), params.limit, params.offset);
  sendData(res, data, { ...page, loadedAt });
});
