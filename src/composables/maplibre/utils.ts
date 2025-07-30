import { GeoJSONSource, Map } from "maplibre-gl";
import { v4 } from "uuid";

import { RectangleSelectionInfo } from "../../types";
import { geoJson } from "leaflet";

function createBounds(info: RectangleSelectionInfo) {
  return [
    [info.xmin, info.ymin],
    [info.xmax, info.ymin],
    [info.xmax, info.ymax],
    [info.xmin, info.ymax],
    [info.xmin, info.ymin],
  ];
}


export function addRectangleLayer(
  map: Map,
  info: RectangleSelectionInfo,
  color: string,
) {
  
  const uuid = v4();
  const geoJson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          createBounds(info),
        ],
      },
      properties: {},
    }],
  };

  map.addSource(uuid, {
    type: "geojson",
    data: geoJson,
  });
  const source = map.getSource(uuid) as GeoJSONSource;

  map.addLayer({
    id: uuid,
    type: "fill",
    source: uuid,
    paint: {
      "fill-color": color,
      "fill-opacity": 0.7,
    }
  });
  const layer = map.getLayer(uuid);

  return { layer, source };
}

export function updateRectangleBounds(
  source: GeoJSONSource,
  info: RectangleSelectionInfo,
) {
  source.getData().then(data => {
    const geoJson = data as GeoJSON.FeatureCollection;
    geoJson.features[0] = {
      ...geoJson.features[0],
      geometry: {
        type: "Polygon",
        coordinates: [createBounds(info)],
      }
    };

    source.setData(geoJson);
  });
}
