
<template>
  <ul>
    <draggable 
      v-model="currentOrder" 
      handle=".drag-handle"
      @sort="(evt: SortableEndEvent) => handleEnd(evt)">
      <template #item="{ element }">
        <div class="layer-order-row">
          <span class="drag-handle">☰</span>
          <layer-control-item
            :map="mapRef"
            :layer="mapRef?.getLayer(element)"
          >
          </layer-control-item>
        </div>
      </template>
    </draggable>
  </ul>
</template>


<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ref, type Ref, type MaybeRef, watch, toValue, toRef } from 'vue';
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

function handleEnd(evt: SortableEndEvent) {
  if (controller) {
    console.log(evt.item);
    controller.moveActualLayerByIndex(evt.oldIndex!, evt.newIndex!);
  }
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
}

.drag-handle {
  font-size: 20pt;
}

.layer-order-row {
  display: flex;
  flex-direction: row;
  gap: 5px;
}
</style>
