import type { MillisecondRange, UserSelection } from "../types";

export function formatTimeRange(ranges: MillisecondRange | MillisecondRange[]): string {
  if (Array.isArray(ranges)) {
    if (ranges.length === 0) {
      return 'No time range set';
    }
    
    if (ranges.length === 1) {
      const range = ranges[0];
      return `${new Date(range.start).toLocaleDateString()} - ${new Date(range.end).toLocaleDateString()}`;
    } else {
      // For multiple ranges, show the full span
      const allStarts = ranges.map(r => r.start);
      const allEnds = ranges.map(r => r.end);
      const minStart = Math.min(...allStarts);
      const maxEnd = Math.max(...allEnds);
      return `${new Date(minStart).toLocaleDateString()} - ${new Date(maxEnd).toLocaleDateString()} (${ranges.length} ranges)`;
    }
  } else {
    return `${new Date(ranges.start).toLocaleDateString()} - ${new Date(ranges.end).toLocaleDateString()}`;
  }
}

export function getTimeRangeDisplay(sel: UserSelection): string {
  if (!sel.timeRange || !sel.timeRange.range) {
    return `No time range set for selection ${sel.name}`;
  }
  return formatTimeRange(sel.timeRange.range);
}
