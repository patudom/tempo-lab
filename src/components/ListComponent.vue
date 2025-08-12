<template>
  <section class="selection-list">
    <header class="selection-header">
      <h3>Selected Regions</h3>
      <v-btn
        size="x-small"
        icon="mdi-plus"
        @click="$emit('create-new')"
        aria-label="Add new selection"
      />
    </header>
    
    <ul class="selection-items">
      <li v-if="filteredSelectionOptions.length === 0" class="selection-placeholder">
        Select a region on the map
      </li>
      <li
        v-for="(sel, idx) in filteredSelectionOptions"
        :key="sel.id ?? idx"
        @click="select(sel)"
        class="selection-item"
        :style="sel.color ? { '--selection-color': sel.color } : {}"
      >
        <label class="selection-label">
          <input
            type="radio"
            name="region-selection"
            :value="sel"
            v-model="modelValue"
            @change="select(sel)"
          />
          <span class="selection-name">{{ sel.name }}</span>
          <span v-if="sel.timeRange" class="selection-time">
            {{ formatTimeRange(sel.timeRange) }}
          </span>
        </label>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed, defineModel } from 'vue';
import { RectangleSelection, MappingBackends } from '@/types';

type RectangleSelectionType = Omit<RectangleSelection<MappingBackends>, "layer"> | null;
const modelValue = defineModel<RectangleSelectionType>('modelValue');
const props = defineProps<{ selectionOptions: RectangleSelectionType[], selectionActive?: boolean }>();
const emits = defineEmits(['edit-selection', 'create-new']);

const filteredSelectionOptions = computed(() =>
  props.selectionOptions.filter(sel => sel !== null)
);

// Function to format time range for display - from TempoLite.vue
function formatTimeRange(ranges:  { start: number; end: number } |  { start: number; end: number }[]): string {
  if (Array.isArray(ranges)) {
    if (ranges.length === 0) return 'No time range set';
    if (ranges.length === 1) {
      const range = ranges[0];
      return `${new Date(range.start).toLocaleDateString()} - ${new Date(range.end).toLocaleDateString()}`;
    }
    const allStarts = ranges.map(r => r.start);
    const allEnds = ranges.map(r => r.end);
    const minStart = Math.min(...allStarts);
    const maxEnd = Math.max(...allEnds);
    return `${new Date(minStart).toLocaleDateString()} - ${new Date(maxEnd).toLocaleDateString()} (${ranges.length} ranges)`;
  }
  return `${new Date(ranges.start).toLocaleDateString()} - ${new Date(ranges.end).toLocaleDateString()}`;
}

function select(sel: RectangleSelectionType) {
  if (modelValue.value !== sel) {
    modelValue.value = sel;
    emits('edit-selection', sel);
  }
}
</script>

<style scoped>
.selection-list {
  font-size: 0.9em;
  max-height: 200px;
}

.selection-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5em;
}

.selection-header h3 {
  margin: 0;
  font-size: 1em;
}

.selection-items {
  list-style: none;
  padding: 0;
  margin: 0;
}

.selection-item {
  margin: 0.25em 0;
  cursor: pointer;
  background: var(--selection-color, transparent);
  padding: 0.25em 0.5em;
}

.selection-label {
  /* updated to inline layout */
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5em;
}

.selection-name {
  /* no extra formatting */
}

.selection-time {
  /* updated sub-label inline */
  font-size: 0.75em;
  opacity: 0.7;
  margin-left: 0.5em;
}

.selection-placeholder {
  padding: 0.75em;
  text-align: center;
  font-style: italic;
  font-size: 0.85em;
  color: #666;
}


</style>
