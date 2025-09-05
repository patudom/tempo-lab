import { defineStore } from "pinia";
import { ref } from "vue";

import type { MappingBackends, TimeRange, UnifiedRegion, UserSelection } from "../types";
import { TempoDataService } from "../esri/services/TempoDataService";
import { ESRI_URLS, MoleculeType } from "@/esri/utils";

const createTempoStore = <T extends MappingBackends>() => defineStore("tempods", () => {
  type UnifiedRegionType = UnifiedRegion<T>;
  const timeRanges = ref<TimeRange[]>([]);
  const regions = ref<UnifiedRegionType[]>([]);
  const selections = ref<UserSelection[]>([]);
  const timestamps = ref<number[]>([]);
  const timestampsLoaded = ref(false);
  const tempoDataServices: Record<MoleculeType, TempoDataService> = {};

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

  // ESRI layer composable
  const { getEsriTimeSteps, loadingEsriTimeSteps, addEsriSource, esriTimesteps, changeUrl, renderOptions } = useEsriLayer(
    esriUrl.value,
    esriVariable.value,
    timestampRef,
    opacityRef
  );

  return {
    availableRegions: regions,
    availableTimeRanges: timeRanges,
    getTempoDataService,
    tempoDataServices,
    selections,
    timestamps,
    timestampsLoaded,
  };
});

export const useTempoStore = createTempoStore<"maplibre">();
