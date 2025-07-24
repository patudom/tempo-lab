import { newPlot, type Data, type PlotlyHTMLElement } from "plotly.js";
import { v4 } from "uuid";

import { AggValue } from "./esri/imageServer/esriGetSamples";


export async function createTimeseriesPlot(
  data: Record<number,AggValue>,
  errors?: Data[]
): Promise<PlotlyHTMLElement> {

  const id = v4();

  const dataT = Object.values(data).map(aggValue => aggValue.date);
  const dataV = Object.values(data).map(aggValue => aggValue.value);

  const plotlyData = [{
    x: dataT,
    y: dataV,
    mode: "lines+markers",
  }];

  return newPlot(id, plotlyData);
}
