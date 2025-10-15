<template>
  <!-- <v-dialog
    v-model="dialogOpen"
    max-width="90vw"
    max-height="90vh"
    persistent
    scrollable
  > -->
    <v-card id="data-aggregation-card">
      <v-toolbar
        density="compact"
        color="var(--info-background)"
      >
        <v-toolbar-title>Data Aggregation</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          icon="mdi-close"
          @click="closeDialog"
        ></v-btn>
      </v-toolbar>
      
      <v-card-text class="pa-4">
        <v-row>
          <!-- Left Panel: Folding Options -->
          <v-col cols="12" md="4">
            <v-card variant="outlined" class="pa-3">
              
              <!-- Time Bin Selection -->
              <v-select
                v-if="false"
                v-model="selectedTimeBin"
                :items="timeBinOptions"
                label="Time Bin"
                density="compact"
                variant="outlined"
                hide-details
                class="mb-3"
              />
              <!-- use chips for select -->
              <h3>Time Bin</h3>
              <v-chip-group
                v-model="selectedTimeBin"
                column
                class="mb-3"
              >
                <v-chip
                  v-for="option in timeBinOptions"
                  :key="option.value"
                  :value="option.value"
                  color="#092088"
                  :variant="option.value === selectedTimeBin ? 'flat' : 'outlined'"    
                  density="compact"
                >
                  {{ option.title }}
                </v-chip>
              </v-chip-group> 
              
              <div class="mb-2 explainer-text">
                <strong class="text-red">FIX</strong>
                Select the time bin for which we will aggregate the data. 
                When aggregating data, we take all of the data in a bin (say the 1pm bin) and
                computed a single (aggregated) value for it, such as a mean or a max value.
                <hr/>
                <div>
                  <div v-if="selectedTimeBin === 'hour'">
                    <dt>Hour</dt>
                    <dd>
                      Rounds data to the nearest hour. For example: Date from 12:30pm to 1:29pm will go into the 1pm bin.
                      The binned point, shown in black is placed on the hour (e.g. at 1:00pm).
                    </dd>
                  </div>
                  <div v-else-if="selectedTimeBin === 'day'">
                    <dt>Day</dt>
                    <dd>Bins all data within a date. For example, all data points occuring on Dec 5 2025, or on Aug 28 2024, etc.
                      The binned point, shown in black is placed at local noon (12:00pm) of that day.
                    </dd>
                  </div>
                  <div v-else-if="selectedTimeBin === 'week'">
                    <dt>Week</dt>
                    <dd>
                      Rounds data to the nearest week. Weeks start on Sunday. For example: Date from Sunday 12:00am to Saturday 11:59pm will go into the week bin.
                      The binned point, shown in black is placed at local noon (12:00pm) on Wednesday of that week.
                    </dd>
                  </div>
                  <div v-else-if="selectedTimeBin === 'month'">
                    <dt>Month</dt>
                    <dd>
                      Rounds data to the nearest month. 
                      For example: Date from the 1st of the month 12:00am to the last day of the month 11:59pm will go into the month bin.
                      The binned point, shown in black is placed at local noon (12:00pm) on the 15th of that month.
                    </dd>
                  </div>
                </div>
                
              </div>
              
              <!-- Folding Period Selection -->
              <v-select
                v-if="false"
                v-model="selectedFoldingPeriod"
                :items="foldingPeriodOptions"
                label="Folding Period"
                density="compact"
                variant="outlined"
                hide-details
                class="mb-3"
              />
              <h3>Folding Period</h3>
              <v-chip-group
                v-model="selectedFoldingPeriod"
                column
                class="mb-3"
              >
                <v-chip
                  v-for="option in foldingPeriodOptions"
                  :key="option.value"
                  :value="option.value"
                  color="#092088"
                  :variant="option.value === selectedFoldingPeriod ? 'flat' : 'outlined'"
                  outline
                  density="compact"
                  :disabled="!isValidCombination(option.value, selectedTimeBin)"
                >
                  {{ option.title }}
                </v-chip>
              </v-chip-group> 
              
              <div class="mb-2 explainer-text">
                <strong class="text-red">FIX</strong>
                We "fold" data, by stacking data re-aligning data based on a periodic cycle. For example, if we fold by "Week", then
                
                Select the period over which to fold the data. Selecting "None" will simply bin the data without folding.
              </div>
              
              <!-- Timezone Selection -->
              <div class="selected-timezone-details d-flex mb-4">
                  <v-checkbox
                    v-model="useTzCenter"
                    :label="`Use timezone of region center: ${tzCenter}`"
                    density="compact"
                    hide-details
                    class="mb-1"
                  />
                </div>
              <v-select
                v-if="!useTzCenter"
                v-model="selectedTimezone"
                :items="timezoneOptions"
                label="Timezone"
                density="compact"
                variant="outlined"
                hide-details
                class="mb-3"
              />
              
              <!-- Folding Method -->
              <v-select
                v-model="selectedMethod"
                :items="methodOptions"
                label="Folding Method"
                density="compact"
                variant="outlined"
                hide-details
                class="mb-3"
              />
              
              <!-- Show Errors Toggle -->
              <div class="d-flex flex-row flex-wrap">
              <v-checkbox
                v-model="showErrors"
                label="Show Errors"
                density="compact"
                :disabled="selectedMethod == 'min' || selectedMethod == 'max'"
                hide-details
                class="mb-3"
              />
              
              <v-checkbox
                v-model="useErrorBars"
                label="Use Error Bars"
                density="compact"
                hide-details
                class="mb-3"
              />
              
              <!-- Show Errors Toggle -->
              <v-checkbox
                v-model="useSEM"
                label="Use SEM"
                density="compact"
                hide-details
                class="mb-3"
              />
              
              <v-checkbox
                v-model="includeBinPhase"
                label="Use True Time"
                density="compact"
                :disabled="!disableIncludePhaseCheckbox"
                hide-details
                class="mb-3"
              />
              
              <v-checkbox
                v-if="false"
                v-model="alignToBinCenter"
                label="Center bins"
                density="compact"
                :disabled="!disableBinCenterCheckbox"
                hide-details
                class="mb-3"
              />
              </div>
              <!-- Preview Info -->
              <v-card height="fit-content" variant="tonal" class="pa-2 mb-3">
                <v-card-subtitle class="pa-0">Preview</v-card-subtitle>
                <div class="text-caption">
                  <div>Original points: {{ originalDataPointCount }}</div>
                  <div>Aggregated points: {{ foldedDataPointCount }}</div>
                  <div>Time Bin: {{ selectedTimeBin }}</div>
                  <div>Folding Period: {{ selectedFoldingPeriod }}</div>
                  <div>Fold Type: {{ selectedFoldType }}</div>
                  <div>First bin: {{ foldedData && foldedData.bins ? Object.keys(foldedData.bins)[0] : 'N/A' }}</div>
                  <!-- show first bins time in the local timezone if it's a date using toZonedTime -->
                  <div v-if="foldedData && foldedData.bins && foldedData.bins[Object.keys(foldedData.bins)[0]] && foldedData.values[Object.keys(foldedData.bins)[0]] && foldedData.values[Object.keys(foldedData.bins)[0]].date">
                    First bin time: 
                    </div>
                </div>
              </v-card>
              
              <!-- Action Buttons -->
              <div class="d-flex ga-2">
                <v-btn
                  color="primary"
                  @click="saveFolding"
                  :disabled="!canSave"
                  size="small"
                >
                  Save Folding
                </v-btn>
                <v-btn
                  color="secondary"
                  variant="outlined"
                  @click="closeDialog"
                  size="small"
                >
                  Cancel
                </v-btn>
              </div>
            </v-card>
          </v-col>
          
          <!-- Right Panel: Timeseries Graph -->
          <v-col cols="12" md="8">
            <v-card variant="outlined" class="pa-3" style="height: 500px;">
              <v-card-title>
                Time Series Comparison
              </v-card-title>
              <div style="height: calc(100% - 40px);">
                <folded-plotly-graph
                  :datasets="graphData"
                  :show-errors="showErrors"
                  :fold-type="selectedFoldType"
                  :colors="[selection?.region.color ?? 'blue', '#333']"
                  :data-options="[
                    {mode: 'markers'}, // options for the original data
                    {mode: 'lines+markers'} // options for the folded data
                    ]"
                  :error-bar-styles="[
                    {'thickness': 1, 'width': 0}, // original data error bar style
                    { 'thickness': 3, 'width': 0 } // folded data error bar style
                  ]"
                  @click="handlePointClick"
                />
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  <!-- </v-dialog> -->
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ref, computed, watch, nextTick } from 'vue';
import { v4 } from 'uuid';
import { TimeSeriesFolder, sortfoldBinContent } from '../esri/services/aggregation';
import FoldedPlotlyGraph from './FoldedPlotlyGraph.vue';
import type { Prettify, UserDataset, PlotltGraphDataSet, UnifiedRegion } from '../types';
import type { AggregationMethod, TimeSeriesData, FoldedTimeSeriesData , FoldType, FoldBinContent} from '../esri/services/aggregation';
import tz_lookup from '@photostructure/tz-lookup';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

interface DataFoldingProps {
  selection: UserDataset | null;
}

const props = defineProps<DataFoldingProps>();

const emit = defineEmits<{
  (event: 'save', foldedSelection: UserDataset): void;
}>();

// Dialog state
const dialogOpen = defineModel<boolean>('modelValue', { type: Boolean, required: true });


type TimeBinOptions = 'hour' | 'day' | 'week' | 'month';
type FoldingPeriodOptions = 'day' | 'week' | 'year' | 'weekdayWeekend' | 'none';

// Time bin and folding period options
const timeBinOptions: {title: string, value: TimeBinOptions}[] = [
  { title: 'Hour', value: 'hour' },
  { title: 'Day', value: 'day' },
  { title: 'Week', value: 'week' },
  { title: 'Month', value: 'month' }
];

const allFoldingPeriodOptions: {title: string, value: FoldingPeriodOptions}[] = [
  { title: 'Day', value: 'day' },
  { title: 'Week', value: 'week' },
  { title: 'Year', value: 'year' },
  { title: 'Weekend/Weekday', value: 'weekdayWeekend' },
  { title: 'None (Simple Binning)', value: 'none' },
];



// Computed property to filter valid folding periods based on selected time bin
const foldingPeriodOptions = computed(() => {
  return allFoldingPeriodOptions;
});


const methodOptions = [
  { title: 'Mean', value: 'mean' },
  { title: 'Median', value: 'median' },
  { title: 'Min', value: 'min' },
  { title: 'Max', value: 'max' }
];

const timezoneOptions = [
  { title: 'US/Eastern', value: 'US/Eastern' },
  { title: 'US/Central', value: 'US/Central' },
  { title: 'US/Mountain', value: 'US/Mountain' },
  { title: 'US/Arizona', value: 'US/Arizona' },
  { title: 'US/Pacific', value: 'US/Pacific' },
  { title: 'UTC', value: 'UTC' }
];

// Reactive state
const selectedTimeBin = ref<TimeBinOptions>('hour');
const selectedFoldingPeriod = ref<FoldingPeriodOptions>('day');
const selectedMethod = ref<AggregationMethod>('mean');
const selectedTimezone = ref('US/Eastern');
const showErrors = ref(true);
const useSEM = ref(true);
const useErrorBars = ref(false);

const validCombinations: Record<TimeBinOptions, FoldingPeriodOptions[]> = {
  'hour': ['day', 'week', 'year', 'weekdayWeekend'],
  'day': ['week', 'year', 'weekdayWeekend', 'none'],
  'week': ['year', 'none'],
  'month': ['year', 'none'],
};
const isValidCombination = (period: FoldingPeriodOptions, bin: TimeBinOptions) => {
  return validCombinations[bin].includes(period);
};
  
watch(selectedTimeBin, (newBin) => {
  if (!isValidCombination(selectedFoldingPeriod.value, newBin)) {
    // Set to first valid option
    const validPeriods = validCombinations[newBin];
    if (validPeriods.length > 0) {
      selectedFoldingPeriod.value = validPeriods[0];
    }
  }
});

// Computed FoldType based on time bin and folding period selections
const selectedFoldType = computed<FoldType>(() => {
  // Map the combination to the appropriate FoldType
  const timeBin = selectedTimeBin.value;
  const period = selectedFoldingPeriod.value;
    
  const foldType = `${timeBin}Of${period.charAt(0).toUpperCase()}${period.slice(1)}` as FoldType;
  console.log('Computed FoldType:', foldType, 'from', timeBin, 'and', period);
  return foldType;
});




// Check if we're using a None-period fold type (no actual folding)
const isNonePeriod = computed(() => {
  return selectedFoldingPeriod.value === 'none';
});

// Check if we're using any hour-based fold type (which is always centered)
const isHourBinned = computed(() => {
  return selectedTimeBin.value === 'hour';
});

const includeBinPhase = ref(true);
// const alignToBinCenter = ref(true);
const alignToBinCenter = computed(() => {
  if (isNonePeriod.value) return true;
  if (selectedFoldingPeriod.value === 'weekdayWeekend') return false;
  if (includeBinPhase.value === false) return false;
  if (isHourBinned.value) return true;
  return true;
});


const disableBinCenterCheckbox = computed(() => {
  return !isNonePeriod.value && includeBinPhase.value && !isHourBinned.value;
});

const disableIncludePhaseCheckbox = computed(() => {
  return !isNonePeriod.value;
});

// Watch to ensure selected folding period is valid when time bin changes
watch(selectedTimeBin, () => {
  const validPeriods = foldingPeriodOptions.value.map(opt => opt.value);
  if (!validPeriods.includes(selectedFoldingPeriod.value)) {
    // Set to first valid option
    if (validPeriods.length > 0) {
      selectedFoldingPeriod.value = validPeriods[0];
    }
  }
});

// Watch for None-period types and reset incompatible options
watch(isNonePeriod, (isNone) => {
  if (isNone) {
    includeBinPhase.value = true;
    // alignToBinCenter.value = true;
  }
});

const regionCenter = computed(() => {
  const region = props.selection?.region as UnifiedRegion;
  
  if (region && region.geometryType === 'point') {
    return { lat: region.geometryInfo.y, lon: region.geometryInfo.x };
  }
  
  if (region && region.geometryType === 'rectangle') {
    const { xmin, ymin, xmax, ymax } = region.geometryInfo;
    return { lat: (ymin + ymax) / 2, lon: (xmin + xmax) / 2 };
  }
  
  return { lat: 0, lon: 0 };
});



const useTzCenter = ref(true);
const tzCenter = tz_lookup(regionCenter.value.lat, regionCenter.value.lon);

if (regionCenter.value.lat !== 0 || regionCenter.value.lon !== 0) {
  const tz = tz_lookup(regionCenter.value.lat, regionCenter.value.lon);
  if (tz && useTzCenter.value) {
    selectedTimezone.value = tz;
  }
}

watch(useTzCenter, (newVal) => {
  if (newVal && regionCenter.value.lat !== 0 && regionCenter.value.lon !== 0) {
    const tz = tz_lookup(regionCenter.value.lat, regionCenter.value.lon);
    if (tz) {
      selectedTimezone.value = tz;
    }
  }
});

// Computed properties
const originalDataPointCount = computed(() => {
  if (!props.selection?.samples) return 0;
  return Object.keys(props.selection.samples).length;
});

const foldedDataPointCount = computed(() => {
  if (!foldedData.value) return 0;
  return Object.keys(foldedData.value.values).length;
});

const canSave = computed(() => {
  return !!(props.selection && foldedData.value && foldedDataPointCount.value > 0);
});

const foldedDatasetName = computed(() => {
  if (!props.selection?.name) return 'Folded Data';
  return `Folded ${props.selection.name ?? props.selection.region.name} (${selectedTimeBin.value} of ${selectedFoldingPeriod.value}, ${selectedMethod.value})`;
});

// Aggregated data
const foldedData = ref<FoldedTimeSeriesData | null>(null);
const foldedSelection = ref<null>(null);
// Graph data for display - now a ref that gets manually updated
const graphData = ref<PlotltGraphDataSet[]>([]);



// eslint-disable-next-line @typescript-eslint/no-unused-vars
function timeseriesToDataSet(timeseries: TimeSeriesData): Omit<PlotltGraphDataSet, 'name'> {
  const x: PlotltGraphDataSet['x'] = [];
  const y: PlotltGraphDataSet['y'] = [];
  const lower: PlotltGraphDataSet['lower'] = [];
  const upper: PlotltGraphDataSet['upper'] = [];

  // tsa, tsb are the timestamps as strings
  const sortedEntries = Object.entries(timeseries.values).sort(([tsa, _a], [tsb, _b]) => parseInt(tsa) - parseInt(tsb));
  // get the first timestamp
  sortedEntries.forEach(([timestamp, aggValue]) => {
    y.push(aggValue.value);
    x.push(new Date(parseInt(timestamp)));
    const error = timeseries.errors[timestamp];
    lower.push(error?.lower ?? null);
    upper.push(error?.upper ?? null);
  });

  return { x, y, lower, upper };
}

function foldedTimesSeriesToDataSet(foldedTimeSeries: FoldedTimeSeriesData): Omit<PlotltGraphDataSet, 'name'> {
  const x: (number | Date | null)[] = [];
  const y: (number | null)[] = [];
  const lower: (number | null)[] = [];
  const upper: (number | null)[] = [];

  // Check if this is a None-period fold type
  const isNonePeriod = ['hourOfNone', 'dayOfNone', 'weekOfNone', 'monthOfNone'].includes(foldedTimeSeries.foldType);

  // tsa, tsb are the timestamps as strings
  const sortedEntries = Object.entries(foldedTimeSeries.bins).sort(([binIndexa, _a], [binIndexb, _b]) => parseInt(binIndexa) - parseInt(binIndexb));

  sortedEntries.forEach(([binIndex, _binContent]) => {
    const idx = parseInt(binIndex);
    const aggValue = foldedTimeSeries.values[idx];
    
    // Use date if available (for None-period types), otherwise use bin index
    if (isNonePeriod && aggValue.date) {
      // For None-period types with dates, center bins by adding half the bin width
      if (alignToBinCenter.value) {
        const date = new Date(aggValue.date);
        switch (foldedTimeSeries.foldType) {
        case 'hourOfNone':
          date.setMinutes(30); // Center of hour
          break;
        case 'dayOfNone':
          date.setHours(date.getHours() + 12); // local Noon
          break;
        case 'weekOfNone':
          date.setDate(date.getDate() + 3); // Middle of week (approx)
          date.setHours(date.getHours() + 12);
          break;
        case 'monthOfNone':
          date.setDate(15); // Middle of month (approx)
          break;
        }
        x.push(date);
      } else {
        x.push(aggValue.date);
      }
    } else {
      if (foldedTimeSeries.foldType !== 'hourOfDay') {
        x.push(idx + (alignToBinCenter.value ? 0.5 : 0));
      } else {
        x.push(idx);
      }
    }
    
    y.push(aggValue.value);
    const error = foldedTimeSeries.errors[idx];
    lower.push(error?.lower ?? null);
    upper.push(error?.upper ?? null);
  });

  return { x, y, lower, upper, errorType: useErrorBars.value ? 'bar' : 'band' };
}
  
function foldedTimeSeriesRawToDataSet(foldedTimeSeries: FoldedTimeSeriesData): Omit<PlotltGraphDataSet, 'name'> {
  const x: (number | Date | null)[] = [];
  const y: (number | null)[] = [];
  const lower: (number | null)[] = [];
  const upper: (number | null)[] = [];
  const customdata: Date[] = [];

  // Check if this is a None-period fold type
  const isNonePeriod = ['hourOfNone', 'dayOfNone', 'weekOfNone', 'monthOfNone'].includes(foldedTimeSeries.foldType);

  // tsa, tsb are the timestamps as strings
  const sortedEntries = Object.entries(foldedTimeSeries.bins).sort(([binIndexa, _a], [binIndexb, _b]) => parseInt(binIndexa) - parseInt(binIndexb));

  sortedEntries.forEach(([_binIndex, binContent]) => {
    const sortedBinContent = sortfoldBinContent(binContent);
    const bins = sortedBinContent as Prettify<FoldBinContent>;
    
    bins.rawValues.forEach((rv, index) => {
      if (isNonePeriod) {
        // For None-period types, use the actual timestamp
        x.push(new Date(bins.timestamps[index]));
      } else {
        // For regular fold types, use bin index with optional phase
        x.push(bins.bin + (includeBinPhase.value ? bins.binPhase[index] : 0));
      }
      customdata.push(toZonedTime(new Date(bins.timestamps[index]), selectedTimezone.value));
      y.push(rv);
    });
    bins.lowers.forEach(low => {
      lower.push(low ?? null);
    });
    bins.uppers.forEach(up => {
      upper.push(up ?? null);
    });
  });
  // the ascii +- symbol is this characher: ±
  const hovertemplate = '%{customdata|%Y-%m-%d %H:%M}<br>%{y:0.2e}±%{error_y.array:0.2e}<extra></extra>';
  
  return { x, y, lower, upper, errorType: 'bar', datasetOptions: { customdata, hovertemplate } };
}

// Function to update graph data
function updateGraphData() {
  console.log("Updating graph data");
  if (!props.selection) {
    graphData.value = [];
    return;
  }
  
  // const data = [timeseriesToDataSet(selectionToTimeseries(props.selection))]; // Original data
  const data: PlotltGraphDataSet[] = [];
  
  if (foldedData.value) {
    const t = foldedTimeSeriesRawToDataSet(foldedData.value); // Raw folded data
    (t as PlotltGraphDataSet).name = props.selection.name || 'Original Data';
    data.push(t as PlotltGraphDataSet); // Raw folded data
    const f = foldedTimesSeriesToDataSet(foldedData.value); // Summary folded data
    (f as PlotltGraphDataSet).name = foldedDatasetName.value;
    data.push(f as PlotltGraphDataSet); // Summary folded data
  }
  console.log("Prepared graph data:", data);
  graphData.value = data;
  console.log("Graph data updated with", data.length, "datasets");
}

// Create a time range for the folded data
function createFoldedTimeRange() {
  if (!props.selection) {
    throw new Error('No selection available');
  }
  
  const originalRange = props.selection.timeRange.range;
  const ranges = Array.isArray(originalRange) ? originalRange : [originalRange];
  
  return {
    id: v4(),
    name: `Folded (${selectedTimeBin.value} of ${selectedFoldingPeriod.value})`,
    description: `Folded data (${selectedTimeBin.value} of ${selectedFoldingPeriod.value}) ${selectedMethod.value}`,
    range: ranges,
    type: 'folded'
  };
}


// Only recalculate when data-affecting parameters change
watch([selectedTimeBin, selectedFoldingPeriod, selectedMethod, selectedTimezone, useSEM], 
  updateAggregatedData, { immediate: true });

// Handle display-only changes separately
watch([useErrorBars, alignToBinCenter, includeBinPhase], updateGraphData);

function selectionToTimeseries(selection: UserDataset): TimeSeriesData {
  return {
    values: selection.samples || {},
    errors: selection.errors || {},
    locations: selection.locations || [],
    geometryType: selection.region.geometryType || 'rectangle'
  };
}

// Update folded data when parameters change
function updateAggregatedData() {
  console.log("Updating folded data with time bin:", selectedTimeBin.value, "folding period:", selectedFoldingPeriod.value, "fold type:", selectedFoldType.value, "method:", selectedMethod.value, "timezone:", selectedTimezone.value);
  if (!props.selection?.samples) {
    foldedData.value = null;
    return;
  }
  
  try {
    
    // Convert the selection data to TimeSeriesData format
    const timeSeriesData = selectionToTimeseries(props.selection);
    
    
    const grouper = new TimeSeriesFolder(
      selectedFoldType.value,  // Use the computed fold type
      selectedTimezone.value, 
      selectedMethod.value, 
      useSEM.value ? 'sem' : 'std', true);
    foldedData.value = grouper.foldData(timeSeriesData);
    
  } catch (error) {
    console.error('Error aggregating data:', error);
    foldedData.value = null;
    foldedSelection.value = null;
  }
  
  // Update graph data after folding
  updateGraphData();
  console.log("graphData after update:", graphData.value);
}

function handlePointClick(value: {x: Date, y: number, customdata: unknown}) {
  console.log("Point clicked:", value);
  console.log("Custom data Date:", value.customdata ? value.customdata as Date: value.customdata);
  // the from timezoned time is what we want to to send work with if we go back to esri stuff
  console.log("fromZonedTime", value.customdata ? fromZonedTime(value.customdata as Date, selectedTimezone.value) : value.customdata);
}

// Save the folding
function saveFolding() {
  
  if (!canSave.value || !props.selection || !foldedData.value) return;
  const oldAlignToBinCenter = alignToBinCenter.value;
  // Ensure alignToBinCenter is false when saving, as we want to store raw bin indices
  // alignToBinCenter.value = false;
  
  // Precompute datasets so parent consumers don't need to transform again.
  // We intentionally do NOT fabricate Dates for bins; x values remain numeric bin indices / phases.
  const rawDataset = foldedTimeSeriesRawToDataSet(foldedData.value);
  (rawDataset as PlotltGraphDataSet).name = props.selection.name || 'Original Data';
  const summaryDataset = foldedTimesSeriesToDataSet(foldedData.value);
  (summaryDataset as PlotltGraphDataSet).name = foldedDatasetName.value;

  const foldedSelection: UserDataset = {
    id: v4(),
    region: { ...props.selection.region, name: props.selection.region.name } as typeof props.selection.region,
    timeRange: createFoldedTimeRange(),
    molecule: props.selection.molecule,
    loading: false, // folded data is immediately available
    // samples/errors intentionally omitted for folded since bins are synthetic; rely on plotlyDatasets
    locations: foldedData.value.locations,
    name: foldedDatasetName.value,
    folded: {
      timeBin: selectedTimeBin.value,
      foldingPeriod: selectedFoldingPeriod.value,
      foldType: selectedFoldType.value,
      method: selectedMethod.value,
      timezone: selectedTimezone.value,
      useSEM: useSEM.value,
      includeBinPhase: includeBinPhase.value,
      alignToBinCenter: alignToBinCenter.value,
      useErrorBars: useErrorBars.value,
      raw: foldedData.value
    },
    plotlyDatasets: [rawDataset as PlotltGraphDataSet, summaryDataset as PlotltGraphDataSet]
  };
  console.log(foldedSelection);
  emit('save', foldedSelection);
  // alignToBinCenter.value = oldAlignToBinCenter;
  closeDialog();
}

// Close dialog
function closeDialog() {
  dialogOpen.value = false;
  // Reset state
  nextTick(() => {
    foldedData.value = null;
  });
}

// Watch for selection changes
watch(() => props.selection, () => {
  if (props.selection) {
    updateAggregatedData();
  }
}, { immediate: true });
</script>

<style scoped>
#data-aggregation-card .explainer-text {
  border-radius: 5px;
  padding: 5px;
  padding-inline-start: 10px;
  background-color: rgb(var(--v-theme-surface-bright));
  font-size: 0.8em;
  color: rgb(var(--v-theme-on-surface-bright));
  
}

#data-aggregation-card .explainer-text hr {
  border: none;
  border-top: 1px solid rgb(var(--v-theme-on-surface-bright));
  margin-inline: 0;
  margin-block: 1em;
}

#data-aggregation-card .explainer-text dt {
  font-weight: bold;
}

#data-aggregation-card .explainer-text dd {
  margin-left: 0;
  margin-bottom: 8px;
}



</style>
