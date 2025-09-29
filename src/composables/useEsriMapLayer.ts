import { ref, watch, Ref, MaybeRef, toRef, computed } from 'vue';
import { RenderingRuleOptions } from '@/esri/ImageLayerConfig';
import { Map, type MapSourceDataEvent } from 'maplibre-gl';
import { validate as uuidValidate } from "uuid";

import { ImageService } from 'mapbox-gl-esri-sources';
import { TempoDataService } from '@/esri/services/TempoDataService';
import { type PointBounds } from '@/esri/geometry';



interface UseEsriLayer {
  esriImageSource: Ref<maplibregl.RasterTileSource | null>;
  opacity: Ref<number>;
  noEsriData: Ref<boolean>;
  loadingEsriTimeSteps: Ref<boolean>;
  esriTimesteps: Ref<number[]>;
  updateEsriOpacity: (value?: number | null | undefined) => void;
  updateEsriTimeRange: () => void;
  addEsriSource: (map: Map) => void;
  renderOptions: Ref<RenderingRuleOptions>;
}

export function useEsriImageServiceLayer(
  serviceUrl: string,
  layerId: string,
  opacity: MaybeRef<number>,
  _timestamp: MaybeRef<number>,
  renderingRule: unknown,
  clickValue = false,
): UseEsriLayer {

  const timestamp = toRef(_timestamp);
  const url = ref(serviceUrl);
  const esriLayerId = layerId;
  const esriImageSource = ref<maplibregl.RasterTileSource | null>(null);
  const map = ref<Map | null>(null);
  
  const tds = new TempoDataService(serviceUrl, 'un-adjusted-population-density');
  // bind tds to the window
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).tds = tds;


  const opacityRef = toRef(opacity);
  const noEsriData = ref(false);
  

  
  const options = computed(() => {
    return  {
      'format': 'png',
      'pixelType': 'U8',
      'size': '256,256',
      'transparent': true,
      'bboxSR': 3857,
      'imageSR': 3857,
      'bbox': '{bbox-epsg-3857}',
      'interpolation': 'RSP_NearestNeighbor',
      'renderingRule': renderingRule,
    };
  });

  
  function addLayer(map: Map | null | undefined) {

    if (map && !map.getLayer(esriLayerId)) {
      map.addLayer({
        id: esriLayerId,
        type: 'raster',
        source: esriLayerId,
        paint: {
          'raster-resampling': 'nearest',
          'raster-opacity': opacityRef.value ?? 0.8,
        },
      });
      let index = -1;
      for (const [idx, layer] of Object.entries(map.getStyle().layers)) {
        if (uuidValidate(layer.id)) {
          index = Number(idx) - 1;
        }
      }
      if (index >= 0) {
        map.moveLayer(esriLayerId, map.getStyle().layers[index].id);
      }
    }
  }
  
  function removeLayer(map: Map | null | undefined) {
    if (map && map.getLayer(esriLayerId)) {
      map.removeLayer(esriLayerId);
    }
  }
  
  const dynamicMapService = ref<ImageService | null>(null);
  
  function onSourceLoad(e: MapSourceDataEvent) {
    // console.log('Source data event: ', e.sourceId, e.isSourceLoaded);
    if (e.sourceId === esriLayerId && e.isSourceLoaded && map.value?.getSource(esriLayerId)) {
      console.log(`ESRI source ${esriLayerId} loaded`);
      esriImageSource.value = map.value?.getSource(esriLayerId) as maplibregl.RasterTileSource;
      updateEsriOpacity();
      dynamicMapService.value.setDate(new Date(timestamp.value-1), new Date(timestamp.value+1));
      map.value?.off('sourcedata', onSourceLoad);
    }
  }
  
  function createImageService(map: Map, url: string, options) {
    return new ImageService(
      esriLayerId,
      map,
      {
        url: url,
        ...options
      },
      {
        tileSize: 256,
      }
    );
    
  }
  
  
  function addEsriSource(mMap: Map) {
    if (!mMap) return;
    map.value = mMap;
    
    dynamicMapService.value = createImageService(mMap, url.value, options.value);

    addLayer(mMap);
    // this event will run until the source is loaded
    mMap.on('sourcedata', onSourceLoad);
    
    // on click on the layer
    if (clickValue) {
      mMap.on('click', (e) => {
        if (_hasEsriSource() && map.value) {
          const point = { x: e.lngLat.lng, y: e.lngLat.lat } as PointBounds;
          const timeRange = {start: timestamp.value - 1, end: timestamp.value + 1};
          tds.fetchSample(point, timeRange ).then((val) => {
            console.log('Value at point', point, 'is', val.samples.map(v => v.value));
          }).catch((err) => {
            console.error('Error fetching sample:', err);
          });
        }
      });
    }
  }
  
  function _hasEsriSource() {
    return map.value?.getSource(esriLayerId) !== undefined;
  }
  
  watch(timestamp, (_value) => {
    console.log('esri imageset timestamp set to ', _value ? new Date(_value) : null);
    if ( _hasEsriSource() ) {
      dynamicMapService.value.setDate(new Date(_value-1), new Date(_value+1));
    } else {
      console.error('ESRI source not yet available');
    }
  });
  
  
  
  function updateEsriOpacity(value: number | null | undefined = undefined) {
    if (map.value) {
      map.value.setPaintProperty(esriLayerId, 'raster-opacity', value ?? opacityRef.value ?? 0.8);
    }
  }

  

  watch(opacityRef, (_value: number) => {
    updateEsriOpacity(_value);
  });

  watch(noEsriData, (value: boolean) => {
    if (value) {
      updateEsriOpacity(0);
      removeLayer(map.value as Map | null);
    } else {
      addLayer(map.value as Map | null);
    }
  });

  return {
    esriImageSource,
    opacity: opacityRef,
    noEsriData,
    updateEsriOpacity,
    addEsriSource,
  } as UseEsriLayer;
}


