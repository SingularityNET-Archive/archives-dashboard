// pages/api/getMeetingSummaries.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from "../../lib/supabaseClient";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set cache for 24 hours
  // s-maxage is for CDN caching
  // stale-while-revalidate allows serving stale content while fetching fresh data
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=86400, stale-while-revalidate=43200'
  );

  const API_KEY = process.env.NEXT_PUBLIC_SERVER_API_KEY;
  const apiKeyHeader = req.headers['api_key'];

  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(200).end();
  }

  if (!apiKeyHeader || apiKeyHeader !== API_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { data, error } = await supabase
      .from('meetingsummaries')
      .select(`
        meeting_id,
        created_at,
        updated_at,
        confirmed,
        summary,
        workgroup_id,
        name
      `)
      .eq('confirmed', true);

    if (error) throw error;
    if (!data) {
      throw new Error('No data received from database');
    }

    setCorsHeaders(res);
    res.status(200).json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : error 
    });
  }
}

function setCorsHeaders(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, api_key');
}