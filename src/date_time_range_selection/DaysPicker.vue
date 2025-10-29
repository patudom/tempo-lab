<template>
  <div>
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
</template>


<script lang="ts" setup>
const { dayOptions } = defineProps<{
  dayOptions: {title: string;value: number;}[];
}>();

const selectedDays = defineModel<number[]>({
  type: Array as () => number[],
  default: () => [],
});

</script>