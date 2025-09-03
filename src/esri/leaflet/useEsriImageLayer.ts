// src/composables/useEsriLayer.ts
import { ref, watch, nextTick, MaybeRef, toRef, Ref } from 'vue';
import { ImageMapLayer, imageMapLayer } from 'esri-leaflet';
import { renderingRule, fetchEsriTimeSteps, extractTimeSteps, stretches, colorramps, type VariableNames, type RenderingRuleOptions, ColorRamps } from '../ImageLayerConfig';
import { Map } from 'leaflet';
export const no2Url = ref('https://gis.earthdata.nasa.gov/image/rest/services/C2930763263-LARC_CLOUD/TEMPO_NO2_L3_V03_HOURLY_TROPOSPHERIC_VERTICAL_COLUMN/ImageServer');



export function useEsriLayer(_url: string, variableName: VariableNames, timestamp: Ref<number | null>, opacity: MaybeRef<number>) {
  const esriTimesteps = ref([] as number[]);
  const esriImageLayer = ref(null as ImageMapLayer | null);

  const opacityRef = toRef(opacity);

  const noEsriData = ref(false);
  
  const variableNameRef = toRef(variableName);
  
  const urlRef = toRef(_url);
  
  const loadingEsriTimeSteps = ref(false);
  
  const renderOptions = ref<RenderingRuleOptions>({
    range: stretches[variableNameRef.value],
    colormap: colorramps[variableNameRef.value],
  });


  async function getEsriTimeSteps() {
    loadingEsriTimeSteps.value = true;
    fetchEsriTimeSteps(urlRef.value, variableNameRef.value)
      .then((json) => {
        esriTimesteps.value = extractTimeSteps(json);
      }).then(() => {
        nextTick(updateEsriTimeRange);
        loadingEsriTimeSteps.value = false;
      });
  }


  function updateEsriTimeRange() {
    if (timestamp.value === null) return;
    const now = timestamp.value;
    if (esriTimesteps.value.length === 0) {
      console.warn('No ESRI time steps available');
      return;
    }
    
    const nearest = esriTimesteps.value.reduce((a, b) => Math.abs(b - now) < Math.abs(a - now) ? b : a);
    noEsriData.value = Math.abs((nearest - now) / (1000 * 60)) > 60;
    if (noEsriData.value) {
      console.error('nearest time is more than an hour away');
    }
    if (esriImageLayer.value) {
      // Esri will pick the first valid time slice
      // console.table({'nearest': new Date(nearest), 'now': new Date(now), 'diff (minutes)': (nearest - now) / (1000 * 60) });
      esriImageLayer.value.setTimeRange(new Date(nearest), new Date(nearest * 2));
    }
  }

  function updateEsriOpacity(value: number = 0.8) {
    if (esriImageLayer.value) {
      esriImageLayer.value.setOpacity(value);
    }
  }


  esriImageLayer.value = imageMapLayer({
    url: urlRef.value,
    format: 'png',
    opacity: opacityRef.value ?? 0.8,
  });
  
  if (esriImageLayer.value) {
    // esriImageLayer.value.setPixelType(renderingRule?.rasterFunctionArguments?.Raster?.outputPixelType ?? 'U8');
    esriImageLayer.value.setRenderingRule(renderingRule(renderOptions.value.range, renderOptions.value.colormap));
    console.log('Initial rendering rule set:', renderOptions.value);
    updateEsriTimeRange();
  }
  
  const mapRef = ref<Map | null>(null);

  function addEsriSource(map: Map) {
    if (!map) return;
    if (mapRef.value === null) {
      mapRef.value = map;
    }
    esriImageLayer.value?.addTo(map);
  }
  
  function changeUrl(newUrl: string, variableName: VariableNames) {
    console.log('Changed URL to:', newUrl);
    if (esriImageLayer.value && mapRef.value) {
      urlRef.value = newUrl;
      esriImageLayer.value.remove(); // Remove the old layer
      
      variableNameRef.value = variableName; // Default to NO2 if not provided
      esriImageLayer.value = imageMapLayer({
        url: newUrl,
        format: 'png',
        opacity: opacityRef.value ?? 0.8,
      });
      esriImageLayer.value.setRenderingRule(renderingRule(renderOptions.value.range, renderOptions.value.colormap));
      addEsriSource(mapRef.value as Map);
    }
  }
  
  function updateStretch(vmin: number, vmax: number) {
    if (esriImageLayer.value) {
      esriImageLayer.value.setRenderingRule(renderingRule([vmin, vmax], renderOptions.value.colormap));
      console.log('Updated stretch to ', vmin, vmax);
    }
  }
  
  function updateColormap(colormap: ColorRamps) {
    if (esriImageLayer.value) {
      esriImageLayer.value.setRenderingRule(renderingRule(renderOptions.value.range, colormap));
      console.log('Updated colormap to ', colormap);
    }
  }

  watch(() => renderOptions.value.range, (newRange) => {
    updateStretch(newRange[0], newRange[1]);
  });
  watch(() => renderOptions.value.colormap, (newColormap) => {
    updateColormap(newColormap);
  });
  
  watch(variableNameRef, () => {
    renderOptions.value.range = stretches[variableNameRef.value];
    renderOptions.value.colormap = colorramps[variableNameRef.value];
  });

  
  
  watch(timestamp, (_value: number | null) => {
    updateEsriTimeRange();
  }, { immediate: true });

  watch(opacityRef, (value: number) => {
    updateEsriOpacity(value);
  });

  watch(noEsriData, (value: boolean) => {
    if (value) {
      updateEsriOpacity(0);
    } else {
      updateEsriOpacity(opacityRef.value);
    }
  });

  return {
    esriImageLayer,
    opacity: opacityRef,
    noEsriData,
    esriTimesteps,
    getEsriTimeSteps,
    loadingEsriTimeSteps,
    updateEsriTimeRange,
    updateEsriOpacity,
    addEsriSource,
    changeUrl,
    renderOptions
  };
}