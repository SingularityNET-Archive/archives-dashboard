// utils/dateFormatting.ts
// All formatting is done in UTC so that server-rendered markup matches what the
// browser renders during hydration regardless of the viewer's timezone.
export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'No date';

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
    const year = date.getUTCFullYear();

    return `${day} ${month} ${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/** Format an ISO timestamp for display, deterministic across server and client. */
export const formatDateTime = (isoString: string | null | undefined): string => {
  if (!isoString) return 'Unknown';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short'
  });
};
