// lib/meetingSummaries/stats.ts
import type { MeetingSummary, WorkgroupMonthlyStats } from '../../types/meetings';
import { toDateKey } from '../../utils/dateUtils';
import { flattenActionItems, flattenDecisions } from './search';

const monthName = (year: number, month: number): string =>
  new Date(Date.UTC(year, month, 1)).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });

const isInMonth = (value: string | undefined, month: number, year: number): boolean => {
  const key = toDateKey(value);
  if (!key) return false;
  return Number(key.slice(0, 4)) === year && Number(key.slice(5, 7)) - 1 === month;
};

/**
 * Per-workgroup counts of decisions (by meeting date) and action items (by due
 * date) for the current month versus the previous month. All month math is in
 * UTC so the result is the same on the server and in any browser.
 */
export function buildWorkgroupMonthlyStats(rows: MeetingSummary[], now: Date = new Date()): WorkgroupMonthlyStats {
  const currentMonth = now.getUTCMonth();
  const currentYear = now.getUTCFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const workgroups = Array.from(
    new Set(
      rows
        .map((r) => r.summary?.workgroup)
        .filter((w): w is string => typeof w === 'string' && w.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b));

  const index = new Map(workgroups.map((w, i) => [w, i] as const));
  const zeros = () => workgroups.map(() => 0);

  const decisions = { current: zeros(), last: zeros() };
  for (const d of flattenDecisions(rows)) {
    const i = index.get(d.workgroup);
    if (i === undefined) continue;
    if (isInMonth(d.date, currentMonth, currentYear)) decisions.current[i] += 1;
    else if (isInMonth(d.date, lastMonth, lastMonthYear)) decisions.last[i] += 1;
  }

  const actions = { current: zeros(), last: zeros() };
  for (const a of flattenActionItems(rows)) {
    if (!a.dueDate) continue;
    const i = index.get(a.workgroup);
    if (i === undefined) continue;
    if (isInMonth(a.dueDate, currentMonth, currentYear)) actions.current[i] += 1;
    else if (isInMonth(a.dueDate, lastMonth, lastMonthYear)) actions.last[i] += 1;
  }

  let latest = 0;
  for (const row of rows) {
    const t = Date.parse(row.updated_at);
    if (!isNaN(t) && t > latest) latest = t;
  }

  return {
    workgroups,
    decisions,
    actions,
    monthNames: {
      current: monthName(currentYear, currentMonth),
      last: monthName(lastMonthYear, lastMonth),
    },
    totalMeetings: rows.length,
    lastUpdated: latest > 0 ? new Date(latest).toISOString() : null,
  };
}
