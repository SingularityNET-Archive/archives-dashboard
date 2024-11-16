// utils/dateUtils.ts
export const normalizeDate = (date: string | Date): string => {
  // Convert date to YYYY-MM-DD format in local timezone
  const d = new Date(date);
  return d.getFullYear() + '-' + 
    String(d.getMonth() + 1).padStart(2, '0') + '-' + 
    String(d.getDate()).padStart(2, '0');
};

export const isSameDate = (date1: string | Date, date2: string | Date): boolean => {
  if (!date1 || !date2) return false;
  return normalizeDate(date1) === normalizeDate(date2);
};