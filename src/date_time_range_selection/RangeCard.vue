<template>
  <v-card class="mb-2 timeline-bar" :ripple="false">
    <v-card-text class="py-3">
      <v-row align-content="center" dense>
        <v-col cols="auto">
          <v-chip 
            size="small" 
            :color="chipColor"
            variant="elevated"
          >
            {{ chipLabel }}
          </v-chip>
        </v-col>
        <v-col>
          <div class="text-subtitle-2 font-weight-bold mb-1">
            {{ formattedTime }}
          </div>
          <div class="text-caption text-disabled mt-1">
            <div>{{ formattedTimezoneTime }}</div>
            <div>UTC: {{ formattedUTCTime }}</div>
          </div>
        </v-col>
        <v-col cols="auto">
          <v-icon color="success">mdi-check-circle</v-icon>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue';
import { useTimezone } from '../composables/useTimezone';
import type { MillisecondRange } from '../types/datetime';

const props = defineProps<{
  range: MillisecondRange;
  index: number;
  selectedTimezone: string;
  mode: 'weekday' | 'daterange';
}>();

// Create reactive timezone handling
const timezoneRef = toRef(props, 'selectedTimezone');
const { 
  formatTimeLong, 
  toTimezone
} = useTimezone(timezoneRef);

// Computed properties for display
const chipColor = computed(() => 'primary');

const chipLabel = computed(() => `${props.index + 1}`);
const formattedTime = computed(() => {
  if (props.mode === 'weekday') {
    return formatTimeLong(props.range.start);
  } else {
    // Date range mode: show "Start DateTime - End DateTime"
    const startTime = formatTimeLong(props.range.start);
    const endTime = formatTimeLong(props.range.end);
    return `${startTime} - ${endTime}`;
  }
});

const formattedTimezoneTime = computed(() => {
  if (props.mode === 'weekday') {
    const zonedDate = toTimezone(props.range.start);
    const time = zonedDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const date = zonedDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    return `${props.selectedTimezone}: ${date} ${time}`;
  } else {
    // Date range mode: show timezone range
    const startZoned = toTimezone(props.range.start);
    const endZoned = toTimezone(props.range.end);
    
    const startTime = startZoned.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const startDate = startZoned.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const endTime = endZoned.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const endDate = endZoned.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    return `${props.selectedTimezone}: ${startDate} ${startTime} - ${endDate} ${endTime}`;
  }
});

const formattedUTCTime = computed(() => {
  if (props.mode === 'weekday') {
    const utcDate = new Date(props.range.start);
    const time = utcDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    });
    const date = utcDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      timeZone: 'UTC'
    });
    return `${date} ${time}`;
  } else {
    // Date range mode: show UTC range
    const startUtc = new Date(props.range.start);
    const endUtc = new Date(props.range.end);
    
    const startTime = startUtc.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    });
    const startDate = startUtc.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      timeZone: 'UTC'
    });
    const endTime = endUtc.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    });
    const endDate = endUtc.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      timeZone: 'UTC'
    });
    
    return `${startDate} ${startTime} - ${endDate} ${endTime}`;
  }
});
</script>

<style>
.timeline-bar {
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }
}
</style>
