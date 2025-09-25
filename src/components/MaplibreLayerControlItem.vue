<template>
  <div
    :id="`mlc-layer-item-${layer.id}`"
    :class="['mlc-layer-item', `mlc-layer-item-${layer.layout?.visibility === 'none' ? 'hidden' : 'visible'}`]"
  >
    <div
      class="mlc-layer-item-checkbox-label-container"
    >
      <input
        type="checkbox"
        :id="`mlc-${layer.id}-visibility-checkbox`"
        class="mlc-layer-item-checkbox"
      />
      <label
        class="mlc-layer-item-label"
        :for="`mlc-${layer.id}-visibility-checkbox`"
      >
        {{ layer.id }}
      </label>
    </div>
    <div
      class="mlc-layer-item-opacity-label-container"
    >
      <input
        :id="`mlc-${layer.id}-opacity-slider`"
        class="mlc-layer-opacity-slider"
        type="range"
        min="0"
        max="1"
        step="0.01"
        title="Adjust layer opacity"
      />
      <label
        :for="`mlc-${layer.id}-opacity-slider`"
      >
        Transparency: 
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { LayerSpecification } from "maplibre-gl";

interface Props {
  layer: LayerSpecification;
  initialOpacity?: number;
}

const props = withDefaults(defineProps<Props>(), {
  initialOpacity: 1,
});

const opacity = ref(props.initialOpacity);
</script>
