<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<template>
  <div
    ref="graph"
    :id="id"
    class="timeseries"
  >
  </div>
</template>


<script setup lang="ts">
/* slint-disable @typescript-eslint/no-unused-vars */
import { onMounted, ref, watch, nextTick } from "vue";
import { v4 } from "uuid";
import Plotly, { PlotlyHTMLElement, newPlot, restyle, type Data, type Datum, type PlotMouseEvent } from "plotly.js-dist-min";


export type DataSet = {
  x: Datum[],
  y: (number | null)[],
  lower? : (number | null)[],
  upper? : (number | null)[],
  errorType? : 'bar' | 'band',
};

// https://stackoverflow.com/a/7616484
const generateHash = (string) => {
  let hash = 0;
  for (const char of string) {
    hash = (hash << 5) - hash + char.charCodeAt(0);
    hash |= 0; // Constrain to 32bit integer
  }
  return hash;
};

const hashDataset = (data: DataSet) => {
  const hash = JSON.stringify(data.x) + JSON.stringify(data.y) +
              JSON.stringify(data.lower) + JSON.stringify(data.upper) + JSON.stringify(data.errorType);
  return generateHash(hash).toString();
};

interface TimeseriesProps {
  datasets: DataSet[];
  showErrors?: boolean;
}

const props = defineProps<TimeseriesProps>();

const id = `timeseries-${v4()}`;

const plot = ref<PlotlyHTMLElement | null>(null);
const graph = ref<HTMLDivElement | null>(null);

const emit = defineEmits<{
  // Datum is from type of x in DataSet
  (event: "click", value: {x: Datum, y: number}): void;
}>();

function datumToDate(datum: Datum): Date | null {
  if (datum === null) { return null; }
  if (datum instanceof Date) { return datum; }
  return new Date(datum);
}

const legendGroups: Record<string, string> = {};
let errorTraces: number[] = [];
const traceVisible = ref<Map<string, boolean>>(new Map());

function renderPlot() {

  errorTraces = [];
  
  const plotlyData: Data[] = [];
  if (props.datasets.length === 0) {
    console.log("No data provided for timeseries graph");
    return;
  }
  

  let max = 0;
  props.datasets.forEach((data, index) => {
    // create a hash from the data.x and data.y to be it's "id"
    
    // check x, and have same length y
    if (!data.x || !data.y || data.x.length !== data.y.length) {
      console.error("Invalid dataset, skipping", data);
      return;
      // throw new Error(`Invalid dataset: x and y must be non-null and of same length. Lengths: x=${data.x?.length}, y=${data.y?.length}`);
    }
    
    const id = hashDataset(data);
    
    max = Math.max(max, Math.max(...data.y.filter((v): v is number => v !== null)));

    const legendGroup = v4();
    if (!traceVisible.value.has(id)) {
      traceVisible.value.set(id, true);
    }
    legendGroups[id] = legendGroup;
    
    
    const errorOptions = {} as Record<'error_y',Plotly.ErrorBar>;
    
    // https://plotly.com/javascript/error-bars/
    if (data.errorType === 'bar') {
      errorOptions['erroy_y'] = {
        type: 'data',
        symmetric: false,
        array: data.upper as Datum[],
        arrayminus: data.lower as Datum[] | undefined,
        visible: true,
        thickness: 1.5,
        width: 3,
      };
      
    }
    
    const dataTraceOptions = {
      mode: "lines+markers",
      legendgroup: legendGroup,
      showlegend: true,
      name: `Dataset ${index + 1}`,
      marker: { color: 'red' },
      visible: traceVisible.value.get(id) ? true : "legendonly",
      ...errorOptions
    };
    
    plotlyData.push({
      x: data.x,
      y: data.y,
      ...dataTraceOptions
    } as Data);
    
    const hasErrors = data.lower && data.upper && data.lower.length === data.y.length && data.upper.length === data.y.length;
    console.log("Dataset has errors:", hasErrors, data.lower, data.upper);
    // double checking to have valid types
    if (hasErrors && data.lower && data.upper && data.errorType !== 'bar') {
      console.log("Adding error traces for dataset", index);
      const upperY: (number | null)[] = [];
      const lowerY: (number | null)[] = [];
      
      data.y.forEach((y, idx) => {
        if (y === null || data.lower === undefined || data.upper === undefined) {
          lowerY.push(null);
          upperY.push(null);
          return;
        }
        const high = y + (data.upper[idx] ?? 0);
        const low = y - (data.lower[idx] ?? 0);
        max = Math.max(max, high !== null ? high : 0);
        lowerY.push(low);
        upperY.push(high);
      });
      console.log("Upper Y:", upperY.map(v => v / 10**16));
      console.log("Lower Y:", lowerY.map(v => v / 10**16));
      const traceErrorOptions = {
        x: data.x,
        mode: "lines",
        line: { width: 0 },
        showlegend: false,
        legendgroup: legendGroup,
        name: `Dataset ${index + 1}`,
        marker: { color: 'red' },
        // visible: props.showErrors && traceVisible.value.get(id),
      };


      plotlyData.push({
        y: lowerY,
        ...traceErrorOptions
      });
      errorTraces.push(plotlyData.length - 1);

      plotlyData.push({
        y: upperY,
        ...traceErrorOptions,
        fill: "tonexty",
      });
      errorTraces.push(plotlyData.length - 1);
    }
  });

  const paddingFactor = 1.1;
  const axisMax = Math.max(1, paddingFactor * max);
  const layout: Partial<Plotly.Layout> = {
    width: 600,
    height: 400,
    yaxis: {
      title: { text: "Molecules / cm<sup>2</sup>" },
      range: [0, axisMax],
    },
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
          emit("click", {x: point.x, y: point.y as number} );
        }
      });
    });
    el.on('plotly_legendclick', (data) => {
      const trace = plotlyData[data.curveNumber];
      if (!trace) { 
        console.error("No trace for legend click", data);
        return true; 
      }
      // eslint-disable-next-line 
      // @ts-ignore legend group should exist. but guard anyway
      const group = trace.legendgroup as string;
      if (!group) { 
        console.error("No legend group for trace", trace);
        return true; 
      }
      const dataId = Object.keys(legendGroups).find(key => legendGroups[key] === group);
      if (!dataId) { 
        console.error("Could not find data ID for legend group", group);
        return true; 
      }
      const currentlyVisible = traceVisible.value.get(dataId);
      traceVisible.value.set(dataId, !currentlyVisible);
      // if currently visible and errors are visible set stlye the error traces too
      nextTick(() => { // next tick so that updated traceVisible is available
        if (currentlyVisible && props.showErrors) {
          updateErrorDisplay(true);
        }
      });
      return true;
    });
  });
}

function updateErrorDisplay(visible: boolean) {
  if (graph.value) {
    errorTraces.forEach((traceIndex) => {
      const trace = plot.value?.data[traceIndex];
      if (!trace) return;
      if (!graph.value) return;
      // eslint-disable-next-line 
      // @ts-ignore legend group should exist. but guard anyway
      const group = trace.legendgroup as string;
      const dataId = Object.keys(legendGroups).find(key => legendGroups[key] === group);
      if (dataId && traceVisible.value.get(dataId)) {
        restyle(graph.value, { visible }, [traceIndex]);
      } 
    });
  }
}


onMounted(() => {
  renderPlot();
});


watch(() => props.showErrors, updateErrorDisplay);

watch(() => props.datasets, (_newData, _oldData) => {
  console.log("Data prop changed, re-rendering plot");
  renderPlot();
}, { deep: true });

</script>

<style scoped>
.timeseries:not(:empty) {
  width: 600px;
  height: 400px;
}
</style>
