<template>
  <section class="selection-list">
    <header class="selection-header">
      <h3>Selection</h3>
      <v-btn
        size="x-small"
        icon="mdi-plus"
        @click="$emit('create-new')"
        aria-label="Add new selection"
      />
    </header>
    
    <ul class="selection-items">
      <li
        v-if="filteredSelectionOptions.length === 0"
        class="selection-placeholder"
      >
        <span class="placeholder-text">Select a region on the map</span>
      </li>
      <li
        v-for="(sel, idx) in filteredSelectionOptions"
        :key="sel?.id || idx"
        class="selection-item"
        :class="{ 
          'is-selected': sel === modelValue, 
          'is-editing': sel === modelValue && selectionActive
        }"
        :style="sel?.color ? { '--selection-color': sel.color } : {}"
        @click="handleSelectionClick(idx, sel)"
        tabindex="0"
        @keyup.enter="handleSelectionClick(idx, sel)"
        role="button"
        :aria-label="`Edit selection: ${sel.name}`"
      >
        <span class="selection-name">{{ sel.name }}</span>
        <time v-if="sel.timeRange" class="selection-time">
          {{ formatTimeRange(sel.timeRange) }}
        </time>
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


// Filter out null items from selectionOptions
const filteredSelectionOptions = computed(() => 
  props.selectionOptions.filter(sel => sel !== null)
);

// Function to format time range for display - from TempoLite.vue
function formatTimeRange(ranges:  { start: number; end: number } |  { start: number; end: number }[]): string {
  if (Array.isArray(ranges)) {
    if (ranges.length === 0) {
      return 'No time range set';
    }
    
    if (ranges.length === 1) {
      const range = ranges[0];
      return `${new Date(range.start).toLocaleDateString()} - ${new Date(range.end).toLocaleDateString()}`;
    } else {
      // For multiple ranges, show the full span
      const allStarts = ranges.map(r => r.start);
      const allEnds = ranges.map(r => r.end);
      const minStart = Math.min(...allStarts);
      const maxEnd = Math.max(...allEnds);
      return `${new Date(minStart).toLocaleDateString()} - ${new Date(maxEnd).toLocaleDateString()} (${ranges.length} ranges)`;
    }
  } else {
    return `${new Date(ranges.start).toLocaleDateString()} - ${new Date(ranges.end).toLocaleDateString()}`;
  }
}

// Function to handle selection clicks
function handleSelectionClick(_idx: number, sel: RectangleSelectionType) {
  emits('edit-selection', sel);
}
</script>

<style scoped>
.selection-list {
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
  font-weight: bold;
}

.selection-items {
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid #ccc;
  border-radius: 6px;
  max-height: 160px;
  overflow-y: auto;

}

.selection-item {
  padding: 0.5em;
  margin: 0.25em;
  background: var(--selection-color, #f5f5f5);
  border-radius: 4px;
  cursor: pointer;
  border: 5px solid transparent;
  transition: border-color 0.2s;
}

.selection-item:hover {
  border-color: #ddd;
}

.selection-item.is-selected {
  border-color: white;
  border-width: 3px;
  font-weight: bold;
}

.selection-item.is-editing {
  border-color: #ff4500;
  border-width: 2px;
  font-weight: bold;
}

.selection-item:focus {
  outline: 2px solid #068ede;
  outline-offset: 2px;
}

.selection-name {
  display: block;
  font-weight: 500;
}

.selection-time {
  display: block;
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.25rem;
}

.selection-placeholder {
  padding: 1rem;
  text-align: center;
  color: #999;
  font-style: italic;
  border: 2px dashed #ccc;
  border-radius: 4px;
  margin: 0.25rem;
  background: #fafafa;
}

.placeholder-text {
  font-size: 0.9rem;
}
</style>
