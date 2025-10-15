
import type { PlotltGraphDataSet } from '../../types';
import { nanmean } from "@/utils/array_operations/array_math";

function normalizeBadValue(v: number | null | undefined): number | null {
  if (v === null || v === undefined || isNaN(v)) {
    return null;
  }
  return v;
}

import { deepMerge } from "./plotly_styles";

export function createErrorBands(data: PlotltGraphDataSet, color: string, datasetName: string, legendGroup: string, options: object = {}) {
  if (!data.upper || !data.lower) return {lower: null, upper: null};
      
  const upperY: (number | null)[] = [];
  const lowerY: (number | null)[] = [];
    
  data.y.forEach((y, idx) => {
    if (y === null) {
      lowerY.push(null);
      upperY.push(null);
      return;
    }
        
    if (data.upper === undefined) {
      upperY.push(null);
    } else {
      const high = y + (data.upper[idx] ?? nanmean(data.upper) ?? 0);
      upperY.push(high);
    }
        
    if (data.lower === undefined) {
      lowerY.push(null);
    } else {
      const low = y - (data.lower[idx] ?? nanmean(data.lower) ?? 0);
      lowerY.push(low);
          
    }
        
        
  });
  // console.log({lowerY, upperY});
  const traceErrorOptions = {
    x: data.x,
    mode: "lines",
    line: { width: 0 },
    showlegend: false,
    legendgroup: legendGroup,
    name: datasetName,
    marker: { color: color ?? 'red' },
  };
      
  return {
    lower:{
      y: lowerY.map(normalizeBadValue),
      ...deepMerge(traceErrorOptions, options),
    },
    upper:{
      y: upperY.map(normalizeBadValue),
      ...deepMerge(traceErrorOptions, options),
      fill: "tonexty",
    }

  };
    
}
