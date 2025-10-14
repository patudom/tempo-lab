
/* eslint-disable @typescript-eslint/no-unused-vars */
/** Home of two base classses for binning and / or folding time sereis data.
*/

import type { Prettify } from "@/types";
import type { RawSampleData } from "@/esri/services/TempoDataService";
import type { CEsriTimeseries } from "@/esri/types";
// import type { TimeSeriesData } from "./TempoDataService";
import type { AggValue, DataPointError } from "@/types";
import { 
  toZonedTime, // returns a Date object where the time is ajusted
  fromZonedTime, 
  format as formatTz,
  formatInTimeZone
} from 'date-fns-tz';
import {
  nan2null,
  nanmean,
  nanstandardError,
  nanstdev,
  nansum,
  nanmedian,
  nanmad,
  nanmin,
  nanmax,
  nanRootMeanSquare,
  clip,
} from "../../utils/array_operations/array_math";

function getBeginningOfWeek(date: Date, timezone?: string): Date {
  const zonedDate = timezone ? toZonedTime(date, timezone) : date;
  const day = zonedDate.getDay(); // 0 (Sun) to 6 (Sat)
  const weekStart = new Date(zonedDate);
  weekStart.setDate(zonedDate.getDate() - day); // move back to sunday
  weekStart.setHours(0, 0, 0, 0);
  // want this to return the UTC time (so we can use the timestamp if we want)
  return timezone ? fromZonedTime(weekStart, timezone) : weekStart;
}

function getEndOfWeek(date: Date, timezone?: string): Date {
  const zonedDate = timezone ? toZonedTime(date, timezone) : date;
  const day = zonedDate.getDay();
  const weekEnd = new Date(zonedDate);
  // Move to Saturday (day 6) then set end of day
  weekEnd.setDate(zonedDate.getDate() + (6 - day));
  weekEnd.setHours(23, 59, 59, 999);
  return timezone ? fromZonedTime(weekEnd, timezone) : weekEnd;
}

/** https://www.geeksforgeeks.org/javascript/calculate-current-week-number-in-javascript/
* getWeekoOfYear for Date object
* If you have a UTC/js timestamp, and want the day of week for a 
* specfic timezone
*/
function getWeekOfYear(date: Date) {
  const currentDate = 
    (typeof date === 'object') ? date : new Date();
  const januaryFirst = 
    new Date(currentDate.getFullYear(), 0, 1);
  const daysToNextMonday = 
    (januaryFirst.getDay() === 1) ? 0 : 
      (7 - januaryFirst.getDay()) % 7;
  const nextMonday = 
    new Date(currentDate.getFullYear(), 0, 
      januaryFirst.getDate() + daysToNextMonday);

  return (currentDate < nextMonday) ? 52 : 
    (currentDate > nextMonday ? Math.ceil(
      (currentDate.getTime() - nextMonday.getTime()) / (24 * 3600 * 1000) / 7) : 1);
}

/**
 * Helper to get number of days in a month
 * @param month 1-12 for Jan-Dec
 * @param year full year e.g. 2023
 * @returns number of days in the month
 */
function daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
}

function getDaysInMonth(date: Date): number {
  return daysInMonth(date.getMonth() + 1, date.getFullYear());
}

function getDaysInYear(date: Date): number {
  const year = date.getFullYear();
  return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0) ? 366 : 365;
}

function seasonFraction(date: Date): number {
  // D=12, J=1, F=2, M=3, A=4, M=5, J=6, J=7, A=8, S=9, O=10, N=11
  // D=11, J=0, F=1, M=2, A=3, M=4, J=5, J=6, A=7, S=8, O=9, N=10 (0-based)
  const month = date.getMonth();
  const seasonStartingMonths = [11, 2, 5, 8]; // Dec-11, Mar-2, Jun-5, Sep-8
  const seasonEndingMonths = [1, 4, 7, 10]; // Feb-1, May-4, Aug-7, Nov-10
  const season = Math.floor(((month + 1) / 3) % 4); // 0, 1, 2, 3 for DJF, MAM, JJA, SON

  const yearOff = season === 0 ? 1 : 0; // if DJF, then year offset is 1
  const seasonStart = new Date(
    date.getFullYear() - yearOff, 
    seasonStartingMonths[season], 1).getTime(); // Dec 1 of previous year
  const seasonEnd = new Date(
    date.getFullYear(),
    seasonEndingMonths[season] +1 , -1, 23, 59, 59, 999).getTime(); // Last day of Feb
  const seasonFrac = (date.getTime() - seasonStart) / (seasonEnd - seasonStart);
  return seasonFrac;
  
}

export interface TimeSeriesData {
  values: Record<number, AggValue>;
  errors: Record<number, DataPointError>;
}

type TimeBin = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'yearly' | string;
type AggregationMethod = 'mean' | 'median' | 'min' | 'max';
type ErrorMethod = 'stddev' | 'sem' | 'mad';
type TimeZonedDate = Date;




export class BinData {
  _window: TimeBin;
  timezone?: string;
  method: AggregationMethod;
  errorMethod: ErrorMethod = 'sem'; // standard deviation or standard error of the mean
  includeCalibrationUncertainty = true; // whether to include calibration uncertainty in the error propagation

  constructor(
    window: TimeBin, 
    timezone: string = 'UTC', 
    method: AggregationMethod = 'mean',
    errorMethod: ErrorMethod = 'sem',
    includeCalibrationUncertainty = true
  ) {
    console.log("Creating Grouper with window:", window, "timezone:", timezone, "method:", method);
    this._window = window;
    this.timezone = timezone;
    this.method = method;
    this.errorMethod = errorMethod;
    this.includeCalibrationUncertainty = includeCalibrationUncertainty;
    if (includeCalibrationUncertainty) {
      console.error('This may not handle NaN values in the errors correctly which can lead to Zero values for errors');
    }
  }
  
  get window(): TimeBin {
    switch(this._window) {
    case 'hourly':
      return '1h';
    case 'daily':
      return '1d';
    case 'weekly':
      return '1w';
    case 'monthly':
      return '1m';
    case 'seasonal':
      return 'seasonal';
    case 'yearly':
      return '1y';
    default:
      return this._window;
    }
  }
  
  private _getZonedDate(date: Date): Date {
    return this.timezone ? toZonedTime(date, this.timezone) : date;
  }

  getGroupId(date: Date): string {
    const zonedDate = this._getZonedDate(date);
    const groupDate = new Date(zonedDate);
    
    // handle daily or multi-day
    if (this.window.endsWith('d')) {
      const days = parseInt(this.window.slice(0, -1));
      const day = zonedDate.getDate();
      const groupDay = Math.floor((day - 1) / days) * days + 1;
      groupDate.setDate(groupDay);
      groupDate.setHours(0, 0, 0, 0);
      
      // handle weekly
    } else if (this.window === '1w' || this.window === 'weekly') {
      const weekStart = getBeginningOfWeek(date, this.timezone);
      return String(weekStart.getTime());
      
      // handly monthly
    } else if (this.window === '1m' || this.window === 'monthly') {
      groupDate.setDate(1);
      groupDate.setHours(0, 0, 0, 0);
      
      // default to daily
    } else if (this.window == 'seasonal') {
      // seasons = DJF, MAM, JJA, SON :
      const month = zonedDate.getMonth();
      const season = Math.floor(( (month+1) / 3) % 4); // 0, 1, 2, 3 for DJF, MAM, JJA, SON
      const seasonMidMonth = season * 3 + 1; // 1, 4, 7, 10 // Jan, Apr, Jul, Oct (avoid year change)
      groupDate.setMonth(seasonMidMonth);
      groupDate.setDate(15); // middle of the month (avoid utc issues)
      groupDate.setHours(12, 0, 0, 0);
    } else {
      groupDate.setHours(0, 0, 0, 0);
    }
    const utcMidnight = this.timezone ? fromZonedTime(groupDate, this.timezone) : groupDate;
    return String(utcMidnight.getTime());
  }
  
  aggMethod(values: (number | null)[]): number | null {
    let aggregatedValue: number | null;
    switch (this.method) {
    case 'mean':
      aggregatedValue = nanmean(values);
      break;
    case 'median':
      aggregatedValue = nanmedian(values);
      break;
    case 'min':
      aggregatedValue = nanmin(values);
      break;
    case 'max':
      aggregatedValue = nanmax(values);
      break;
    default:
      aggregatedValue = nanmean(values);
    }
    return aggregatedValue;
  }
  
  errMethod(values: (number | null)[]): number | null {
    let errorValue: number | null;
    switch (this.errorMethod) {
    case 'sem':
      errorValue = nanstandardError(values);
      break;
    case 'stddev':
      errorValue = nanstdev(values);
      break;
    case 'mad':
      errorValue = nanmad(values);
      if (errorValue !== null) {
        errorValue *= 1.4826; // scale factor for normal distribution
      }
      break;
    default:
      errorValue = nanstdev(values);
    }
    return errorValue;
  }
  
  calibrationError(values: DataPointError[]): { lower: number | null; upper: number | null } {
    if (values.length === 0) {
      return { lower: null, upper: null };
    }
    const lowers = values.map(e => e.lower).filter(v => v !== null) as number[];
    const uppers = values.map(e => e.upper).filter(v => v !== null) as number[];
    return {
      lower: nanRootMeanSquare(lowers),
      upper: nanRootMeanSquare(uppers)
    };
  }
  
  groupData(timeseries: Prettify<TimeSeriesData>): Omit<TimeSeriesData, 'locations' | 'geometryType'> {
    console.log("Grouping data with window:", this.window, "and method:", this.method);
    // the data and the error are in the same order
    const data = Object.values(timeseries.values); // AggValue[]
    const error = Object.values(timeseries.errors); // DataPointError[] | undefined
    
    // colate the data and errors into groups (bins)
    const groups: { [key: string]: { values: AggValue[]; errors: DataPointError[] } } = {};
    data.forEach((d, idx) => {
      const groupId = this.getGroupId(d.date);
      if (!groups[groupId]) {
        groups[groupId] = { values: [], errors: [] };
      }
      groups[groupId].values.push(d);
      if (error) {
        groups[groupId].errors.push(error[idx]);
      }
    });

    // these will be the time-aggregated values
    const values: Record<number, AggValue> = {};
    const errors: Record<number, DataPointError> = {};
    
    // loop over the groups
    for (const groupId in groups) {
      const groupData = groups[groupId];
      const timestamp = parseInt(groupId); // this is the UTC for the start of the group

      const groupValues = groupData.values.map(d => d.value);
      const aggregatedValue = this.aggMethod(groupValues);
      
      values[timestamp] = { value: aggregatedValue, date: new Date(timestamp) };
      
      const dataError = this.errMethod(groupValues);
      if (!dataError) {
        console.error(
          'Standard error is null for group', 
          formatInTimeZone(new Date(timestamp), this.timezone ?? 'UTC', "yyyy-mm-dd"), 
          'with values', groupValues);
      }
      
      const calibError = this.calibrationError(groupData.errors);
      const newLower = calibError.lower;
      const newUpper = calibError.upper;
      
      if (!calibError.lower || !calibError.upper) {
        console.error(
          'Calibration error is null for group', 
          formatInTimeZone(new Date(timestamp), this.timezone ?? 'UTC', "yyyy-mm-dd"), 
          'with errors', groupData.errors);
      }
      
      errors[timestamp] = {
        lower: nan2null(nanRootMeanSquare([dataError, newLower])),
        upper: nan2null(nanRootMeanSquare([dataError, newUpper]))
      };

      // end of loop over groups
    }
    
    return {
      values,
      errors,
    };
  }
}


export interface FoldedTimeSeriesData {
  phases: number[];
  values: (number | null)[];
  errors: {
    lower: (number | null)[];
    upper: (number | null)[];
  };
  originalTimestamps: number[];  // to preserve original time info
}


type FoldingPeriod = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'yearly' | string;
/**
 * Allow use to speficy a period for folding the data
 * This generally means an epoch start and a period
 * Let's set some defautlts
 * 
 */

export class FoldData {
  _period: FoldingPeriod;
  timezone?: string;

  constructor(period: FoldingPeriod, timezone: string = 'UTC') {
    console.log("Creating Folder with period:", period, "timezone:", timezone);
    this._period = period;
    this.timezone = timezone;
  }
  
  get period(): FoldingPeriod {
    return this._period;
  }
  
  private _getZonedDate(date: Date): Date {
    return this.timezone ? toZonedTime(date, this.timezone) : date;
  }
  
  getFoldedPhase(date: Date) {
    const zonedDate = this._getZonedDate(date);
    const foldDate = new Date(zonedDate);
    
    if (this.period === 'hourly' || this.period === '1h') {
      // return minutes within the hour
      return zonedDate.getMinutes() + (zonedDate.getSeconds() / 60) + (zonedDate.getMilliseconds() / 6000);
      
    } else if (this.period === 'daily' || this.period === '1d') {
      // return hours within the day
      const dayFrac = (zonedDate.getHours() + zonedDate.getMinutes() / 60) / 24;
      return dayFrac * 24;
    
    } else if (this.period === 'weekly' || this.period === '1w') {
      // Return hours within the week (0-167.999...)
      const dayOfWeek = zonedDate.getDay(); // 0 (Sun) to 6 (Sat)
      const hourOfDay = zonedDate.getHours() + zonedDate.getMinutes() / 60 + zonedDate.getSeconds() / 3600;
      return dayOfWeek * 24 + hourOfDay;
      
    } else if (this.period === 'monthly' || this.period === '1m') {
      // Return day of month 
      const dayOfMonth = zonedDate.getDate() - 1; // 0-based
      const hourOfDay = zonedDate.getHours() + zonedDate.getMinutes() / 60 + zonedDate.getSeconds() / 3600;
      return dayOfMonth + hourOfDay / 24;
        
    } else if (this.period == 'seasonal') {
      return seasonFraction(zonedDate);
    
    } else if (this.period === 'yearly' || this.period === '1y') {
      // Return day of year
      const yearStart = new Date(zonedDate.getFullYear(), 0, 1).getTime();
      const dayOfYear = (zonedDate.getTime() - yearStart) / (1000 * 60 * 60 * 24);
      return dayOfYear;
      
    } else {
      console.warn("Unknown folding period:", this.period, "defaulting to daily");
      return (zonedDate.getHours() + zonedDate.getMinutes() / 60) / 24;
    }
  }
  
  
  
  foldData(timeseries: Prettify<TimeSeriesData>): FoldedTimeSeriesData {
    console.log("Folding data with period:", this.period);
    // the data and the error are in the same order
    const phases: number[] = [];
    const values: (number | null)[] = [];
    const lowers: (number | null)[] = [];
    const uppers: (number | null)[] = [];
    const originalTimestamps: number[] = [];
    
    Object.entries(timeseries.values).forEach(([ts, d]) => {
      const phase = this.getFoldedPhase(d.date);
      
      phases.push(phase);
      values.push(d.value);
      originalTimestamps.push(parseInt(ts));
      
      const err = timeseries.errors[ts];
      lowers.push(err.lower);
      uppers.push(err.upper);
    });
    
    return {
      phases,
      values,
      errors: {
        lower: lowers,
        upper: uppers
      },
      originalTimestamps
    };
    
    
  }
}