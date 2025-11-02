<template>
  <div class="mt-2 dtrs-flex-time-box">
    <v-col>
    <v-radio-group
      v-model="timePlusMinus"
      direction="horizontal"
      inline
      hide-details
      class="mb-2"
      >
      <v-radio
        label="Specific Times"
        :value="0.5"
        />
      <v-radio
        label="All Day"
        :value="12"
        />
    </v-radio-group>
    <v-combobox
      v-if="timePlusMinus != 12"
      v-model="selectedTimesRef"
      :items="timeOptions"
      label="Add/select times"
      multiple
      chips
      closable-chips
      density="compact"
      variant="outlined"
      hide-details
      hint="24h format HH:MM (e.g., 09:00, 14:30)"
      persistent-hint
      @update:model-value="normalizeTimes"
    />
    <div v-else class="dtrs-all-day-label">
      All Day Selected
    </div>
  </v-col>
    
    <!-- <div class="pm-wrapper">
      <input
        id="dtrs-time-plus-minus"
        type="checkbox"
        v-model="timePlusMinus"
        :true-value="12"
        :false-value="0.5"
      />
      <label for="dtrs-time-plus-minus">All Day</label>
    </div> -->
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
const selectedTimes = defineModel<string[]>({
  type: Array as () => string[]
});
const timePlusMinus = defineModel<number>('timePlusMinus', {
  type: Number,
  default: 0.5
});
const timeOptions = ref<string[]>(Array.from({ length: 15 }, (_, h) => `${String(h+6).padStart(2, '0')}:00`));
const _selectedTimesRef = ref<string[]>([]);
const selectedTimesRef = computed({
  get: () => {
    if (timePlusMinus.value == 12) return timeOptions.value;
    return _selectedTimesRef.value;
  },
  set: (value: string[]) => {
    console.log('selectedTimesRef set to', value);
    _selectedTimesRef.value = value;
  }
});


watch(selectedTimesRef, (value: string[]) => {
  console.log('selectedTimesRef changed to', value);
  if (timePlusMinus.value == 12) {
    selectedTimes.value = [];
    return;
  }
  selectedTimes.value = value;
});

/**
 * Parse a string to a timme. Support H, H:MM, HH, HH:MM, and am/pm
 * 
 */
function parseTimeString(timeString: string): { hour: number; minute: number } | null {
  
  // get a lower case version, and remove spaces
  const lower = timeString.toLowerCase().replace(/\s+/g, '');

  // Defeine regexes
  // Match the hour part (1 or 2 digits)
  const hourRegex = /^(\d{1,2})/; 
  // Match the minute part (optional, preceded by a colon)
  const minuteRegex = /(?::(\d{1,2}))/; 
  // Matches the am/pm suffix, required
  const ampmRegex = /(am|pm)$/; 
  
  
  const ampmMatch = lower.match(new RegExp(`${hourRegex.source}${minuteRegex.source}?${ampmRegex.source}`));
  if (ampmMatch) {
    let hour = parseInt(ampmMatch[1], 10);
    const minute = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const suffix = ampmMatch[3];
    if (suffix === 'pm' && hour < 12) hour += 12;
    if (suffix === 'am' && hour === 12) hour = 0;
    return { hour, minute };
  }
  
  const m = lower.match(new RegExp(`${hourRegex.source}${minuteRegex.source}?`));
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const mm = m[2] ? parseInt(m[2], 10) : 0;
  if (isNaN(h) || h < 0 || h > 23) return null;
  if (isNaN(mm) || mm < 0 || mm > 59) return null;
  return { hour: h, minute: mm }; 
}



function parseTimeRange(timeRangeStr: string): string | null {
  const parts = timeRangeStr.split('-').map(p => p.trim());
  if (parts.length !== 2) return null;
  let startParsed = parseTimeString(parts[0]);
  let endParsed = parseTimeString(parts[1]);
  if (!startParsed || !endParsed) return null;
  const endEarlier = (endParsed.hour + endParsed.minute / 60) < (startParsed.hour + startParsed.minute / 60);
  if (endEarlier) {
    /* Situations where due to user errorr end time is earlier than start time:
    1. hours are equal, swap -> just swap them
    2. start <= 12 and end < 12 -> end is pm
    */
    console.log(`%c End time earlier than start time detected in range "${timeRangeStr}"`, 'color: orange;');
    if (startParsed.hour === endParsed.hour) {
      console.log('%c Swapping times with equal hours', 'color: orange;');
      // swap
      [startParsed, endParsed] = [endParsed, startParsed];
    } else if (startParsed.hour <= 12 && endParsed.hour < 12) {
      console.log('%c Adjusting end time to PM', 'color: orange;');
      endParsed.hour += 12;
    } else if (startParsed.hour > 12 && endParsed.hour <= 12) {
      console.log('%c Adjusting start time to AM', 'color: orange;');
      [startParsed, endParsed] = [endParsed, startParsed];
    } else {
      throw new Error(`Cannot parse time range: ${timeRangeStr} with start ${startParsed} and end ${endParsed}`);
    }
  }
  const startStr = `${String(startParsed.hour).padStart(2, '0')}:${String(startParsed.minute).padStart(2, '0')}`;
  const endStr = `${String(endParsed.hour).padStart(2, '0')}:${String(endParsed.minute).padStart(2, '0')}`;
  return [startStr, endStr].join('-');
}

// Normalize entered times to HH:MM 24h (flexible entry via copilot)
function normalizeTimes(values: string[]) {
  const normalized = values
    .map(v => String(v).trim())
    .map(v => {
      if (v.includes('-')) {
        console.log('parsing range', v);
        const range = parseTimeRange(v);
        return range;
      }
      const parsed = parseTimeString(v);
      if (!parsed) return null;
      return `${String(parsed.hour).padStart(2, '0')}:${String(parsed.minute).padStart(2, '0')}`;
    })
    .filter((v): v is string => !!v);
  // Deduplicate
  const unique = Array.from(new Set(normalized));
  selectedTimesRef.value = unique;
}
</script>