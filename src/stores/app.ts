import { defineStore } from "pinia";
import { ref } from "vue";

import type { MappingBackends, TimeRange, UnifiedRegion, UserSelection } from "../types";

export const useTempoStore = <T extends MappingBackends>() => defineStore("tempods", () => {
  type UnifiedRegionType = UnifiedRegion<T>;
  const availableTimeRanges = ref<TimeRange[]>([]);
  const availableRegions = ref<UnifiedRegionType[]>([]);
  const selections = ref<UserSelection[]>([]);

  return {
    availableRegions,
    availableTimeRanges,
    selections,
  };
});
