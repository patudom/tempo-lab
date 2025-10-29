<template>
  <div>
    <label class="text-subtitle-2 mb-2 d-block">Months</label>
    <div v-for="month in monthNames" :key="month" class="d-inline-block">
      <label class="mr-3" style="text-wrap: nowrap;" :for="`dtrs-month-${month}`">
        <input 
          :id="`dtrs-month-${month}`"
          type="checkbox" 
          :value="monthNames.indexOf(month)" 
          v-model="selectedMonths" 
        />
        <span class="ml-1">{{ month }}</span>
      </label>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { monthNames } = defineProps<{
  monthNames: string[];
}>();

const selectedMonths = defineModel<number[]>({
  type: Array as () => number[]
});
</script>
