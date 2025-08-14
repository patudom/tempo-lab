import { onMounted, onUnmounted, ref, watch, type Ref } from "vue";
import { type LeafletMouseEvent, Map, Point } from "leaflet";

import { PointSelectionInfo } from "../../types";

export function usePointSelection(
  map: Ref<Map | null>,
  startActive: boolean = false,
) {
  const active = ref(startActive);
  const selectionInfo = ref<PointSelectionInfo | null>(null);

  onMounted(() => {
    const lMap = map.value;
    if (active.value && lMap) {
      updateListeners(lMap, active.value);
    }
  });

  function onMouseup(event: LeafletMouseEvent) {
    selectionInfo.value = {
      x: event.latlng.lng,
      y: event.latlng.lat,
    };
  }

  function updateListeners(map: Map, active: boolean) {
    if (active) {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.addEventListener("mouseup", onMouseup);
    } else {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.removeEventListener("mouseup", onMouseup);
    }
  }

  watch(active, (nowActive: boolean) => {
    const lMap = map.value;
    if (lMap !== null) {
      updateListeners(lMap, nowActive);
    }
  });

  // If we're going to take in the map as a ref,
  // we might as well update if its value does
  watch(map, (newMap: Map | null) => {
    if (newMap !== null) {
      updateListeners(newMap, active.value);
    }
  });

  onUnmounted(() => {
    // The map will probably be destroyed along with the component using this composable
    // But if not, we should remove handlers
    const lMap = map.value;
    if (lMap !== null && active.value) {
      updateListeners(lMap, false);
    }
  });

  return {
    selectionInfo,
    active,
  };
}
