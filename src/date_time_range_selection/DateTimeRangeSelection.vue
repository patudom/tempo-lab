<template>
  <v-card class="datetime-range-selector my-4" elevation="4" color="surface">

    <v-card-text>
      <!-- Selection Type Radio Buttons -->
       Would you like to select a single date or multiple dates?
      <v-radio-group 
        v-model="timeSelectionMode" 
        direction="horizontal" 
        density="compact"
      >
        <v-radio 
          label="Single Date" 
            value="single"
          density="compact"
        />    
        <v-radio 
          label="Multiple Dates" 
          value="multiple"
          density="compact"
        />
      </v-radio-group>

        
      <!-- Single Date Section -->
        <v-expand-transition value="singledate" title="Select a Single Date">
        <div v-if="selectionType === 'singledate'" class="single-date-section">

            <div class="mb-4">
              <label class="text-subtitle-2 mb-2 d-block">Date</label>
              <date-picker
                class="mx-2"
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
                :year-range="datePickerYearRange"
              />
            </div>
          </div>
        </v-expand-transition>


        
        <v-expansion-panels 
          v-if="timeSelectionMode === 'multiple'"
          class="mb-4"
          v-model="selectionType" 
          variant="default"
          focusable 
          :multiple="false"
          color="var(--info-background)"
        >
        
        
        
        <!-- Month Selection -->
        <v-expansion-panel 
          value="monthrange" 
          title="Select Months and Years" 
          bg-color="surface"
          >
        <v-expansion-panel-text v-if="selectionType === 'monthrange'" class="month-selection-section">

            <div class="mb-4">
              <MonthsPicker
                v-model="selectedMonths"
                :month-names="monthNames"
              />
            </div>
            
            <div class="mb-4">
              <YearsPicker
                v-model="selectedYears"
                :possible-years="possibleYears"
              />
            </div>
            
            <SeasonPicker
              v-model="selectedMonths"
            />
        </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel 
        value="daterange" 
        title="Select a Date Range"
        bg-color="surface"
        >
          <v-expansion-panel-text v-if="selectionType === 'daterange'" class="date-range-section">
            <!-- Date Range Picker -->
                <label class="text-subtitle-2 mb-2 d-block">Pick Date Range</label>
                <date-picker
                  class="mx-2"
                  range
                  ref="dateRangeCalendar"
                  :model-value="dateRangeArray"
                  @internal-model-change="handleDateRangeChange"
                  :allowed-dates="allowedDates"
                  :format="(d) => d.map(formatDateDisplay).join(' - ')"
                  :teleport="true"
                  :enable-time-picker="false"
                  dark
                  :year-range="datePickerYearRange"
                />

          </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Pattern Section (Multi-day, Multi-time) -->
        <v-expansion-panel 
          value="pattern" 
          title="Select Day/Time Patterns"
          bg-color="surface"
        >
        <v-expansion-panel-text v-if="selectionType === 'pattern'" class="pattern-section">

          <div class="mb-4">
              <DaysPicker
                v-model="selectedDays"
                :day-options="dayOptions"
              />
          </div>
              <DayPatterns
                v-model="selectedDays"
              />

            <!-- Times Multi-select -->
            <div class="mb-4">
              <SpecificTimesSelector
                v-model="selectedTimes"
                :time-options="timeOptions"
                v-model:timePlusMinus="timePlusMinus"
              />
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
                class="reference-date-picker mx-2"
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
        </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>


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
    <TimelineVisualization
      :ranges="currentTimeRanges"

    />
  </v-card>
</template>

<script setup lang="ts">
// === IMPORTS ===
import { watch, computed, ref, onMounted } from 'vue';
import DatePicker from '@vuepic/vue-datepicker';
import { setToMidnightUTC, setToEndOfDayUTC } from './dtr_utils';
import { useDateTimeSelector } from './useDateTimeSelector';
import type { MillisecondRange, TimeRangeSelectionType } from '../types/datetime';
import { formatTimeRange } from "@/utils/timeRange";
import DaysPicker from './DaysPicker.vue';
import DayPatterns from './DayPatterns.vue';
import MonthsPicker from './MonthsPicker.vue';
import SeasonPicker from './SeasonPicker.vue';
import YearsPicker from './YearsPicker.vue';
import SpecificTimesSelector from './SpecificTimesSelector.vue';
import TimelineVisualization from './TimelineVisualization.vue';


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

const timeSelectionMode = ref<'single' | 'multiple'>('single');

// === COMPOSABLE SETUP ===
// Create refs for the current date to pass to the composable
const currentDateRef = ref(props.currentDate);

function formatDateDisplay(date: Date | null): string {
  return date?.toDateString() || '';
}

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
  currentDate: currentDateRef
});


watch(timeSelectionMode, (newMode) => {
  if (newMode === 'single') {
    selectionType.value = 'singledate';
  } else if (newMode === 'multiple') {
    selectionType.value = 'daterange';
  }
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
const singleDateObj = ref<Date | null>(currentDateRef.value);

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

const datePickerYearRange = computed<[number, number]>(() => {
  if (!props.allowedDates || props.allowedDates.length === 0) {
    return [2023, new Date().getFullYear()];
  }
  const minYear = props.allowedDates ? props.allowedDates[0].getFullYear() : 2023;
  
  const maxYear = props.allowedDates 
    ? props.allowedDates[props.allowedDates.length - 1].getFullYear() 
    : new Date().getFullYear();
    
  return [minYear, maxYear];
});

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
      const timestamp = setToMidnightUTC(value);
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
      const timestamp = setToEndOfDayUTC(value);
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


// === LIFECYCLE HOOKS ===
onMounted(() => {
  // Initialize default dates
  if (props.defaultStartDate) {
    startDateObj.value = props.defaultStartDate;
    const timestamp = setToMidnightUTC(props.defaultStartDate);
    setStartTimestampInternal(timestamp);
  }
  if (props.defaultEndDate) {
    endDateObj.value = props.defaultEndDate;
    const timestamp = setToEndOfDayUTC(props.defaultEndDate);
    setEndTimestampInternal(timestamp);
  } else {
    // Default end date to today
    const today = new Date();
    endDateObj.value = today;
    const timestamp = setToEndOfDayUTC(today);
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
