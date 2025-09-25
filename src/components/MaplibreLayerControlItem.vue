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
      >
      </input>
      <label
        class="mlc-layer-item-label"
        :for="`mlc-${layer.id}-visibility-checkbox`"
      >
        {{ layer.id }}
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">

</script>
