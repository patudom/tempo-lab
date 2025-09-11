<template>
  <v-dialog
    v-model="dialogOpen"
    max-width="90vw"
    max-height="90vh"
    persistent
    scrollable
  > 
    <v-btn-toggle
      v-model="mode"
      class="ma-4"
      variant="outlined"
      density="compact"
    >
      <v-btn value="aggregate" >Aggregate Data</v-btn>
      <v-btn value="fold" >Fold Data</v-btn>
    </v-btn-toggle>
    <v-card v-if="mode === 'aggregate'">
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
          <!-- Left Panel: Aggregation Options -->
          <v-col cols="12" md="4">
            <v-card variant="outlined" class="pa-3">
              <v-card-title class="text-h6 pa-0 mb-3">Aggregation Options</v-card-title>
              
              <!-- Time Window Selection -->
              <v-select
                v-model="selectedWindow"
                :items="windowOptions"
                label="Time Window"
                density="compact"
                variant="outlined"
                hide-details
                class="mb-3"
              />
              
              <!-- Timezone Selection -->
              <v-select
                v-model="selectedTimezone"
                :items="timezoneOptions"
                label="Timezone"
                density="compact"
                variant="outlined"
                hide-details
                class="mb-3"
              />
              
              <!-- Aggregation Method -->
              <v-select
                v-model="selectedMethod"
                :items="methodOptions"
                label="Aggregation Method"
                density="compact"
                variant="outlined"
                hide-details
                class="mb-3"
              />
              
              <!-- Show Errors Toggle -->
              <v-checkbox
                v-model="showErrors"
                label="Show Error Bands"
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
              
              <!-- Preview Info -->
              <v-card variant="tonal" class="pa-2 mb-3">
                <v-card-subtitle class="pa-0">Preview</v-card-subtitle>
                <div class="text-caption">
                  <div>Original points: {{ originalDataPointCount }}</div>
                  <div>Aggregated points: {{ aggregatedDataPointCount }}</div>
                  <div>Window: {{ selectedWindow }}</div>
                </div>
              </v-card>
              
              <!-- Action Buttons -->
              <div class="d-flex ga-2">
                <v-btn
                  color="primary"
                  @click="saveAggregation"
                  :disabled="!canSave"
                  size="small"
                >
                  Save Aggregation
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
                <timeseries-graph
                  :data="graphData"
                  :show-errors="showErrors"
                />
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <data-folding
      v-else
      v-model="dialogOpen"
      :selection="selection"
    />
  </v-dialog>

  
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { v4 } from 'uuid';
import { TimeSeriesResampler } from '../esri/services/aggregation';
import TimeseriesGraph from './TimeseriesGraph.vue';
import type { UserSelection, TimeRange } from '../types';
import type { AggregationMethod, TimeSeriesData } from '../esri/services/aggregation';
import DataFolding from './DataFolding.vue';
interface DataAggregationProps {
  selection: UserSelection | null;
}

const props = defineProps<DataAggregationProps>();

const mode = ref<'aggregate' | 'fold'>('aggregate');

const emit = defineEmits<{
  (event: 'save', aggregatedSelection: UserSelection): void;
}>();

// Dialog state
const dialogOpen = defineModel<boolean>('modelValue', { type: Boolean, required: true });

// Aggregation options
const windowOptions = [
  { title: 'Daily', value: '1d' },
  { title: 'Weekly', value: '1w' },
  { title: 'Monthly', value: '1m' }
];

const methodOptions = [
  { title: 'Mean', value: 'mean' },
  { title: 'Min', value: 'min' },
  { title: 'Max', value: 'max' }
];

const timezoneOptions = [
  { title: 'US/Eastern', value: 'US/Eastern' },
  { title: 'US/Central', value: 'US/Central' },
  { title: 'US/Mountain', value: 'US/Mountain' },
  { title: 'US/Pacific', value: 'US/Pacific' },
  { title: 'UTC', value: 'UTC' }
];

// Reactive state
const selectedWindow = ref('1d');
const selectedMethod = ref<AggregationMethod>('mean');
const selectedTimezone = ref('US/Eastern');
const showErrors = ref(true);
const useSEM = ref(true);

// Computed properties
const originalDataPointCount = computed(() => {
  if (!props.selection?.samples) return 0;
  return Object.keys(props.selection.samples).length;
});

const aggregatedDataPointCount = computed(() => {
  if (!aggregatedData.value) return 0;
  return Object.keys(aggregatedData.value.values).length;
});

const canSave = computed(() => {
  return props.selection && aggregatedData.value && aggregatedDataPointCount.value > 0;
});

// Aggregated data
const aggregatedData = ref<TimeSeriesData | null>(null);
const aggregatedSelection = ref<UserSelection | null>(null);
// Graph data for display - now a ref that gets manually updated
const graphData = ref<UserSelection[]>([]);

// Function to update graph data
function updateGraphData() {
  console.log("Updating graph data");
  if (!props.selection) {
    graphData.value = [];
    return;
  }
  
  const data = [props.selection]; // Original data
  
  if (aggregatedSelection.value) {
    data.push(aggregatedSelection.value);
  }
  
  graphData.value = data;
  console.log("Graph data updated with", data.length, "datasets");
}

// Create a time range for the aggregated data
function createAggregatedTimeRange(): TimeRange {
  if (!props.selection) {
    throw new Error('No selection available');
  }
  
  const originalRange = props.selection.timeRange.range;
  const ranges = Array.isArray(originalRange) ? originalRange : [originalRange];
  
  return {
    id: v4(),
    name: `Aggregated (${selectedWindow.value})`,
    description: `Aggregated data with ${selectedWindow.value} window`,
    range: ranges,
    type: 'aggregated'
  };
}

// Watch for changes in aggregation parameters
watch([selectedWindow, selectedMethod, selectedTimezone, useSEM], () => {
  updateAggregatedData();
}, { immediate: true });

function selectionToTimeseries(selection: UserSelection): TimeSeriesData {
  return {
    values: selection.samples || {},
    errors: selection.errors || {},
    locations: selection.locations || [],
    geometryType: selection.region.geometryType || 'rectangle'
  };
}

// Update aggregated data when parameters change
function updateAggregatedData() {
  console.log("Updating aggregated data with window:", selectedWindow.value, "method:", selectedMethod.value, "timezone:", selectedTimezone.value);
  if (!props.selection?.samples) {
    aggregatedData.value = null;
    return;
  }
  
  
  
  try {
    
    // Convert the selection data to TimeSeriesData format
    const timeSeriesData = selectionToTimeseries(props.selection);
    
    
    const grouper = new TimeSeriesResampler(
      selectedWindow.value, 
      selectedTimezone.value, 
      selectedMethod.value, 
      useSEM.value ? 'sem' : 'std', true);
    aggregatedData.value = grouper.groupData(timeSeriesData);
      
    
    
    
    
    aggregatedSelection.value = {
      id: v4(),
      region: props.selection.region,
      timeRange: createAggregatedTimeRange(),
      molecule: props.selection.molecule,
      samples: aggregatedData.value.values,
      errors: aggregatedData.value.errors,
      locations: aggregatedData.value.locations
    };
    
  } catch (error) {
    console.error('Error aggregating data:', error);
    aggregatedData.value = null;
    aggregatedSelection.value = null;
  }
  
  // Update graph data after aggregation
  updateGraphData();
}

// Save the aggregation
function saveAggregation() {
  if (!canSave.value || !props.selection) return;
  
  const aggregatedSelection: UserSelection = {
    id: v4(),
    region: props.selection.region,
    timeRange: createAggregatedTimeRange(),
    molecule: props.selection.molecule,
    samples: aggregatedData.value!.values,
    errors: aggregatedData.value!.errors,
    locations: aggregatedData.value!.locations
  };
  
  emit('save', aggregatedSelection);
  closeDialog();
}

// Close dialog
function closeDialog() {
  dialogOpen.value = false;
  // Reset state
  nextTick(() => {
    aggregatedData.value = null;
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
.v-card {
  height: 100%;
}

.v-row {
  height: 100%;
}

.v-col {
  height: 100%;
}
</style>
