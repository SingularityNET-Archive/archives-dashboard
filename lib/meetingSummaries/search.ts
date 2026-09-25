// lib/meetingSummaries/search.ts
// Pure filter / flatten / facet / paginate functions. No I/O, so these are
// safe to unit test and to call from both API routes and getServerSideProps.
import type {
  ActionItem,
  ActionItemQuery,
  Decision,
  DecisionQuery,
  DecisionStats,
  FacetCount,
  Facets,
  MeetingQuery,
  MeetingSearchResult,
  MeetingSummary,
  SortOrder,
} from '../../types/meetings';
import { escapeRegExp } from '../../utils/stringFormatting';
import { isInRange, toDateKey } from '../../utils/dateUtils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const lower = (value: unknown): string => (typeof value === 'string' ? value.toLowerCase() : '');

const splitCsv = (value: string | null | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

const onlyStrings = (values: unknown[]): string[] =>
  values.filter((v): v is string => typeof v === 'string' && v.length > 0);

const countMatches = (text: string, term: string): number => {
  if (!term || !text) return 0;
  const matches = text.match(new RegExp(escapeRegExp(term), 'gi'));
  return matches ? matches.length : 0;
};

const includesCi = (fields: Array<string | null | undefined>, term: string): boolean => {
  const needle = term.toLowerCase();
  return fields.some((field) => typeof field === 'string' && field.toLowerCase().includes(needle));
};

const matchesWorkgroup = (id: string, name: string, param?: string): boolean => {
  if (!param) return true;
  return id === param || name.toLowerCase() === param.toLowerCase();
};

const meetingDateKey = (row: MeetingSummary): string | null =>
  toDateKey(row.summary?.meetingInfo?.date) ?? toDateKey(row.date);

const applyOrder = (cmp: number, order: SortOrder): number => (order === 'asc' ? cmp : -cmp);

const compareKeys = (a: string | null, b: string | null): number => {
  // Nulls sort after everything regardless of direction is handled by callers;
  // here a plain string compare with nulls treated as smallest.
  if (a === b) return 0;
  if (a === null) return -1;
  if (b === null) return 1;
  return a < b ? -1 : 1;
};

const parseTime = (value: string | undefined): number => {
  if (!value) return 0;
  const t = Date.parse(value);
  return isNaN(t) ? 0 : t;
};

// ---------------------------------------------------------------------------
// Meetings
// ---------------------------------------------------------------------------

/** All tag text for a meeting, mirroring MeetingsTable.getTagMatchCount. */
function meetingTagText(row: MeetingSummary): string {
  const tags = row.summary?.tags;
  return onlyStrings([tags?.topicsCovered, tags?.emotions, tags?.other, tags?.gamesPlayed]).join(' ');
}

/** All content text for a meeting, mirroring MeetingsTable.getContentMatchCount. */
function meetingContentText(row: MeetingSummary): string {
  const s = row.summary;
  if (!s) return '';
  const info = s.meetingInfo;
  const video = info?.timestampedVideo;

  const parts: unknown[] = [
    s.workgroup,
    info?.purpose,
    info?.name,
    info?.host,
    info?.documenter,
    info?.peoplePresent,
    video?.intro,
    video?.timestamps,
    ...(video?.sections ?? []).flatMap((section) => [section?.title, section?.content]),
  ];

  for (const item of s.agendaItems ?? []) {
    if (!item) continue;
    parts.push(
      item.agenda,
      item.narrative,
      item.discussion,
      item.townHallUpdates,
      item.townHallSummary,
      item.gameRules,
      ...(Array.isArray(item.discussionPoints) ? item.discussionPoints : []),
      ...(Array.isArray(item.meetingTopics) ? item.meetingTopics : []),
      ...(Array.isArray(item.issues) ? item.issues : []),
      ...(Array.isArray(item.learningPoints) ? item.learningPoints : []),
      ...(item.actionItems ?? []).flatMap((a) => [a?.text, a?.assignee, a?.status]),
      ...(item.decisionItems ?? []).flatMap((d) => [d?.decision, d?.effect, d?.rationale, d?.opposing])
    );
  }

  return onlyStrings(parts).join(' ');
}

/** Lower-cased set of every tag on the meeting. */
function meetingTags(row: MeetingSummary): string[] {
  const tags = row.summary?.tags;
  return [
    ...splitCsv(tags?.topicsCovered),
    ...splitCsv(tags?.emotions),
    ...splitCsv(tags?.other),
    ...splitCsv(tags?.gamesPlayed),
  ].map((t) => t.toLowerCase());
}

function meetingHasAssignee(row: MeetingSummary, assignee: string): boolean {
  const needle = assignee.toLowerCase();
  for (const item of row.summary?.agendaItems ?? []) {
    for (const action of item?.actionItems ?? []) {
      if (splitCsv(action?.assignee).some((name) => name.toLowerCase() === needle)) {
        return true;
      }
    }
  }
  return false;
}

export function filterMeetings(rows: MeetingSummary[], params: MeetingQuery): MeetingSearchResult[] {
  const q = params.q?.trim();
  const results: MeetingSearchResult[] = [];

  for (const row of rows) {
    const s = row.summary;
    if (!s) continue;

    const workgroupId = s.workgroup_id ?? row.workgroup_id ?? '';
    if (!matchesWorkgroup(workgroupId, s.workgroup ?? '', params.workgroup)) continue;

    const dateKey = meetingDateKey(row);
    if (params.date && dateKey !== params.date) continue;
    if ((params.dateFrom || params.dateTo) && !isInRange(dateKey, params.dateFrom, params.dateTo)) continue;

    if (params.confirmed !== undefined && Boolean(row.confirmed) !== params.confirmed) continue;
    if (params.type && lower(s.type) !== params.type.toLowerCase()) continue;
    if (params.host && lower(s.meetingInfo?.host) !== params.host.toLowerCase()) continue;
    if (params.tag && !meetingTags(row).includes(params.tag.toLowerCase())) continue;
    if (params.assignee && !meetingHasAssignee(row, params.assignee)) continue;

    if (q) {
      const tags = countMatches(meetingTagText(row), q);
      const content = countMatches(meetingContentText(row), q);
      if (tags === 0 && content === 0) continue;
      results.push({ ...row, matches: { tags, content } });
    } else {
      results.push(row);
    }
  }

  results.sort((a, b) => {
    let cmp: number;
    if (params.sort === 'updated_at') {
      cmp = parseTime(a.updated_at) - parseTime(b.updated_at);
    } else {
      cmp = compareKeys(meetingDateKey(a), meetingDateKey(b));
    }
    if (cmp === 0) cmp = compareKeys(a.meeting_id, b.meeting_id);
    return applyOrder(cmp, params.order);
  });

  return results;
}

// ---------------------------------------------------------------------------
// Action items
// ---------------------------------------------------------------------------

export function flattenActionItems(rows: MeetingSummary[]): ActionItem[] {
  const items: ActionItem[] = [];

  for (const row of rows) {
    const s = row.summary;
    if (!s?.agendaItems) continue;

    const meetingDate = meetingDateKey(row) ?? '';
    const workgroup = s.workgroup ?? '';
    const workgroupId = s.workgroup_id ?? row.workgroup_id ?? '';

    for (const agenda of s.agendaItems) {
      for (const item of agenda?.actionItems ?? []) {
        if (!item || typeof item.text !== 'string') continue;
        items.push({
          text: item.text,
          assignee: typeof item.assignee === 'string' ? item.assignee : '',
          dueDate: typeof item.dueDate === 'string' ? item.dueDate : '',
          status: typeof item.status === 'string' ? item.status : '',
          workgroup,
          workgroup_id: workgroupId,
          meeting_id: row.meeting_id,
          meetingDate,
        });
      }
    }
  }

  return items;
}

export function filterActionItems(items: ActionItem[], params: ActionItemQuery): ActionItem[] {
  const q = params.q?.trim();
  const hasDueFilter = Boolean(params.due || params.dueFrom || params.dueTo);

  const results = items.filter((item) => {
    if (!matchesWorkgroup(item.workgroup_id, item.workgroup, params.workgroup)) return false;

    if (hasDueFilter) {
      const dueKey = toDateKey(item.dueDate);
      if (!dueKey) return false;
      if (params.due && dueKey !== params.due) return false;
      if (!isInRange(dueKey, params.dueFrom, params.dueTo)) return false;
    }

    if (params.date && item.meetingDate !== params.date) return false;
    if ((params.dateFrom || params.dateTo) && !isInRange(item.meetingDate || null, params.dateFrom, params.dateTo)) return false;

    if (params.status && lower(item.status) !== params.status.toLowerCase()) return false;

    if (params.assignee) {
      const needle = params.assignee.toLowerCase();
      if (!splitCsv(item.assignee).some((name) => name.toLowerCase() === needle)) return false;
    }

    if (q && !includesCi([item.text, item.assignee, item.workgroup, item.status], q)) return false;

    return true;
  });

  results.sort((a, b) => {
    let cmp: number;
    if (params.sort === 'date') {
      cmp = compareKeys(a.meetingDate || null, b.meetingDate || null);
    } else {
      cmp = parseTime(a.dueDate) - parseTime(b.dueDate);
    }
    if (cmp === 0) cmp = compareKeys(a.meeting_id, b.meeting_id);
    return applyOrder(cmp, params.order);
  });

  return results;
}

// ---------------------------------------------------------------------------
// Decisions
// ---------------------------------------------------------------------------

export function flattenDecisions(rows: MeetingSummary[]): Decision[] {
  const decisions: Decision[] = [];

  for (const row of rows) {
    const s = row.summary;
    if (!s?.agendaItems) continue;

    const date = meetingDateKey(row) ?? '';
    const workgroup = s.workgroup ?? '';
    const workgroupId = s.workgroup_id ?? row.workgroup_id ?? '';

    for (const agenda of s.agendaItems) {
      for (const item of agenda?.decisionItems ?? []) {
        if (!item || typeof item.decision !== 'string') continue;
        decisions.push({
          decision: item.decision,
          effect: typeof item.effect === 'string' ? item.effect : '',
          rationale: typeof item.rationale === 'string' ? item.rationale : '',
          opposing: typeof item.opposing === 'string' ? item.opposing : '',
          workgroup,
          workgroup_id: workgroupId,
          date,
          meeting_id: row.meeting_id,
        });
      }
    }
  }

  return decisions;
}

export function filterDecisions(items: Decision[], params: DecisionQuery): Decision[] {
  const q = params.q?.trim();

  const results = items.filter((item) => {
    if (!matchesWorkgroup(item.workgroup_id, item.workgroup, params.workgroup)) return false;

    const dateKey = item.date || null;
    if (params.date && dateKey !== params.date) return false;
    if ((params.dateFrom || params.dateTo) && !isInRange(dateKey, params.dateFrom, params.dateTo)) return false;

    if (params.effect && item.effect !== params.effect) return false;

    if (q && !includesCi([item.decision, item.effect, item.rationale, item.opposing, item.workgroup], q)) return false;

    return true;
  });

  results.sort((a, b) => {
    let cmp = compareKeys(a.date || null, b.date || null);
    if (cmp === 0) cmp = compareKeys(a.meeting_id, b.meeting_id);
    return applyOrder(cmp, params.order);
  });

  return results;
}

export function decisionStats(items: Decision[]): DecisionStats {
  const total = items.length;
  const withRationale = items.filter((d) => Boolean(d.rationale)).length;
  const withEffect = items.filter((d) => Boolean(d.effect)).length;

  return {
    total,
    withRationale,
    withEffect,
    rationalePercentage: total ? Math.round((withRationale / total) * 100) : 0,
    effectPercentage: total ? Math.round((withEffect / total) * 100) : 0,
  };
}

// ---------------------------------------------------------------------------
// Facets
// ---------------------------------------------------------------------------

const STATUS_PRIORITY: Record<string, number> = {
  'in progress': 1,
  'pending': 2,
  'completed': 3,
  'cancelled': 4,
};

const DEFAULT_EFFECTS = ['affectsOnlyThisWorkgroup', 'mayAffectOtherPeople'];

const titleCase = (value: string): string =>
  value
    .split(/[-\s]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

/** Counts case-insensitively, keeping the first-seen casing as the label. */
function countCi(values: Iterable<string>, labelFor: (raw: string) => string = (raw) => raw): Map<string, FacetCount> {
  const map = new Map<string, FacetCount>();
  for (const raw of values) {
    const value = raw.toLowerCase();
    const existing = map.get(value);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(value, { value, label: labelFor(raw), count: 1 });
    }
  }
  return map;
}

export function buildFacets(rows: MeetingSummary[]): Facets {
  const workgroupMap = new Map<string, { id: string; name: string; count: number }>();
  const tagValues: string[] = [];
  const typeValues: string[] = [];

  for (const row of rows) {
    const s = row.summary;
    if (!s) continue;

    const id = s.workgroup_id ?? row.workgroup_id;
    const name = s.workgroup;
    if (id && name) {
      const existing = workgroupMap.get(id);
      if (existing) {
        existing.count += 1;
      } else {
        workgroupMap.set(id, { id, name, count: 1 });
      }
    }

    tagValues.push(...new Set(meetingTags(row)));
    if (typeof s.type === 'string' && s.type) typeValues.push(s.type);
  }

  const actionItems = flattenActionItems(rows);
  const statusMap = countCi(
    actionItems.map((a) => a.status).filter(Boolean),
    titleCase
  );
  const assigneeMap = countCi(actionItems.flatMap((a) => splitCsv(a.assignee)));

  const decisions = flattenDecisions(rows);
  const effectCounts = new Map<string, number>();
  for (const d of decisions) {
    if (d.effect) effectCounts.set(d.effect, (effectCounts.get(d.effect) ?? 0) + 1);
  }
  if (effectCounts.size === 0) {
    for (const effect of DEFAULT_EFFECTS) effectCounts.set(effect, 0);
  }

  return {
    workgroups: Array.from(workgroupMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    statuses: Array.from(statusMap.values()).sort((a, b) => {
      const pa = STATUS_PRIORITY[a.value] ?? 999;
      const pb = STATUS_PRIORITY[b.value] ?? 999;
      return pa !== pb ? pa - pb : a.label.localeCompare(b.label);
    }),
    assignees: Array.from(assigneeMap.values()).sort((a, b) => {
      const byLabel = a.label.toLowerCase().localeCompare(b.label.toLowerCase());
      return byLabel !== 0 ? byLabel : b.count - a.count;
    }),
    effects: Array.from(effectCounts.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => a.value.localeCompare(b.value)),
    tags: Array.from(countCi(tagValues).values()).sort((a, b) =>
      b.count !== a.count ? b.count - a.count : a.label.localeCompare(b.label)
    ),
    types: Array.from(countCi(typeValues).values()).sort((a, b) => a.label.localeCompare(b.label)),
  };
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export interface Page<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export function paginate<T>(items: T[], limit: number, offset: number): Page<T> {
  const data = items.slice(offset, offset + limit);
  return {
    data,
    total: items.length,
    limit,
    offset,
    hasMore: offset + data.length < items.length,
  };
}
