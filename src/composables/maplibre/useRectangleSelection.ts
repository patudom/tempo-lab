import { onMounted, onUnmounted, ref, watch, type Ref } from "vue";
import { GeoJSONSource, LngLat, Map, MapMouseEvent } from "maplibre-gl";
import { v4 } from "uuid";

import type { RectangleSelectionInfo } from "../../types";
import type { LayerType } from "./utils";


export function useRectangleSelection(
  map: Ref<Map | null>,
  interactColor: string = "yellow",
  startActive: boolean = false,
) {

  let rectangleSource: GeoJSONSource | null = null;
  let rectangleLayer: LayerType | undefined = undefined;
  let startCoords: LngLat | null = null;
  let geoJson: GeoJSON.FeatureCollection;
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
    geoJson = {
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
      data: geoJson,
    });

    const source = mMap.getSource(uuid);
    if (!source) {
      return;
    }

    rectangleSource = source as GeoJSONSource;

    mMap.addLayer({
      id: uuid,
      type: "line",
      source: uuid,
      paint: {
        "line-color": interactColor,
        "line-width": 2,
        "line-dasharray": [2, 1],
      }
    });

    const layer = mMap.getLayer(uuid);
    if (layer) {
      rectangleLayer = layer;
    }
  }

  function onMouseup(event: MapMouseEvent) {
    const mMap = map.value;
    if (!mMap || startCoords === null) {
      return;
    }

    const eventCoords = event.lngLat;
    selectionInfo.value = {
      xmin: startCoords.lng,
      ymin: startCoords.lat,
      xmax: eventCoords.lng,
      ymax: eventCoords.lat,
    };

    if (rectangleLayer) {
      mMap.removeLayer(rectangleLayer.id);
    }
    if (rectangleSource) {
      mMap.removeSource(rectangleSource.id);
    }
    startCoords = null;

  }

  function onMousemove(event: MapMouseEvent) {
    const mMap = map.value;
    if (!mMap || (startCoords === null) || (!geoJson)) {
      return;
    }

    const eventCoords = event.lngLat;
    const coordinates = [[
      [startCoords.lng, startCoords.lat],
      [eventCoords.lng, startCoords.lat],
      [eventCoords.lng, eventCoords.lat],
      [startCoords.lng, eventCoords.lat],
      [startCoords.lng, startCoords.lat],
    ]];

    geoJson.features[0] = {
      ...geoJson.features[0],
      geometry: {
        type: "Polygon",
        coordinates,
      }
    };

    rectangleSource?.setData(geoJson);
  }

  function updateListeners(map: Map, active: boolean) {
    if (active) {
      map.dragPan.disable();
      map.scrollZoom.disable();
      map.on("mousedown", onMousedown);
      map.on("mouseup", onMouseup);
      map.on("mousemove", onMousemove);
    } else {
      map.dragPan.enable();
      map.scrollZoom.enable();
      map.off("mousedown", onMousedown);
      map.off("mouseup", onMouseup);
      map.off("mousemove", onMousemove);
    }
  }

  watch(active, (nowActive: boolean) => {
    const mMap = map.value;
    if (mMap !== null) {
      updateListeners(mMap, nowActive);
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
    const mMap = map.value;
    if (mMap !== null && active.value) {
      updateListeners(mMap, false);
    }
  });

  return {
    selectionInfo,
    active,
  };

}
