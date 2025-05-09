// pages/api/getMeetingSummaries.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from "../../lib/supabaseClient";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set cache for 24 hours
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=300, stale-while-revalidate=60'
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
    // Query for confirmed meetings
    const { data: confirmedData, error: confirmedError } = await supabase
      .from('meetingsummaries')
      .select(`
        meeting_id,
        created_at,
        updated_at,
        confirmed,
        summary,
        workgroup_id,
        name,
        date
      `)
      .eq('confirmed', true);

    if (confirmedError) throw confirmedError;

    // Extract keys for confirmed meetings
    const confirmedKeys = new Set(
      (confirmedData || []).map(
        (item) => `${item.workgroup_id}-${item.date}`
      )
    );

    // Query for unconfirmed meetings within the last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const { data: unconfirmedData, error: unconfirmedError } = await supabase
      .from('meetingsummaries')
      .select(`
        meeting_id,
        created_at,
        updated_at,
        confirmed,
        summary,
        workgroup_id,
        name,
        date
      `)
      .eq('confirmed', false)
      .gte('date', threeMonthsAgo.toISOString());

    if (unconfirmedError) throw unconfirmedError;

    // Filter unconfirmed meetings to exclude those with a matching confirmed meeting
    const filteredUnconfirmed = unconfirmedData
      .filter((item) => !confirmedKeys.has(`${item.workgroup_id}-${item.date}`))
      .reduce((acc, curr) => {
        const key = `${curr.workgroup_id}-${curr.date}`;
        if (!acc[key] || new Date(curr.updated_at) > new Date(acc[key].updated_at)) {
          acc[key] = curr;
        }
        return acc;
      }, {} as Record<string,  typeof unconfirmedData[0]>);

    const filteredUnconfirmedArray = Object.values(filteredUnconfirmed);

    // Combine confirmed and filtered unconfirmed data
    const combinedData = [...(confirmedData || []), ...filteredUnconfirmedArray];

    setCorsHeaders(res);
    res.status(200).json(combinedData);
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
