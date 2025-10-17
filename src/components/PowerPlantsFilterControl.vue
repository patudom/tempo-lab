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
      v-model="selectedSources"
      :key="source"
      :label="source"
      :value="source"
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


const selectedSources = ref<PrimSource[]>(Object.values(PrimSource));
const MODELS = ref<Record<PrimSource, Ref<boolean>>>(Object.values(PrimSource)
  .reduce((obj, source) => ({ ...obj, [source]: ref(true) }), {} as Record<PrimSource, Ref<boolean>>));

let _allValue = true;
const allModel = computed({
  get() {
    return _allValue;
  },
  set(value: boolean) {
    _allValue = value;
  }
});

const SOURCES_BY_CATEGORY: Record<PlantCategory, readonly PrimSource[]> = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Renewables: RenewableSources,
  "Fossil Fuels": TraditionalSources,
};

function onCategoryChange(category: PlantCategory, value: boolean) {
  if (value) {
    SOURCES_BY_CATEGORY[category].forEach(source => {
      if (!selectedSources.value.includes(source)) {
        selectedSources.value.push(source);
      }
    });
  } else {
    selectedSources.value = selectedSources.value.filter(item => !SOURCES_BY_CATEGORY[category].includes(item));
  }
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
</script>
