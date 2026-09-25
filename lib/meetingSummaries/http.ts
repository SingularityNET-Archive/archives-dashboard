// lib/meetingSummaries/http.ts
import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { requireApiKey } from './auth';
import { ParamError } from './params';

export function setCors(res: NextApiResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'x-api-key, authorization, api_key, content-type, accept');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export function sendData<T>(res: NextApiResponse, data: T, meta: Record<string, unknown> = {}, status = 200): void {
  res.status(status).json({ data, meta });
}

export function sendError(res: NextApiResponse, status: number, code: string, message: string): void {
  res.status(status).json({ error: { code, message } });
}

export const firstParam = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;

/**
 * Wraps an API handler with CORS, method checking, API-key auth and uniform
 * error handling.
 *
 * Responses are marked `private, no-store`. The routes are key-protected, and a
 * shared CDN cache keyed only on the URL would otherwise hand a cached 200 to a
 * caller without a key. The loader keeps its own in-memory cache instead.
 */
export function withApi(handler: ApiHandler): NextApiHandler {
  return async (req, res) => {
    setCors(res);
    res.setHeader('Cache-Control', 'private, no-store');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET, OPTIONS');
      sendError(res, 405, 'method_not_allowed', `Method ${req.method ?? ''} is not allowed`);
      return;
    }

    const auth = requireApiKey(req);
    if (!auth.ok) {
      sendError(res, auth.status, auth.code, auth.message);
      return;
    }

    try {
      await handler(req, res);
    } catch (err) {
      if (err instanceof ParamError) {
        sendError(res, err.status, err.code, err.message);
        return;
      }
      console.error(`API error on ${req.url ?? 'unknown route'}:`, err);
      sendError(res, 500, 'internal_error', 'An unexpected error occurred');
    }
  };
}
