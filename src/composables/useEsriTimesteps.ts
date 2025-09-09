import { toRef, ref, watch, type MaybeRef } from "vue";

import { getEsriTimesteps } from "../esri/utils";
import { VariableNames } from "@/esri/ImageLayerConfig";

export function useEsriTimesteps(initialUrl: MaybeRef<string>, initialVariable: MaybeRef<VariableNames>) {
  const url = toRef(initialUrl);
  const variable = toRef(initialVariable);
  const loadingTimesteps = ref(false);
  const esriTimesteps = ref<number[]>([]);
  const error = ref<string | null>(null);

  async function updateEsriTimeSteps(): Promise<void> {
    loadingTimesteps.value = true;
    return getEsriTimesteps(url.value, variable.value)
      .then(timesteps => {
        esriTimesteps.value = timesteps;
      })
      .catch((err: Error) => {
        console.error(`Error fetching ESRI time steps: ${err}`);
        error.value = err.message;
      });
  }

  watch(() => [url, variable], _newValues => {
    updateEsriTimeSteps();
  });

  return {
    loadingTimesteps,
    url,
    variable,
    esriTimesteps,
  };
}
