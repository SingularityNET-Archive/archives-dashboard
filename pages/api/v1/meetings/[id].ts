// pages/api/v1/meetings/[id].ts
// GET /api/v1/meetings/:id — a single meeting summary by meeting_id.
import {
  withApi,
  sendData,
  sendError,
  firstParam,
  loadMeetingSummaries,
} from '../../../../lib/meetingSummaries';

export default withApi(async (req, res) => {
  const id = firstParam(req.query.id);
  const { rows, loadedAt } = await loadMeetingSummaries();
  const row = id ? rows.find((r) => r.meeting_id === id) : undefined;

  if (!row) {
    sendError(res, 404, 'not_found', `No meeting found with id ${id ?? ''}`);
    return;
  }

  sendData(res, row, { loadedAt });
});
