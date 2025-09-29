/* eslint-disable @typescript-eslint/naming-convention */
import { rectangleToGeometry, pointToGeometry } from '../geometry';
import type { RectBounds, PointBounds, EsriGeometryType } from '../geometry';
import type { 
  EsriGetSamplesReturn, 
  EsriGetSamplesReturnError, 
  EsriGetSamplesSample, 
  Variables, 
  EsriInterpolationMethod, 
  CEsriTimeseries, 
  EsriImageServiceSpec,
} from '../types';
import type { AggValue, DataPointError, MillisecondRange } from "../../types";
import {nanmean, diff} from './array_math';
import { EsriSampler } from './sampling';

// ============================================================================
// TYPES
// ============================================================================

export interface FetchOptions {
  sampleCount?: number;
  interpolation?: EsriInterpolationMethod;
  returnFirstValueOnly?: boolean;
  outFields?: string | string[];
  sliceID?: string | number;
}


export type TimeRanges = MillisecondRange | MillisecondRange[];

export interface RawSampleData {
  samples: CEsriTimeseries[];
  metadata: {
    totalSamples: number;
    timeRange: MillisecondRange | MillisecondRange[];
    geometry: RectBounds | PointBounds;
    geometryType: 'rectangle' | 'point';
  };
}

export interface TimeSeriesData {
  values: Record<number, AggValue>;
  errors: Record<number, DataPointError>;
  locations: Array<{ x: number; y: number }>;
  geometryType: 'rectangle' | 'point';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function safeParseNumber(value: string | null | undefined): number | null {
  if (value === null || value === '' || value === undefined) return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

function stringifyEsriGetSamplesParameters(params: {
  geometry: ReturnType<typeof rectangleToGeometry> | ReturnType<typeof pointToGeometry>;
  geometryType: EsriGeometryType;
  sampleDistance?: number;
  sampleCount?: number;
  mosaicRule?: string | Record<string, unknown>;
  pixelSize?: number;
  returnFirstValueOnly?: boolean;
  interpolation: EsriInterpolationMethod;
  outFields?: string | string[];
  sliceID?: string | number;
  time?: string | [number, number] | [Date, Date];
  f: 'pjson';
}): URLSearchParams {
  const {
    geometry,
    geometryType,
    sampleDistance,
    sampleCount,
    mosaicRule,
    pixelSize,
    returnFirstValueOnly,
    interpolation,
    outFields,
    sliceID,
    time,
  } = params;
  
  const options: Record<string, string> = {
    f: 'pjson',
    geometry: JSON.stringify(geometry),
    geometryType: geometryType,
    interpolation: interpolation,
  };

  if (sampleDistance) options.sampleDistance = sampleDistance.toString();
  if (sampleCount) options.sampleCount = sampleCount.toString();
  if (mosaicRule) options.mosaicRule = JSON.stringify(mosaicRule);
  if (pixelSize) options.pixelSize = pixelSize.toString();
  if (returnFirstValueOnly !== undefined) options.returnFirstValueOnly = returnFirstValueOnly.toString();
  if (outFields) options.outFields = Array.isArray(outFields) ? outFields.join(',') : outFields;
  if (sliceID !== undefined) options.sliceID = sliceID.toString();
  if (time) {
    const timeStr = Array.isArray(time)
      ? time.map((t) => (t instanceof Date ? t.getTime() : t)).join(',')
      : time;
    options.time = timeStr;
  }

  return new URLSearchParams(options);
}

// ============================================================================
// TEMPO DATA SERVICE
// ============================================================================

export class TempoDataService {
  private baseUrl: string;
  private variable: Variables | string;
  private metadataCache: EsriImageServiceSpec | null = null;
  private _loadingMetadata: boolean = false;
  
  constructor(baseUrl: string, variable: Variables | string = "NO2_Troposphere") {
    this.baseUrl = baseUrl;
    this.variable = variable;
    this.updateMetadataCache();
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  setVariable(variable: Variables | string): void {
    this.variable = variable;
  }

  getVariable(): Variables | string {
    return this.variable;
  }

  setBaseUrl(baseUrl: string): void {
    if (this.baseUrl === baseUrl) return;
    this.baseUrl = baseUrl;
    this.updateMetadataCache();
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private async _getServiceMetadata(): Promise<EsriImageServiceSpec> {
    const url = `${this.baseUrl}?f=json`;
    return fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .catch((error) => {
        console.error('Error fetching service metadata:', error);
        throw error;
      });
  }
  
  async updateMetadataCache() {
    // in general we really should invalidate the cache when the URL changes
    // however, we know that for this purpose, the grid is identical for all
    // the various services we may access, so ease of use, we will always have a metaDataCache
    // available. 
    // this.metadataCache = null; // Invalidate cache
    this._loadingMetadata = true;
    this.metadataCache = await this._getServiceMetadata();
    this._loadingMetadata = false;
    console.log('Service metadata updated:', this.metadataCache);
    return this.metadataCache;
  }
  
  getMetadata(): EsriImageServiceSpec {
    if (!this.metadataCache) {
      if (this._loadingMetadata) {
        throw new Error('Metadata is currently loading. Please wait and try again.');
      }
      throw new Error('Metadata not loaded yet. Call updateMetadataCache() first.');
    }
    return this.metadataCache;
  }
  
  get meta(): EsriImageServiceSpec | null {
    return this.metadataCache;
  }
  
  async withMetadataCache(): Promise<EsriImageServiceSpec> {
    if (this.metadataCache) {
      return this.metadataCache;
    }
    if (this._loadingMetadata) {
      // Wait until loading is done. Check eveery 100ms
      while (this._loadingMetadata) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (this.metadataCache) {
        return this.metadataCache;
      } else {
        throw new Error('Failed to load metadata.');
      }
    }
    return this.updateMetadataCache();
  }
  

  // ============================================================================
  // CORE DATA FETCHING
  // ============================================================================
  /**
   * Fetch raw samples from the ESRI Image Server
   */
  async fetchSample(
    geometry: RectBounds | PointBounds,
    timeRange: MillisecondRange,
    options: FetchOptions = {}
  ): Promise<RawSampleData> {
    const esriGeometry = this.isRectBounds(geometry) 
      ? rectangleToGeometry(geometry as RectBounds)
      : pointToGeometry(geometry as PointBounds);

    const geometryType: EsriGeometryType = this.isRectBounds(geometry)
      ? 'esriGeometryPolygon'
      : 'esriGeometryPoint';

    // Handle multiple time ranges by combining them
    const timeString = `${timeRange.start},${timeRange.end}`;
    
    // log sample geometry type and time range
    console.log(`Fetching samples for geometry type: ${geometryType}, time range: ${timeString}`);


    const params = {
      f: 'pjson' as const,
      interpolation: 'RSP_NearestNeighbor' as EsriInterpolationMethod,
      returnFirstValueOnly: false,
      geometry: esriGeometry,
      geometryType: geometryType,
      time: timeString,
      sampleCount: options.sampleCount || 30, // 100 is the Esri default. 30 has been our default
      ...options
    };

    const urlWithParams = `${this.baseUrl}/getSamples/?${stringifyEsriGetSamplesParameters(params).toString()}`;
    
    try {
      const response = await fetch(urlWithParams);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data: EsriGetSamplesReturn | EsriGetSamplesReturnError = await response.json();
      
      if ('error' in data) {
        throw new Error(`Error fetching samples (${data.error.code}): ${data.error.message} ${data.error.details}`);
      }

      const processedSamples = data.samples.map((sample: EsriGetSamplesSample) => ({
        x: sample.location.x,
        y: sample.location.y,
        time: sample.attributes.StdTime,
        date: new Date(sample.attributes.StdTime),
        variable: safeParseNumber(sample.attributes[this.variable] ?? ''),
        value: safeParseNumber(sample.value),
        locationId: sample.locationId,
        geometryType: this.isRectBounds(geometry) ? 'rectangle' : 'point' as 'rectangle' | 'point'
      })); // this is a CEsriTimeseries[]
      console.log(`Fetched ${processedSamples.length} samples for time range ${timeRange.start}-${timeRange.end}`);
      return {
        samples: processedSamples,
        metadata: {
          totalSamples: processedSamples.length,
          timeRange: timeRange,
          geometry,
          geometryType: this.isRectBounds(geometry) ? 'rectangle' : 'point'
        }
      };
    } catch (error) {
      console.error('Error in TempoDataService.fetchSamples:', params);
      throw error;
    }
  }
  
  /**
   * Fetch raw samples from the ESRI Image Server
   */
  async fetchSamples(
    geometry: RectBounds | PointBounds,
    timeRanges: TimeRanges,
    options: FetchOptions = {}
  ): Promise<RawSampleData> {
    
    if (!Array.isArray(timeRanges)) {
      return this.fetchSample(geometry, timeRanges, options);
    }
    
    const promises = timeRanges.map(async (tr) => {
      try {
        return await this.fetchSample(geometry, tr, options);
      } catch (error) {
        console.error(`Error fetching sample for time range ${tr.start}-${tr.end}:`, error);
        return null;
      }
    });

    return Promise.all(promises).then((results) => {
      const validResults = results.filter((result): result is RawSampleData => result !== null);
      const samples = validResults.map((result) => result.samples).flat();
      console.log(`Total samples fetched across all time ranges: ${samples.length}`);
      console.log(samples);
      return {
        samples,
        metadata: {
          totalSamples: samples.length,
          timeRange: timeRanges,
          geometry: geometry,
          geometryType: this.isRectBounds(geometry) ? 'rectangle' : 'point',
        }
      } as RawSampleData;
    });
  }

  // ============================================================================
  // AGGREGATION METHODS
  // ============================================================================

  /**
   * Aggregate samples by time (for rectangle areas)
   */
  aggregateByTime(samples: CEsriTimeseries[]): TimeSeriesData {
    // Group samples by time
    const grouped = new Map<number, CEsriTimeseries[]>();
    samples.forEach((sample) => {
      if (!grouped.has(sample.time)) {
        grouped.set(sample.time, []);
      }
      grouped.get(sample.time)?.push(sample);
    });

    // Calculate aggregated values
    const values: Record<number, AggValue> = {};
    const errors: Record<number, DataPointError> = {};
    
    grouped.forEach((samples, time) => {
      const sampleValues = samples.map(s => s.value);
      values[time] = this.calculateMean(sampleValues, time);
      errors[time] = this.calculateError(sampleValues);
    });

    // Collect unique locations
    const seen = new Set<string>();
    const locations: Array<{ x: number; y: number }> = [];
    for (const sample of samples) {
      const key = `${sample.x},${sample.y}`;
      if (!seen.has(key)) {
        seen.add(key);
        locations.push({ x: sample.x, y: sample.y });
      }
    }

    return { values, errors, locations, geometryType: samples[0].geometryType };
  }

  /**
   * Get single point data (for center points or individual points)
   */
  // aggregatePoint(samples: CEsriTimeseries[]): TimeSeriesData | null {
  //   if (samples.length === 0) return null;
    
  //   // For point data, we typically expect one sample per time
  //   // Group by time and aggregate
  //   const grouped = new Map<number, CEsriTimeseries[]>();
  //   samples.forEach((sample) => {
  //     if (!grouped.has(sample.time)) {
  //       grouped.set(sample.time, []);
  //     }
  //     grouped.get(sample.time)?.push(sample);
  //   });

  //   // Calculate aggregated values
  //   const values: Record<number, AggValue> = {};
  //   const errors: Record<number, DataPointError> = {};
    
  //   grouped.forEach((samples, time) => {
  //     const sampleValues = samples.map(s => s.value);
  //     values[time] = this.calculateMean(sampleValues, time);
  //     errors[time] = this.calculateError(sampleValues);
  //   });

  //   // For point data, we expect only one location
  //   const locations: Array<{ x: number; y: number }> = [];
  //   if (samples.length > 0) {
  //     const sample = samples[0];
  //     locations.push({ x: sample.x, y: sample.y });
  //   }

  //   return { values, errors, locations };
  // }

  // ============================================================================
  // CONVENIENCE METHODS
  // ============================================================================
  
  getTimeSeriesStatistics(jsonData: RawSampleData) {
    const samples = jsonData.samples || [];
    
    const uniqueLocations = new Set();
    const uniqueLatitudes = new Set<number>();
    const uniqueLongitudes = new Set<number>();
    const valuesPerLocation = {};
    
    for (const sample of samples) {
      const location = {x: sample.x, y: sample.y};
      const locString = `${location.x},${location.y}`;
      if (location) {
        // Use a string representation for unique locations in the Set
        uniqueLocations.add(locString);
        uniqueLatitudes.add(location.y);
        uniqueLongitudes.add(location.x);
      }
      
      valuesPerLocation[locString] = (valuesPerLocation[locString] || 0) + 1;

    }
    
    const totalValues = samples.length;
    const numUniqueLocations = uniqueLocations.size;
    
    const latitudeSpacing = diff([...uniqueLatitudes].sort());
    const longitudeSpacing = diff([...uniqueLongitudes].sort());
    
    
    
    return {
      numUniqueLocations,
      totalValues,
      valuesPerLocation,
      latitudeSpacing: nanmean(latitudeSpacing),
      longitudeSpacing: nanmean(longitudeSpacing),
    };
  }
  
  /**
   * Fetch and aggragate any valid geometry data (rectangle or point)
   */
  async fetchTimeseriesData(
    geometry: RectBounds | PointBounds,
    timeRanges: TimeRanges,
    options: FetchOptions = {}
  ): Promise<TimeSeriesData> {
    if (this.isRectBounds(geometry) && this.meta) {
      const sampler = new EsriSampler(this.meta, geometry);
      const sampleCount = options.sampleCount || 30;
      console.log(`Requested sample count: ${sampleCount}`);
      options.sampleCount = sampler.getSamplingSpecificationFromSampleCount(sampleCount).count;
      console.log(`Using sample count: ${options.sampleCount}`);
    }
    const rawData = await this.fetchSamples(geometry, timeRanges, options);
    const stats = this.getTimeSeriesStatistics(rawData);
    console.log(`Data is sampled from ${stats.numUniqueLocations} unique locations with a total of ${stats.totalValues} values.`);
    
    console.log(`Approximate spacing between unique locations: ${stats.latitudeSpacing?.toFixed(4)}° latitude, ${stats.longitudeSpacing?.toFixed(4)}° longitude`);
    return this.aggregateByTime(rawData.samples);
  }
  
  /**
   * Fetch and aggregate rectangle data (current fetchRectangleSamples equivalent)
   */
  // async fetchRectangleTimeseries(
  //   rectangle: RectBounds,
  //   timeRanges: TimeRanges,
  //   options: FetchOptions = {}
  // ): Promise<TimeSeriesData> {
  //   const rawData = await this.fetchSamples(rectangle, timeRanges, options);
  //   return this.aggregateByTime(rawData.samples);
  // }

  /**
   * Fetch and aggregate point data (current fetchCenterPointSample equivalent)
   */
  // async fetchPointTimeseries(
  //   point: PointBounds,
  //   timeRanges: TimeRanges,
  //   options: FetchOptions = {}
  // ): Promise<TimeSeriesData | null> {
  //   const rawData = await this.fetchSamples(point, timeRanges, options);
  //   return this.aggregatePoint(rawData.samples);
  // }

  /**
   * Get center point of rectangle and fetch data for it
   */
  async fetchCenterPointData(
    rectangle: RectBounds,
    timeRanges: TimeRanges,
    options: FetchOptions = {}
  ): Promise<TimeSeriesData | null> {
    const center: PointBounds = {
      x: (rectangle.xmin + rectangle.xmax) / 2,
      y: (rectangle.ymin + rectangle.ymax) / 2
    };
    
    return this.fetchTimeseriesData(center, timeRanges, options);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private isRectBounds(geometry: RectBounds | PointBounds): geometry is RectBounds {
    return 'xmin' in geometry && 'xmax' in geometry && 'ymin' in geometry && 'ymax' in geometry;
  }

  private calculateMean(samples: (number | null)[], time: number): AggValue {
    const validSamples = samples.filter((sample) => sample !== null);
    if (validSamples.length === 0) return { value: null, date: new Date(time) };
    const sum = validSamples.reduce((acc, val) => acc + (val ?? 0), 0);
    return { value: sum / validSamples.length, date: new Date(time) };
  }

  private calculateError(samples: (number | null)[]): DataPointError {
    const validSamples = samples.filter((sample) => sample !== null);
    if (validSamples.length === 0) return { lower: null, upper: null };
    
    const mean = validSamples.reduce((acc, val) => acc + (val ?? 0), 0) / validSamples.length;
    const squaredDiffs = validSamples.map((sample) => {
      if (sample === null) return 0;
      return Math.pow(sample - mean, 2);
    });
    // squared standard error of the mean = variance / n
    const squaredSEM = squaredDiffs.reduce((acc, val) => acc + val, 0) / Math.pow(validSamples.length, 2);
    
    return { lower: Math.sqrt(squaredSEM), upper: Math.sqrt(squaredSEM) };
  }
} 