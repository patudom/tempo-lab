import type { MillisecondRange, UserSelection } from "../types";

export function formatSingleRange(range: MillisecondRange): string {
  const startString = new Date(range.start).toLocaleDateString();
  const endString = new Date(range.end).toLocaleDateString();
  if (startString === endString) {
    return startString;
  }
  return `${startString} - ${endString}`;
}

export function formatTimeRange(ranges: MillisecondRange | MillisecondRange[]): string {
  if (Array.isArray(ranges)) {
    if (ranges.length === 0) {
      return 'No time range set';
    }
    
    if (ranges.length === 1) {
      return formatSingleRange(ranges[0]); 
    } else {
      // For multiple ranges, show the full span
      const allStarts = ranges.map(r => r.start);
      const allEnds = ranges.map(r => r.end);
      const minStart = Math.min(...allStarts);
      const maxEnd = Math.max(...allEnds);
      return `${new Date(minStart).toLocaleDateString()} - ${new Date(maxEnd).toLocaleDateString()} (${ranges.length} ranges)`;
    }
  } else {
    return formatSingleRange(ranges);
  }
}

export function getTimeRangeDisplay(sel: UserSelection): string {
  if (!sel.timeRange || !sel.timeRange.range) {
    return `No time range set for selection ${sel.id}`;
  }
  return formatTimeRange(sel.timeRange.range);
}
