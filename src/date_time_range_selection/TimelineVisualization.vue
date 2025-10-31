<template>
  <div class="timeline-section">
    
    <!-- Timeline Ranges -->
    <v-card class="pa-3" variant="tonal">
      <div class="d-flex justify-space-between align-center mb-3">
        <span class="text-subtitle-2 font-weight-bold">

        </span>
      </div>

      <v-virtual-scroll
        :items="ranges"
        height="300"
        item-height="80"
      >
        <template v-slot:default="{ item }">
          {{ (new Date(item.start)).toLocaleString(undefined,{
            // 2 digit day, month, year, hour, minute, second
            day: '2-digit',
            weekday: 'short',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }) }} - {{ (new Date(item.end)).toLocaleString(undefined,{
            // 2 digit day, month, year, hour, minute, second
            day: '2-digit',
            weekday: 'short',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }) }}
        </template>
      </v-virtual-scroll>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import type { MillisecondRange } from '../types/datetime';

defineProps<{
  ranges: MillisecondRange[];
}>();
</script>
