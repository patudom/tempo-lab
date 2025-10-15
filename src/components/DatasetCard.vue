<template>
  <v-list>
    <v-hover
      v-slot="{ isHovering, props }"
      v-for="dataset in datasets"
      :key="dataset.id"
    > 
      <!-- create a checkbox input that will -->
    
      <v-list-item
        v-bind="props"
        :ref="(el) => datasetRowRefs[dataset.id] = el"
        class="selection-item my-2"
        :style="{ 'background-color': dataset.customColor ?? dataset.region.color }"
        :ripple="touchscreen"
        lines="two"
      >
        <template v-slot:prepend v-if="turnOnSelection">
          <v-checkbox
            v-model="selectedDatasets"
            :value="dataset.id"
            @click.stop
            hide-details
            density="compact"
          />
        </template>
        <template #default>
          <div>
            <v-chip
              size="small" 
              append-icon="mdi-pencil"
              elevation="1"
              @click="() => handleEditDataset(dataset)"
              >
              {{ dataset.name ?? dataset.region.name }}
            </v-chip>
            
            <v-chip 
              v-if="dataset.name" 
              size="small" 
              variant="flat"  
              :style="(dataset.customColor === dataset.region.color) ? {border: '1px solid #ffffff61'} : {}"
              :color="dataset.region.color"
              >
              {{ dataset.region.name }}
            </v-chip>
            
            <v-chip size="small">
              {{ moleculeName(dataset.molecule) }}
            </v-chip>
            
            <v-chip
              v-if="dataset.timeRange" 
              size="small" 
              class="text-caption"
              >
              {{ dataset.timeRange.description }}
            </v-chip>
            
            <v-chip 
              v-if="dataset.timeRange" 
              size="small" 
              class="text-caption"
              >
              {{ dataset.timeRange?.type ?? 'no type' }}
            </v-chip>
          </div>
          
          <!-- this is where the actions will go -->
          <slot name="action-row" :isHovering="isHovering" :dataset="dataset">
          </slot>
        </template>
      </v-list-item>
    </v-hover>
  </v-list>


</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { supportsTouchscreen } from "@cosmicds/vue-toolkit";
import type { UserDataset } from "../types";
import { useTempoStore } from "../stores/app";
import { moleculeName } from "../esri/utils";


const store = useTempoStore();

interface DatasetCardProps {
  datasets: UserDataset[];
  turnOnSelection?: boolean;
}
const { datasets, turnOnSelection } = defineProps<DatasetCardProps>();

// create a selectedDatasets model, to hold selectedDatsets use (defineModel). should just store the dataset.id values
const selectedDatasets = defineModel<string[]>('selectedDatasets', {
  type: Array as () => string[],
  default: () => [],
});

const touchscreen = supportsTouchscreen();


const openGraphs = ref<Record<string,boolean>>({});
const currentlyEditingDataset = ref<UserDataset | null>(null);


const datasetRowRefs = ref({});




const showDatasetEditor = ref(false);
const datasetEditorNameOnly = ref(false);
function handleEditDataset(dataset: UserDataset, nameOnly = false) {
  datasetEditorNameOnly.value = nameOnly;
  currentlyEditingDataset.value = dataset;
  showDatasetEditor.value = true;
}

function _removeDataset(dataset: UserDataset) {
  store.deleteDataset(dataset);

  delete openGraphs[dataset.id];
  delete datasetRowRefs[dataset.id];
}


</script>

<style scoped lang="less">
</style>
