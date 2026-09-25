// lib/meetingSummaries/loader.ts
// Server-only. Loads the full meeting-summaries dataset from Supabase, pages
// past PostgREST's row cap, applies the confirmed/unconfirmed dedupe rules, and
// caches the result in memory for a few minutes.
import supabase from '../supabaseClient';
import type { MeetingSummary } from '../../types/meetings';

const TABLE = 'meetingsummaries';
const SELECT = 'meeting_id, created_at, updated_at, confirmed, summary, workgroup_id, name, date';
const PAGE_SIZE = 1000;
const MAX_PAGES = 500;
const TTL_MS = 5 * 60 * 1000;
const UNCONFIRMED_WINDOW_MONTHS = 3;

export interface LoadResult {
  rows: MeetingSummary[];
  /** ISO timestamp of when these rows were fetched. */
  loadedAt: string;
}

type PageResponse = PromiseLike<{
  data: unknown[] | null;
  error: { message?: string } | null;
}>;

/**
 * Fetch every row of a query by walking `.range()` windows until an empty page
 * comes back. Advancing by the number of rows actually returned (rather than by
 * PAGE_SIZE) keeps this correct even if the project's max-rows setting is lower
 * than PAGE_SIZE.
 */
async function fetchAllPages(build: (from: number, to: number) => PageResponse): Promise<MeetingSummary[]> {
  const rows: MeetingSummary[] = [];
  let from = 0;

  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await build(from, from + PAGE_SIZE - 1);
    if (error) {
      throw new Error(error.message || 'Supabase query failed');
    }

    const batch = (data ?? []) as MeetingSummary[];
    if (batch.length === 0) break;

    rows.push(...batch);
    from += batch.length;
  }

  return rows;
}

const dedupeKey = (row: MeetingSummary) => `${row.workgroup_id}-${row.date}`;

async function loadFresh(): Promise<LoadResult> {
  const confirmed = await fetchAllPages((from, to) =>
    supabase
      .from(TABLE)
      .select(SELECT)
      .eq('confirmed', true)
      .order('date', { ascending: false, nullsFirst: false })
      .order('meeting_id', { ascending: true })
      .range(from, to)
  );

  const windowStart = new Date();
  windowStart.setMonth(windowStart.getMonth() - UNCONFIRMED_WINDOW_MONTHS);

  const unconfirmed = await fetchAllPages((from, to) =>
    supabase
      .from(TABLE)
      .select(SELECT)
      .eq('confirmed', false)
      .gte('date', windowStart.toISOString())
      .order('date', { ascending: false, nullsFirst: false })
      .order('meeting_id', { ascending: true })
      .range(from, to)
  );

  // Unconfirmed rows are only shown when there is no confirmed row for the same
  // workgroup + date, and only the most recently updated one per key survives.
  const confirmedKeys = new Set(confirmed.map(dedupeKey));
  const latestUnconfirmed = new Map<string, MeetingSummary>();

  for (const row of unconfirmed) {
    const key = dedupeKey(row);
    if (confirmedKeys.has(key)) continue;

    const existing = latestUnconfirmed.get(key);
    if (!existing || Date.parse(row.updated_at) > Date.parse(existing.updated_at)) {
      latestUnconfirmed.set(key, row);
    }
  }

  // Dedupe by meeting_id as well, in case a row was inserted between pages.
  const byId = new Map<string, MeetingSummary>();
  for (const row of [...confirmed, ...latestUnconfirmed.values()]) {
    byId.set(row.meeting_id, row);
  }

  return { rows: Array.from(byId.values()), loadedAt: new Date().toISOString() };
}

let cache: LoadResult | null = null;
let inflight: Promise<LoadResult> | null = null;

/**
 * Returns the cached dataset when it is fresh. When it is stale the stale copy
 * is returned immediately and a refresh runs in the background. When there is
 * no cache yet, the caller waits for the load. Concurrent callers share a
 * single in-flight request.
 */
export async function loadMeetingSummaries(opts: { force?: boolean } = {}): Promise<LoadResult> {
  const isFresh = cache !== null && Date.now() - Date.parse(cache.loadedAt) < TTL_MS;

  if (isFresh && !opts.force) {
    return cache as LoadResult;
  }

  if (!inflight) {
    inflight = loadFresh()
      .then((result) => {
        cache = result;
        return result;
      })
      .finally(() => {
        inflight = null;
      });
  }

  if (cache && !opts.force) {
    // Stale-while-revalidate: serve what we have, refresh in the background.
    inflight.catch((err) => console.error('Meeting summaries refresh failed:', err));
    return cache;
  }

  return inflight;
}

/** Drops the in-memory cache. Mainly useful for tests. */
export function clearMeetingSummariesCache(): void {
  cache = null;
}
