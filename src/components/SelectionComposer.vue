<template>
  <v-card >
    <v-card-title class="d-flex justify-space-between">
      <h3>Compose Selection</h3>
      <v-chip size="x-small" color="primary" variant="tonal">{{ creationProgress.count }}/3</v-chip>
    </v-card-title>
  <v-card-text class="d-flex flex-column ga-3">
      <!-- Region Picker -->
      <v-select
        :items="availableRegions.map(r => ({ title: r.name, value: r }))"
        :model-value="draftUserSelection.region"
        @update:model-value="setDraftSelectionRegion($event as RectangleSelectionType)"
        label="Region"
        :disabled="selectionActive"
        item-title="title"
        item-value="value"
        density="compact"
        hide-details
        variant="outlined"
      />

      <!-- Molecule Picker -->
      <v-select
        :items="availableMolecules.map(m => ({ title: m.title, value: m.key }))"
        :model-value="draftUserSelection.molecule"
        @update:model-value="setDraftSelectionMolecule($event)"
        label="Molecule"
        item-title="title"
        item-value="value"
        density="compact"
        hide-details
        variant="outlined"
      />

      <!-- Time Range Picker: offer Effective (current day/custom) and any active custom ranges -->
      <v-select
        :items="timeRangeOptions"
        :model-value="draftUserSelection.timeRange"
        @update:model-value="setDraftSelectionTimeRange($event)"
        label="Time Range"
        item-title="title"
        item-value="value"
        density="compact"
        hide-details
        variant="outlined"
      />

      <v-progress-linear :model-value="creationProgress.percent" height="6" color="primary" rounded></v-progress-linear>

      <div class="d-flex ga-2">
        <v-btn
          color="primary"
          :disabled="creationProgress.count < 3"
          @click="composeSelection"
          size="small"
        >Create Selection</v-btn>
        <v-btn
          color="secondary"
          variant="tonal"
          size="small"
          @click="() => { draftUserSelection.region = null; draftUserSelection.timeRange = null; draftUserSelection.molecule = null; }"
        >Reset</v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { type RectangleSelectionType } from "../types";

// Public composition progress
const creationProgress = computed(() => {
  let count = 0;
  if (draftUserSelection.value.region) count += 1;
  if (draftUserSelection.value.timeRange) count += 1;
  if (draftUserSelection.value.molecule) count += 1;
  return { count, percent: (count / 3) * 100 };
});
</script>
