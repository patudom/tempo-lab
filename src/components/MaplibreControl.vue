<template>
  <ul>
    <draggable
      v-model="currentOrder"
      @sort="(event: SortableEndEvent) => handleEnd(event)">
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
import { toRef, ref, onMounted } from "vue";
import type { LayerSpecification, Map } from "maplibre-gl";

import MaplibreLayerControlItem from "@/components/MaplibreLayerControlItem.vue";
import { useMaplibreLayerOrderControl } from "@/composables/useMaplibreLayerOrderControl";
import type { SortableEndEvent } from "@/types/sortablejs";

interface Props {
  map: Map;
}

const props = defineProps<Props>();
const mapRef = toRef(() => props.map);

const layers = ref<LayerSpecification[]>(props.map.getStyle().layers);

const {
  currentOrder,
  controller
} = useMaplibreLayerOrderControl(mapRef, props.map.getStyle().layers.map(layer => layer.id), true);

function handleEnd(event: SortableEndEvent) {
  if (controller && event.oldIndex && event.newIndex) {
    controller.moveActualLayerByIndex(event.oldIndex, event.newIndex);
  }
}


onMounted(() => {
  props.map.on("styledata", () => {
    layers.value = props.map.getStyle().layers; 
  });
});
</script>
