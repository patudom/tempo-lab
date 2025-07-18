import { ref, watch, type Ref } from "vue";
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
) {
  let rect: Rectangle | null = null;
  let startCoords: LatLng | null = null;
  const selectionInfo = ref<RectangleSelectionInfo | null>(null);
  const active = ref(false);

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
  }

  function onMousemove(event: LeafletMouseEvent) {
    if (startCoords === null || rect === null) {
      return;
    }
    rect.setBounds(new LatLngBounds(startCoords, event.latlng));
  }

  watch(active, (nowActive: boolean) => {
    const lMap = map.value;
    if (lMap === null) {
      return;
    }
    if (nowActive) {
      lMap.dragging.disable();
      lMap.scrollWheelZoom.disable();
      lMap.addEventListener("mousedown", onMousedown);
      lMap.addEventListener("mouseup", onMouseup);
      lMap.addEventListener("mousemove", onMousemove);
    } else {
      lMap.dragging.enable();
      lMap.scrollWheelZoom.enable();
      lMap.removeEventListener("mousedown", onMousedown);
      lMap.removeEventListener("mouseup", onMouseup);
      lMap.removeEventListener("mousemove", onMousemove);
    }
  });

  return {
    selectionInfo,
    active,
  };

}
