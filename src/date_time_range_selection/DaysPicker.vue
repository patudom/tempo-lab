<template>
  <div :class="{'dtrs-error-highlight': showErrorForEmpty && empty, 'dtrs-days-picker': true}">
    <label class="text-subtitle-2 mb-2 d-block">Days of Week
      <span v-show="showErrorForEmpty && empty" aria-live="polite" style="font-weight: bold;">
        (Select at least 1)
      </span>
    </label>
    <!-- just do labeled checkboxes -->
    <label v-for="(day, idx) in DAYS" :key="idx" class="mr-3" style="text-wrap: nowrap;">
      <input 
        type="checkbox" 
        :value="day" 
        v-model="selectedDays" 
      />
      <span class="ml-1">{{ day.slice(0,3) }}</span>
    </label>
  </div>
</template>


<script lang="ts" setup>
import { computed } from 'vue';
import { type DayType, DAYS } from './date_time_range_generators';

const { showErrorForEmpty } = defineProps<{
  showErrorForEmpty?: boolean;
}>();

const selectedDays = defineModel<DayType[]>({
  type: Array as () => DayType[],
  default: () => [...DAYS],
});

const empty = computed(() => selectedDays.value?.length === 0);

</script>

<style scoped>
.dtrs-days-picker {
  border-radius: 8px;
  padding: 8px 12px;
  margin: 4px;
  
}
.dtrs-error-highlight {
  box-shadow: inset 0 0 8px 0px rgba(255,0,0,0.82)
}
</style>