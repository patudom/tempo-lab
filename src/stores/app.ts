import { defineStore } from "pinia";
import { computed, ref } from "vue";

import type { MappingBackends, TimeRange, UnifiedRegion, UserDataset } from "../types";
import { TempoDataService } from "../esri/services/TempoDataService";
import { ESRI_URLS, MoleculeType } from "../esri/utils";
import { useUniqueTimeSelection } from "../composables/useUniqueTimeSelection";
import { useTimezone, type Timezone } from "../composables/useTimezone";
import { atleast1d } from "../utils/atleast1d";

const createTempoStore = <T extends MappingBackends>(backend: MappingBackends) => defineStore("tempods", () => {
  type UnifiedRegionType = UnifiedRegion<T>;
  const timeRanges = ref<TimeRange[]>([]);
  const regions = ref<UnifiedRegionType[]>([]);
  const datasets = ref<UserDataset[]>([]);
  const timestamps = ref<number[]>([]);
  const timestampsLoaded = ref(false);
  const tempoDataServices: Record<MoleculeType, TempoDataService> = {};
  const backendRef = ref<MappingBackends>(backend);
  const maxSampleCount = ref(50);
  const sampleErrors = ref<Record<string, string | null>>({});

  const selectedTimezone = ref<Timezone>("US/Eastern");
  const { isDST, timezoneOptions: tzOptions } = useTimezone(selectedTimezone);

  const dateIsDST = computed(() => isDST(singleDateSelected.value));
  const timezoneOptions = computed(() => tzOptions(singleDateSelected.value));
     
  // This part is still assuming that multiple maps will be temporally linked
  // If/when we want to make that not the case, we'll need to rethink this
  // and some of the consuming components
  const {
    timeIndex,
    timestamp,
    date,
    singleDateSelected,
    maxIndex,
    minIndex,
    uniqueDays,
    uniqueDaysIndex,
    setNearestDate,
    moveBackwardOneDay,
    moveForwardOneDay,
    nearestDateIndex
  } = useUniqueTimeSelection(timestamps);

  const accentColor = ref("#068ede");
  const accentColor2 = ref("#ffcc33");

  function getTempoDataService(molecule: MoleculeType) {
    if (molecule in tempoDataServices) {
      return tempoDataServices[molecule];
    }
    const url = ESRI_URLS[molecule];
    const service = new TempoDataService(url.url, url.variable);
    tempoDataServices[molecule] = service;
    return service;
  }

  function addTimeRange(range: TimeRange) {
    timeRanges.value.push(range);
  }

  function deleteTimeRange(range: TimeRange) {
    const index = timeRanges.value.findIndex(r => r.id === range.id);
    if (index < 0) {
      return;
    }
    timeRanges.value.splice(index, 1);
  }

  function deleteDataset(dataset: UserDataset) {
    const index = datasets.value.findIndex(s => s.id == dataset.id);
    if (index < 0) {
      return;
    }
    datasets.value.splice(index, 1);
  }

  function addDataset(dataset: UserDataset, fetch=true) {
    datasets.value.push(dataset);
    if (fetch) {
      fetchDataForDataset(dataset);
    }
    return dataset;
  }

  function markDatasetUpdated(dataset: UserDataset) {
    const index = datasets.value.findIndex(ds => ds.id === dataset.id);
    if (index >= 0) {
      datasets.value[index] = { ...dataset };
    }
  }

  function setRegionName(region: UnifiedRegionType, newName: string) {
    if (newName.trim() === '') {
      console.error("Region name cannot be empty.");
      return;
    }
    // eslint-disable-next-line
    // @ts-ignore it is not actually deep
    const existing = (regions.value as UnifiedRegionType[]).find(r => r.name === newName && r.id !== region.id);
    if (existing) {
      console.error(`A region with the name "${newName}" already exists.`);
      return;
    }
    region.name = newName;
    console.log(`Renamed ${region.geometryType} region to: ${newName}`);
  }

  async function fetchDataForDataset(dataset: UserDataset) {
    dataset.loading = true;

    // loadingSamples.value = sel.id;
    // sampleErrors.value[sel.id] = null;
    
    const timeRanges = atleast1d(dataset.timeRange.range);
    
    try {
      const service = getTempoDataService(dataset.molecule);
      const data = await service.fetchTimeseriesData(dataset.region.geometryInfo, timeRanges);
      dataset.samples = data.values;
      dataset.errors = data.errors;
      // loadingSamples.value = "finished";
      console.log(`Fetched data for ${timeRanges.length} time range(s)`);
    } catch (error) {
      sampleErrors.value[dataset.id] = error instanceof Error ? error.message : String(error);
      // loadingSamples.value = "error";
    }
  
    dataset.loading = false;
  
    markDatasetUpdated(dataset);
  }

  async function fetchCenterPointDataForDataset(dataset: UserDataset) {
    sampleErrors.value[dataset.id] = null;

    const service = getTempoDataService(dataset.molecule);
    const timeRanges = atleast1d(dataset.timeRange.range);

    
    try {
      service.setBaseUrl(ESRI_URLS[dataset.molecule].url);
      const data = await service.fetchCenterPointData(
        dataset.region.geometryInfo,
        timeRanges,
        { sampleCount: maxSampleCount.value },
      );
      if (data) {
        dataset.samples = data.values;
        dataset.locations = data.locations;
        console.log(`Fetched center point data for ${timeRanges.length} time range(s)`);
      }
    } catch (error) {
      sampleErrors.value[dataset.id] = error instanceof Error ? error.message : String(error);
    }
  }

  function datasetHasSamples(dataset: UserDataset): boolean {
    return (dataset.samples !== undefined) && Object.keys(dataset.samples).length > 0;
  }

  function regionHasDatasets(region: UnifiedRegionType): boolean {
    const sel = datasets.value.find(ds => ds.region.id === region.id);
    return sel !== undefined;
  }

  function deleteRegion(region: UnifiedRegionType) {
    const index = regions.value.findIndex(r => r.id === region.id);
    if (index < 0) {
      return;
    }
    // if (map.value && region.layer) {
    //   if (isRectangleSelection(region)) {
    //     removeRectangleLayer(map.value as Map, region.layer as unknown as StyleLayer);
    //   } else if (isPointSelection(region)) {
    //     removePointLayer(map.value as Map, region.layer as unknown as StyleLayer);
    //   }
    // }
  }

  // ESRI layer composable
  // const { getEsriTimeSteps, loadingEsriTimeSteps, addEsriSource, esriTimesteps, changeUrl, renderOptions } = useEsriLayer(
  //   esriUrl.value,
  //   esriVariable.value,
  //   timestampRef,
  //   opacityRef
  // );

  return {
    accentColor,
    accentColor2,

    selectedTimezone,
    dateIsDST,
    timezoneOptions,

    regions,
    timeRanges,
    backend: backendRef,
    maxSampleCount,
    getTempoDataService,
    tempoDataServices,
    datasets,
    timestamps,
    timestampsLoaded,

    addTimeRange,
    addDataset,
    fetchDataForDataset,
    fetchCenterPointDataForDataset,
    markDatasetUpdated,
    datasetHasSamples,
    regionHasDatasets,
    setRegionName,

    deleteTimeRange,
    deleteRegion,
    deleteDataset,

    timeIndex,
    timestamp,
    date,
    singleDateSelected,
    maxIndex,
    minIndex,
    uniqueDays,
    uniqueDaysIndex,
    setNearestDate,
    moveBackwardOneDay,
    moveForwardOneDay,
    nearestDateIndex,
  };
});

export const useTempoStore = createTempoStore("maplibre");
