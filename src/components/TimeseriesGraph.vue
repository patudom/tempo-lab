<template>
  <div
    ref="graph"
    :id="id"
    class="timeseries"
  >
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { v4 } from "uuid";
import { PlotlyHTMLElement, newPlot, type Data, type Datum, type PlotMouseEvent } from "plotly.js-dist-min";

import { AggValue, RectangleSelection } from "../types";

interface TimeseriesProps {
  data: RectangleSelection[];
}

const props = defineProps<TimeseriesProps>();

const id = `timeseries-${v4()}`;

const plot = ref<PlotlyHTMLElement | null>(null);
const graph = ref<HTMLDivElement | null>(null);

const emit = defineEmits<{
  (event: "click", value: AggValue): void;
}>();

function datumToDate(datum: Datum): Date | null {
  if (datum === null) { return null; }
  if (datum instanceof Date) { return datum; }
  return new Date(datum);
}

const legendGroups: Record<string, string> = {};

onMounted(() => {

  props.data.forEach(data => {
    const ts = Object.keys(data).sort();
    const dataT: Date[] = [];
    const dataV: (number | null)[] = [];
    ts.forEach(t => {
      const point: AggValue = data[t];
      dataT.push(point.date);
      dataV.push(point.value);
    });

    const legendGroup = v4();
    legendGroups[data.id] = legendGroup;
    const plotlyData: Data[] = [{
      x: dataT,
      y: dataV,
      mode: "lines+markers",
      legendgroup: legendGroup,
      name: data.name,
    }];

    const errors = data.errors;
    if (errors != null) {
      const upperY: (number | null)[] = [];
      const lowerY: (number | null)[] = [];

      ts.forEach(t => {
        const point: AggValue = data[t];
        const value = point.value;
        const errs = errors[t];
        if (value === null || errs == null) {
          lowerY.push(null);
          upperY.push(null);
          return;
        }
        const { lower, upper } = errs;
        const valueLower = value - lower;
        const valueHigher = value + upper;
        lowerY.push(Math.min(valueLower, valueHigher));
        upperY.push(Math.max(valueLower, valueHigher));
      });

      plotlyData.push({
        x: dataT,
        y: lowerY,
        mode: "lines",
        line: { width: 0 },
        showlegend: false,
        legendgroup: legendGroup,
      });

      plotlyData.push({
        x: dataT,
        y: upperY,
        mode: "lines",
        line: { width: 0 },
        fill: "tonexty",
        showlegend: false,
        legendgroup: legendGroup,
      });
    }
  });

  const layout = {
    width: 600,
    height: 400,
  };

  newPlot(graph.value ?? id, plotlyData, layout).then((el: PlotlyHTMLElement) => {
    plot.value = el;
    el.on("plotly_click", (data: PlotMouseEvent) => {
      data.points.forEach(point => {
        const traceIndex = point.curveNumber;
        if (traceIndex !== 0 || point.x == null || point.y == null) {
          return;
        }
        const date = datumToDate(point.x);
        if (date !== null) {
          emit("click", { date, value: point.y as number });
        }
      });
    });
  });

});
</script>

<style scoped>
.timeseries {
  width: 600px;
  height: 400px;
}
</style>
