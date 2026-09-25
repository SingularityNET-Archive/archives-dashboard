// utils/dateUtils.ts
const DATE_KEY_PREFIX = /^\d{4}-\d{2}-\d{2}/;

/**
 * Normalise a date value to a `YYYY-MM-DD` key using UTC.
 *
 * Strings that already start with `YYYY-MM-DD` are used as-is so that a
 * calendar date stored as `2025-03-04` never shifts by a day depending on the
 * timezone of the machine doing the comparison (server vs browser).
 * Returns null for empty or unparseable input.
 */
export const toDateKey = (value: string | Date | null | undefined): string | null => {
  if (!value) return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (DATE_KEY_PREFIX.test(trimmed)) return trimmed.slice(0, 10);
  }

  const d = new Date(value);
  if (isNaN(d.getTime())) return null;

  return d.getUTCFullYear() + '-' +
    String(d.getUTCMonth() + 1).padStart(2, '0') + '-' +
    String(d.getUTCDate()).padStart(2, '0');
};

/** Inclusive range check on `YYYY-MM-DD` keys. Missing bounds are open. */
export const isInRange = (key: string | null, from?: string, to?: string): boolean => {
  if (!key) return false;
  if (from && key < from) return false;
  if (to && key > to) return false;
  return true;
};

export const normalizeDate = (date: string | Date): string => {
  return toDateKey(date) ?? '';
};

export const isSameDate = (date1: string | Date, date2: string | Date): boolean => {
  if (!date1 || !date2) return false;
  const a = toDateKey(date1);
  const b = toDateKey(date2);
  return a !== null && a === b;
};
