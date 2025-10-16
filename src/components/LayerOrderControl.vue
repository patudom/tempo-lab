
<template>
  <ul>
    <draggable 
      v-model="displayOrder" 
      handle=".drag-handle"
      @sort="(evt: SortableEndEvent) => handleEnd(evt)">
      <template #item="{ element, index }">
        <div>
          <div class="layer-order-row">
            <span class="drag-handle">☰</span>
            <layer-control-item
              :map="mapRef"
              :layer-id="element"
              :display-name="displayNameTransform(element)"
            >
            </layer-control-item>
          </div>
          <hr v-if="index != currentOrder.length - 1" />
        </div>
      </template>
    </draggable>
  </ul>
</template>


<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-unused-vars */
import { computed, type MaybeRef, toValue, toRef } from 'vue';
import draggable from 'vuedraggable';
import {
  SortableChangeEvent,
  SortableChooseEvent,
  SortableCloneEvent,
  SortableEndEvent,
  SortableEmits,
  SortableFilterEvent,
  SortableStartEvent,
  SortableOptions
} from '@/types/sortablejs';
import { useMaplibreLayerOrderControl } from "@/composables/useMaplibreLayerOrderControl";
import M from 'maplibre-gl';


interface Props {
  mapRef: M.Map | null;
  order: MaybeRef<string[]>;
}

const props = defineProps<Props>();
const mapRef = toRef(() => props.mapRef);

// https://vuejs.org/guide/typescript/composition-api.html#typing-component-emits

interface Emits {
  (e: 'change', newOrder: string[]): void;
}
const emit = defineEmits<Emits>();
console.log('LayerOrderControl props:', props);
const { 
  desiredOrder, 
  currentOrder, 
  controller 
} = useMaplibreLayerOrderControl(mapRef, toValue(props.order), true);

function ordersEqual(orderA: string[], orderB: string[]) {
  if (orderA === orderB) { return true; }
  if (orderA.length !== orderB.length) { return false; }

  return orderA.every((el, idx) => el === orderB[idx]);
}

const displayOrder = computed({
  get(): string[] {
    return currentOrder.value.slice().reverse();
  },
  set(value: string[]) {
    controller?.setManagedOrder(value.slice().reverse());
  }
});

function displayNameTransform(layerId: string): string {
  return layerId.replace(/-/g, " ").replace(/\b(\w)/g, function(match) {
    return match.toUpperCase();
  });
}
</script>


<style scoped>
ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
  margin-left: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  height: fit-content;
}
li {
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
  cursor: move;
  margin: 10px 0;
}

.drag-handle {
  font-size: 20pt;

  &:hover {
    cursor: grab;
  }
}

.layer-order-row {
  display: flex;
  flex-direction: row;
  gap: 5px;
}
</style>
