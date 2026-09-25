// pages/api/search.ts
// GET /api/search — internal, same-origin endpoint behind the /search page. It
// returns exactly the payload getServerSideProps renders, so the browser can
// switch tabs, page and filter without a full page-data round trip.
//
// Not part of the public /api/v1 contract: no API key (the same data is already
// public in the server-rendered HTML), no CORS headers (same-origin only) and
// no versioning guarantees. Deliberately not wrapped in withApi.
import type { NextApiRequest, NextApiResponse } from 'next';
import type { SearchPayload } from '../../types/meetings';
import { runSearch, failurePayload, LOAD_ERROR_MESSAGE } from '../../lib/meetingSummaries/searchPage';

export default async function handler(req: NextApiRequest, res: NextApiResponse<SearchPayload>) {
  // Same policy as the page and the v1 routes: Netlify's CDN keys its cache
  // without query params, so a shared cache would serve one tab for another.
  // The browser keeps its own cache (lib/searchCache.ts).
  res.setHeader('Cache-Control', 'private, no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).end();
    return;
  }

  try {
    const payload = await runSearch(req.query);
    res.status(payload.error ? 400 : 200).json(payload);
  } catch (err) {
    console.error('Failed to load meeting summaries:', err);
    res.status(503).json(failurePayload(req.query, LOAD_ERROR_MESSAGE));
  }
}
