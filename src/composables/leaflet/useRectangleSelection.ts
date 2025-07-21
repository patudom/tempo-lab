import { onMounted, ref, watch, type Ref } from "vue";
import { type LatLng, LatLngBounds, type LeafletMouseEvent, Map, Rectangle } from "leaflet";

export interface RectangleSelectionInfo {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

export function useRectangleSelection(
  map: Ref<Map | null>, 
  interactColor: string = "yellow",
  startActive: boolean = false,
) {
  let rect: Rectangle | null = null;
  let startCoords: LatLng | null = null;
  const selectionInfo = ref<RectangleSelectionInfo | null>(null);
  const active = ref(startActive);

  onMounted(() => {
    const lMap = map.value;
    if (active.value && lMap) {
      updateListeners(lMap, active.value);
    }
  });

  function onMousedown(event: LeafletMouseEvent) {
    startCoords = event.latlng;
    rect = new Rectangle(new LatLngBounds(startCoords, startCoords));
    rect.setStyle({
      weight: 1,
      fillOpacity: 0,
      dashArray: [5, 5],
      color: interactColor,
    });
    map.value?.addLayer(rect);
  }

  function onMouseup(event: LeafletMouseEvent) {
    if (startCoords === null) {
      return;
    }

    const eventCoords = event.latlng;
    selectionInfo.value = {
      xmin: startCoords.lng,
      ymin: startCoords.lat,
      xmax: eventCoords.lng,
      ymax: eventCoords.lat,
    };

    if (rect) {
      map.value?.removeLayer(rect);
      rect = null;
    }
    startCoords = null;
  }

  function onMousemove(event: LeafletMouseEvent) {
    if (startCoords === null || rect === null) {
      return;
    }
    rect.setBounds(new LatLngBounds(startCoords, event.latlng));
  }

  function updateListeners(map: Map, active: boolean) {
    if (active) {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.addEventListener("mousedown", onMousedown);
      map.addEventListener("mouseup", onMouseup);
      map.addEventListener("mousemove", onMousemove);
    } else {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.removeEventListener("mousedown", onMousedown);
      map.removeEventListener("mouseup", onMouseup);
      map.removeEventListener("mousemove", onMousemove);
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

  return {
    selectionInfo,
    active,
  };

}
