/* eslint-disable @typescript-eslint/naming-convention */
// import L from 'leaflet';
// import * as esri from 'esri-leaflet';

// const earthdataRestSerivceURL = "https://gis.earthdata.nasa.gov/image/rest/services/C2930763263-LARC_CLOUD/TEMPO_NO2_L3_V03_HOURLY_TROPOSPHERIC_VERTICAL_COLUMN/ImageServer";
import { type ImageMapLayer } from 'esri-leaflet';
import { Variables } from './types';

type ColorRamps = "Magma" | "Inferno" | "Plasma" | "Viridis" | "Gray" | "Hillshade";

type PixelType = Parameters<ImageMapLayer['setPixelType']>[0];

interface RasterFunctionObject {
  rasterFunction: string;
  variableName?: string; // Optional, as it might be implied or set by composition
  rasterFunctionArguments?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
    Raster?: RasterFunctionObject | { variableName: string }; // Input can be another function or the base 'Raster'
  };
  outputPixelType?: PixelType;
}

// https://developers.arcgis.com/rest/services-reference/enterprise/raster-function-objects/
// https://developers.arcgis.com/rest/services-reference/enterprise/raster-function-objects/#resample
export function _stretchRule(min: number, max: number): RasterFunctionObject {
  return {
    'rasterFunction': 'Stretch',
    'outputPixelType': 'U8' as PixelType, 
    'variableName': 'Raster',
    'rasterFunctionArguments': {
      'StretchType': 5,
      'Statistics': [[
        min, // max
        max, // min
        0,0
      ]],
      'DRA': false,
      'UseGamma': false,
      'Gamma': [1],
      'ComputeGamma': true,
      'Min': 255,
      'Max': 0
    },
  };
}

export const stretches = {
  'NO2_Troposphere': [100000000000000, 15000000000000000],
  'Ozone_Column_Amount': [260, 400],
  'HCHO': [0, 300000000000000000],
} as Record<Variables, [number, number]>;
  
export const _colorMapRule: RasterFunctionObject = {
  'rasterFunction': 'Colormap',
  'variableName': 'Raster',
  'rasterFunctionArguments': {
    'ColormapName': "Magma" as ColorRamps,
  },
};

export const _resampleRule: RasterFunctionObject =  {
  'rasterFunction': 'Resample',
  'variableName': 'Raster',
  'rasterFunctionArguments': {
    'ResamplingType': '0', // Nearest Neighbor
  },
};


export function composeRasterRules(
  baseRule: RasterFunctionObject,
  additionalRules: RasterFunctionObject[]
): RasterFunctionObject {
  let currentRule: RasterFunctionObject = { ...baseRule }; 

  
  for (let i = 0; i < additionalRules.length; i++) {
    const nextOuterRule = { ...additionalRules[i] }; // Copy to avoid modifying original rule objects

    // Ensure rasterFunctionArguments exists
    if (!nextOuterRule.rasterFunctionArguments) {
      nextOuterRule.rasterFunctionArguments = {};
    }

    // Assign the current (inner) rule as the 'Raster' input to the next outer rule.
    nextOuterRule.rasterFunctionArguments.Raster = currentRule;

    currentRule = nextOuterRule; // The newly composed rule becomes the current one for the next iteration
  }

  return currentRule;
}

export const renderingRule = (range: [number, number]) => composeRasterRules(_stretchRule(Math.min(...range), Math.max(...range)), [_colorMapRule, _resampleRule]);



interface MultidimensionalDefinition {
  variableName: string;
  dimensionName: string;
  values: number[] | Array<number[]>;
}



export interface EsriSlice {
  sliceId: number;
  multidimensionalDefinition: MultidimensionalDefinition[];
}

export interface EsriSliceResponse {
  slices: EsriSlice[];
}


export type VariableNames = 'NO2_Troposphere' | 'Ozone_Column_Amount' | 'HCHO';

export async function fetchEsriTimeSteps(esriUrl: string, variableName: VariableNames, dimensionName = "StdTime"): Promise<EsriSliceResponse> {
  const url = esriUrl + '/slices';
  const format = "json";
  const multidimensionalDefinition = { variableName: variableName, dimensionName: dimensionName };
  const params = { f: format, multidimensionalDefinition: JSON.stringify(multidimensionalDefinition) };
  const fetchURL = new URL(url);
  fetchURL.search = new URLSearchParams(params).toString();
  return fetch(fetchURL).then(res => {
    return res.json();
  });
}


export function extractTimeSteps(data: EsriSliceResponse): number[] {
  const slices = data.slices;
  const timesteps = slices.map(slice => slice.multidimensionalDefinition[0].values[0]);
  // check if timesteps are arrays or numbers. if arrays take first element of each
  

  return timesteps.reduce((acc: number[], val) => {
    if (Array.isArray(val)) {
      return acc.concat(val[0]);
    } else {
      acc.push(val);
      return acc;
    }
  }, []);
}
