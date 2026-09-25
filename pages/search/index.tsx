// pages/search/index.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import useSWR, { SWRConfig, useSWRConfig } from 'swr';
import type { CachedSearch, FilterState, SearchPayload, SearchTab } from '../../types/meetings';
import { runSearch, failurePayload, LOAD_ERROR_MESSAGE } from '../../lib/meetingSummaries/searchPage';
import SearchBar from '../../components/filters/SearchBar';
import WorkgroupFilter from '../../components/filters/WorkgroupFilter';
import StatusFilter from '../../components/filters/StatusFilter';
import DateFilter from '../../components/filters/DateFilter';
import AssigneeFilter from '../../components/filters/AssigneeFilter';
import EffectFilter from '../../components/filters/EffectFilter';
import DecisionsTable from '../../components/tables/DecisionsTable';
import ActionItemsTable from '../../components/tables/ActionItemsTable';
import MeetingsTable from '../../components/tables/MeetingsTable';
import HowToModal from '../../components/modals/HowToModal';
import {
  getFilterStateFromUrl,
  updateUrlWithFilters,
  pushTab,
  cancelPendingPush,
  parseTab,
  parseOffset,
  pushOffset,
  buildSearchApiUrl,
  filtersEqual,
  clearedForTab,
} from '../../utils/urlParams';
import {
  fetchSearch,
  isFresh,
  restorePersistedEntries,
  SWR_CONFIG,
  SWR_OPTIONS,
  type SearchFetchError,
} from '../../lib/searchCache';
import { formatDateTime } from '../../utils/dateFormatting';
import styles from '../../styles/search.module.css';

const TABS: readonly SearchTab[] = ['meetings', 'actions', 'decisions'];

export type SearchPageProps = SearchPayload;

/**
 * Server-renders the first request (and deep links). Every later tab switch,
 * filter edit or page change is a shallow URL update: the page then reads its
 * state from the URL and gets results from /api/search through a client-side
 * cache (lib/searchCache.ts), so this does not run again.
 */
export const getServerSideProps: GetServerSideProps<SearchPageProps> = async ({ query, res }) => {
  // No shared cache: Netlify's Next.js runtime keys its CDN cache without the
  // page's own query params (see the Netlify-Vary header it emits), so a
  // cached `?tab=meetings` response would be served for `?tab=decisions`. The
  // rows are already cached in memory by loadMeetingSummaries, so each request
  // only pays for filtering. Same policy as lib/meetingSummaries/http.ts.
  res.setHeader('Cache-Control', 'private, no-store');

  try {
    return { props: await runSearch(query) };
  } catch (err) {
    console.error('Failed to load meeting summaries:', err);
    return { props: failurePayload(query, LOAD_ERROR_MESSAGE) };
  }
};

export default function SearchPage(props: SearchPageProps) {
  // Page-scoped SWR config: the persisted cache provider only applies here.
  return (
    <SWRConfig value={SWR_CONFIG}>
      <SearchPageInner {...props} />
    </SWRConfig>
  );
}

function SearchPageInner(props: SearchPageProps) {
  const router = useRouter();
  const { cache, mutate } = useSWRConfig();

  // The URL is the source of truth. This holds whether a navigation was a
  // shallow push from this page or a full one (Back to the first entry re-runs
  // getServerSideProps): both end up in router.query.
  const { urlTab, urlFilters, urlOffset } = useMemo(
    () => ({
      urlTab: parseTab(router.query.tab),
      urlFilters: getFilterStateFromUrl(router.query),
      urlOffset: parseOffset(router.query.offset),
    }),
    // router.query is a fresh object on every render; asPath is the stable
    // identity of what it contains.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.asPath]
  );
  const key = buildSearchApiUrl(urlTab, urlFilters, urlOffset);

  // The server payload. Next spreads pageProps into a new object on every
  // render, but the payload inside only changes when getServerSideProps ran.
  const ssrKey = buildSearchApiUrl(props.tab, props.filters, props.meta.offset);
  const ssrFallback: CachedSearch = { ...props, fetchedAt: 0 };

  const {
    data,
    error: fetchError,
    isLoading,
    isValidating,
    mutate: revalidate,
  } = useSWR<CachedSearch, SearchFetchError>(key, fetchSearch, {
    ...SWR_OPTIONS,
    fallbackData: key === ssrKey ? ssrFallback : undefined,
  });
  const view: SearchPayload = data ?? ssrFallback;

  const [filters, setFilters] = useState<FilterState>(props.filters);
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // True while a filter edit made on this page is waiting for its URL push.
  // Prevents the URL from overwriting what the user is still typing.
  const isUserAction = useRef(false);

  // Restore persisted pages (after hydration, see restorePersistedEntries) and
  // seed the cache with the server payload. If the server render failed, retry
  // from the client instead.
  useEffect(() => {
    restorePersistedEntries(ssrKey);
    if (props.error) {
      void revalidate();
      return;
    }
    void mutate(ssrKey, { ...props, fetchedAt: Date.now() }, { revalidate: false });
    // Re-run only when getServerSideProps produced a new payload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.results]);

  // A cached page (in memory, restored or prefetched) is shown at once; when it
  // is old, refresh it silently in the background. Uncached keys are fetched by
  // SWR itself.
  useEffect(() => {
    const cached = cache.get(key)?.data as CachedSearch | undefined;
    if (cached && !isFresh(cached)) void revalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Adopt the URL's filters on back/forward navigation or an external URL
  // change. While a local edit is pending, only clear the pending flag once our
  // own push has landed; never overwrite what the user is typing.
  useEffect(() => {
    if (isUserAction.current) {
      if (filtersEqual(urlFilters, filtersRef.current)) isUserAction.current = false;
      return;
    }
    setFilters((prev) => (filtersEqual(prev, urlFilters) ? prev : urlFilters));
  }, [urlFilters]);

  // Push local filter edits to the URL (debounced). Typing back to the URL's
  // current value needs no push at all.
  useEffect(() => {
    if (!isUserAction.current) return;
    if (filtersEqual(filters, urlFilters)) {
      cancelPendingPush();
      isUserAction.current = false;
      return;
    }
    updateUrlWithFilters(router, filters, urlTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Leaving the page: a pending filter push must not fire mid-navigation and
  // yank the user back here.
  useEffect(() => {
    const start = (url: string) => {
      if (new URL(url, window.location.origin).pathname !== router.pathname) {
        cancelPendingPush();
      }
    };
    router.events.on('routeChangeStart', start);
    return () => {
      router.events.off('routeChangeStart', start);
    };
  }, [router.events, router.pathname]);

  // A debounced push must not outlive this page.
  useEffect(() => () => cancelPendingPush(), []);

  // Next only keeps Back/Forward shallow when both history entries were pushed
  // shallowly. The server-rendered entry was not, so re-write it as shallow
  // once; otherwise returning to it re-runs getServerSideProps, and the next
  // Forward does too.
  useEffect(() => {
    void router.replace(router.asPath, undefined, { shallow: true, scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once the current page has settled, warm the other two tabs while idle so
  // the first switch is instant too. Keys mirror what a tab click produces.
  useEffect(() => {
    if (isLoading || fetchError) return;
    if ((navigator as { connection?: { saveData?: boolean } }).connection?.saveData) return;

    const prefetch = () => {
      for (const other of TABS) {
        if (other === urlTab) continue;
        const otherKey = buildSearchApiUrl(other, clearedForTab(urlFilters), 0);
        if (cache.get(otherKey)?.data) continue;
        mutate(otherKey, fetchSearch(otherKey), { revalidate: false }).catch(() => {
          // A failed prefetch is not an error the user needs to see; the tab
          // will fetch normally when clicked.
        });
      }
    };

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(prefetch, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(prefetch, 300);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, isLoading, fetchError]);

  const handleFilterChange = useCallback((updates: Partial<FilterState>) => {
    isUserAction.current = true;
    setFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleTabChange = (tab: SearchTab) => {
    if (tab === urlTab) return;

    const cleared = clearedForTab(filters);

    // Not a typing edit: keeps the filters effect from scheduling a second,
    // debounced push for the same change.
    isUserAction.current = false;
    setFilters(cleared);
    pushTab(router, cleared, tab);
  };

  const goToOffset = (offset: number) => pushOffset(router, Math.max(0, offset));

  const { results, facets, meta } = view;
  const errorMessage = fetchError?.message ?? view.error;
  const isRefreshing = isValidating && !isLoading;
  const showingFrom = meta.total === 0 ? 0 : meta.offset + 1;
  const showingTo = meta.offset + results.items.length;
  // Highlight with the term the rows on screen were searched with.
  const searchTerm = view.filters.search;

  return (
    <div className={styles.searchPage}>
      <div className={styles.filtersSection}>
        <div className={styles.filterControls}>
          <SearchBar
            value={filters.search}
            onChange={(value) => handleFilterChange({ search: value })}
            placeholder={`Search ${urlTab === 'meetings'
              ? 'meetings'
              : urlTab === 'actions'
                ? 'action items'
                : 'decisions'
              }...`}
          />
          <HowToModal />
        </div>
        <div className={styles.filterGroup}>
          <WorkgroupFilter
            value={filters.workgroup}
            onChange={(value) => handleFilterChange({ workgroup: value })}
            options={facets.workgroups}
          />
          <DateFilter
            value={filters.date}
            onChange={(value) => handleFilterChange({ date: value })}
          />
          {urlTab === 'decisions' && (
            <EffectFilter
              value={filters.effect}
              onChange={(value) => handleFilterChange({ effect: value })}
              options={facets.effects}
            />
          )}
          {urlTab === 'actions' && (
            <>
              <StatusFilter
                value={filters.status}
                onChange={(value) => handleFilterChange({ status: value })}
                options={facets.statuses}
              />
              <AssigneeFilter
                value={filters.assignee}
                onChange={(value) => handleFilterChange({ assignee: value })}
                options={facets.assignees}
              />
            </>
          )}
        </div>
        <div className={styles.lastFetchedInfo}>
          Last updated: {formatDateTime(meta.loadedAt)}
          {isRefreshing && <span aria-live="polite"> · Refreshing…</span>}
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${urlTab === 'meetings' ? styles.active : ''}`}
          onClick={() => handleTabChange('meetings')}
          aria-selected={urlTab === 'meetings'}
          role="tab"
        >
          Meetings
        </button>
        <button
          className={`${styles.tab} ${urlTab === 'actions' ? styles.active : ''}`}
          onClick={() => handleTabChange('actions')}
          aria-selected={urlTab === 'actions'}
          role="tab"
        >
          Action Items
        </button>
        <button
          className={`${styles.tab} ${urlTab === 'decisions' ? styles.active : ''}`}
          onClick={() => handleTabChange('decisions')}
          aria-selected={urlTab === 'decisions'}
          role="tab"
        >
          Decisions
        </button>
      </div>

      {errorMessage && (
        <div className={styles.errorContainer} role="alert">
          {errorMessage}
        </div>
      )}

      <div
        className={`${styles.resultsWrapper} ${isLoading ? styles.navigating : ''}`}
        aria-busy={isLoading}
      >
        {results.kind === 'meetings' ? (
          <MeetingsTable items={results.items} searchTerm={searchTerm} />
        ) : results.kind === 'actions' ? (
          <ActionItemsTable items={results.items} searchTerm={searchTerm} total={meta.total} />
        ) : (
          <DecisionsTable items={results.items} searchTerm={searchTerm} stats={results.stats} />
        )}

        {meta.total > meta.limit && (
          <nav className={styles.pager} aria-label="Pagination">
            <button
              type="button"
              className={styles.pagerButton}
              onClick={() => goToOffset(meta.offset - meta.limit)}
              disabled={meta.offset === 0 || isLoading}
            >
              Previous
            </button>
            <span className={styles.pagerInfo}>
              Showing {showingFrom}–{showingTo} of {meta.total}
            </span>
            <button
              type="button"
              className={styles.pagerButton}
              onClick={() => goToOffset(meta.offset + meta.limit)}
              disabled={!meta.hasMore || isLoading}
            >
              Next
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
