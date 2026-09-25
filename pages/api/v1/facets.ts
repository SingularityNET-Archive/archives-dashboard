// pages/api/v1/facets.ts
// GET /api/v1/facets — the distinct values available for each filter.
import {
  withApi,
  sendData,
  loadMeetingSummaries,
  buildFacets,
} from '../../../lib/meetingSummaries';

export default withApi(async (_req, res) => {
  const { rows, loadedAt } = await loadMeetingSummaries();
  sendData(res, buildFacets(rows), { loadedAt });
});
