export function setToMidnightUTC(date: Date): number {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}


export function setToEndOfDayUTC(date: Date): number {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d.getTime();
}

/**
 * Format time string (HH:mm) for display in 12-hour format
 */
export function formatTimeString(timeString: string): string {
  const [hour, minute] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}
