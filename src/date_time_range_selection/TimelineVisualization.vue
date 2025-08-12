<template>
  <div class="timeline-section">
    <v-row align="center" class="mb-3">
      <v-col>
        <h4 class="text-h6 mb-0">
          <v-icon class="mr-2">mdi-timeline-outline</v-icon>
          Timeline Visualization
        </h4>
      </v-col>
      <v-col cols="auto">
        <v-chip 
          size="small" 
          :color="ranges.length > 0 ? 'success' : 'warning'"
          variant="tonal"
        >
          {{ ranges.length }} ranges
        </v-chip>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-card v-if="ranges.length === 0" class="text-center pa-6" variant="tonal">
      <v-card-text>
        <v-icon size="48" color="grey-darken-1" class="mb-3">
          mdi-timeline-help-outline
        </v-icon>
        <div class="text-body-1 text-medium-emphasis mb-2">
          No time ranges to display
        </div>
        <div class="text-body-2 text-disabled">
          Configure the settings above to generate time ranges
        </div>
      </v-card-text>
    </v-card>

    <!-- Timeline Ranges -->
    <v-card v-else class="pa-3" variant="tonal">
      <div class="d-flex justify-space-between align-center mb-3">
        <span class="text-subtitle-2 font-weight-bold">
          Time Ranges ({{ ranges.length }})
        </span>
        <v-chip size="small" color="info" variant="tonal">
          {{ selectedTimezone }}
        </v-chip>
      </div>

      <v-virtual-scroll
        :items="ranges"
        height="300"
        item-height="80"
      >
        <template v-slot:default="{ item, index }">
          <RangeCard
            :range="item"
            :index="index"
            :selected-timezone="selectedTimezone"
            :mode="mode"
          />
        </template>
      </v-virtual-scroll>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import RangeCard from '../date_time_range_selection/RangeCard.vue';
import type { MillisecondRange } from '../types/datetime';

defineProps<{
  ranges: MillisecondRange[];
  selectedTimezone: string;
  mode: 'weekday' | 'daterange';
}>();
</script>

<style scoped>
.timeline-section {
  /* Timeline-specific styles */
}
</style>