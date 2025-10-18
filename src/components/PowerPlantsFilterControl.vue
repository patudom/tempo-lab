<template>
  <v-expansion-panels multiple>
    <div>
      <v-btn
       @click="handleGlobalSelect(true)"
      >All</v-btn>
      <v-btn
        @click="handleGlobalSelect(false)"
      >None</v-btn>
    </div>
    <v-expansion-panel
      v-for="(category, index) in PLANT_CATEGORIES"
      :key="index"
      :title="category"
    >
      <template #text>
        <v-btn
          @click="handleCategoryGlobalSelect(category, true)"
        >All</v-btn>
        <v-btn
          @click="handleCategoryGlobalSelect(category, false)"
        >None</v-btn>
        <v-checkbox
          v-for="source in SOURCES_BY_CATEGORY[category]"
          :label="source"
          :key="source"
          :value="source"
          v-model="selectedSources"
          density="compact"
          hide-details
        ></v-checkbox>
      </template>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
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

const PLANT_CATEGORIES = ["Renewables", "Fossil Fuels", "Other"] as const;
type PlantCategory = typeof PLANT_CATEGORIES[number];

const selectedSources = ref<PrimSource[]>(Object.values(PrimSource));

const SOURCES_BY_CATEGORY: Record<PlantCategory, readonly PrimSource[]> = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Renewables: RenewableSources,
  "Fossil Fuels": TraditionalSources,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Other: Object.values(PrimSource).filter(source => 
    !((RenewableSources as unknown as PrimSource[]).includes(source) || 
      (TraditionalSources as unknown as PrimSource[]).includes(source))
  ),
};

function handleGlobalSelect(value: boolean) {
  selectedSources.value = value ? [...Object.values(PrimSource)] : [];
}

function handleCategoryGlobalSelect(category: PlantCategory, value: boolean) {
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

let layers: LayerSpecification[] = [];

function onLayersChanged(newLayers: LayerSpecification[]) {
  layers = newLayers;
  applyPrimSourceFilter(selectedSources.value);
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

  applyPrimSourceFilter(selectedSources.value);
});

watch(selectedSources, applyPrimSourceFilter);

function applyPrimSourceFilter(sources: PrimSource[]) {
  const layerIds = ["power-plants-layer", "power-plants-heatmap"];
  layerIds.forEach(id => {
    if (!props.map.getLayer(id)) { return; }

    if (sources.length === Object.values(PrimSource).length) {
      props.map.setFilter(id, null);
    } else {
      props.map.setFilter(id, ["in", ["get", "PrimSource"], ["literal", sources]]);
    }
  });
}
</script>
