
/* eslint-disable @typescript-eslint/no-unused-vars */
import { TimeSeriesFolder } from "@/esri/services/aggregation";
import { MillisecondRange, TimeRangeSelectionType} from "@/types/datetime";
import { ElementOf } from "@vueuse/core";


// "as const" is required to use typeof inference later
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;
const MS_IN_HOUR = 60 * 60 * 1000;
const MS_IN_DAY = 24 * MS_IN_HOUR;

export type DayType = typeof DAYS[number];
export type MonthType = typeof MONTHS[number];

export type TimeRangeCreationMode = 'single' | 'multiple';

export interface TimeRangeConfigSingle {
  type: Extract<TimeRangeCreationMode, 'single'>; // Ensures 'type' is strictly 'single'
  singleDate: Date; // UTC timestamp
}

// we use " | undefined" to force optional values to be explicitly set to undefined if not used
export interface TimeRangeConfigMultiple {
  type: Extract<TimeRangeCreationMode, 'multiple'>; // Ensures 'type' is strictly 'multiple'
  dateRange: {
      start: Date; // UTC timestamp
      end: Date;   // UTC timestamp
  },
  years: number[] | undefined;
  months: MonthType[] | undefined; // 0-11
  weekdays: DayType[] | undefined; // 0 (Sun) - 6 (Sat)
  times: string[] | undefined; // 'HH:MM' format
}

export type TimeRangeConfig = TimeRangeConfigSingle | TimeRangeConfigMultiple;

/**
 * Parcels a long time range into smaller ranges. 
 * 
 * This should only be applied after all other time range filtering has been done.
 */
function parcelLongRange(range: MillisecondRange, maxParcelSize: number): MillisecondRange[] {
  const parcels: MillisecondRange[] = [];
  let currentStart = range.start;
  if (range.end - range.start <= maxParcelSize) {
    return [range];
  }

  while (currentStart < range.end) {
    const currentEnd = Math.min(currentStart + maxParcelSize, range.end);
    parcels.push({ start: currentStart, end: currentEnd });
    currentStart = currentEnd;
  }

  return parcels;
}

function parcelRanges(ranges: MillisecondRange[], maxParcelSize: number): MillisecondRange[] {
  const allParcels: MillisecondRange[] = [];
  for (const range of ranges) {
    const parcels = parcelLongRange(range, maxParcelSize);
    allParcels.push(...parcels);
  }
  return allParcels;
}

function parseTimeStringToHoursMinutes(timeStr: string): { hours: number; minutes: number } {
  const timeParts = timeStr.split(':');
  if (timeParts.length !== 2) {
    throw new Error(`Invalid time format: ${timeStr}. Expected 'HH:MM' using 24 hour time.`);
  }
  const hours = parseInt(timeParts[0]);
  const minutes = parseInt(timeParts[1]);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time values in: ${timeStr}. Hours must be 0-23 and minutes must be 0-59.`);
  }
  
  return { hours, minutes };
}

function genOneDayRange(date: number): MillisecondRange {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  return { start: start.getTime(), end: end.getTime() };
}

function genOneYearRange(date: number): MillisecondRange {
  const start = new Date(date);
  start.setUTCMonth(0, 1); // January 1st
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setUTCMonth(11, 31); // December 31st
  end.setUTCHours(23, 59, 59, 999);
  return { start: start.getTime(), end: end.getTime() };
}

function genOneMonthRange(date: number): MillisecondRange {
  const start = new Date(date);
  start.setUTCDate(1); // first day of month
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setUTCMonth(end.getUTCMonth() + 1);
  end.setUTCDate(0); // last day of previous month
  end.setUTCHours(23, 59, 59, 999);
  return { start: start.getTime(), end: end.getTime() };
}



/** 
Generate all of the hour ranges for a single day.

If no times are provided, return the full day range.

Otherwise, each time generates a range range that is {time - toleranceMs, time + toleranceMs}.
The range will be left-inclusive, right-exclusive: [start, end)
*/
function genHoursForOneDay(date: number, times: string[] | undefined, toleranceMs: number = 0.5 * MS_IN_HOUR): MillisecondRange[] {
  const ranges: MillisecondRange[] = [];
  if (!times || times.length === 0) {
    return [genOneDayRange(date)];
  }
  
  // for each time, generate the appropriate range. by default +/- 30 minutes
  for (const timeStr of times) {
    const { hours, minutes } = parseTimeStringToHoursMinutes(timeStr);
    const start = new Date(date);
    start.setUTCHours(hours, minutes, 0, 0);
    ranges.push({ start: start.getTime() - toleranceMs, end: start.getTime() + toleranceMs - 1 });
  }
  return ranges;
}

function advanceDateToNextMonth(date: Date): Date {
  const newDate = new Date(date);
  const newMonth = newDate.getUTCMonth() + 1;
  newDate.setUTCMonth(newMonth);
  newDate.setUTCDate(1);
  newDate.setUTCHours(0, 0, 0, 0);
  return newDate;
}

function advanceDateToNextYear(date: Date): Date {
  const newDate = new Date(date);
  newDate.setUTCFullYear(newDate.getUTCFullYear() + 1);
  newDate.setUTCMonth(0);
  newDate.setUTCDate(1);
  newDate.setUTCHours(0, 0, 0, 0);
  return newDate;
}


function generatePatternedRanges(config: TimeRangeConfigMultiple, toleranceHours: number = 0.5): MillisecondRange[] {
  const ranges: MillisecondRange[] = [];
  const toleranceMs = toleranceHours * MS_IN_HOUR;
  
  // loop every day
  // use a while loop so we can easily increment by day or month or 
  if (!config.dateRange) {
    throw new Error('dateRange is required for multiple time range generation.');
  }
  
  if (config.dateRange.start >= config.dateRange.end) {
    // swap them
    const temp = config.dateRange.start;
    config.dateRange.start = config.dateRange.end;
    config.dateRange.end = temp;
  }
  
  const startDate = new Date(config.dateRange.start);
  startDate.setUTCHours(0, 0, 0, 0);
  const endDate = new Date(config.dateRange.end);
  endDate.setUTCHours(23, 59, 59, 999);
  
  let currentDate = new Date(startDate);
      
  // are we splitting on month, year, weekday, or time. 
  // if we split on times or weekdays  then we need to generate daily ranges
  // other wise we just pull the the largest time range we can
  const filterOnTimes = config.times && config.times.length > 0;
  const filterOnWeekdays = config.weekdays && config.weekdays.length > 0;
  const filterOnMonths = config.months && config.months.length > 0;
  const filterOnYears = config.years && config.years.length > 0;
  
  // boolearns to determine if we need finer filtering
  const needsFinerThanYears = filterOnMonths || filterOnWeekdays || filterOnTimes;
  const needsFinerThanMonths = filterOnWeekdays || filterOnTimes;
  const needsFinerThanWeekdays = filterOnTimes;
  
  // If no filters are applied, return the full range
  if (!filterOnTimes && !filterOnWeekdays && !filterOnMonths && !filterOnYears) {
    return [ { start: config.dateRange.start.getTime(), end: config.dateRange.end.getTime() } ];
  }
  
  
  
  
  
  // The way this loop works is to incrementally advance the currentDate pointer
  // depending on how fine of a filter is required. The goal to to produce the
  // largest possible time ranges (so no having daily time ranges if we can do monthly ranges).
  // If no filters we applied, then, then the full range was already returned above.
  // Here we check from largest to smallest filter.
  // So if year filter is applied, we check that first
  // Then, if we don't need any finer filtering, we grab the whole year and advance to next year
  // short-circuiting the rest of the checks.
  // Getting data for a single day already allows for time filtering if needed, so we don't need
  // the extra check for finer filters
  while (currentDate <= endDate) {

    
    // check year filter
    const currentYear = currentDate.getUTCFullYear();
    if (config.years && !config.years.includes(currentYear)) {
      currentDate = advanceDateToNextYear(currentDate); // advances to beginning of next year
      continue;
    }
    
    // the year is fine. 
    // if we don't need any finer filtering, just grab the whole year, and then go to the next year
    if (!needsFinerThanYears) { 
      const yearRange = genOneYearRange(currentDate.getTime());
      ranges.push(yearRange);
      currentDate = advanceDateToNextYear(currentDate);
      continue;
    }
    
    // check month filter
    const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' }) as MonthType;
    if (config.months && !config.months.includes(currentMonth)) {
      currentDate = advanceDateToNextMonth(currentDate); // advances to beginning of next month
      continue;
    }
    
    // the month is fine.
    // if we don't need any finer filtering, just grab the whole month, and then go to the next month
    if (!needsFinerThanMonths) { 
      const monthRange = genOneMonthRange(currentDate.getTime());
      ranges.push(monthRange);
      currentDate = advanceDateToNextMonth(currentDate);
      continue;
    }
    
    // check weekday filter
    const currentWeekday = currentDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }) as DayType;
    if (config.weekdays && !config.weekdays.includes(currentWeekday)) {
      // advance to next day
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      continue;
    }
    
    // 
    
    // generate time ranges for this day
    const dailyRanges = genHoursForOneDay(currentDate.getTime(), config.times, toleranceMs);
    ranges.push(...dailyRanges);
    
    // advance to next day
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }
  
  console.log(`Generated ${ranges.length} time ranges based on pattern.`);
  return ranges;
}
    


export function generateTimeRanges(config: TimeRangeConfig): MillisecondRange[] {
  const ranges: MillisecondRange[] = [];
  
  if (config.type === 'single') {
    return [genOneDayRange(config.singleDate.getTime())];
  }
  
  if (config.type === 'multiple') {
    const range = generatePatternedRanges(config, );
    return parcelRanges(range, 7 * MS_IN_DAY);
  }
    
    
  return ranges;
}
  

