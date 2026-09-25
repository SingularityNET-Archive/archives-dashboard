// lib/meetingSummaries/searchPage.ts
// Server-only. Builds the /search page payload from a raw query string. Shared
// by getServerSideProps (first request and deep links) and /api/search (every
// in-page navigation), so both always agree on filtering and paging.
import type { Facets, SearchPayload, SearchResults, SearchTab } from '../../types/meetings';
import { loadMeetingSummaries } from './loader';
import {
  buildFacets,
  decisionStats,
  filterActionItems,
  filterDecisions,
  filterMeetings,
  flattenActionItems,
  flattenDecisions,
  paginate,
} from './search';
import { ParamError, parseActionItemQuery, parseDecisionQuery, parseMeetingQuery } from './params';
import type { RawQuery } from './params';
import { filtersToApiQuery, getFilterStateFromUrl, parseOffset, parseTab } from '../../utils/urlParams';

export const PAGE_SIZE = 100;
export const LOAD_ERROR_MESSAGE = 'Could not load meeting summaries. Please try again later.';

export const EMPTY_FACETS: Facets = {
  workgroups: [],
  statuses: [],
  assignees: [],
  effects: [],
  tags: [],
  types: [],
};

export const emptyResults = (tab: SearchTab): SearchResults => {
  if (tab === 'actions') return { kind: 'actions', items: [] };
  if (tab === 'decisions') return { kind: 'decisions', items: [], stats: decisionStats([]) };
  return { kind: 'meetings', items: [] };
};

/** A payload with no results and an error message, keeping the tab and filters the URL asked for. */
export function failurePayload(
  query: RawQuery,
  error: string,
  facets: Facets = EMPTY_FACETS,
  loadedAt = ''
): SearchPayload {
  const tab = parseTab(query.tab);
  const offset = parseOffset(query.offset);
  return {
    tab,
    filters: getFilterStateFromUrl(query),
    results: emptyResults(tab),
    facets,
    meta: { total: 0, limit: PAGE_SIZE, offset, hasMore: false, loadedAt },
    error,
  };
}

/**
 * Runs the search described by the page's URL query. Invalid parameters come
 * back as a payload with `error` set (and facets intact, so the filter inputs
 * still work). A failure to load the dataset is thrown; the caller decides how
 * to report it.
 */
export async function runSearch(query: RawQuery): Promise<SearchPayload> {
  const tab = parseTab(query.tab);
  const filters = getFilterStateFromUrl(query);
  const offset = parseOffset(query.offset);
  const raw = filtersToApiQuery(tab, filters, { limit: PAGE_SIZE, offset });

  const { rows, loadedAt } = await loadMeetingSummaries();
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
      tab,
      filters,
      results,
      facets,
      meta: { total: page.total, limit: page.limit, offset: page.offset, hasMore: page.hasMore, loadedAt },
      error: null,
    };
  } catch (err) {
    if (err instanceof ParamError) {
      return failurePayload(query, err.message, facets, loadedAt);
    }
    throw err;
  }
}
