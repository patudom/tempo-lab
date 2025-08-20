import type { ColorMap } from "./types";
import { colormaps, type AllAvailableColorMaps } from ".";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// linear spline
function spline( t: number, ...values: number[]): number {
  if (t <= 0) return values[0] as number;
  if (t >= 1) return values[values.length - 1] as number;
  const n = values.length - 1;
  const i = Math.floor(t * n);
  const u = t * n - i;
  return lerp(values[i], values[i + 1] ?? values[i], u);
}

function clamp(x: number, min: number, max: number): number {
  return Math.min(Math.max(x, min), max);
}

export function colormap(cmap: AllAvailableColorMaps, cmin: number, cmax: number, val: number): [number, number, number]
{ 
  
  let reversed = false;
  if (cmap.endsWith('_r')) {
    cmap = cmap.slice(0, -2) as AllAvailableColorMaps;
    reversed = true;
  }
  if (!(cmap in colormaps)) {
    throw new Error(`Colormap ${cmap} not found`);
  }
  
  const { r: redValues, g: greenValues, b: blueValues } = colormaps[cmap] as ColorMap;

  // const normalizedVal = clamp((val-cmin)/(cmax-cmin),0,1);
  const normalizedVal = reversed ? clamp((cmax - val) / (cmax - cmin), 0, 1) : clamp((val - cmin) / (cmax - cmin), 0, 1);
  const r = spline(normalizedVal, ...redValues);
  const g = spline(normalizedVal, ...greenValues);
  const b = spline(normalizedVal, ...blueValues);
  return [Math.round(r*255),Math.round(g*255),Math.round(b*255)];
}

