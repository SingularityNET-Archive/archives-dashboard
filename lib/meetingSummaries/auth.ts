// lib/meetingSummaries/auth.ts
import { timingSafeEqual } from 'crypto';
import type { NextApiRequest } from 'next';

export type AuthResult =
  | { ok: true }
  | {
      ok: false;
      status: 401 | 403 | 500;
      code: 'missing_api_key' | 'invalid_api_key' | 'server_misconfigured';
      message: string;
    };

const headerValue = (req: NextApiRequest, name: string): string | undefined => {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
};

/**
 * Reads the API key from, in order: `x-api-key`, `Authorization: Bearer`, or
 * the legacy `api_key` header used by the original route.
 */
export function extractApiKey(req: NextApiRequest): string | undefined {
  const direct = headerValue(req, 'x-api-key');
  if (direct) return direct.trim();

  const authorization = headerValue(req, 'authorization');
  if (authorization) {
    const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
    if (match) return match[1].trim();
  }

  const legacy = headerValue(req, 'api_key');
  if (legacy) return legacy.trim();

  return undefined;
}

export function requireApiKey(req: NextApiRequest): AuthResult {
  const expected = process.env.SERVER_API_KEY;
  if (!expected) {
    return {
      ok: false,
      status: 500,
      code: 'server_misconfigured',
      message: 'SERVER_API_KEY is not configured on the server',
    };
  }

  const supplied = extractApiKey(req);
  if (!supplied) {
    return {
      ok: false,
      status: 401,
      code: 'missing_api_key',
      message: 'Provide an API key in the x-api-key header or as a Bearer token',
    };
  }

  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, status: 403, code: 'invalid_api_key', message: 'Invalid API key' };
  }

  return { ok: true };
}
