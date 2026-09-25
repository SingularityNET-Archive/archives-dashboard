// pages/search/index.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import type {
  ActionItem,
  Decision,
  DecisionStats,
  Facets,
  FilterState,
  MeetingSearchResult,
  PageMeta,
  SearchTab,
} from '../../types/meetings';
import {
  loadMeetingSummaries,
  buildFacets,
  paginate,
  parseMeetingQuery,
  parseActionItemQuery,
  parseDecisionQuery,
  filterMeetings,
  flattenActionItems,
  filterActionItems,
  flattenDecisions,
  filterDecisions,
  decisionStats,
  ParamError,
} from '../../lib/meetingSummaries';
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
  filtersToApiQuery,
  parseTab,
  parseOffset,
  pushOffset,
} from '../../utils/urlParams';
import { formatDateTime } from '../../utils/dateFormatting';
import styles from '../../styles/search.module.css';

const PAGE_SIZE = 100;

type SearchResults =
  | { kind: 'meetings'; items: MeetingSearchResult[] }
  | { kind: 'actions'; items: ActionItem[] }
  | { kind: 'decisions'; items: Decision[]; stats: DecisionStats };

export interface SearchPageProps {
  tab: SearchTab;
  filters: FilterState;
  results: SearchResults;
  facets: Facets;
  meta: PageMeta;
  error: string | null;
}

const EMPTY_FACETS: Facets = {
  workgroups: [],
  statuses: [],
  assignees: [],
  effects: [],
  tags: [],
  types: [],
};

const emptyResults = (tab: SearchTab): SearchResults => {
  if (tab === 'actions') return { kind: 'actions', items: [] };
  if (tab === 'decisions') return { kind: 'decisions', items: [], stats: decisionStats([]) };
  return { kind: 'meetings', items: [] };
};

export const getServerSideProps: GetServerSideProps<SearchPageProps> = async ({ query, res }) => {
  // No shared cache: Netlify's Next.js runtime keys its CDN cache without the
  // page's own query params (see the Netlify-Vary header it emits), so a
  // cached `?tab=meetings` response would be served for `?tab=decisions`. The
  // rows are already cached in memory by loadMeetingSummaries, so each request
  // only pays for filtering. Same policy as lib/meetingSummaries/http.ts.
  res.setHeader('Cache-Control', 'private, no-store');

  const tab = parseTab(query.tab);
  const filters = getFilterStateFromUrl(query);
  const offset = parseOffset(query.offset);
  const raw = filtersToApiQuery(tab, filters, { limit: PAGE_SIZE, offset });

  const failure = (error: string, facets: Facets, loadedAt: string): { props: SearchPageProps } => ({
    props: {
      tab,
      filters,
      results: emptyResults(tab),
      facets,
      meta: { total: 0, limit: PAGE_SIZE, offset, hasMore: false, loadedAt },
      error,
    },
  });

  let rows;
  let loadedAt: string;
  try {
    ({ rows, loadedAt } = await loadMeetingSummaries());
  } catch (err) {
    console.error('Failed to load meeting summaries:', err);
    return failure('Could not load meeting summaries. Please try again later.', EMPTY_FACETS, '');
  }

  const facets = buildFacets(rows);

  try {
    let results: SearchResults;
    let page: { total: number; limit: number; offset: number; hasMore: boolean };

    if (tab === 'actions') {
      const params = parseActionItemQuery(raw);
      const paged = paginate(filterActionItems(flattenActionItems(rows), params), params.limit, params.offset);
      results = { kind: 'actions', items: paged.data };
      page = paged;
    } else if (tab === 'decisions') {
      const params = parseDecisionQuery(raw);
      const filtered = filterDecisions(flattenDecisions(rows), params);
      const paged = paginate(filtered, params.limit, params.offset);
      results = { kind: 'decisions', items: paged.data, stats: decisionStats(filtered) };
      page = paged;
    } else {
      const params = parseMeetingQuery(raw);
      const paged = paginate(filterMeetings(rows, params), params.limit, params.offset);
      results = { kind: 'meetings', items: paged.data };
      page = paged;
    }

    return {
      props: {
        tab,
        filters,
        results,
        facets,
        meta: { total: page.total, limit: page.limit, offset: page.offset, hasMore: page.hasMore, loadedAt },
        error: null,
      },
    };
  } catch (err) {
    if (err instanceof ParamError) {
      return failure(err.message, facets, loadedAt);
    }
    throw err;
  }
};

export default function SearchPage(props: SearchPageProps) {
  const router = useRouter();
  const { results, facets, meta, error } = props;

  const [filters, setFilters] = useState<FilterState>(props.filters);
  const [isNavigating, setIsNavigating] = useState(false);

  // The URL is the source of truth for the tab: the results table is rendered
  // from `props.tab`. `pendingTab` only highlights a clicked tab while its
  // navigation is in flight, and is cleared whenever a navigation finishes, so
  // the highlight and the table can never stay out of sync.
  const [pendingTab, setPendingTab] = useState<SearchTab | null>(null);
  const activeTab: SearchTab = pendingTab ?? props.tab;

  // True while a filter edit made on this page is waiting for the server round
  // trip. Prevents fresh props from overwriting what the user is still typing.
  const isUserAction = useRef(false);

  // Adopt server filters on back/forward navigation or external URL changes.
  useEffect(() => {
    if (!isUserAction.current) {
      setFilters(props.filters);
    }
    isUserAction.current = false;
  }, [props.filters]);

  // Push local filter edits to the URL (debounced), which re-runs getServerSideProps.
  useEffect(() => {
    if (!isUserAction.current) return;
    updateUrlWithFilters(router, filters, pendingTab ?? props.tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // A debounced push must not outlive this page.
  useEffect(() => () => cancelPendingPush(), []);

  // Show a busy state while the next page of results is loading, and drop the
  // optimistic tab highlight once a navigation has settled:
  // - routeChangeComplete: new props are already committed, so `props.tab` is right.
  // - routeChangeError (not cancelled): nothing will land, so fall back to `props.tab`.
  // - routeChangeError (cancelled): emitted by our own newer push, which already
  //   owns `pendingTab`; clearing here would un-highlight the tab just clicked.
  useEffect(() => {
    const start = (url: string) => {
      setIsNavigating(true);
      // Leaving the page: a pending filter push must not fire mid-navigation
      // and yank the user back here.
      if (new URL(url, window.location.origin).pathname !== router.pathname) {
        cancelPendingPush();
      }
    };
    const complete = () => {
      setIsNavigating(false);
      setPendingTab(null);
    };
    const error = (err: unknown) => {
      setIsNavigating(false);
      if (!(err as { cancelled?: boolean } | null)?.cancelled) {
        setPendingTab(null);
      }
    };

    router.events.on('routeChangeStart', start);
    router.events.on('routeChangeComplete', complete);
    router.events.on('routeChangeError', error);
    return () => {
      router.events.off('routeChangeStart', start);
      router.events.off('routeChangeComplete', complete);
      router.events.off('routeChangeError', error);
    };
  }, [router.events, router.pathname]);

  const handleFilterChange = useCallback((updates: Partial<FilterState>) => {
    isUserAction.current = true;
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const handleTabChange = (tab: SearchTab) => {
    if (tab === activeTab) return;

    const cleared: FilterState = {
      ...filters,
      search: '',
      status: '',
      effect: '',
      assignee: '',
    };

    // Not a typing edit: keeps the filters effect from scheduling a second,
    // debounced push for the same change.
    isUserAction.current = false;
    setFilters(cleared);
    setPendingTab(tab);
    pushTab(router, cleared, tab);
  };

  const goToOffset = (offset: number) => pushOffset(router, Math.max(0, offset));

  const showingFrom = meta.total === 0 ? 0 : meta.offset + 1;
  const showingTo = meta.offset + results.items.length;
  const searchTerm = props.filters.search;

  return (
    <div className={styles.searchPage}>
      <div className={styles.filtersSection}>
        <div className={styles.filterControls}>
          <SearchBar
            value={filters.search}
            onChange={(value) => handleFilterChange({ search: value })}
            placeholder={`Search ${activeTab === 'meetings'
              ? 'meetings'
              : activeTab === 'actions'
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
          {activeTab === 'decisions' && (
            <EffectFilter
              value={filters.effect}
              onChange={(value) => handleFilterChange({ effect: value })}
              options={facets.effects}
            />
          )}
          {activeTab === 'actions' && (
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
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'meetings' ? styles.active : ''}`}
          onClick={() => handleTabChange('meetings')}
          aria-selected={activeTab === 'meetings'}
          role="tab"
        >
          Meetings
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'actions' ? styles.active : ''}`}
          onClick={() => handleTabChange('actions')}
          aria-selected={activeTab === 'actions'}
          role="tab"
        >
          Action Items
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'decisions' ? styles.active : ''}`}
          onClick={() => handleTabChange('decisions')}
          aria-selected={activeTab === 'decisions'}
          role="tab"
        >
          Decisions
        </button>
      </div>

      {error && (
        <div className={styles.errorContainer} role="alert">
          {error}
        </div>
      )}

      <div
        className={`${styles.resultsWrapper} ${isNavigating ? styles.navigating : ''}`}
        aria-busy={isNavigating}
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
              disabled={meta.offset === 0 || isNavigating}
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
              disabled={!meta.hasMore || isNavigating}
            >
              Next
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
