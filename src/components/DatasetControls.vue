<template>
  <div id="dataset-sections">
    <h2>Investigate Patterns with Time</h2>
    <div id="add-region-time">
      <v-expansion-panels
        v-model="openPanels"
        variant="accordion"
        id="user-options-panels"
        multiple
        class="pl-3"
      >
        <v-expansion-panel
          title="Time Ranges"
          class="mt-3 h3-panel-titles"
        >
          <template #text>
            <v-btn
              size="small"
              :active="createTimeRangeActive"
              :color="accentColor2"
              @click="createTimeRangeActive = !createTimeRangeActive"
            >
              <template #prepend>
                <v-icon v-if="!createTimeRangeActive" icon="mdi-plus"></v-icon>
              </template>
              {{ createTimeRangeActive ? "Cancel" : "New Time Range" }}
            </v-btn>
            <date-time-range-selection
              v-if="createTimeRangeActive"
              :current-date="singleDateSelected"
              :selected-timezone="selectedTimezone"
              :allowed-dates="uniqueDays"
              @ranges-change="handleDateTimeRangeSelectionChange"
            />
            <div class="my-selections" v-if="timeRanges.length>0" style="margin-top: 1em;">
              <h4>My Time Ranges</h4>
              <v-list>
                <v-list-item
                  v-for="(timeRange, index) in timeRanges"
                  :key="index"
                  :title="timeRange.name === 'Displayed Day' ? `Displayed Day: ${ formatTimeRange(timeRange.range) }`  : formatTimeRange(timeRange.range)"
                  style="background-color: #444444"
                >

                  <template #append>
                    <v-btn
                      v-if="timeRange.id !== 'displayed-day' && !selections.some(s => areEquivalentTimeRanges(s.timeRange, timeRange))"
                      variant="plain"
                      v-tooltip="'Delete'"
                      icon="mdi-delete"
                      color="white"
                      @click="() => deleteTimeRange(timeRange)"
                    >
                    </v-btn>
                  </template>
                </v-list-item>
              </v-list>
            </div>
          </template>
        </v-expansion-panel>
        <v-expansion-panel
          title="Regions"
          class="mt-3 h3-panel-titles"
        >
          <template #text>
            <div id="add-region-buttons">
              <v-btn
                size="small"
                :active="rectangleSelectionActive"
                :disabled="pointSelectionActive"
                :color="accentColor2"
                @click="() => {
                  if (rectangleSelectionActive) {
                    rectangleSelectionActive = false;
                  } else {
                    createNewSelection('rectangle');
                  }
                }"
              >
                <template #prepend>
                  <v-icon v-if="!rectangleSelectionActive" icon="mdi-plus"></v-icon>
                </template>
                {{ rectangleSelectionActive ? "Cancel" : "New Region" }}
              </v-btn>
            </div>
            <div class="my-selections" v-if="regions.length>0" style="margin-top: 1em;">
            <h4>My Regions</h4>                   
              <v-list>
                <v-list-item
                  v-for="(region, index) in regions"
                  :key="index"
                  :title="region.name"
                  :style="{ 'background-color': region.color }"
                  @click="() => moveMapToRegion(region as UnifiedRegionType)"
                >
                  <template #append>
                    <!-- New: Edit Geometry button (disabled if any selection using region has samples) -->
                    <!-- <v-btn
                      variant="plain"
                      :icon="region.geometryType === 'rectangle' ? 'mdi-select' : 'mdi-plus'"
                      color="white"
                      :disabled="regionHasSamples(region as UnifiedRegionType)"
                      v-tooltip="regionHasSamples(region as UnifiedRegionType) ? 'Cannot edit geometry after samples are fetched for a selection using this region' : 'Edit Geometry'"
                      @click="() => editRegionGeometry(region as UnifiedRegionType)"
                    ></v-btn> -->
                    <v-btn
                      variant="plain"
                      v-tooltip="'Edit Name'"
                      icon="mdi-pencil"
                      color="white"
                      @click="() => editRegionName(region as UnifiedRegionType)"
                    ></v-btn>
                    <v-btn
                      v-if="!regionHasDatasets(region as UnifiedRegionType)"
                      variant="plain"
                      v-tooltip="'Delete'"
                      icon="mdi-delete"
                      color="white"
                      @click="() => deleteRegion(region as UnifiedRegionType)"
                    ></v-btn>
                  </template>
                </v-list-item>
              </v-list>
            </div>
          </template>
        </v-expansion-panel>

        <v-divider
          class="mt-3"
          opacity="1"
        >
        </v-divider>

        <v-expansion-panel
          title="Datasets"
          class="mt-3 h3-panel-titles"
        >
        <template #text>
          <v-btn
            size="small"
            :active="createDatasetActive"
            :color="accentColor2"                    
            @click="createDatasetActive = !createDatasetActive"
            class="mt-3"
          >
            <template #prepend>
              <v-icon v-if="!createDatasetActive" icon="mdi-plus"></v-icon>
            </template>
            {{ createDatasetActive ? "Cancel" : "New Dataset" }}
          </v-btn>
          <selection-composer
            v-show="createDatasetActive"
            :backend="backend"
            :time-ranges="timeRanges"
            :regions="regions"
            :disabled="{ region: rectangleSelectionActive, point: pointSelectionActive, timeRange: createTimeRangeActive }"
            @create="handleDatasetCreated"
          >
          </selection-composer>
          <div class="my-selections" v-if="datasets.length>0" style="margin-top: 1em;">

            <h4>My Datasets</h4>
            <v-list>
              <v-hover
                v-slot="{ isHovering, props }"
                v-for="dataset in datasets"
                :key="dataset.id"
              >
                <v-list-item
                  v-bind="props"
                  :ref="(el) => datasetRowRefs[dataset.id] = el"
                  class="selection-item"
                  :style="{ 'background-color': dataset.region.color }"
                  :ripple="touchscreen"
                  @click="() => {
                    if (touchscreen) {
                      openSelection = (openSelection == dataset.id) ? null : dataset.id;
                    }
                  }"
                  lines="two"
                >
                  <template #default>
                    <div>
                      <v-chip size="small">{{ dataset.region.name }}</v-chip>
                      <v-chip size="small">{{ moleculeName(dataset.molecule) }}</v-chip>
                      <v-chip v-if="dataset.timeRange" size="small" class="text-caption">
                        {{ dataset.timeRange.description }}
                      </v-chip>
                    </div>
                    <div
                      v-if="dataset.loading || !dataset.samples"
                      class="dataset-loading"
                    >
                      <v-progress-linear
                        :class="['dataset-loading-progress', !(dataset.loading && dataset.samples) ? 'dataset-loading-failed' : '']"
                        :active="dataset.loading || !dataset.samples"
                        :color="dataset.loading ? 'primary' : 'red'"
                        :indeterminate="dataset.loading"
                        :value="!dataset.loading ? 100 : 0"
                        :striped="!dataset.loading"
                        bottom
                        rounded
                        height="20"
                      >
                        <template #default>
                          <span class="text-subtitle-2">
                            {{ dataset.loading ? 'Data Loading' : (!dataset.samples ? 'Error Loading Data' : '') }}
                          </span>
                        </template>
                      </v-progress-linear>
                      <div v-if="!(dataset.loading || dataset.samples)">
                        <v-tooltip
                          text="Failure info"
                          location="top"
                        >
                          <template #activator="{ props }">
                            <v-btn
                              v-bind="props"
                              size="x-small"
                              icon="mdi-help-circle"
                              variant="plain"
                              @click="() => sampleErrorID = dataset.id"
                            ></v-btn>
                          </template>
                        </v-tooltip>
                        <v-tooltip
                          text="Remove selection"
                          location="top"
                        >
                          <template #activator="{ props }">
                            <v-btn
                              v-bind="props"
                              size="x-small"
                              icon="mdi-trash-can"
                              variant="plain"
                              @click="() => removeDataset(dataset)"
                            ></v-btn>
                          </template>
                        </v-tooltip>
                      </div>
                    </div>

                    <v-expand-transition>
                      <div
                        class="selection-icons"
                        v-show="dataset.samples && (touchscreen ? openSelection == dataset.id : isHovering)"
                      >
                        <v-tooltip
                          text="Get Center Point Sample"
                          location="top"
                        >
                          <template #activator="{ props }">
                            <v-btn
                              v-bind="props"
                              size="x-small"
                              :loading="loadingPointSample === dataset.id"
                              icon="mdi-image-filter-center-focus"
                              variant="plain"
                              @click="() => store.fetchCenterPointDataForSelection(dataset)"
                            ></v-btn>
                          </template>
                        </v-tooltip> 
                        <v-tooltip
                          text="Show table"
                          location="top"
                        >
                          <template #activator="{ props }">
                            <v-btn
                              v-bind="props"
                              size="x-small"
                              icon="mdi-table"
                              :disabled="!dataset.samples"
                              variant="plain"
                              @click="() => tableSelection = dataset"
                            ></v-btn>
                          </template>
                        </v-tooltip>
                        <v-tooltip
                          text="Show graph"
                          location="top"
                        >
                          <template #activator="{ props }">
                            <v-btn
                              v-bind="props"
                              size="x-small"
                              icon="mdi-chart-line"
                              :disabled="!dataset.samples"
                              variant="plain"
                              @click="() => openGraphs[dataset.id] = true"
                            ></v-btn>
                          </template>
                        </v-tooltip>
                        <v-tooltip
                          text="Remove selection"
                          location="top"
                        >
                          <template #activator="{ props }">
                            <v-btn
                              v-bind="props"
                              size="x-small"
                              icon="mdi-trash-can"
                              variant="plain"
                              @click="() => removeDataset(dataset)"
                            ></v-btn>
                          </template>
                        </v-tooltip>
                      </div>
                    </v-expand-transition>
                    <cds-dialog
                      :title="graphTitle(dataset)"
                      v-model="openGraphs[dataset.id]"
                      title-color="#F44336"
                      draggable
                      persistent
                      :scrim="false"
                      :modal="false"
                    >
                      <v-checkbox
                        v-model="showErrorBands"
                        label="Show Errors"
                        density="compact"
                        hide-details
                      >
                      </v-checkbox>
                      <timeseries-graph
                        :data="dataset ? [dataset] : []"
                        :show-errors="showErrorBands"
                      />
                    </cds-dialog>
                    <v-dialog
                      :model-value="sampleErrorID !== null"
                      max-width="50%"
                    >
                      <v-card>
                        <v-toolbar
                          density="compact"
                        >
                          <v-toolbar-title text="Error Loading Data"></v-toolbar-title>
                          <v-spacer></v-spacer>
                          <v-btn
                            icon="mdi-close"
                            @click="sampleErrorID = null"
                          >
                          </v-btn>
                        </v-toolbar>
                        <v-card-text>
                          There was an error loading data for this selection. Either there is no data for the
                          region/time range/molecule combination that you selected, or there was an error loading
                          data from the server. You can delete this selection and try making a new one.
                        </v-card-text>
                      </v-card>
                    </v-dialog>
                  </template>
                </v-list-item>
              </v-hover>
            </v-list>
          </div>
        </template>
      </v-expansion-panel>
    </v-expansion-panels>
    </div>
  
    <v-btn v-if="no2GraphData.length > 0" @click="showNO2Graph = true">
      Show NO₂ Graph
    </v-btn>
    <cds-dialog
      title="Nitrogen Dioxide Data"
      v-model="showNO2Graph"
      draggable
      persistent
      :modal="false"
      :scrim="false"
    >
      <v-checkbox
        v-model="showErrorBands"
        label="Show Errors"
        density="compact"
        hide-details
      >
      </v-checkbox>
      <timeseries-graph
        :data="no2GraphData.length > 0 ? no2GraphData : []"
        :show-errors="showErrorBands"
      />
    </cds-dialog>

    <v-btn v-if="o3GraphData.length > 0" @click="showO3Graph = true">
      Show Ozone Graph
    </v-btn>
    <cds-dialog
      title="Ozone Data"
      v-model="showO3Graph"
      draggable
      persistent
      :modal="false"
      :scrim="false"
    >
      <v-checkbox
        v-model="showErrorBands"
        label="Show Errors"
        density="compact"
        hide-details
      >
      </v-checkbox>
      <timeseries-graph
        :data="o3GraphData.length > 0 ? o3GraphData : []"
        :show-errors="showErrorBands"
      />
    </cds-dialog>
    
    <v-btn v-if="hchoGraphData.length > 0" @click="showHCHOGraph = true">
      Show Formaldehyde Graph
    </v-btn>
    <cds-dialog
      title="Formaldehyde Data"
      v-model="showHCHOGraph"
      draggable
      persistent
      :modal="false"
      :scrim="false"
    >
      <v-checkbox
        v-model="showErrorBands"
        label="Show Errors"
        density="compact"
        hide-details
      >
      </v-checkbox>
      <timeseries-graph
        :data="hchoGraphData.length > 0 ? hchoGraphData : []"
        :show-errors="showErrorBands"
      />
    </cds-dialog>
  </div>

</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { supportsTouchscreen } from "@cosmicds/vue-toolkit";

import type { UserSelection } from "../types";
import { useTempoStore } from "../stores/app";
import { moleculeName, MOLECULE_OPTIONS } from "../esri/utils";

const store = useTempoStore();
const {
  accentColor2,
  backend,
  regions,
  datasets,
  timeRanges,
} = storeToRefs(store);

const touchscreen = supportsTouchscreen();

const openPanels = ref<number[]>([]);
const openGraphs = ref<Record<string,boolean>>({});
const openSelection = ref<string | null>(null);
const tableSelection = ref<UserSelection | null>(null);

const pointSelectionActive = ref(false);
const rectangleSelectionActive = ref(false);
const createTimeRangeActive = ref(false);
const createDatasetActive = ref(false);
const datasetRowRefs = ref({});


function removeDataset(selection: UserSelection) {
  store.deleteDataset(selection);

  delete openGraphs[selection.id];
  delete datasetRowRefs[selection.id];
}

function graphTitle(selection: UserSelection): string {
  const molecule = selection.molecule;
  const molTitle = MOLECULE_OPTIONS.find(m => m.value === molecule)?.title || '';
  return `${molTitle} Time Series for ${selection.region.name}`;
}

const showNO2Graph = ref(false);
const no2GraphData = computed(() =>{
  return datasets.value.filter(s => s.molecule.includes('no2') && selectionHasSamples(s));
});

// ozone version
const showO3Graph = ref(false);
const o3GraphData = computed(() =>{
  return datasets.value.filter(s => s.molecule.includes('o3') && selectionHasSamples(s));
});

// formaldehyde version
const showHCHOGraph = ref(false);
const hchoGraphData = computed(() =>{
  return datasets.value.filter(s => s.molecule.includes('hcho') && selectionHasSamples(s));
});

const showErrorBands = ref(true);
</script>
