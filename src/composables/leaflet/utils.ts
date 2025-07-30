import { LatLng, LatLngBounds, Map, Rectangle } from "leaflet";
import { RectangleSelectionInfo } from "../../types";

export function addRectangleLayer(
  map: Map,
  info: RectangleSelectionInfo,
  color: string,
) {
  const southwest = new LatLng(info.ymin, info.xmin);
  const northeast = new LatLng(info.ymax, info.xmax);
  const bounds = new LatLngBounds(southwest, northeast);
  const rect = new Rectangle(bounds);
  rect.setStyle({
    fill: true,
    fillOpacity: 0.7,
    color,
  });
  map.addLayer(rect);
  return { layer: rect };
}
