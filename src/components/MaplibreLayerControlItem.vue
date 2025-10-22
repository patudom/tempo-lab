<template>
  <div
    :id="`mlc-layer-item-${layerId}`"
    :class="['mlc-layer-item', `mlc-layer-item-${visible ? 'visible' : 'none'}`]"
  >
    <div
      class="mlc-layer-item-checkbox-label-container"
    >
      <input
        v-model="visible"
        type="checkbox"
        :id="`mlc-${layerId}-visibility-checkbox`"
        class="mlc-layer-item-checkbox"
      />
      <label
        class="mlc-layer-item-label"
        :for="`mlc-${layerId}-visibility-checkbox`"
      >
        {{ displayName ?? layerId }}
      </label>
    </div>
    <div
      class="mlc-layer-item-opacity-label-container"
    >
      <label
        :for="`mlc-${layerId}-opacity-slider`"
      >
        Transparency: 
      </label>
      <input
        v-model.number="opacity"
        :id="`mlc-${layerId}-opacity-slider`"
        class="mlc-layer-opacity-slider"
        type="range"
        min="0"
        max="1"
        step="0.01"
        title="Adjust layer opacity"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from "vue";
import type { Map } from "maplibre-gl";
import { useMaplibreLayerOpacity } from "@/composables/useMaplibreLayerOpacity";
import { useMaplibreLayerVisibility } from "@/composables/useMaplibreLayerVisibility";

interface Props {
  layerId: string;
  map: Map;
  displayName?: string;
}

const props = defineProps<Props>();
let { opacity } = useMaplibreLayerOpacity(props.map, props.layerId);
let { visible } = useMaplibreLayerVisibility(props.map, props.layerId);

// NB: If the props update, we need to make sure that the refs that we're using are still tracking the same layer
// In particular, if the layer ID changes, without this the component can end up manipulating the wrong layer!
watch(() => [props.map, props.layerId],
  ([map, layerId]: [Map, string]) => {
    opacity = useMaplibreLayerOpacity(map, layerId).opacity;
    visible = useMaplibreLayerVisibility(map, layerId).visible;
  });
</script>
