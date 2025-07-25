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
import { PlotlyHTMLElement, newPlot, type Data } from "plotly.js-dist-min";

import { AggValue } from "../esri/imageServer/esriGetSamples";

interface TimeseriesProps {
  data: Record<number, AggValue>;
  errors?: [number, number][];
}

const props = defineProps<TimeseriesProps>();

const id = `timeseries-${v4()}`;

const plot = ref<PlotlyHTMLElement | null>(null);
const graph = ref<HTMLDivElement | null>(null);

onMounted(() => {
  const dataT = Object.values(props.data).map(aggValue => aggValue.date);
  const dataV = Object.values(props.data).map(aggValue => aggValue.value);
  const legendGroup = v4();
  const plotlyData: Data[] = [{
    x: dataT,
    y: dataV,
    mode: "lines+markers",
    legendgroup: legendGroup,
  }];

  if (props.errors) {
    const upperY: number[] = [];
    const lowerY: number[] = [];

    props.errors.forEach(([lower, upper], index) => {
      const value = dataV[index];
      if (value === null) {
        return;
      }
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

  const layout = {
    width: 600,
    height: 400,
  };

  newPlot(graph.value ?? id, plotlyData, layout).then(el => plot.value = el);
});
</script>

<style scoped>
.timeseries {
  width: 600px;
  height: 400px;
}
</style>
