import { defineStore } from "pinia";
import { ref } from "vue";

import type { MappingBackends, TimeRange, UnifiedRegion } from "../types";

export const useTempoStore = <T extends MappingBackends>() => defineStore("tempods", () => {
  type UnifiedRegionType = UnifiedRegion<T>;
  const availableTimeRanges = ref<TimeRange[]>([]);
  const availableRegions = ref<UnifiedRegionType[]>([]);

  return {
    availableTimeRanges,
  };
});
