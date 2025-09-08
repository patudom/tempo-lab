import { nextTick, ref, type Ref } from "vue";

import { renderingRule, fetchEsriTimeSteps, extractTimeSteps, VariableNames, stretches, colorramps, RenderingRuleOptions, ColorRamps } from '../ImageLayerConfig';

export function useEsriTimesteps(initialUrl: string, initialVariable: string, timestamp: Ref<number | null>) {
  const url = ref(initialUrl);
  const variable = ref(initialVariable);
  const loadingTimesteps = ref(false);
  const esriTimesteps = ref<number[]>([]);
  const noEsriData = ref(false);

  async function getEsriTimeSteps(): Promise<void> {
    loadingTimesteps.value = true;
    return fetchEsriTimeSteps(url.value, variable.value)
      .then(json => {
        esriTimesteps.value = extractTimeSteps(json);
      })
      .catch(error => {
        console.error(`Error fetching ESRI time steps: ${error}`);
      });
  }

  return {
    esriTimesteps,
    getEsriTimeSteps,
  }
}
