<template>
  <div>
    <v-select
      v-model="selectedPrimSource"
      :items="items"
      label="Power Plants by Primary Source"
    >
    </v-select>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import type { LayerSpecification, Map } from "maplibre-gl";

import { 
  PrimSource,
  RenewableSource,
  TraditionalSource,
} from "@/assets/power_plants";

interface Props {
  map: Map;
  layerId: string;
}

const props = defineProps<Props>();

type PlantCategory = "Renewables" | "Fossil Fuels" | "All";

const selectedPrimSource = ref<PrimSource | PlantCategory>("All");

let layers: LayerSpecification[] = [];

const items = ["All", "Renewables", "Fossil Fuels"].concat(Object.values(PrimSource));

function onLayersChanged(newLayers: LayerSpecification[]) {
  layers = newLayers;
  applyPrimSourceFilter(selectedPrimSource.value);
}

onMounted(() => {
  props.map.on("styledata", () => {
    // check if layers changed
    // console.log('Style data event received');
    const newLayerIds = new Set((props.map.getStyle().layers || []).map(l => l.id));
    const oldLayerIds = new Set(layers.map(l => l.id));
    const hasNewLayers = newLayerIds.size !== oldLayerIds.size || [...newLayerIds].some(id => !oldLayerIds.has(id));
    if (hasNewLayers) {
      // console.log('Style data changed, updating layer list');
      onLayersChanged(props.map.getStyle().layers || []);
    }
    // check layer visibility changes
    const visibilityChanged = layers.some(oldLayer => {
      const newLayer = props.map.getStyle().layers?.find(l => l.id === oldLayer.id);
      return newLayer && oldLayer.layout?.visibility !== newLayer.layout?.visibility;
    });
    if (visibilityChanged) {
      console.log('Layer visibility changed, updating layer list');
      onLayersChanged(props.map.getStyle().layers || []);
    }
  });

  applyPrimSourceFilter(selectedPrimSource.value);
});

function applyPrimSourceFilter(source: PrimSource | PlantCategory) {
  const layerIds = ["power-plants-layer", "power-plants-heatmap"];
  layerIds.forEach(id => {
    if (!props.map.getLayer(id)) { return; }

    switch (source) {
    case "All":
      props.map.setFilter(id, null);
      break;
    case "Renewables":
      props.map.setFilter(id, ['in', ['get', 'PrimSource'], ['literal', Object.values(RenewableSource)]]);
      break;
    case "Fossil Fuels":
      props.map.setFilter(id, ['in', ['get', 'PrimSource'], ['literal', Object.values(TraditionalSource)]]);
      break;
    default:
      props.map.setFilter(id, ['==', ['get', 'PrimSource'], source]);
    }
    
  });
}

watch(selectedPrimSource, applyPrimSourceFilter);

</script>
