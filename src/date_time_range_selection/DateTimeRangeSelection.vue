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
    <TimelineVisualization
      :ranges="currentTimeRanges"

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
import { DAYS, MONTHS, generateTimeRanges } from './date_time_range_generators';
import type { TimeRangeConfig, TimeRangeCreationMode, DayType, MonthType } from './date_time_range_generators';
// === INTERFACES === 
// === PROPS ===
const props = defineProps<{
  currentDate: Date;
  allowedDates?: Date[];
  validTimes?: number[]; // timestamps
}>();

// === EMITS ===
const emit = defineEmits<{
  'ranges-change': [ranges: MillisecondRange[], selectionType: TimeRangeCreationMode, customName: string];
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
  return date?.toDateString() || '';
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
const timePlusMinus = ref<0.5 | 12>(0.5);
const allDay = computed(() => timePlusMinus.value === 12);
const dayNames = DAYS;
const monthNames = MONTHS;
const timeRangeConfig = computed<TimeRangeConfig>(() => {
  if (timeSelectionMode.value === 'single') {
    return {
      type: 'single',
      singleDate: singleDateObj.value,
    } as TimeRangeConfig;
  } else {
    const patternConfig: TimeRangeConfig = {
      type: 'multiple',
      dateRange: {
        start: startDateObj.value ?? new Date(),
        end: endDateObj.value ?? new Date(),
      },
      years: (selectedYears.value.length > 0) ? selectedYears.value : undefined,
      months: (selectedMonths.value.length > 0) ? selectedMonths.value : undefined,
      weekdays: (selectedDays.value.length > 0) ? selectedDays.value : undefined,
      times: ((selectedTimes.value.length > 0) && !allDay.value) ? selectedTimes.value : undefined,
    };
    return patternConfig as TimeRangeConfig;
  }
});

watch(timeRangeConfig, (newConfig) => {
  console.log('Time Range Config changed:', newConfig);
});





const customTimeRangeName = computed((): string => {
  
  // if (selectionType.value === 'singledate') {
    
  //   return `${singleDateObj.value ? formatDateDisplay(singleDateObj.value) : 'No date selected'}`;
    
  // } else if (selectionType.value === 'pattern') {
    
  //   // string to describe the pattern
  //   const dayNamesSelected = selectedDays.value.map(d => dayNames[d].slice(0,3)).join(',');
  //   const timesSelected = selectedTimes.value.join(', ');
  //   return `Pattern: [${dayNamesSelected}] × [${timesSelected}] ± ${Math.abs(timePlusMinus.value)}h  (${formatTimeRange(generatePatternRanges())})`;
    
  // } else if (selectionType.value === 'monthrange') {
    
  //   const monthNamesSelected = selectedMonths.value.map(m => monthNames[m].slice(0,3)).join(', ');
  //   const yearsSelected = selectedYears.value.join(', ');
    
  //   return `Months: [${monthNamesSelected}] in [${yearsSelected}] (${formatTimeRange(generatePatternRanges())})`;
    
  // } else if (selectionType.value === 'daterange') {
    
  //   return `${startDateObj.value ? formatDateDisplay(startDateObj.value) : 'No start date'} - ${endDateObj.value ? formatDateDisplay(endDateObj.value) : 'No end date'}`;
    
  // } else {
    
  //   return 'Unrecognized selection type';
  // }
  
  return `${timeSelectionMode.value === 'single' ? 'Single Date' : 'Multiple Dates'} Selection`;
    
});

const currentTimeRanges = ref<MillisecondRange[]>([]);
// === METHODS ===
// Update custom range button handler
function updateCustomRange(doEmit=true) {
  let currentRanges: MillisecondRange[] = [];
  currentRanges = generateTimeRanges(timeRangeConfig.value);
  currentTimeRanges.value = currentRanges;
  if (doEmit) {
    emit('ranges-change', currentRanges, timeSelectionMode.value, customTimeRangeName.value);
  }
}

// watch all the values and keep currentTimeRanges updated
watch([
  timePlusMinus,
  selectedDays,
  selectedTimes,
  selectedMonths,
  selectedYears,
  startDateObj,
  endDateObj,
], () => {
  updateCustomRange(false);
}, { deep: true });

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
    startDateObj.value = props.allowedDates[0];
    endDateObj.value = props.allowedDates[props.allowedDates.length - 1];
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
