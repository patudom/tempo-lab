import { 
  IControl, 
  Map,
  LayerSpecification,
} from "maplibre-gl";

import { 
  PrimSource,
  RenewableSource,
  TraditionalSource,
} from "@/assets/power_plants";
import './styles/maplibre-layer-control.css';
import { h, ref, watch, type Ref } from "vue";

function setLayerOpacity(map: Map, layerId: string, opacity: number) {
  const layer = map.getLayer(layerId)!;
  if (!layer) {
    console.warn('Layer not found:', layerId);
    return;
  }

  if (layer.type !== 'symbol') {
    const paintProp = `${layer.type}-opacity`;
    map.setPaintProperty(layerId, paintProp, opacity);
  }
  if (layer.type === 'circle') {
    if (map.getPaintProperty(layerId, 'circle-opacity') !== undefined) {
      map.setPaintProperty(layerId, 'circle-stroke-opacity', opacity);
    }
  }  
  if (layer.type === 'symbol') {
    // icon-opacity
    if (map.getPaintProperty(layerId, 'icon-opacity') !== undefined) {
      map.setPaintProperty(layerId, 'icon-opacity', opacity);
    }
    // text-opacity
    if (map.getPaintProperty(layerId, 'text-opacity') !== undefined) {
      map.setPaintProperty(layerId, 'text-opacity', opacity);
    }
  }
}

function getLayerOpacity(map: Map, layerId: string): number {
  const layer = map.getLayer(layerId);
  if (!layer) return 1;
  
  let op: unknown = 1;
  
  if (layer.type === 'symbol') {
    op = map.getPaintProperty(layerId, 'icon-opacity');
    if (isNaN(op as unknown as number)) {
      op = map.getPaintProperty(layerId, 'text-opacity');
    }
  } else if (layer.type === 'circle') {
    op = map.getPaintProperty(layerId, 'circle-opacity');
    if (isNaN(op as unknown as number)) {
      op = map.getPaintProperty(layerId, 'circle-stroke-opacity');
    }
  } else {
    const paintProp = `${layer.type}-opacity`;
    op = map.getPaintProperty(layerId, paintProp);
  }
  
  return isNumeric(op) ? (op as unknown as number) : 1;
} 

function useLayerOpacity(map: Map, layerId: string, initialValue?: number): Ref<number> {
  const opacity = ref(initialValue ?? 1);
  watch(opacity, (value: number) => setLayerOpacity(map, layerId, value), { immediate: true });
  return opacity;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isNumeric(value: any): boolean {
  return !isNaN(value - parseFloat(value));
}

export interface MaplibreLayersControlOptions {
  ignoreLayers?: string[];
  ignoreSources?: string[];
  shownLayers?: string[];
  linkOpacities?: Record<string, string[]>;
}

export class MaplibreLayersControl implements IControl {
  private _map: Map | undefined;
  private _container: HTMLElement | undefined;
  private _layers: LayerSpecification[] | undefined;
  private _ignoredLayers: string[] = [];
  private _ignoredSources: string[] = [];
  private _shownLayers: string[] = [];

  constructor(options: MaplibreLayersControlOptions) {
    this._ignoredLayers = options.ignoreLayers || [];
    this._ignoredSources = options.ignoreSources || [];
    this._shownLayers = options.shownLayers || [];
  }

  private _createLayerItem(layer: LayerSpecification): HTMLElement {
    if (!this._map || !this._map.getLayer(layer.id)) {
      return document.createElement('div');
    }

  }
}
