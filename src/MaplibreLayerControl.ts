import { 
  IControl, 
  Map,
  LayerSpecification,
} from "maplibre-gl";

import { 
  PrimSource,
} from "@/assets/power_plants";
import './styles/maplibre-layer-control.css'; // added

// useful reference:
// https://github.com/reyemtm/mapbox-layer-control/blob/master/src/layerControlSimple.js

// https://maplibre.org/maplibre-gl-js/docs/API/interfaces/IControl/
// class HelloWorldControl: IControl {
//     onAdd(map) {
//         this._map = map;
//         this._container = document.createElement('div');
//         this._container.className = 'maplibregl-ctrl';
//         this._container.textContent = 'Hello, world';
//         return this._container;
//     }

//     onRemove() {
//         this._container.parentNode.removeChild(this._container);
//         this._map = undefined;
//     }
// }

// A super simple layer control to toggle visibility of layers
export class MaplibreLayersControl implements IControl {
  private _map: Map | undefined;
  private _container: HTMLElement | undefined;
  private _layers: LayerSpecification[] | undefined;
  private _ignoredLayers: string[] = [];
  private _ignoredSources: string[] = [];
  private _shownLayers: string[] = [];
  private _selectedPrimSource: PrimSource | 'All' = 'All';
  
  constructor(ignoreLayers?: string[], ignoreSources?: string[], shownLayers?: string[]) {
    this._ignoredLayers = ignoreLayers || [];
    this._ignoredSources = ignoreSources || [];
    this._shownLayers = shownLayers || [];
  }
  
  // apply current PrimSource filter to both layers if present
  private _applyPrimSourceFilter() {
    if (!this._map) return;
    const selected = this._selectedPrimSource;
    const layerIds = ['power-plants-layer', 'power-plants-layerheatmap'];
    layerIds.forEach(id => {
      if (!this._map!.getLayer(id)) return;
      if (selected === 'All') {
        this._map!.setFilter(id, null);
      } else {
        this._map!.setFilter(id, ['==', ['get', 'PrimSource'], selected]);
      }
    });
  }

  private _createLayerItem(layer: LayerSpecification): HTMLElement {
    // console.log('Creating layer item for', layer.id);
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    // corrected: checked when layer is visible
    checkbox.checked = layer.layout?.visibility !== 'none';
    checkbox.addEventListener('change', () => {
      if (this._map) {
        this._map.setLayoutProperty(
          layer.id,
          'visibility',
          checkbox.checked ? 'visible' : 'none'
        );
      }
    });

    const label = document.createElement('label');
    label.classList.add('mlc-layer-item');
    label.textContent = layer.id;
    label.appendChild(checkbox);
    return label;
  }
  
  
  get filteredLayers(): LayerSpecification[] {
    if (!this._layers) return [];
    return this._layers.filter(layer => {
      if (!layer.id) return false;
      if (this._ignoredLayers.includes(layer.id)) return false;
      // eslint-disable-next-line 
      // @ts-ignore
      if (layer.source && this._ignoredSources.includes(layer.source as string)) return false;
      if (this._shownLayers.length > 0 && !this._shownLayers.includes(layer.id)) return false;
      return true;
    });
  }
  
  _createPrimsSourceFilterElement(): HTMLElement {
    const label = document.createElement('label') as HTMLLabelElement;
    label.classList.add('mlc-filter');
    label.textContent = "Power Plants by Primary Source";
    
    const select = document.createElement('select');
    
    const allOption = document.createElement('option');
    allOption.value = 'All';
    allOption.textContent = 'All';
    select.appendChild(allOption);
    
    Object.values(PrimSource).forEach(source => {
      const option = document.createElement('option');
      option.value = source;
      option.textContent = source;
      select.appendChild(option);
    });

    // set the select to the persisted value
    select.value = this._selectedPrimSource;

    select.addEventListener('change', () => {
      this._selectedPrimSource = select.value as PrimSource | 'All';
      this._applyPrimSourceFilter();
    });
    
    label.appendChild(select);

    // ensure map reflects the persisted selection after (re)creation
    this._applyPrimSourceFilter();

    return label;
  }
  
  onLayersChanged(layers: LayerSpecification[]) {
    this._layers = layers;
    if (this._container) {
      // Clear existing items
      this._container.innerHTML = '';
      // Re-add items
      const elements = this.filteredLayers.map(layer => this._createLayerItem(layer));
      elements.forEach(el => this._container?.appendChild(el));
      this._container.appendChild(this._createPrimsSourceFilterElement());
      // re-apply filter to current layers
      this._applyPrimSourceFilter();
    }
  }
  
  

  onAdd(map: Map): HTMLElement {
    this._map = map;
    this._layers = map.getStyle().layers;
    const elements = this.filteredLayers.map(layer => this._createLayerItem(layer));
    this._container =  document.createElement('div');
    this._container.className = 'maplibregl-ctrl maplibre-layer-control';
    elements.forEach(el => this._container?.appendChild(el));
    this._container.appendChild(this._createPrimsSourceFilterElement());
    
    map.on('styledata', () => {
      // check if layers changed
      console.log('Style data event received');
      const newLayerIds = new Set((map.getStyle().layers || []).map(l => l.id));
      const oldLayerIds = new Set((this._layers ?? []).map(l => l.id));
      const hasNewLayers = newLayerIds.size !== oldLayerIds.size || [...newLayerIds].some(id => !oldLayerIds.has(id));
      if (hasNewLayers) {
        console.log('Style data changed, updating layer list');
        this.onLayersChanged(map.getStyle().layers || []);
      }
      // check layer visibility changes
      const visibilityChanged = (this._layers ?? []).some(oldLayer => {
        const newLayer = map.getStyle().layers?.find(l => l.id === oldLayer.id);
        return newLayer && oldLayer.layout?.visibility !== newLayer.layout?.visibility;
      });
      if (visibilityChanged) {
        console.log('Layer visibility changed, updating layer list');
        this.onLayersChanged(map.getStyle().layers || []);
      }
    });
    
    // watch for 

    // ensure initial selection is applied
    this._applyPrimSourceFilter();

    return this._container;
  }
  
  onRemove(_map: Map): void {
    this._map = undefined;
  }
}