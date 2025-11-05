<template>
  <div :class="{'dtrs-error-highlight': showErrorForEmpty && empty, 'dtrs-months-picker': true}">
    <label class="text-subtitle-2 mb-2 d-block">Months
      <span v-show="showErrorForEmpty && empty" aria-live="polite" style="font-weight: bold;">
        (Select at least 1)
      </span>
    </label>
    <div v-for="month in MONTHS" :key="month" class="d-inline-block">
      <!-- TODO make this a grid, organized, with 3 letter names -->
      <label class="mr-3" style="text-wrap: nowrap;" :for="`dtrs-month-${month}`">
        <input 
          :id="`dtrs-month-${month}`"
          type="checkbox" 
          :value="month" 
          v-model="selectedMonths" 
        />
        <span class="ml-1">{{ month }}</span>
      </label>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { type MonthType, MONTHS } from './date_time_range_generators';

const { showErrorForEmpty } = defineProps<{
  showErrorForEmpty?: boolean;
}>();

const selectedMonths = defineModel<MonthType[]>({
  type: Array as () => MonthType[]
});

const empty = computed(() => selectedMonths.value?.length === 0);
</script>

<style scoped>
.dtrs-months-picker {
  border-radius: 8px;
  padding: 8px 12px;
  margin: 4px;
  
}
.dtrs-error-highlight {
  box-shadow: inset 0 0 8px 0px rgba(255,0,0,0.82)
}
</style>
