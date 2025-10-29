<template>
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

</template>

<script lang="ts" setup>
const selectedDays = defineModel<number[]>({
  type: Array as () => number[]
});
</script>