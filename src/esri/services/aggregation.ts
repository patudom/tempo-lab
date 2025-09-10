/* eslint-disable @typescript-eslint/no-unused-vars */
/** A set of generic routines for aggregating data that comes from 
 * our Tempo Data Serivce
*/

import type { Prettify } from "@/types";
import type { RawSampleData } from "./TempoDataService";
import type { CEsriTimeseries } from "../types";
// import type { TimeSeriesData } from "./TempoDataService";
import type { AggValue, DataPointError } from "@/types";
import { toZonedTime, fromZonedTime, format as formatTz } from 'date-fns-tz';
import {
  nan2null,
  nanmean,
  nanstandardError,
  nansum,
  diff
} from "./array_math";
import { Data } from "plotly.js-dist-min";

export interface TimeSeriesData {
  values: Record<number, AggValue>;
  errors: Record<number, DataPointError>;
  locations: Array<{ x: number; y: number }>;
  geometryType: 'rectangle' | 'point';
}

// a flexible aggregation
// aggregation options
// daily, multi-day, weekly

// https://www.geeksforgeeks.org/javascript/calculate-current-week-number-in-javascript/
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


function getBeginningOfWeek(date: Date, timezone?: string): Date {
  const zonedDate = timezone ? toZonedTime(date, timezone) : date;
  const day = zonedDate.getDay(); // 0 (Sun) to 6 (Sat)
  const diff = zonedDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  const weekStart = new Date(zonedDate);
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);
  return timezone ? toZonedTime(weekStart, timezone) : weekStart;
}

function getEndOfWeek(date: Date, timezone?: string): Date {
  const zonedDate = timezone ? toZonedTime(date, timezone) : date;
  const day = zonedDate.getDay(); // 0 (Sun) to 6 (Sat)
  const diff = zonedDate.getDate() - day + (day === 0 ? 0 : 7); // adjust when day is Sunday
  const weekEnd = new Date(zonedDate);
  weekEnd.setDate(diff);
  weekEnd.setHours(23, 59, 59, 999);
  return timezone ? toZonedTime(weekEnd, timezone) : weekEnd;
}

function sumOfSquares(x: number[]): number {
  return nansum(x.map(v => v * v));
}

function ul2sig(u: number | null, l: number | null): number | null {
  if (u === null || l === null) return null;
  return (u - l) / 2;
}

type Window = string ; // e.g, '1d', '3d', '1w' , 'weekly'

export class Grouper {
  window: Window;
  timezone?: string;

  constructor(window: Window, timezone?: string) {
    this.window = window;
    this.timezone = timezone;
  }

  // have a goupers for weekly, daily, monthly
  // formats are '1d', '3d', '7d', '1w', '1m'
  // or numbers in milliseconds
  getGroupId(date: Date): string {
    const zonedDate = this.timezone ? toZonedTime(date, this.timezone) : date;
    // check the window type
    if (this.window.endsWith('d')) {
      const days = parseInt(this.window.slice(0, -1));
      const day = zonedDate.getDate();
      const groupDay = Math.floor((day - 1) / days) * days + 1;
      const groupDate = new Date(zonedDate);
      groupDate.setDate(groupDay);
      groupDate.setHours(0, 0, 0, 0);
      return this.timezone ? formatTz(groupDate, 'yyyy-MM-dd', { timeZone: this.timezone }) : formatTz(groupDate, 'yyyy-MM-dd');
    }
    if (this.window === '1w' || this.window === 'weekly') {
      const weekStart = getBeginningOfWeek(zonedDate, this.timezone);
      return this.timezone ? formatTz(weekStart, 'yyyy-MM-dd', { timeZone: this.timezone }) : formatTz(weekStart, 'yyyy-MM-dd');
    }
    if (this.window === '1m' || this.window === 'monthly') {
      const groupDate = new Date(zonedDate);
      groupDate.setDate(1);
      groupDate.setHours(0, 0, 0, 0);
      return this.timezone ? formatTz(groupDate, 'yyyy-MM', { timeZone: this.timezone }) : formatTz(groupDate, 'yyyy-MM');
    }
    // default to daily
    const groupDate = new Date(zonedDate);
    groupDate.setHours(0, 0, 0, 0);
    return this.timezone ? formatTz(groupDate, 'yyyy-MM-dd', { timeZone: this.timezone }) : formatTz(groupDate, 'yyyy-MM-dd');
  }
  
  // Aggregates data and returns TimeSeriesData
  groupData(timeseries: Prettify<TimeSeriesData>): TimeSeriesData {
    const data = Object.values(timeseries.values); // AggValue[]
    const error = Object.values(timeseries.errors); // DataPointError[] | undefined
    
    // create the group keys we will need
    const groups: { [key: string]: AggValue[] } = {};
    data.forEach(d => {
      const groupId = this.getGroupId(d.date);
      if (!groups[groupId]) {
        groups[groupId] = [];
      }
      groups[groupId].push(d);
    });

    const values: Record<number, AggValue> = {};
    const errors: Record<number, DataPointError> = {};

    for (const groupId in groups) {
      const groupData = groups[groupId];
      // using the timezone might be a mistake :|. if so try the mean timestamp??
      const zonedDate = this.timezone ? toZonedTime(new Date(groupId), this.timezone) : new Date(groupId);
      const timestamp = zonedDate.getTime(); // cuz this is gonna be all utc

      const groupValues = groupData.map(d => d.value);
      values[timestamp] = { value: nanmean(groupValues), date: zonedDate };

      if (error) {
        const groupErrors = error.filter((e, idx) => this.getGroupId(data[idx].date) === groupId);
        const lowers = groupErrors.map(e => e.lower);
        const uppers = groupErrors.map(e => e.upper);
        const sigmas = uppers.map((u, i) => ul2sig(u, lowers[i])).filter(v => v !== null) as number[];
        const meanSigma = Math.sqrt(sumOfSquares(sigmas)) / sigmas.length;
        errors[timestamp] = {
          lower: values[timestamp].value ? values[timestamp].value - meanSigma : null,
          upper: values[timestamp].value ? values[timestamp].value + meanSigma : null,
        };
      } else {
        errors[timestamp] = { lower: null, upper: null };
      }
    }

    return {
      values,
      errors,
      locations: timeseries.locations,
      geometryType: timeseries.geometryType
    };
  }
}
