// lib/searchCache.ts
// Browser-side cache for the /search page: the SWR fetcher, the SWR options and
// a cache provider that persists Action Items / Decisions pages to localStorage.
// Client-safe: must not import anything from lib/meetingSummaries.
import type { Cache, SWRConfiguration } from 'swr';
import type { CachedSearch, SearchPayload } from '../types/meetings';
import { SEARCH_API_PATH } from '../utils/urlParams';

/** A cached page younger than this is shown as-is; older pages are shown and refreshed in the background. */
export const FRESH_MS = 60_000;
/** Persisted pages older than this are not restored from localStorage. */
const PERSIST_TTL_MS = 30 * 60_000;
const STORAGE_KEY = 'archives:search-cache:v1';
const STORAGE_VERSION = 1;
const MAX_PERSISTED_ENTRIES = 12;
const MAX_PERSISTED_CHARS = 1_500_000;
const PERSIST_DEBOUNCE_MS = 1000;
const KEY_PREFIX = `${SEARCH_API_PATH}?`;

export class SearchFetchError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'SearchFetchError';
    this.status = status;
  }
}

export const isFresh = (entry: CachedSearch | undefined): boolean =>
  entry !== undefined && Date.now() - entry.fetchedAt < FRESH_MS;

// One request per key at a time, so an idle prefetch and a click on the same
// tab share a single round trip.
const inflight = new Map<string, Promise<CachedSearch>>();

export function fetchSearch(key: string): Promise<CachedSearch> {
  const existing = inflight.get(key);
  if (existing) return existing;

  const request = (async (): Promise<CachedSearch> => {
    const res = await fetch(key, { headers: { accept: 'application/json' } });
    let payload: SearchPayload | null = null;
    try {
      payload = (await res.json()) as SearchPayload;
    } catch {
      payload = null;
    }
    if (!res.ok || !payload || payload.error) {
      throw new SearchFetchError(payload?.error ?? 'Could not load results. Please try again.', res.status);
    }
    return { ...payload, fetchedAt: Date.now() };
  })().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, request);
  return request;
}

// ---------------------------------------------------------------------------
// Cache provider with localStorage persistence
// ---------------------------------------------------------------------------

type State = { data?: CachedSearch; error?: unknown; isValidating?: boolean; isLoading?: boolean };

// Module-level so the cache survives client-side navigation away from and back
// to /search within a session.
const memory = new Map<string, State>();
let persistTimer: ReturnType<typeof setTimeout> | undefined;
let persistDisabled = false;
let listenersInstalled = false;

const storage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const isQuotaError = (err: unknown): boolean => {
  const name = (err as { name?: string } | null)?.name;
  return name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED';
};

// Meetings pages carry 100 full summaries (hundreds of KB or more each) and
// would blow through the ~5 MB origin quota; they stay in memory only.
const isPersistable = (key: string, data: CachedSearch | undefined): data is CachedSearch =>
  key.startsWith(KEY_PREFIX) && data !== undefined && data.error === null && data.tab !== 'meetings';

const isCachedSearch = (value: unknown): value is CachedSearch => {
  const v = value as Partial<CachedSearch> | null;
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof v.fetchedAt === 'number' &&
    typeof v.tab === 'string' &&
    typeof v.filters === 'object' &&
    typeof v.results === 'object' &&
    v.results !== null &&
    typeof v.results.kind === 'string' &&
    typeof v.facets === 'object' &&
    typeof v.meta === 'object'
  );
};

function persistNow(): void {
  persistTimer = undefined;
  if (persistDisabled) return;
  const store = storage();
  if (!store) return;

  const entries: [string, CachedSearch][] = [];
  for (const [key, state] of memory) {
    if (isPersistable(key, state.data)) entries.push([key, state.data]);
  }
  entries.sort((a, b) => b[1].fetchedAt - a[1].fetchedAt);

  const kept: [string, CachedSearch][] = [];
  let chars = 0;
  for (const entry of entries) {
    if (kept.length >= MAX_PERSISTED_ENTRIES) break;
    chars += JSON.stringify(entry[1]).length;
    if (chars > MAX_PERSISTED_CHARS) break;
    kept.push(entry);
  }

  const write = (list: [string, CachedSearch][]) =>
    store.setItem(STORAGE_KEY, JSON.stringify({ v: STORAGE_VERSION, entries: list }));

  try {
    write(kept);
    return;
  } catch (err) {
    if (!isQuotaError(err)) {
      persistDisabled = true;
      return;
    }
  }

  // Out of room: keep only the newest half, then give up for this session.
  try {
    write(kept.slice(0, Math.floor(kept.length / 2)));
  } catch {
    try {
      store.removeItem(STORAGE_KEY);
    } catch {
      // Nothing more to do; the in-memory cache still works.
    }
    persistDisabled = true;
  }
}

/** Writes any pending cache changes to localStorage right away. */
export function flushPersist(): void {
  if (persistTimer === undefined) return;
  clearTimeout(persistTimer);
  persistNow();
}

function installListeners(): void {
  if (listenersInstalled || typeof window === 'undefined') return;
  listenersInstalled = true;
  window.addEventListener('pagehide', flushPersist);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPersist();
  });
}

function schedulePersist(): void {
  if (persistDisabled) return;
  installListeners();
  if (persistTimer !== undefined) clearTimeout(persistTimer);
  persistTimer = setTimeout(persistNow, PERSIST_DEBOUNCE_MS);
}

const clientCache: Cache<CachedSearch> = {
  keys: () => memory.keys(),
  get: (key) => memory.get(key),
  set: (key, value) => {
    const prev = memory.get(key);
    memory.set(key, value);
    // SWR routes every state change (isValidating toggles included) through
    // here; only a new payload is worth writing to disk.
    if (value.data !== prev?.data && isPersistable(key, value.data)) schedulePersist();
  },
  delete: (key) => {
    memory.delete(key);
  },
};

/**
 * SWR cache provider: a throwaway Map per server render, one shared persisted
 * cache in the browser. Persisted entries are NOT loaded here; see
 * restorePersistedEntries, which must run after hydration.
 */
export const searchCacheProvider = (): Cache<CachedSearch> =>
  typeof window === 'undefined' ? new Map() : clientCache;

/**
 * Loads persisted pages into the in-memory cache. Call from an effect, after
 * hydration: SWR prefers cached data over fallbackData, so restoring before the
 * first client render could make it differ from the server-rendered HTML.
 * `skipKey` (the server-rendered page) is left to the fresh server payload.
 */
export function restorePersistedEntries(skipKey: string): void {
  const store = storage();
  if (!store) return;

  let raw: string | null = null;
  try {
    raw = store.getItem(STORAGE_KEY);
  } catch {
    return;
  }
  if (!raw) return;

  let parsed: { v?: unknown; entries?: unknown } | null = null;
  try {
    parsed = JSON.parse(raw) as { v?: unknown; entries?: unknown };
  } catch {
    parsed = null;
  }
  if (!parsed || parsed.v !== STORAGE_VERSION || !Array.isArray(parsed.entries)) {
    try {
      store.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    return;
  }

  const cutoff = Date.now() - PERSIST_TTL_MS;
  for (const entry of parsed.entries as unknown[]) {
    if (!Array.isArray(entry) || entry.length !== 2) continue;
    const [key, data] = entry as [unknown, unknown];
    if (typeof key !== 'string' || !isCachedSearch(data)) continue;
    if (key === skipKey || data.fetchedAt < cutoff || memory.get(key)?.data) continue;
    memory.set(key, { data });
  }
}

export const SWR_OPTIONS: SWRConfiguration<CachedSearch, SearchFetchError> = {
  // Keep the previous tab on screen (dimmed) while an uncached tab loads.
  keepPreviousData: true,
  // Never auto-refetch a key that already has data. The page decides when a
  // cached page is old enough to refresh, using `fetchedAt`.
  revalidateIfStale: false,
  // One silent refresh when the user comes back to a long-open tab, at most
  // once per server cache window.
  revalidateOnFocus: true,
  focusThrottleInterval: 5 * 60_000,
  revalidateOnReconnect: true,
  errorRetryCount: 3,
  onErrorRetry: (err, _key, _config, revalidate, { retryCount }) => {
    // 400 means the URL itself is invalid; retrying cannot help.
    if (err.status === 400 || retryCount >= 3) return;
    setTimeout(() => void revalidate({ retryCount }), 1000 * 2 ** retryCount);
  },
};

export const SWR_CONFIG = { provider: searchCacheProvider };
