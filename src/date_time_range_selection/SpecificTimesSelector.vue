<template>
  <div class="mt-2 dtrs-flex-time-box">
    <v-combobox
      v-model="selectedTimes"
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
    
    <div class="pm-wrapper">
      <input
        id="dtrs-time-plus-minus"
        type="checkbox"
        v-model="timePlusMinus"
        :true-value="11"
        :false-value="0.5"
      />
      <label for="dtrs-time-plus-minus">All Day</label>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
const selectedTimes = defineModel<string[]>({
  type: Array as () => string[]
});
const timePlusMinus = defineModel<number>('timePlusMinus', {
  type: Number,
  default: 0.5
});
const timeOptions = ref<string[]>(Array.from({ length: 15 }, (_, h) => `${String(h+6).padStart(2, '0')}:00`));


// Normalize entered times to HH:MM 24h (flexible entry via copilot)
function normalizeTimes(values: string[]) {
  const normalized = values
    .map(v => String(v).trim())
    .map(v => {
      // Accept HH, H, HH:MM, H:MM, also allow am/pm inputs like 9am, 2:30 PM
      const lower = v.toLowerCase().replace(/\s+/g, '');
      const ampmMatch = lower.match(/^(\d{1,2})(?::(\d{1,2}))?(am|pm)$/);
      if (ampmMatch) {
        let hour = parseInt(ampmMatch[1], 10);
        const minute = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
        const suffix = ampmMatch[3];
        if (suffix === 'pm' && hour < 12) hour += 12;
        if (suffix === 'am' && hour === 12) hour = 0;
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      }
      const m = lower.match(/^(\d{1,2})(?::(\d{1,2}))?$/);
      if (!m) return null;
      const h = parseInt(m[1], 10);
      const mm = m[2] ? parseInt(m[2], 10) : 0;
      if (isNaN(h) || h < 0 || h > 23) return null;
      if (isNaN(mm) || mm < 0 || mm > 59) return null;
      return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    })
    .filter((v): v is string => !!v);
  // Deduplicate
  const unique = Array.from(new Set(normalized));
  selectedTimes.value = unique;
}
</script>