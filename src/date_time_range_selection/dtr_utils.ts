
export function setToMidnightUTC(date: Date, toDate: true): Date;
export function setToMidnightUTC(date: Date, toDate?: false): number;
export function setToMidnightUTC(date: Date, toDate: boolean = false): number | Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  if (toDate) {
    return d;
  }
  return d.getTime();
}

export function setToEndOfDayUTC(date: Date, toDate: true): Date;
export function setToEndOfDayUTC(date: Date, toDate?: false): number;
export function setToEndOfDayUTC(date: Date, toDate: boolean = false): number | Date {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  if (toDate) {
    return d;
  }
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
