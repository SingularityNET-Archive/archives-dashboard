// pages/api/v1/action-items.ts
// GET /api/v1/action-items — flattened action items across all meetings.
import {
  withApi,
  sendData,
  parseActionItemQuery,
  loadMeetingSummaries,
  flattenActionItems,
  filterActionItems,
  paginate,
} from '../../../lib/meetingSummaries';

export default withApi(async (req, res) => {
  const params = parseActionItemQuery(req.query);
  const { rows, loadedAt } = await loadMeetingSummaries();
  const filtered = filterActionItems(flattenActionItems(rows), params);
  const { data, ...page } = paginate(filtered, params.limit, params.offset);
  sendData(res, data, { ...page, loadedAt });
});
