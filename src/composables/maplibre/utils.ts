import { GeoJSONSource, Map } from "maplibre-gl";
import { v4 } from "uuid";

import { RectangleSelectionInfo } from "../../types";


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
        coordinates: [[
          [info.xmin, info.ymin],
          [info.xmax, info.ymin],
          [info.xmax, info.ymax],
          [info.xmin, info.ymax],
          [info.xmin, info.ymin],
        ]],
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
