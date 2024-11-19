// utils/dateFormatting.ts
export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'No date';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    // Get day and pad with leading zero if needed
    const day = date.getDate().toString().padStart(2, '0');
    
    // Get month in short format (Jan, Feb, etc)
    const month = date.toLocaleString('en-US', { month: 'short' });
    
    // Get full year
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};