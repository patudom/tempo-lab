import { defineStore } from "pinia";
import { ref } from "vue";

import type { MappingBackends, TimeRange, UnifiedRegion, UserSelection } from "../types";
import { TempoDataService } from "../esri/services/TempoDataService";
import { ESRI_URLS, MoleculeType } from "../esri/utils";
import { useUniqueTimeSelection } from "../composables/useUniqueTimeSelection";
import { atleast1d } from "../utils/atleast1d";

const createTempoStore = <T extends MappingBackends>(backend: MappingBackends) => defineStore("tempods", () => {
  type UnifiedRegionType = UnifiedRegion<T>;
  const timeRanges = ref<TimeRange[]>([]);
  const regions = ref<UnifiedRegionType[]>([]);
  const datasets = ref<UserSelection[]>([]);
  const timestamps = ref<number[]>([]);
  const timestampsLoaded = ref(false);
  const tempoDataServices: Record<MoleculeType, TempoDataService> = {};
  const backendRef = ref<MappingBackends>(backend);
  const maxSampleCount = ref(50);
  const sampleErrors = ref<Record<string, string | null>>({});

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

  function deleteTimeRange(range: TimeRange) {
    const index = timeRanges.value.findIndex(r => r.id === range.id);
    if (index < 0) {
      return;
    }
    timeRanges.value.splice(index, 1);
  }

  function deleteDataset(dataset: UserSelection) {
    const index = datasets.value.findIndex(s => s.id == dataset.id);
    if (index < 0) {
      return;
    }
    datasets.value.splice(index, 1);
  }

  function addDataset(sel: UserSelection) {
    datasets.value = [...datasets.value, sel];
    return sel;
  }

  async function fetchCenterPointDataForDataset(sel: UserSelection) {
    sampleErrors.value[sel.id] = null;

    const service = getTempoDataService(sel.molecule);
    const timeRanges = atleast1d(sel.timeRange.range);

    
    try {
      service.setBaseUrl(ESRI_URLS[sel.molecule].url);
      const data = await service.fetchCenterPointData(
        sel.region.geometryInfo,
        timeRanges,
        { sampleCount: maxSampleCount.value },
      );
      if (data) {
        sel.samples = data.values;
        sel.locations = data.locations;
        console.log(`Fetched center point data for ${timeRanges.length} time range(s)`);
      }
    } catch (error) {
      sampleErrors.value[sel.id] = error instanceof Error ? error.message : String(error);
    }
  }

  // ESRI layer composable
  const { getEsriTimeSteps, loadingEsriTimeSteps, addEsriSource, esriTimesteps, changeUrl, renderOptions } = useEsriLayer(
    esriUrl.value,
    esriVariable.value,
    timestampRef,
    opacityRef
  );

  return {
    accentColor,
    accentColor2,

    regions,
    timeRanges,
    backend: backendRef,
    maxSampleCount,
    getTempoDataService,
    tempoDataServices,
    datasets,
    timestamps,
    timestampsLoaded,

    addDataset,
    fetchCenterPointDataForDataset,

    deleteTimeRange,
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
