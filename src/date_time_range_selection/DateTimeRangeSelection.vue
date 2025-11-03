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
        <v-expand-transition title="Select a Single Date">
        <div v-if="timeSelectionMode === 'single'" class="single-date-section">

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


        <v-expand-transition title="Select Multiple Dates">
          <div v-if="timeSelectionMode === 'multiple'" class="multiple-dates-section">
            <DateRangePicker
              v-model:start-date="startDateObj"
              v-model:end-date="endDateObj"
              :allowed-dates="allowedDates"
              :format="formatDateDisplay"
              :preview-format="formatDateDisplay"
              :clearable="false"
              :text-input="true"
              :teleport="true"
              :dark="true"
              :year-range="datePickerYearRange"
            />
            <v-expansion-panels 
              v-if="timeSelectionMode === 'multiple'"
              class="mb-4"
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
            <v-expansion-panel-text class="month-selection-section">

                <div class="mb-4">
                  <MonthsPicker
                    v-model="selectedMonths"
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
            </v-expansion-panels>
            <v-expansion-panels 
              class="mb-4"
              variant="default"
              focusable 
              :multiple="false"
              color="var(--info-background)"
            >

            
            </v-expansion-panels>
            <v-expansion-panels 
              class="mb-4"
              variant="default"
              focusable 
              :multiple="false"
              color="var(--info-background)"
            >

            <!-- Pattern Section (Multi-day, Multi-time) -->
            <v-expansion-panel 
              value="pattern" 
              title="Select Day/Time Patterns"
              bg-color="surface"
            >
            <v-expansion-panel-text  class="pattern-section">

              <div class="mb-4">
                  <DaysPicker
                    v-model="selectedDays"
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
            </v-expansion-panel-text>
            </v-expansion-panel>
            </v-expansion-panels>
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
    <!-- validate time range button -->
    <v-btn
      v-if="validate"
      color="info"
      variant="outlined"
      class="mb-4 mx-4"
      @click="() =>updateCustomRange(false)"
    >
      <v-icon class="mr-2">mdi-help-circle</v-icon>
      Validate Time Range
    </v-btn>  
    <TimelineVisualization
      v-if="validate"
      :ranges="currentTimeRanges"
      :config="timeRangeConfig"
      :allowed-dates="allowedDates"
    />
  </v-card>
</template>

<script setup lang="ts">
// no unused vars
/* eslint-disable @typescript-eslint/no-unused-vars */
// === IMPORTS ===
import { watch, computed, ref, onMounted } from 'vue';
import DatePicker from '@vuepic/vue-datepicker';
import { setToMidnightUTC, setToEndOfDayUTC } from './dtr_utils';
import type { MillisecondRange, TimeRangeSelectionType } from '../types/datetime';
import { formatTimeRange } from "@/utils/timeRange";
import DateRangePicker from './DateRangePicker.vue';
import DaysPicker from './DaysPicker.vue';
import DayPatterns from './DayPatterns.vue';
import MonthsPicker from './MonthsPicker.vue';
import SeasonPicker from './SeasonPicker.vue';
import YearsPicker from './YearsPicker.vue';
import SpecificTimesSelector from './SpecificTimesSelector.vue';
import TimelineVisualization from './TimelineVisualization.vue';
import { DAYS, MONTHS, generateTimeRanges, DEFAULT_TOLERANCE, ALL_DAY_TOLERANCE } from './date_time_range_generators';
import type { TimeRangeConfig, TimeRangeCreationMode, DayType, MonthType, TimeRangeConfigMultiple, TimeRangeConfigSingle } from './date_time_range_generators';
// === INTERFACES === 
// === PROPS ===
const props = defineProps<{
  currentDate: Date;
  allowedDates?: Date[];
  validTimes?: number[]; // timestamps
  validate?: boolean;
}>();

// === EMITS ===
const emit = defineEmits<{
  'ranges-change': [ranges: MillisecondRange[], selectionType: TimeRangeCreationMode, customName: string, config: TimeRangeConfig];
}>();



// === COMPOSABLE SETUP ===
// Create refs for the current date to pass to the composable
const currentDateRef = ref(props.currentDate);

// === REFS ===
const singleDateCalendar = ref();
// === PICKER STATE ===
// Direct date objects for date pickers - no unnecessary timestamp conversion
const startDateObj = ref<Date | null>(null);
const endDateObj = ref<Date | null>(null);
const singleDateObj = ref<Date | null>(currentDateRef.value);


// Pre-populated time options (every hour from 6am-9pm; user can add custom HH:MM)
const timeOptions = ref<string[]>(Array.from({ length: 15 }, (_, h) => `${String(h+6).padStart(2, '0')}:00`));


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


function formatDateDisplay(date: Date | null): string {
  return date?.toLocaleDateString() || '';
}

const filterGroups = [
  'month-year',
  'day-time'
] as const;
type FilterGroup = typeof filterGroups[number];
const filterGroup = ref<FilterGroup | null>(null);



const timeSelectionMode = ref<TimeRangeCreationMode>('single');
const selectedMonths = ref<MonthType[]>([]);
const selectedYears = ref<number[]>([]);
const selectedTimes = ref<string[]>([]);
const selectedDays = ref<DayType[]>([]);
const timePlusMinus = ref<[number, number]>([...ALL_DAY_TOLERANCE]);
const allDay = computed(() => timePlusMinus.value[0] === ALL_DAY_TOLERANCE[0] && timePlusMinus.value[1] === ALL_DAY_TOLERANCE[1]);
const dayNames = DAYS as unknown as DayType[];
const monthNames = MONTHS as unknown as MonthType[];
const timeRangeConfig = computed<TimeRangeConfig>(() => {
  if (timeSelectionMode.value === 'single') {
    return {
      type: 'single',
      singleDate: singleDateObj.value,
    } as TimeRangeConfigSingle;
  } else {
    const patternConfig: TimeRangeConfigMultiple = {
      type: 'multiple',
      dateRange: {
        start: startDateObj.value ?? new Date(),
        end: endDateObj.value ?? new Date(),
      },
      years: (selectedYears.value.length > 0) ? selectedYears.value : undefined,
      months: (selectedMonths.value.length > 0) ? selectedMonths.value : undefined,
      weekdays: (selectedDays.value.length > 0) ? selectedDays.value : undefined,
      times: ((selectedTimes.value.length > 0) && !allDay.value) ? selectedTimes.value : undefined,
      toleranceHours: allDay.value ? [...ALL_DAY_TOLERANCE] : [...DEFAULT_TOLERANCE],
    };
    return patternConfig as TimeRangeConfig;
  }
});

watch(timeRangeConfig, (newConfig) => {
  console.log('Time Range Config changed:', newConfig);
});

import { isRingConsecutive } from '@/utils/array_operations/cyclic';
function asRangeOrList<T extends string>(arr: T[], order: T[], validDiffs = [1]): string {
  if (arr.length === 0) return '';  
  if (arr.length <= 2) {
    return arr.map(s => s.slice(0,3)).join(', ');
  }
  const sortedArrr = arr.slice().sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const isConsecutive = isRingConsecutive(sortedArrr,  order, true);
  if (isConsecutive && sortedArrr.length > 2) {
    return `${isConsecutive.start.slice(0,3)}-${isConsecutive.end.slice(0,3)}`;
  }
  return arr.map(s => s.slice(0,3)).join(', ');
}
  

const customTimeRangeName = computed((): string => {
  
  if (timeSelectionMode.value === 'single') {
    return `${singleDateObj.value ? formatDateDisplay(singleDateObj.value) : 'No date selected'}`;
  }
    
  let dateRangeString = '';
  let monthsString = '';
  let yearsString = '';
  let daysString = '';
  let timesString = '';
  if (startDateObj.value && endDateObj.value) {
    dateRangeString = `${formatDateDisplay(startDateObj.value)} - ${formatDateDisplay(endDateObj.value)}`;
  } else {
    // we shouldn't be able to reach this, so just throw an error
    throw new Error('Start date or end date is null');
  }
  
  if (selectedMonths.value.length > 0) {
    monthsString = ` | Months: ${asRangeOrList(selectedMonths.value, monthNames, [1,11])}`;
  }
  if (selectedYears.value.length > 0) {
    yearsString = ` | Years: ${selectedYears.value.join(', ')}`;
  }
  if (selectedDays.value.length > 0) {
    daysString = ` | ${asRangeOrList(selectedDays.value, dayNames, [1,6])}`;
  }
  if (selectedTimes.value.length > 0 && !allDay.value) {
    timesString = ` | Times: ${selectedTimes.value.join(', ')}`;
  }
  return `${dateRangeString}${monthsString}${yearsString}${daysString}${timesString}`.trim();
    
});

const currentTimeRanges = ref<MillisecondRange[]>([]);
// === METHODS ===
// Update custom range button handler
function updateCustomRange(doEmit=true) {
  let currentRanges: MillisecondRange[] = [];
  currentRanges = generateTimeRanges(timeRangeConfig.value);
  currentTimeRanges.value = currentRanges;
  if (doEmit) {
    emit('ranges-change', currentRanges, timeSelectionMode.value, customTimeRangeName.value, timeRangeConfig.value);
  }
}

function handleSingleDateChange(value: Date) {
  if (value && value.getTime() !== singleDateObj.value?.getTime()) {
    singleDateObj.value = value;
    singleDateCalendar.value?.closeMenu();
  }
}


// === LIFECYCLE HOOKS ===
onMounted(() => {
  // Initialize default dates
  if (props.allowedDates && props.allowedDates.length > 0) {
    startDateObj.value = setToMidnightUTC(new Date(props.allowedDates[0]), true);
    endDateObj.value = setToEndOfDayUTC(props.allowedDates[props.allowedDates.length - 1], true);
  }
});

// === WATCHERS ===
// Watch for prop changes and update refs
watch(() => props.currentDate, (newDate) => {
  currentDateRef.value = newDate;
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
