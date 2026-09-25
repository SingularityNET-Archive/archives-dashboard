// utils/urlParams.ts
import type { NextRouter } from 'next/router';
import type { FilterState, SearchTab } from '../types/meetings';

type QueryValue = string | string[] | undefined;
type Query = { [key: string]: QueryValue };

const TABS: readonly SearchTab[] = ['meetings', 'actions', 'decisions'];

const first = (value: QueryValue): string => {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === 'string' ? v : '';
};

export const parseTab = (value: QueryValue): SearchTab => {
  const v = first(value);
  return (TABS as readonly string[]).includes(v) ? (v as SearchTab) : 'meetings';
};

/** Invalid or missing offsets fall back to 0 rather than erroring. */
export const parseOffset = (value: QueryValue): number => {
  const n = Number(first(value));
  return Number.isInteger(n) && n >= 0 ? n : 0;
};

const debounce = <T extends (...args: never[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const getFilterStateFromUrl = (query: Query): FilterState => {
  return {
    workgroup: first(query.workgroup),
    status: first(query.status),
    search: first(query.search),
    date: first(query.date),
    dateRange: {
      start: first(query.dateStart),
      end: first(query.dateEnd),
    },
    assignee: first(query.assignee),
    effect: first(query.effect),
  };
};

/**
 * Translate the dashboard's URL/filter state into the canonical API query
 * parameters understood by lib/meetingSummaries/params.ts.
 *
 * On the action-items tab the single Date input filters the due date, so the
 * date fields map to `due*` there and to `date*` everywhere else.
 */
export const filtersToApiQuery = (
  tab: SearchTab,
  filters: FilterState,
  page: { limit: number; offset: number }
): Record<string, string> => {
  const query: Record<string, string> = {};
  const set = (key: string, value: string) => {
    if (value) query[key] = value;
  };

  set('q', filters.search);
  set('workgroup', filters.workgroup);

  if (tab === 'actions') {
    set('due', filters.date);
    set('dueFrom', filters.dateRange.start);
    set('dueTo', filters.dateRange.end);
    set('status', filters.status);
    set('assignee', filters.assignee);
  } else {
    set('date', filters.date);
    set('dateFrom', filters.dateRange.start);
    set('dateTo', filters.dateRange.end);
    if (tab === 'decisions') set('effect', filters.effect);
  }

  query.limit = String(page.limit);
  query.offset = String(page.offset);
  return query;
};

const pushQuery = (router: NextRouter, query: Record<string, string | string[]>) => {
  // A full (non-shallow) push so getServerSideProps re-runs with the new filters.
  router.push({ pathname: router.pathname, query }, undefined, { scroll: false });
};

const debouncedPush = debounce((router: NextRouter, query: Record<string, string>) => {
  pushQuery(router, query);
}, 500);

export const updateUrlWithFilters = (
  router: NextRouter,
  filters: FilterState,
  activeTab: SearchTab
) => {
  // Filter changes always reset paging, so `offset` is deliberately omitted.
  const query: Record<string, string> = { tab: activeTab };

  if (filters.workgroup) query.workgroup = filters.workgroup;
  if (filters.status) query.status = filters.status;
  if (filters.search) query.search = filters.search;
  if (filters.date) query.date = filters.date;
  if (filters.dateRange.start) query.dateStart = filters.dateRange.start;
  if (filters.dateRange.end) query.dateEnd = filters.dateRange.end;
  if (filters.assignee) query.assignee = filters.assignee;
  if (filters.effect) query.effect = filters.effect;

  // Tab changes navigate immediately; typing is debounced.
  if (parseTab(router.query.tab) !== activeTab) {
    pushQuery(router, query);
  } else {
    debouncedPush(router, query);
  }
};

export const pushOffset = (router: NextRouter, offset: number) => {
  const query: Record<string, string | string[]> = {};
  for (const [key, value] of Object.entries(router.query)) {
    if (value !== undefined) query[key] = value;
  }

  if (offset > 0) {
    query.offset = String(offset);
  } else {
    delete query.offset;
  }

  pushQuery(router, query);
};
