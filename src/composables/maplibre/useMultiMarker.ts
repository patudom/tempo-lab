import { Ref } from 'vue';
import maplibregl from 'maplibre-gl';

export interface MultiMarkerOptions {
  label?: string;
  color?: string;
  fillColor?: string;
  fillOpacity?: number;
  opacity?: number;
  radius?: number;
  outlineColor?: string;
  paint?: maplibregl.CircleLayerSpecification['paint'];
  layout?: maplibregl.CircleLayerSpecification['layout'];
  shape?: 'circle' | 'marker';
  scale?: 'world' | 'screen';
}

function toGeoJSON(points: Array<{ x: number; y: number }>): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: points.map(pt => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [pt.x, pt.y] } as GeoJSON.Point,
      properties: {},
    })),
  };
}

export function useMultiMarker(map: Ref<maplibregl.Map | null>, options: MultiMarkerOptions = {}) {
  const sourceId = `${options.label ?? 'multi-marker'}-source`;
  const layerId = `${options.label ?? 'multi-marker'}-layer`;
  
  options.scale = options.scale ?? 'screen';
  
  function optionsToPaint() {
    return {
      'circle-radius': options.radius ?? 8,
      'circle-color': options.fillColor ?? options.color ?? '#ff0000',
      'circle-opacity': options.fillOpacity ?? options.opacity ?? 0.8,
      'circle-stroke-color': options.outlineColor ?? options.color ?? '#000',
      'circle-stroke-width': 2
    };
  }

  function addMarkers(points: Array<{ x: number; y: number }>) {
    if (!map.value) return;
    clearMarkers();
    const geojson = toGeoJSON(points);
    if (map.value.getSource(sourceId)) {
      (map.value.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson);
    } else {
      map.value.addSource(sourceId, {
        type: 'geojson',
        data: geojson,
      });
    }
    if (!map.value.getLayer(layerId)) {
      map.value.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          ...optionsToPaint(),
          ...(options.paint ?? {}),
        },
        layout: options.layout ?? {
          'visibility': 'visible',
        },
      } as maplibregl.CircleLayerSpecification);
    }
    
    if (options.scale === 'screen') return;
    // use world scaling
    const newRadius = (options.radius ?? 1) * Math.pow(2, map.value.getZoom() ?? 0);
    if (map.value?.getLayer(layerId)) {
      map.value.setPaintProperty(layerId, 'circle-radius', newRadius);
    }
    
    // on zoom change the size of the markers to keep them the same size on screen
    map.value.on('zoomend', (e) => {
      const zoom = e.target.getZoom() ?? 0;
      const newRadius = (options.radius ?? 1) * Math.pow(2, zoom);
      console.log('new radius', newRadius);
      if (map.value?.getLayer(layerId)) {
        map.value.setPaintProperty(layerId, 'circle-radius', newRadius);
      }
    });
  }

  function clearMarkers() {
    if (!map.value) return;
    if (map.value.getLayer(layerId)) {
      map.value.removeLayer(layerId);
    }
    if (map.value.getSource(sourceId)) {
      map.value.removeSource(sourceId);
    }
  }

  return { addMarkers, clearMarkers };
}