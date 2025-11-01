<template>
  <div id="dual-date-range-picker">
    <div class="mb-4">
      <label class="text-subtitle-2 mb-2 d-block">Start Date</label>
      <date-picker
        class="ddrp__date-picker"
        uid="start-picker"
        ref="startDateCalendar"
        :model-value="startDateObj"
        @internal-model-change="handleStartDateChange"
        :allowed-dates="allowedDates"
        :format="format"
        :preview-format="previewFormat"
        :clearable="clearable"
        :text-input="textInput"
        :teleport="teleport"
        :dark="dark"
        :year-range="yearRange"
        :enable-time-picker="false"
        :max-date="endDateObj ?? new Date()"
        prevent-min-max-navigation
      />
    </div>
    
    <div class="mb-4">
      <label class="text-subtitle-2 mb-2 d-block">End Date</label>
      <date-picker
        class="ddrp__date-picker"
        uid="end-picker"
        ref="endDateCalendar"
        :model-value="endDateObj"
        @internal-model-change="handleEndDateChange"
        :allowed-dates="allowedDates"
        :format="format"
        :preview-format="previewFormat"
        :clearable="clearable"
        :text-input="textInput"
        :teleport="teleport"
        :dark="dark"
        :year-range="yearRange"
        :enable-time-picker="false"
        :min-date="startDateObj ?? new Date(0)"
        prevent-min-max-navigation
      />
    </div>
    
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import DatePicker from '@vuepic/vue-datepicker';


const props = defineProps<{
  startDate?: Date | null;
  endDate?: Date | null;
  allowedDates?: Date[];
  format?: (date: Date | null) => string;
  previewFormat?: (date: Date | null) => string;
  clearable?: boolean;
  textInput?: boolean;
  teleport?: boolean;
  dark?: boolean;
  yearRange?: [number, number];
}>();


const emit = defineEmits<{
  'update:startDate': [date: Date | null];
  'update:endDate': [date: Date | null];
}>();


const startDateCalendar = ref();
const endDateCalendar = ref();
const startDateObj = ref<Date | null>(props.startDate ?? null);
const endDateObj = ref<Date | null>(props.endDate ?? null);
const errMessage = ref<string>('');


function handleStartDateChange(value: Date | null) {
  if (value !== null && value.getTime() !== startDateObj.value?.getTime()) {
    if (endDateObj.value && value > endDateObj.value) {
      errMessage.value = 'Start date cannot be after end date.';
      return;
    }
    startDateObj.value = value;
    emit('update:startDate', value);
    startDateCalendar.value?.closeMenu();
  }
}

function handleEndDateChange(value: Date | null) {
  if (value !== null && value.getTime() !== endDateObj.value?.getTime()) {
    if (startDateObj.value && value < startDateObj.value) {
      errMessage.value = 'End date cannot be before start date.';
      return;
    }
    endDateObj.value = value;
    emit('update:endDate', value);
    endDateCalendar.value?.closeMenu();
  }
}


watch(() => props.startDate, (newDate) => {
  if (newDate?.getTime() !== startDateObj.value?.getTime()) {
    startDateObj.value = newDate ?? null;
  }
});

watch(() => props.endDate, (newDate) => {
  if (newDate?.getTime() !== endDateObj.value?.getTime()) {
    endDateObj.value = newDate ?? null;
  }
});

</script>

<style>
#dual-date-range-picker {
  width: 100%;
  border: 1px solid rgb(var(--v-theme-surface-variant));
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 8px;
}

#dp-menu-start-picker.dp__menu, #dp-menu-end-picker.dp__menu {
  border: 1px solid rgb(var(--v-theme-surface-variant), 0.3);
}
</style>
