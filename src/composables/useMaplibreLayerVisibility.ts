import { Map } from "maplibre-gl";
import { ref, watch } from "vue";

import { setLayerVisibility } from "@/maplibre_controls";

export function useMaplibreLayerVisibility(
  map: Map,
  layerId: string,
  initialVisibility?: boolean,
) {
  const visible = ref(initialVisibility ?? true);
  watch(visible, (value: boolean) => setLayerVisibility(map, layerId, value), { immediate: true });
  return {
    visible,
  };
}
