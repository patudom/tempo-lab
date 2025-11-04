<template>
  <div>
    <label class="text-subtitle-2 mb-2 d-block">Days of Week</label>
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
import { type DayType, DAYS } from './date_time_range_generators';

const selectedDays = defineModel<DayType[]>({
  type: Array as () => DayType[],
  default: () => [...DAYS],
});

</script>