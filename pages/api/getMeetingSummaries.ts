// pages/api/getMeetingSummaries.ts
// Deprecated. Returns the full dataset as a bare array, exactly as before, but
// now requires the server-side API key. Prefer /api/v1/meetings, which supports
// filtering and pagination.
import { withApi, loadMeetingSummaries } from '../../lib/meetingSummaries';

export default withApi(async (_req, res) => {
  res.setHeader('Deprecation', 'true');
  res.setHeader('Link', '</api/v1/meetings>; rel="successor-version"');

  const { rows } = await loadMeetingSummaries();
  res.status(200).json(rows);
});
