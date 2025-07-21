import { onMounted, ref, watch, type Ref } from "vue";
import { LngLat, Map, MapMouseEvent, Rect, Source } from "maplibre-gl";
import { v4 } from "uuid";

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
  let rectangleSource: Source | null = null;
  let startCoords: LngLat | null = null;
  const selectionInfo = ref<RectangleSelectionInfo | null>(null);
  const active = ref(startActive);
  const uuid = v4();

  onMounted(() => {
    const mMap = map.value;
    if (active.value && mMap) {
      updateListeners(mMap, active.value);
    }
  });

  function onMousedown(event: MapMouseEvent) {
    const mMap = map.value;
    if (!mMap) {
      return;
    }

    startCoords = event.lngLat;
    const geoJSON: GeoJSON.GeoJSON = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[
            [startCoords.lng, startCoords.lat],
            [startCoords.lng, startCoords.lat],
            [startCoords.lng, startCoords.lat],
            [startCoords.lng, startCoords.lat],
          ]],
        },
        properties: {},
      }],
    };

    mMap.addSource(uuid, {
      type: "geojson",
      data: geoJSON,
    });

    const source = mMap.getSource(uuid);
    if (!source) {
      return;
    }

    rectangleSource = source;

    mMap.addLayer({
      id: uuid,
      type: "line",
      source: uuid,
      paint: {
        "line-color": interactColor,
        "line-pattern":
      }
    });
  }
}
