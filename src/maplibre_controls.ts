import type { Map } from "maplibre-gl";
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isNumeric(value: any): boolean {
  return !isNaN(value - parseFloat(value));
}

export function setLayerOpacity(map: Map, layerId: string, opacity: number) {
  const layer = map.getLayer(layerId);
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

export function getLayerOpacity(map: Map, layerId: string): number {
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

export function setLayerVisibility(map: Map, layerId: string, visible: boolean) {
  map.setLayoutProperty(
    layerId,
    "visibility",
    visible ? "visible" : "none",
  );
}
