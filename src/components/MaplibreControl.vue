<template>
  <ul>
    <draggable
      v-model="currentOrder"
    >
      <MaplibreLayerControlItem
        v-for="layer in layers"
        :key="layer.id"
        :map="map"
        :layer="layer"
        :initial-opacity="1"
      />
    </draggable>
  </ul>
</template>

<script setup lang="ts">
import { computed, toRef, ref, onMounted } from "vue";
import type { LayerSpecification, Map } from "maplibre-gl";

import MaplibreLayerControlItem from "@/components/MaplibreLayerControlItem.vue";

interface Props {
  map: Map;
}

const props = defineProps<Props>();
const mapRef = toRef(() => props.map);

const layers = ref<LayerSpecification[]>(props.map.getStyle().layers);
const order = computed<string[]>(() => layers.value.map(layer => layer.id));

const {
  currentOrder,
  controller
} = useMaplibreLayerOrderControl(mapRef, order, true);


onMounted(() => {
  props.map.on("styledata", () => {
    layers.value = props.map.getStyle().layers; 
  });
});
</script>
