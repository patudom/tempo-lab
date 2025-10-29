<template>
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
</template>

<script lang="ts" setup>
const selectedMonths = defineModel<number[]>({
  type: Array as () => number[]
});
</script>
