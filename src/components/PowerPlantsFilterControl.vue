<template>
  <div>
    <v-checkbox
      v-for="category in PLANT_CATEGORIES"

    >
    </v-checkbox>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, type Ref } from "vue";
import type { LayerSpecification, Map } from "maplibre-gl";

import { 
  PrimSource,
  RenewableSources,
  TraditionalSources,
} from "@/assets/power_plants";

interface Props {
  map: Map;
  layerId: string;
}

const props = defineProps<Props>();

const PLANT_CATEGORIES = ["Renewables", "Fossil Fuels"] as const;
type PlantCategory = typeof PLANT_CATEGORIES[number];

const MODELS: Record<PrimSource, Ref<boolean>> = Object.values(PrimSource)
  .reduce((obj, source) => ({ ...obj, [source]: ref(true) }), {} as Record<PrimSource, Ref<boolean>>);

const CATEGORY_MODELS: Record<PlantCategory, Ref<boolean>[]> = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Renewables: RenewableSources.map(source => MODELS[source]),
  "Fossil Fuels": TraditionalSources.map(source => MODELS[source]),
};

function createCategoryModel(category: PlantCategory): Ref<boolean> {
  return computed({
    get() {
      return CATEGORY_MODELS[category].every(r => r.value);
    },
    set(value: boolean) {
      CATEGORY_MODELS[category].forEach(r => {
        r.value = value;
      });
    }
  });
}

type Selection = PrimSource | PlantCategory | "All";

const selectedPrimSource = ref<Selection>("All");

let layers: LayerSpecification[] = [];

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

function applyPrimSourceFilter(source: Selection) {
  const layerIds = ["power-plants-layer", "power-plants-heatmap"];
  layerIds.forEach(id => {
    if (!props.map.getLayer(id)) { return; }

    switch (source) {
    case "All":
      props.map.setFilter(id, null);
      break;
    case "Renewables":
      props.map.setFilter(id, ['in', ['get', 'PrimSource'], ['literal', RenewableSources]]);
      break;
    case "Fossil Fuels":
      props.map.setFilter(id, ['in', ['get', 'PrimSource'], ['literal', TraditionalSources]]);
      break;
    default:
      props.map.setFilter(id, ['==', ['get', 'PrimSource'], source]);
    }
    
  });
}

watch(selectedPrimSource, applyPrimSourceFilter);

</script>
