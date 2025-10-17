<template>
  <div>
    <v-checkbox
      v-model="allModel"
      label="All"
      density="compact"
      hide-details
    >
    </v-checkbox>
    <v-checkbox
      v-for="(category, index) in PLANT_CATEGORIES"
     :key="category"
     v-model="categoryModels[index]"
     :label="category"
      density="compact"
      hide-details
    >
    </v-checkbox>
    <v-checkbox
      v-for="source in Object.keys(MODELS)"
      v-model="MODELS[source]"
      :key="source"
      :label="source"
      density="compact"
      hide-details
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
const categoryModels = PLANT_CATEGORIES.map((category => createCategoryModel(category)));
type PlantCategory = typeof PLANT_CATEGORIES[number];


const MODELS = ref<Record<PrimSource, Ref<boolean>>>(Object.values(PrimSource)
  .reduce((obj, source) => ({ ...obj, [source]: ref(true) }), {} as Record<PrimSource, Ref<boolean>>));

const allModel = computed({
  get() {
    return true;
    // return categoryModels.every(r => r.value) && Object.values(MODELS).every(r => r.value);
  },
  set(_value: boolean) {
    // Object.values(MODELS).forEach(r => {
    //   r.value = value;
    // });
  }
});

const MODELS_BY_CATEGORY: Record<PlantCategory, Ref<boolean>[]> = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Renewables: RenewableSources.map(source => MODELS[source]),
  "Fossil Fuels": TraditionalSources.map(source => MODELS[source]),
};

console.log(MODELS);
console.log(MODELS_BY_CATEGORY);

function createCategoryModel(category: PlantCategory): Ref<boolean> {
  return computed({
    get() {
      console.log(category);
      console.log(MODELS_BY_CATEGORY[category]);
      console.log(MODELS_BY_CATEGORY[category].every(r => r.value));
      return true;
      // return MODELS_BY_CATEGORY[category].every(r => r.value);
    },
    set(value: boolean) {
      MODELS_BY_CATEGORY[category].forEach(r => {
        console.log(`Setting to ${value}`);
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
