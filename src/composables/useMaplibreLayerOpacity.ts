import { Map } from "maplibre-gl";
import { ref, watch } from "vue";

import { setLayerOpacity } from "@/maplibre_controls";

export function useMaplibreLayerOpacity(
  map: Map,
  layerId: string,
  initialOpacity?: number,
) {
  const opacity = ref(initialOpacity ?? 1);
  watch(opacity, (value: number) => setLayerOpacity(map, layerId, value), { immediate: true });
  return {
    opacity,
  };
}
