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
import { ref, watch } from "vue";
import type { Map } from "maplibre-gl";
import { useMaplibreLayerOpacity } from "@/composables/useMaplibreLayerOpacity";

interface Props {
  layerId: string;
  map: Map;
  displayName?: string;
  initialOpacity?: number;
}

const props = withDefaults(defineProps<Props>(), {
  initialOpacity: 1,
});

const visible = ref(true);

let { opacity } = useMaplibreLayerOpacity(props.map, props.layerId, props.initialOpacity);

watch(visible, (nowVisible: boolean) => {
  props.map.setLayoutProperty(
    props.layerId,
    "visibility",
    nowVisible ? "visible" : "none",
  );
});

// NB: If the props update, we need to make sure that the ref that we're using is still tracking the same layer
// In particular, if the layer ID changes, without this the component can end up manipulating the opacity of the wrong layer!
watch(() => [props.map, props.layerId, props.initialOpacity], ([map, layerId, initialOpacity]: [Map, string, number]) => {
  const composable = useMaplibreLayerOpacity(map, layerId, initialOpacity);
  opacity = composable.opacity;
});
</script>
