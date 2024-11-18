// utils/urlParams.ts
import { FilterState } from '../types/meetings';
import { NextRouter } from 'next/router';

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const getFilterStateFromUrl = (query: {
  [key: string]: string | string[] | undefined;
}): FilterState => {
  return {
    workgroup: (query.workgroup as string) || '',
    status: (query.status as string) || '',
    search: (query.search as string) || '',
    date: (query.date as string) || '',
    dateRange: {
      start: (query.dateStart as string) || '',
      end: (query.dateEnd as string) || '',
    },
    assignee: (query.assignee as string) || '',
    effect: (query.effect as string) || ''
  };
};

// Increased debounce timeout for better typing experience
export const debouncedUpdateUrl = debounce((
  router: NextRouter,
  query: { [key: string]: string }
) => {
  const newQuery = { ...query };
  Object.keys(newQuery).forEach(key => {
    if (newQuery[key] === '') {
      delete newQuery[key];
    }
  });

  router.push(
    {
      pathname: router.pathname,
      query: newQuery
    },
    undefined,
    { shallow: true }
  );
}, 500); // Increased from 300ms to 500ms

export const updateUrlWithFilters = (
  router: NextRouter,
  filters: FilterState,
  activeTab: string
) => {
  const query: { [key: string]: string } = { tab: activeTab };
  
  if (filters.workgroup) query.workgroup = filters.workgroup;
  if (filters.status) query.status = filters.status;
  if (filters.search) query.search = filters.search;
  if (filters.date) query.date = filters.date;
  if (filters.dateRange.start) query.dateStart = filters.dateRange.start;
  if (filters.dateRange.end) query.dateEnd = filters.dateRange.end;
  if (filters.assignee) query.assignee = filters.assignee;
  if (filters.effect) query.effect = filters.effect;

  debouncedUpdateUrl(router, query);
};