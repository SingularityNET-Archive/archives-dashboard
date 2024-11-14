// pages/api/getMeetingSummaries.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from "../../lib/supabaseClient";

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  const API_KEY = process.env.NEXT_PUBLIC_SERVER_API_KEY;
  const apiKeyHeader = req.headers['api_key'];

  // Handle OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, api_key'); 
    return res.status(200).end();
  }

  if (!apiKeyHeader || apiKeyHeader !== API_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    // Get all the necessary fields
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

    // Set CORS headers for the actual request
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, api_key');

    res.status(200).json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : error 
    });
  }
}