// lib/meetingSummaries/params.ts
// Parses and validates raw query strings into typed query objects. Every
// validation failure throws ParamError, which the API wrapper turns into a 400.
import type {
  ActionItemQuery,
  BaseQuery,
  DecisionQuery,
  MeetingQuery,
  SortOrder,
} from '../../types/meetings';

export type RawQuery = Partial<Record<string, string | string[]>>;

export class ParamError extends Error {
  readonly status = 400;
  readonly code = 'invalid_param';

  constructor(message: string) {
    super(message);
    this.name = 'ParamError';
  }
}

export const LIMIT_DEFAULT = 50;
export const LIMIT_MAX = 500;
const OFFSET_MAX = 1_000_000;
const STRING_MAX = 200;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const SORT_ORDERS: readonly SortOrder[] = ['asc', 'desc'];

export interface ParseOptions {
  /** Default page size when `limit` is absent. */
  limitDefault?: number;
}

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

function str(q: RawQuery, key: string, maxLen = STRING_MAX): string | undefined {
  const raw = first(q[key]);
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== 'string') throw new ParamError(`${key} must be a string`);

  const value = raw.trim();
  if (!value) return undefined;
  if (value.length > maxLen) throw new ParamError(`${key} must be at most ${maxLen} characters`);
  return value;
}

function int(q: RawQuery, key: string, def: number, min: number, max: number): number {
  const value = str(q, key);
  if (value === undefined) return def;
  if (!/^-?\d+$/.test(value)) throw new ParamError(`${key} must be an integer between ${min} and ${max}`);

  const n = Number(value);
  if (n < min || n > max) throw new ParamError(`${key} must be an integer between ${min} and ${max}`);
  return n;
}

function dateKeyParam(q: RawQuery, key: string): string | undefined {
  const value = str(q, key);
  if (value === undefined) return undefined;

  const invalid = new ParamError(`${key} must be a valid date in YYYY-MM-DD format`);
  if (!DATE_KEY.test(value)) throw invalid;

  const parsed = new Date(`${value}T00:00:00Z`);
  if (isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw invalid;
  return value;
}

function enumParam<T extends string>(q: RawQuery, key: string, allowed: readonly T[], def: T): T {
  const value = str(q, key);
  if (value === undefined) return def;
  if (!allowed.includes(value as T)) throw new ParamError(`${key} must be one of: ${allowed.join(', ')}`);
  return value as T;
}

function boolParam(q: RawQuery, key: string): boolean | undefined {
  const value = str(q, key)?.toLowerCase();
  if (value === undefined) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new ParamError(`${key} must be true or false`);
}

function checkRange(fromKey: string, from: string | undefined, toKey: string, to: string | undefined): void {
  if (from && to && from > to) throw new ParamError(`${fromKey} must be on or before ${toKey}`);
}

function parseBase(q: RawQuery, opts: ParseOptions): BaseQuery {
  const dateFrom = dateKeyParam(q, 'dateFrom');
  const dateTo = dateKeyParam(q, 'dateTo');
  checkRange('dateFrom', dateFrom, 'dateTo', dateTo);

  return {
    q: str(q, 'q'),
    workgroup: str(q, 'workgroup'),
    date: dateKeyParam(q, 'date'),
    dateFrom,
    dateTo,
    order: enumParam(q, 'order', SORT_ORDERS, 'desc'),
    limit: int(q, 'limit', opts.limitDefault ?? LIMIT_DEFAULT, 1, LIMIT_MAX),
    offset: int(q, 'offset', 0, 0, OFFSET_MAX),
  };
}

export function parseMeetingQuery(q: RawQuery, opts: ParseOptions = {}): MeetingQuery {
  return {
    ...parseBase(q, opts),
    sort: enumParam(q, 'sort', ['date', 'updated_at'] as const, 'date'),
    tag: str(q, 'tag'),
    type: str(q, 'type'),
    confirmed: boolParam(q, 'confirmed'),
    host: str(q, 'host'),
    assignee: str(q, 'assignee'),
  };
}

export function parseActionItemQuery(q: RawQuery, opts: ParseOptions = {}): ActionItemQuery {
  const dueFrom = dateKeyParam(q, 'dueFrom');
  const dueTo = dateKeyParam(q, 'dueTo');
  checkRange('dueFrom', dueFrom, 'dueTo', dueTo);

  return {
    ...parseBase(q, opts),
    sort: enumParam(q, 'sort', ['dueDate', 'date'] as const, 'dueDate'),
    status: str(q, 'status'),
    assignee: str(q, 'assignee'),
    due: dateKeyParam(q, 'due'),
    dueFrom,
    dueTo,
  };
}

export function parseDecisionQuery(q: RawQuery, opts: ParseOptions = {}): DecisionQuery {
  return {
    ...parseBase(q, opts),
    sort: enumParam(q, 'sort', ['date'] as const, 'date'),
    effect: str(q, 'effect'),
  };
}
