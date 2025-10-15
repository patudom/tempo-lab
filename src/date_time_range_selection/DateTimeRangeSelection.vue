<template>
  <v-card class="datetime-range-selector" elevation="2">

    <v-card-text>
      <!-- Selection Type Radio Buttons -->
      <v-radio-group 
        v-model="selectionType" 
        row 
        density="compact"
      >
        <v-radio 
          label="Single Date" 
            value="singledate"
          density="compact"
        />    
        <v-radio 
          label="Date Range" 
          value="daterange"
          density="compact"
        />
        <v-radio 
          label="Months Range" 
          value="monthrange"
          density="compact"
        />

        <v-radio 
          label="Pattern (Days × Times)" 
          value="pattern"
          density="compact"
        />
      </v-radio-group>



      <!-- Date Range Section -->
      <v-expand-transition>
        <div v-if="selectionType === 'daterange'" class="date-range-section">
          <!-- Date Range Picker -->
            <div class="mb-4">
              <label class="text-subtitle-2 mb-2 d-block">Pick Date Range</label>
              <date-picker
                range
                :multi-calendars="{solo: true}"
                ref="dateRangeCalendar"
                :model-value="dateRangeArray"
                @internal-model-change="handleDateRangeChange"
                :allowed-dates="allowedDates"
                :format="(d) => d.map(formatDateDisplay).join(' - ')"
                :teleport="true"
                :enable-time-picker="false"
                dark
                :year-range="[allowedDates ? allowedDates[0].getFullYear() : 2023, allowedDates ? allowedDates[allowedDates.length - 1].getFullYear() : new Date().getFullYear()]"
              />
          </div>
        </div>
      </v-expand-transition>

      <!-- Pattern Section (Multi-day, Multi-time) -->
      <v-expand-transition>
        <div v-if="selectionType === 'pattern'" class="pattern-section">
          <!-- Days of Week Multi-toggle -->
          <div class="mb-4">
            <label class="text-subtitle-2 mb-2 d-block">Days of Week</label>
            <!-- just do labeled checkboxes -->
            <label v-for="(day, idx) in dayOptions" :key="idx" class="mr-3" style="text-wrap: nowrap;">
              <input 
                type="checkbox" 
                :value="day.value" 
                v-model="selectedDays" 
              />
              <span class="ml-1">{{ day.title.slice(0,3) }}</span>
            </label>
          </div>
          <div class="mb-4 simple-patterns">
            <!-- weekdays -->
            <v-btn 
              size="x-small" 
              variant="outlined" 
              class="mr-2 mb-2"
              @click="selectedDays = [1,2,3,4,5]"
            >Weekdays</v-btn>
            <!-- weekends -->
            <v-btn 
              size="x-small" 
              variant="outlined" 
              class="mr-2 mb-2"
              @click="selectedDays = [0,6]"
            >Weekends</v-btn>
            <!-- full weeek -->
            <v-btn 
              size="x-small" 
              variant="outlined" 
              class="mr-2 mb-2"
              @click="selectedDays = [0,1,2,3,4,5,6]"
            >Full Week</v-btn>
            <!-- clear -->
            <v-btn 
              size="x-small" 
              variant="outlined" 
              class="mr-2 mb-2"
              @click="selectedDays = []"
            >Clear</v-btn>
          </div>

          <!-- Times Multi-select -->
          <div class="mb-4">
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
                <span>±</span>
                <input 
                  v-model="timePlusMinus"
                  type="number"
                  min="-12"
                  max="12"
                  step="0.5"
                  class="time-input"
                  style="width: 5ch;"
                  placeholder="± hours"
                />
                <span>h</span>
              </div>
            </div>
          </div>

          <!-- Instances -->
          <div>
            <v-number-input
              v-model="instancesBack"
              label="Number of Weeks"
              :rules="instanceRules"
              :min="1"
              :max="104"
              density="compact"
              variant="outlined"
              control-variant="split"
            />
          </div>
          <!-- Reference Date -->
          <div class="mb-2">
            <label>going back from</label>
            <date-picker
              class="reference-date-picker"
              ref="weekdayCalendar"
              :model-value="weekdayStartDateObj"
              @internal-model-change="handleWeekdayDateChange"
              :allowed-dates="allowedDates"
              :format="formatDateDisplay"
              :preview-format="formatDateDisplay"
              :clearable="false"
              text-input
              :teleport="true"
              dark
              :year-range="[allowedDates ? allowedDates[0].getFullYear() : 2023, allowedDates ? allowedDates[allowedDates.length - 1].getFullYear() : new Date().getFullYear()]"
            />
          </div>
        </div>
      </v-expand-transition>

      <!-- Single Date Section -->
      <v-expand-transition>
        <div v-if="selectionType === 'singledate'" class="single-date-section">
          <div class="mb-4">
            <label class="text-subtitle-2 mb-2 d-block">Date</label>
            <date-picker
              ref="singleDateCalendar"
              :model-value="singleDateObj"
              @internal-model-change="handleSingleDateChange"
              :allowed-dates="allowedDates"
              :format="formatDateDisplay"
              :preview-format="formatDateDisplay"
              :clearable="false"
              text-input
              :teleport="true"
              dark
              :year-range="[allowedDates ? allowedDates[0].getFullYear() : 2023, allowedDates ? allowedDates[allowedDates.length - 1].getFullYear() : new Date().getFullYear()]"
            />
          </div>
        </div>
      </v-expand-transition>
      
      <!-- Month Selection -->
      <v-expand-transition>
        <div v-if="selectionType === 'monthrange'" class="month-selection-section">
          <div class="mb-4">
            <div  v-for="month in monthNames" :key="month" class="d-inline-block">
            <label class="mr-3" style="text-wrap: nowrap;" for="dtrs-month-{{ month }}"></label>
              <input 
                id="dtrs-month-{{ month }}"
                type="checkbox" 
                :value="monthNames.indexOf(month)" 
                v-model="selectedMonths" 
              />
              <span class="ml-1">{{ month }}</span>
            </div>
          </div>
          
          <div class="mb-4">
            <div v-for="year in possibleYears" :key="year" class="d-inline-block">
            <label  class="mr-3" style="text-wrap: nowrap;" for="dtrs-year-{{ year }}"></label>
              <input 
                id="dtrs-year-{{ year }}"
                type="checkbox" 
                :value="year" 
                v-model="selectedYears" 
              />
              <span class="ml-1">{{ year }}</span>
            </div>
            
          </div>
          
          <div class="mb-4 simple-patterns">
            <!-- winter, spring, summer, fall -->
            <v-btn 
              size="x-small" 
              variant="outlined" 
              class="mr-2 mb-2"
              @click="selectedMonths = [11,0,1]"
            >Winter</v-btn>
            <v-btn 
              size="x-small" 
              variant="outlined" 
              class="mr-2 mb-2"
              @click="selectedMonths = [2,3,4]"
            >Spring</v-btn>
            <v-btn 
              size="x-small" 
              variant="outlined" 
              class="mr-2 mb-2"
              @click="selectedMonths = [5,6,7]"
            >Summer</v-btn>
            <v-btn 
              size="x-small" 
              variant="outlined" 
              class="mr-2 mb-2"
              @click="selectedMonths = [8,9,10]"
            >Fall</v-btn>
            <!-- clear -->
            <v-btn 
              size="x-small" 
              variant="outlined" 
              class="mr-2 mb-2"
              @click="selectedMonths = []"
            >Clear Months</v-btn>
          </div>
        </div>
      </v-expand-transition>
      

      <!-- Update Custom Range Button -->
      <v-btn
        color="primary"
        variant="elevated"
        class="mb-4"
        @click="updateCustomRange"
      >
        <v-icon class="mr-2">mdi-update</v-icon>
        Confirm Selection 
      </v-btn>

    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
// === IMPORTS ===
import { watch, computed, ref, onMounted } from 'vue';
import DatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { useTimezone } from '../composables/useTimezone';
import { useDateTimeSelector } from './useDateTimeSelector';
import type { MillisecondRange, TimeRangeSelectionType } from '../types/datetime';
import { formatTimeRange } from "@/utils/timeRange";


// === INTERFACES === 
// === PROPS ===
const props = defineProps<{
  currentDate: Date;
  defaultStartDate?: Date;
  defaultEndDate?: Date;
  allowedDates?: Date[];
  validTimes?: number[]; // timestamps
}>();

// === EMITS ===
const emit = defineEmits<{
  'ranges-change': [ranges: MillisecondRange[], selectionType: TimeRangeSelectionType, customName: string];
}>();

// === COMPOSABLE SETUP ===
// Create refs for the current date and timezone to pass to the composable
const currentDateRef = ref(props.currentDate);
// Using UTC for time range generation - will be offset to local timezone when fetching data
const timezoneRef = ref('UTC');
// Initialize timezone handling
const { setToMidnight, setToEndOfDay, formatDateDisplay } = useTimezone(timezoneRef);

// Initialize the datetime selector composable with optional parameters
const {
  selectionType,
  instancesBack,
  timePlusMinus,
  weekdayStartDate,
  startDate,
  endDate,
  setWeekdayStartTimestamp,
  setStartTimestamp: setStartTimestampInternal,
  setEndTimestamp: setEndTimestampInternal,
  dayNames,
  monthNames,
  selectedMonths,
  selectedYears,
  generateMillisecondRanges,
  // single date additions
  singleDate,
  setSingleDateTimestamp,
  generateSingleDateRange,
  // pattern additions
  selectedDays,
  selectedTimes,
  generatePatternRanges,
  generateMonthRanges,
} = useDateTimeSelector({
  currentDate: currentDateRef,
  selectedTimezone: timezoneRef
});

// === REFS ===
const weekdayCalendar = ref();
// const startDateCalendar = ref();
// const endDateCalendar = ref();
const singleDateCalendar = ref();

// === PICKER STATE ===
// Direct date objects for date pickers - no unnecessary timestamp conversion
const weekdayStartDateObj = ref<Date | null>(null);
const startDateObj = ref<Date | null>(null);
const endDateObj = ref<Date | null>(null);
const singleDateObj = ref<Date | null>(null);

// Pre-populated time options (every hour from 6am-9pm; user can add custom HH:MM)
const timeOptions = ref<string[]>(Array.from({ length: 15 }, (_, h) => `${String(h+6).padStart(2, '0')}:00`));
// // Compute available time options based on min/max hour in allowedDates in the selected timezone
// causes a bit a performance degredation and offers 6-9pm for all data, so hard cord it. 
// a better range would be from 9am - 5pm
// const minMaxHours = computed(() => {
//   const dates = props.validTimes ?? [];
//   if (dates.length === 0) return { min: 0, max: 23 };
//   const hours = dates.map(d => {
//     return toTimezone(d).getHours();
//   });
//   const min = Math.min(...hours);
//   const max = Math.max(...hours);
//   return { min, max };
// });

// const timeOptions = computed<string[]>(() => {
//   const { min, max } = minMaxHours.value;
//   const count = max - min + 1;
//   const hours = count > 0 ? Array.from({ length: count }, (_, i) => min + i) : Array.from({ length: 24 }, (_, i) => i);
//   return hours.map(h => `${String(h).padStart(2, '0')}:00`);
// });

const possibleYears = computed(() => {
  const dates = props.allowedDates ?? [2024];
  if (dates.length === 0) return [2023, new Date().getFullYear()];
  const years = dates.map(d => d.getFullYear());
  // Deduplicate and sort
  return [...new Set(years)].sort((a, b) => a - b);
});

// Day options for v-select
const dayOptions = computed(() => 
  dayNames.map((day, index) => ({ title: day, value: index }))
);

// Generate ranges for visualization
// const ranges = computed(() => {
//   return generateMillisecondRanges();
// });

// Validation rules
const instanceRules = computed(() => [
  (v: number) => v >= 1 && v <= 104 || 'Must be between 1 and 104 (2 years)'
]);

const customTimeRangeName = computed((): string => {
  
  if (selectionType.value === 'singledate') {
    
    return `${singleDateObj.value ? formatDateDisplay(singleDateObj.value) : 'No date selected'}`;
    
  } else if (selectionType.value === 'pattern') {
    
    // string to describe the pattern
    const dayNamesSelected = selectedDays.value.map(d => dayNames[d].slice(0,3)).join(',');
    const timesSelected = selectedTimes.value.join(', ');
    return `Pattern: [${dayNamesSelected}] × [${timesSelected}] ± ${Math.abs(timePlusMinus.value)}h  (${formatTimeRange(generatePatternRanges())})`;
    
  } else if (selectionType.value === 'monthrange') {
    
    const monthNamesSelected = selectedMonths.value.map(m => monthNames[m].slice(0,3)).join(', ');
    const yearsSelected = selectedYears.value.join(', ');
    
    return `Months: [${monthNamesSelected}] in [${yearsSelected}] (${formatTimeRange(generatePatternRanges())})`;
    
  } else if (selectionType.value === 'daterange') {
    
    return `${startDateObj.value ? formatDateDisplay(startDateObj.value) : 'No start date'} - ${endDateObj.value ? formatDateDisplay(endDateObj.value) : 'No end date'}`;
    
  } else {
    
    return 'Unrecognized selection type';
  }
    
});

// === METHODS ===
// Update custom range button handler
function updateCustomRange() {
  let currentRanges: MillisecondRange[] = [];
  if (selectionType.value === 'singledate') {
    currentRanges = generateSingleDateRange();
  } else if (selectionType.value === 'pattern') {
    currentRanges = generatePatternRanges();
  } else if (selectionType.value === 'monthrange') {
    currentRanges = generateMonthRanges();
  } else {
    currentRanges = generateMillisecondRanges();
  }
  emit('ranges-change', currentRanges, selectionType.value, customTimeRangeName.value);
}

// Date change handlers
function handleWeekdayDateChange(value: Date) {
  if (value != null) {
    if (value.getTime() !== weekdayStartDateObj.value?.getTime()) {
      weekdayStartDateObj.value = value;
      // Update composable state directly
      setWeekdayStartTimestamp(value.getTime());
      weekdayCalendar.value?.closeMenu();
    }
  }
}

function handleStartDateChange(value: Date) {
  if (value != null) {
    if (value.getTime() !== startDateObj.value?.getTime()) {
      startDateObj.value = value;
      // Convert to timestamp and update composable
      const timestamp = setToMidnight(value);
      setStartTimestampInternal(timestamp);
      // startDateCalendar.value?.closeMenu();
    }
  }
}

function handleEndDateChange(value: Date) {
  if (value != null) {
    if (value.getTime() !== endDateObj.value?.getTime()) {
      endDateObj.value = value;
      // Convert to timestamp and update composable
      const timestamp = setToEndOfDay(value);
      setEndTimestampInternal(timestamp);
      // endDateCalendar.value?.closeMenu();
    }
  }
}


const dateRangeArray = computed<Date[] | null>(() => {
  if (startDateObj.value && endDateObj.value) {
    return [startDateObj.value, endDateObj.value];
  }
  return null;
});
const dateRangeCalendar = ref();
function handleDateRangeChange(value: Date[]) {
  if (value && value.length === 2) {
    const [start, end] = value;
    let changed = false;
    if (start.getTime() !== startDateObj.value?.getTime()) {
      handleStartDateChange(start);
      changed = true;
    }
    if (end.getTime() !== endDateObj.value?.getTime()) {
      handleEndDateChange(end);
      changed = true;
    }
    if (changed) {
      dateRangeCalendar.value?.closeMenu();
    }
  }
}

function handleSingleDateChange(value: Date) {
  if (value && value.getTime() !== singleDateObj.value?.getTime()) {
    singleDateObj.value = value;
    setSingleDateTimestamp(value.getTime());
    singleDateCalendar.value?.closeMenu();
  }
}

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

// Formatting functions
// Formatting functions moved to useTimezone composable

// === LIFECYCLE HOOKS ===
onMounted(() => {
  // Initialize default dates
  if (props.defaultStartDate) {
    startDateObj.value = props.defaultStartDate;
    const timestamp = setToMidnight(props.defaultStartDate);
    setStartTimestampInternal(timestamp);
  }
  if (props.defaultEndDate) {
    endDateObj.value = props.defaultEndDate;
    const timestamp = setToEndOfDay(props.defaultEndDate);
    setEndTimestampInternal(timestamp);
  } else {
    // Default end date to today
    const today = new Date();
    endDateObj.value = today;
    const timestamp = setToEndOfDay(today);
    setEndTimestampInternal(timestamp);
  }
  
  // Initialize weekday start date
  if (weekdayStartDate.value) {
    weekdayStartDateObj.value = new Date(weekdayStartDate.value + 'T00:00:00');
  }

  if (singleDate.value > 0 && !singleDateObj.value) {
    singleDateObj.value = new Date(singleDate.value);
  }
});

// === WATCHERS ===
// Watch for prop changes and update refs
watch(() => props.currentDate, (newDate) => {
  currentDateRef.value = newDate;
});

// Keep weekdayStartDateObj in sync with the composable's weekdayStartDate
watch(() => weekdayStartDate.value, (newDateString) => {
  const newDate = newDateString ? new Date(newDateString + 'T00:00:00') : null;
  if (newDate?.getTime() !== weekdayStartDateObj.value?.getTime()) {
    weekdayStartDateObj.value = newDate;
  }
});

// Keep singleDateObj in sync with the composable's singleDate
watch(() => singleDate.value, (newTs) => {
  if (newTs > 0) {
    const newDate = new Date(newTs);
    if (newDate.getTime() !== singleDateObj.value?.getTime()) {
      singleDateObj.value = newDate;
    }
  } else {
    singleDateObj.value = null;
  }
});

// Sync date objects with composable timestamps (one-way: composable → UI)
watch(() => startDate.value, (newTimestamp) => {
  const newDate = newTimestamp > 0 ? new Date(newTimestamp) : null;
  if (newDate?.getTime() !== startDateObj.value?.getTime()) {
    startDateObj.value = newDate;
  }
});

watch(() => endDate.value, (newTimestamp) => {
  const newDate = newTimestamp > 0 ? new Date(newTimestamp) : null;
  if (newDate?.getTime() !== endDateObj.value?.getTime()) {
    endDateObj.value = newDate;
  }
});

// Ranges are now only emitted when the Update Custom Range button is clicked
</script>

<style scoped>
/* === INPUT STYLES === */
.time-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.23);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: 14px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.time-input:focus {
  outline: none;
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.2);
}

.dtrs-flex-time-box {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  align-items: center;
}

.pm-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
}

.pm-wrapper > span {
  font-size: 1.2em;
  line-height: 1;
}

.reference-date-picker {
  /*Font sizes*/
    --dp-font-size: 0.8rem; /*Default font-size*/
    --dp-preview-font-size: 0.7rem; /*Font size of the date preview in the action row*/
}

</style>
