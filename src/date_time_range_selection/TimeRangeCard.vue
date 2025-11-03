<!-- TimeRange Card to display time range configuration -->
<template>
  <div v-if="timeRange.config" class="time-range-card">
    <!-- Single Date -->
    <div 
      class="time-range-single"
      v-if="timeRange.config.type==='single'" 
    >
      <div 
      v-for="(key) in Object.keys(timeRange.config)" 
      class="time-range-config-item"
      :key="key" 
      >
        <div>{{ key }}: {{ timeRange.config[key] }}</div>
      </div>
    </div>
    
    <!-- Multiple Date -->
    <div v-if="timeRange.config.type==='multiple'" class="time-range-multiple">
      <!-- Date Range -->
      <div class="time-range-config-item">
        <strong>Date Range:</strong> 
        {{ formatDate(timeRange.config.dateRange.start) }} - {{ formatDate(timeRange.config.dateRange.end) }}
      </div>
      
      <!-- Years -->
      <div v-if="timeRange.config.years" class="time-range-config-item">
        <strong>Years:</strong> {{ timeRange.config.years.join(', ') }}
      </div>
      
      <!-- Months -->
      <div v-if="timeRange.config.months" class="time-range-config-item">
        <strong>Months:</strong> {{ timeRange.config.months.map(s => s.slice(0,3)).join(', ') }} 
      </div>
      
      <!-- Weekdays -->
      <div v-if="timeRange.config.weekdays" class="time-range-config-item">
        <strong>Weekdays:</strong> {{ timeRange.config.weekdays.map(s => s.slice(0,3)).join(', ') }} 
      </div>
      
      <!-- Actual Time ranges -->
      <div v-if="timeRange.config.times" class="time-range-config-item">
        <strong>Times:</strong> {{ timeRange.config.times.join(', ') }}
      </div>
    </div>
    
  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { TimeRangeConfig } from './date_time_range_generators';
import type { TimeRange } from '@/types';

const formatDate = (date: Date): string => {
  try {
    return date.toLocaleDateString();
  } catch (e) {
    console.log(date);
    return String(date);
  }
  
};

const props = defineProps<{
  timeRange: TimeRange;
}>();
console.log('TimeRangeCard props:', props.timeRange.config);
</script>
    

<style land="less" scoped>
.time-range-card {
  border-radius: 8px;
  border: 1px solid #ccc;
  padding: 16px;
  height: fit-content;
}

.time-range-config-item {
  margin-bottom: 2px;
  font-size: 0.8em;
}
</style>