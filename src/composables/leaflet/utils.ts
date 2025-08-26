import { LatLng, LatLngBounds, Map, Rectangle, CircleMarker } from "leaflet";
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
    weight: 0,
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

export function removeRectangleLayer(
  map: Map,
  rect: Rectangle
) {
  map.removeLayer(rect);
}


export function addPointLayer(
  map: Map,
  info: { x: number; y: number },
  color: string,
) {
  const latlng = new LatLng(info.y, info.x);
  const marker = new CircleMarker(latlng, {
    radius: 6,
    fillColor: color,
    color: "white",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8,
  });
  map.addLayer(marker);
  return { layer: marker };
}

export function updatePointLocation(
  marker: CircleMarker,
  info: { x: number; y: number },
) {
  const latlng = new LatLng(info.y, info.x);
  marker.setLatLng(latlng);
}

export function removePointLayer(
  map: Map,
  layer: CircleMarker,
) {
  map.removeLayer(layer);
}
