<template>
  <div id="dtrs-months-picker" :class="{'dtrs-error-highlight': showErrorForEmpty && empty}">
    <label class="text-subtitle-2 mb-2 d-block">Months
      <span v-show="showErrorForEmpty && empty" aria-live="polite" style="font-weight: bold;">
        (Select at least 1)
      </span>
    </label>
    <div :style="cssVars" class="dtrs-months-block">
      <div v-for="month in MONTHS" :key="month">
        <label class="mr-3" style="text-wrap: nowrap;" :for="`dtrs-month-${month}`">
          <input 
            :id="`dtrs-month-${month}`"
            type="checkbox" 
            :value="month" 
            v-model="selectedMonths" 
          />
          <span class="ml-1">{{ month }}</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { type MonthType, MONTHS } from './date_time_range_generators';

const { showErrorForEmpty } = defineProps<{
  showErrorForEmpty?: boolean;
}>();

const selectedMonths = defineModel<MonthType[]>({
  type: Array as () => MonthType[]
});

const empty = computed(() => selectedMonths.value?.length === 0);

const columns = ref(1);
const cssVars = computed(() => ({
  '--column-count': columns.value
}));
const observer = new ResizeObserver(() => {
  updateColumnCount();
});

const monthItemWidthPx = 110;
function updateColumnCount() {
  const container = document.getElementById('dtrs-months-picker') ;
  if (container) {
    columns.value = Math.max(Math.floor(container.clientWidth / monthItemWidthPx), 1);
  }
}
onMounted(() => {
  updateColumnCount();
  const container = document.getElementById('dtrs-months-picker') ;
  if (container) {
    observer.observe(container);
  }
});

onBeforeUnmount(() => {
  observer.disconnect();
});

</script>

<style scoped>

.dtrs-months-block {
  display: grid;
  grid-template-columns: repeat(var(--column-count), auto);
}
#dtrs-months-picker {
  border-radius: 8px;
  padding: 8px 0px;
  margin: 4px;
  
}
.dtrs-error-highlight {
  box-shadow: inset 0 0 8px 0px rgba(255,0,0,0.82)
}
</style>
