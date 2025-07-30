import { LatLng, LatLngBounds, Map, Rectangle } from "leaflet";
import { RectangleSelectionInfo } from "../../types";


function createBounds(info: RectangleSelectionInfo): LatLngBounds {
  const southwest = new LatLng(info.ymin, info.xmin);
  const northeast = new LatLng(info.ymax, info.xmax);
  return new LatLngBounds(southwest, northeast);
}

export function addRectangleLayer(
  map: Map,
  info: RectangleSelectionInfo,
  color: string,
) {
  const bounds = createBounds(info);
  const rect = new Rectangle(bounds);
  rect.setStyle({
    fill: true,
    fillOpacity: 0.7,
    color,
  });
  map.addLayer(rect);
  return { layer: rect };
}

export function updateRectangleBounds(
  rectangle: Rectangle,
  info: RectangleSelectionInfo
) {
  rectangle.setBounds(createBounds(info)); 
}
