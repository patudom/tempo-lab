import { Ref } from 'vue';
import L from 'leaflet';

export interface MultiMarkerOptions {
  shape?: 'circle' | 'marker';
  color?: string;
  fillColor?: string;
  fillOpacity?: number;
  opacity?: number;
  radius?: number;
  outlineColor?: string;
}

export function useMultiMarker(map: Ref<L.Map | null>, options: MultiMarkerOptions = {}) {
  let markers: L.Layer[] = [];

  function addMarkers(points: Array<{ x: number; y: number }>) {
    if (!map.value) return;
    clearMarkers();
    points.forEach((point) => {
      if (!map.value) return; // needed for typescript 
      let marker: L.Layer;
      if (options.shape === 'marker') {
        marker = L.marker([point.y, point.x], {
          opacity: options.opacity ?? 1,
        });
      } else {
        marker = L.circle([point.y, point.x], {
          radius: options.radius ?? 10,
          color: options.outlineColor ?? options.color ?? '#ff0000',
          fillColor: options.fillColor ?? options.color ?? '#ff0000',
          fillOpacity: options.fillOpacity ?? options.opacity ?? 0.8,
          opacity: options.opacity ?? 1,
        });
      }
      marker.addTo(map.value);
      markers.push(marker);
    });
  }

  function clearMarkers() {
    markers.forEach(marker => marker.remove());
    markers = [];
  }

  return { addMarkers, clearMarkers };
}
