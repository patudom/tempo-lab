<template>
  <div id="side-panel">
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
              <div class="my-selections" v-if="availableTimeRanges.length>0" style="margin-top: 1em;">
                <h4>My Time Ranges</h4>
                <v-list>
                  <v-list-item
                    v-for="(timeRange, index) in availableTimeRanges"
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
              <div class="my-selections" v-if="availableRegions.length>0" style="margin-top: 1em;">
              <h4>My Regions</h4>                   
                <v-list>
                  <v-list-item
                    v-for="(region, index) in availableRegions"
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
              :active="createSelectionActive"
              :color="accentColor2"                    
              @click="createSelectionActive = !createSelectionActive"
              class="mt-3"
            >
              <template #prepend>
                <v-icon v-if="!createSelectionActive" icon="mdi-plus"></v-icon>
              </template>
              {{ createSelectionActive ? "Cancel" : "New Dataset" }}
            </v-btn>
            <selection-composer
              v-show="createSelectionActive"
              :backend="BACKEND"
              :time-ranges="availableTimeRanges"
              :regions="availableRegions"
              :disabled="{ region: rectangleSelectionActive, point: pointSelectionActive, timeRange: createTimeRangeActive }"
              @create="handleSelectionCreated"
              :tempo-data-service="tempoDataService"
            >
            </selection-composer>
            <div class="my-selections" v-if="selections.length>0" style="margin-top: 1em;">

              <h4>My Datasets</h4>
              <v-list>
                <v-hover
                  v-slot="{ isHovering, props }"
                  v-for="sel in selections"
                  :key="sel.id"
                >
                  <v-list-item
                    v-bind="props"
                    :ref="(el) => datasetRowRefs[sel.id] = el"
                    class="selection-item"
                    :style="{ 'background-color': sel.region.color }"
                    :ripple="touchscreen"
                    @click="() => {
                      if (touchscreen) {
                        openSelection = (openSelection == sel.id) ? null : sel.id;
                      }
                    }"
                    lines="two"
                  >
                    <template #default>
                      <div>
                        <v-chip size="small">{{ sel.region.name }}</v-chip>
                        <v-chip size="small">{{ moleculeName(sel.molecule) }}</v-chip>
                        <v-chip v-if="sel.timeRange" size="small" class="text-caption">
                          {{ sel.timeRange.description }}
                        </v-chip>
                      </div>
                      <div
                        v-if="sel.loading || !sel.samples"
                        class="dataset-loading"
                      >
                        <v-progress-linear
                          :class="['dataset-loading-progress', !(sel.loading && sel.samples) ? 'dataset-loading-failed' : '']"
                          :active="sel.loading || !sel.samples"
                          :color="sel.loading ? 'primary' : 'red'"
                          :indeterminate="sel.loading"
                          :value="!sel.loading ? 100 : 0"
                          :striped="!sel.loading"
                          bottom
                          rounded
                          height="20"
                        >
                          <template #default>
                            <span class="text-subtitle-2">
                              {{ sel.loading ? 'Data Loading' : (!sel.samples ? 'Error Loading Data' : '') }}
                            </span>
                          </template>
                        </v-progress-linear>
                        <div v-if="!(sel.loading || sel.samples)">
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
                                @click="() => sampleErrorID = sel.id"
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
                                @click="() => deleteSelection(sel)"
                              ></v-btn>
                            </template>
                          </v-tooltip>
                        </div>
                      </div>

                      <v-expand-transition>
                        <div
                          class="selection-icons"
                          v-show="sel.samples && (touchscreen ? openSelection == sel.id : isHovering)"
                        >
                          <v-tooltip
                            text="Change Selection Name"
                            location="top"
                          >
                            <template #activator="{ props }">
                              <v-btn
                                v-bind="props"
                                size="x-small"
                                icon="mdi-pencil"
                                @click="() => editSelectionName(sel)"
                                variant="plain"
                              ></v-btn>
                            </template>
                          </v-tooltip>
                          <v-tooltip
                            text="Get Center Point Sample"
                            location="top"
                          >
                            <template #activator="{ props }">
                              <v-btn
                                v-bind="props"
                                size="x-small"
                                :loading="loadingPointSample === sel.id"
                                icon="mdi-image-filter-center-focus"
                                variant="plain"
                                @click="() => fetchCenterPointDataForSelection(sel)"
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
                                :disabled="!sel.samples"
                                variant="plain"
                                @click="() => tableSelection = sel"
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
                                :disabled="!sel.samples"
                                variant="plain"
                                @click="() => openGraphs[sel.id] = true"
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
                                @click="() => deleteSelection(sel)"
                              ></v-btn>
                            </template>
                          </v-tooltip>
                        </div>
                      </v-expand-transition>
                      <cds-dialog
                        :title="graphTitle(sel)"
                        v-model="openGraphs[sel.id]"
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
                          :data="sel ? [sel] : []"
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

    </div>
  </div>
</template>
