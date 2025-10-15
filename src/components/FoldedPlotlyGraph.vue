<template>
  <plotly-graph
    :datasets="datasets"
    :colors="colors"
    :show-errors="showErrors"
    :data-options="dataOptions"
    :error-bar-styles="errorBarStyles"
    :names="names"
    :layout-options="mergedLayoutOptions"
    :config-options="configOptions"
    @click="(value) => emit('click', value)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import PlotlyGraph, { type PlotlyGraphProps } from './plotly/PlotlyGraph.vue';
import { mergeFoldTypeLayout } from './plotly/plotly_styles';
import type { FoldType } from '../esri/services/aggregation';
import type { Datum } from 'plotly.js-dist-min';

interface FoldedPlotlyGraphProps extends PlotlyGraphProps {
  foldType: FoldType;
}

const props = defineProps<FoldedPlotlyGraphProps>();

const emit = defineEmits<{
  (event: "click", value: {x: Datum, y: number}): void;
}>();

// Merge the fold-type specific layout with any custom layout options
const mergedLayoutOptions = computed(() => {
  return mergeFoldTypeLayout(props.foldType, props.layoutOptions);
});
</script>

<style scoped>
</style>
