<template>
  <div>
    <label class="text-subtitle-2 mb-2 d-block">Years</label>
    <div v-for="year in possibleYears" :key="year" class="d-inline-block">
      <label class="mr-3" style="text-wrap: nowrap;" :for="`dtrs-year-${year}`">
        <input 
          :id="`dtrs-year-${year}`"
          type="checkbox" 
          :value="year" 
          v-model="selectedYears" 
        />
        <span class="ml-1">{{ year }}</span>
      </label>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { possibleYears } = defineProps<{
  possibleYears: number[];
}>();

const selectedYears = defineModel<number[]>({
  type: Array as () => number[]
});
</script>
