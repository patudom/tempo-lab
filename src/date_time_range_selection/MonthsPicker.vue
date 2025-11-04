<template>
  <div>
    <label class="text-subtitle-2 mb-2 d-block">Months</label>
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
import { type MonthType, MONTHS } from './date_time_range_generators';
const selectedMonths = defineModel<MonthType[]>({
  type: Array as () => MonthType[]
});
</script>
