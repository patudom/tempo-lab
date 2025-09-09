<template>
  <div class="map-container">
    <map-colorbar-wrap
      :horizontal="display.width.value <= 750"
      :current-colormap="currentColormap"
      :color-map="colorMap"
      :start-value="colorbarOptions[whichMolecule].stretch[0] / colorbarOptions[whichMolecule].cbarScale"
      :end-value="colorbarOptions[whichMolecule].stretch[1] / colorbarOptions[whichMolecule].cbarScale"
      :molecule-label="colorbarOptions[whichMolecule].label"
      :cbar-scale="colorbarOptions[whichMolecule].cbarScale"
    >
      <v-card class="map-contents" style="width:100%; height: 100%;">
        <v-toolbar
          density="compact"
          color="var(--info-background)"
        >
          <v-toolbar-title :text="`TEMPO Data Viewer: ${mapTitle}`"></v-toolbar-title>
          <v-spacer></v-spacer>
          <!-- switch for preview points -->
           <v-switch
            v-if="regions.length > 0"
            v-model="showSamplingPreviewMarkers"
            :label="`${showSamplingPreviewMarkers ? 'Showing' : 'Hiding'} Sample Points`"
            :disabled="regions.length === 0"
            @keyup.enter="showSamplingPreviewMarkers = !showSamplingPreviewMarkers"
            inset
            hide-details
            class="me-3"
            :style="{'--v-theme-on-surface': 'var(--accent-color)'}"
            />
          <v-tooltip :text="rectangleSelectionActive ? 'Cancel selection' : 'Select a region'">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                icon="mdi-select"
                :color="rectangleSelectionActive ? 'info' : 'default'"
                :variant="rectangleSelectionActive ? 'tonal' : 'text'"
                :disabled="pointSelectionActive"
                @click="activateRectangleSelectionMode"
              ></v-btn>
            </template>
          </v-tooltip>
          <v-tooltip :text="pointSelectionActive ? 'Cancel selection' : 'Select a point'">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                icon="mdi-plus"
                :color="pointSelectionActive ? 'info' : 'default'"
                :variant="pointSelectionActive ? 'tonal' : 'text'"
                :disabled="rectangleSelectionActive"
                @click="activatePointSelectionMode"
              ></v-btn>
            </template>
          </v-tooltip>
        </v-toolbar>
        <EsriMap
          mapID="map"
          :initial="initState"
          :home="homeState"
          :show-roads="showRoads"
          :events="{
            'moveend': updateURL,
            'zoomend': updateURL,
          }"
          :timestamp="timestamp"
          :molecule="whichMolecule"
          :opacity="opacity"
          :show-field-of-regard="showFieldOfRegard"
          @zoomhome="onZoomhome"
          @ready="onMapReady"
          @esri-timesteps-loaded="onEsriTimestepsLoaded"
          ref="maplibreMap"
          width="100%"
          height="500px"
        />

        <div v-if="showFieldOfRegard" class="map-legend"><hr class="line-legend">TEMPO Field of Regard</div>
        <!-- show hide cloud data, disable if none is available -->

        <v-menu
          class="map-controls"
          v-model="showControls"
          :close-on-content-click="false"
        >
          <template v-slot:activator="{ props }">
            <div class="map-show-hide-controls">
              <v-btn
                v-bind="props"
                class="mx-2 mt-5"
                elevation="2"
                color="white"
                icon
                style="outline: 2px solid #b6b6b6;"
                rounded="0"
                size="x-small"
              >
                <template v-slot:default>
                  <v-icon
                    color="black"
                    size="x-large"
                  >mdi-tune-variant</v-icon>
                </template>
              </v-btn>
            </div>
          </template>
          <v-card class="controls-card">
            <font-awesome-icon
              style="position:absolute;right:16px;cursor:pointer"
              icon="square-xmark"
              size="xl"
              @click="showControls = false"
              @keyup.enter="showControls = false"
              :color="accentColor2"
              tabindex="0"
            ></font-awesome-icon>
            <div
              class="opacity-slider-container mt-5"
            >
              <div class="opacity-slider-label">TEMPO data opacity</div>
              <v-slider
                  v-model="opacity"
                  :min="0"
                  :max="1"
                  color="#c10124"
                  density="compact"
                  hide-details
                  class="mb-4"
                  @end="store.opacitySliderUsedCount += 1"
                >
              </v-slider>
            </div>
            <div
              class="d-flex flex-row align-center justify-space-between"
            >
              <v-checkbox
                v-model="showRoads"
                @keyup.enter="showRoads = !showRoads"
                label="Show Roads"
                color="#c10124"
                hide-details
              />
            </div>
            <div
              class="d-flex flex-row align-center justify-space-between"
            >
              <v-checkbox
                v-model="showFieldOfRegard"
                @keyup.enter="showFieldOfRegard = !showFieldOfRegard"
                label="TEMPO Field of Regard"
                color="#c10124"
                hide-details
              />
              <info-button>
                <p>
                  The TEMPO satellite observes the atmosphere over North America, from the Atlantic Ocean to the Pacific Coast, and from roughly Mexico City to central Canada. 
                </p>
                <p>
                  The TEMPO Field of Regard (in <span class="text-red">red</span>, currently <em>{{ showFieldOfRegard ? 'visible' : "hidden" }}</em>)
                  is the area over which the satellite takes measurements. 
                </p>
                </info-button>
              </div>
          </v-card>
        </v-menu>
        <div class="location-and-sharing">
        <location-search
          v-model="searchOpen"
          small
          stay-open
          buttonSize="xl"
          persist-selected
          :search-provider="geocodingInfoForSearchLimited"
          @set-location="setLocationFromSearch"
          @error="(error: string) => searchErrorMessage = error"
        ></location-search>
      </div>
      </v-card>
    </map-colorbar-wrap>
    <map-controls
      @molecule="(mol: MoleculeType) => { whichMolecule = mol }"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, type Ref } from "vue";
import { useDisplay } from 'vuetify';
import { storeToRefs } from "pinia";
import { MapBoxFeature, MapBoxFeatureCollection, MapBoxFeatureType, MapBoxForwardGeocodingOptions, geocodingInfoForSearch } from "@cosmicds/vue-toolkit";
import { Map } from "maplibre-gl";

import type { LatLngPair, InitMapOptions } from "@/types";
import { type MoleculeType, MOLECULE_OPTIONS } from "@/esri/utils";
import { colorbarOptions } from "@/esri/ImageLayerConfig";
import type { AllAvailableColorMaps } from "@/colormaps";
import { colormap } from "@/colormaps/utils";
import { useTempoStore } from "@/stores/app";
import { useLocationMarker } from "@/composables/maplibre/useMarker";

import EsriMap from "@/components/EsriMap.vue";
import MapColorbarWrap from "@/components/MapColorbarWrap.vue";

type MapType = Map | null;
const maplibreMap = useTemplateRef<InstanceType<typeof EsriMap>>("maplibreMap");

const store = useTempoStore();
const {
  accentColor2,
  regions,
  timestamp,
  timeIndex,
} = storeToRefs(store);


const display = useDisplay();

const map = ref<MapType>(null);

const onMapReady = (m: Map) => {
  map.value = m; // ESRI source already added by EsriMap
};

const zoomScale = 0.5; // for matplibre-gl
const urlParams = new URLSearchParams(window.location.search);
const initLat = parseFloat(urlParams.get("lat") || '40.044');
const initLon = parseFloat(urlParams.get("lon") || '-98.789');
const initZoom = parseFloat(urlParams.get("zoom") || `${4 * zoomScale}`); // 4 is the default zoom level for the map, multiplied by zoomScale for maplibre
const initTime = urlParams.get("t");
const initState = ref<InitMapOptions>({
  loc: [initLat, initLon] as LatLngPair,
  zoom: initZoom,
  t: initTime ? +initTime : null
});

const homeLat = 40.044;
const homeLon = -98.789;
const homeZoom = 4 * zoomScale; // 4 is the default zoom level for the map, multiplied by zoomScale for maplibre
const homeState = ref({
  loc: [homeLat, homeLon] as LatLngPair,
  zoom: homeZoom,
  t: null as number | null
});

const showLocationMarker = ref(true);
const {
  setMarker,
  removeMarker,
  locationMarker
} = useLocationMarker(map as Ref<Map | null>, showLocationMarker.value);

const showFieldOfRegard = ref(false);
const showControls = ref(false);
const showRoads = ref(true);
const opacity = ref(0.9);
const showSamplingPreviewMarkers = ref(false);

const whichMolecule = ref<MoleculeType>('no2');

const timestamps = ref<number[]>([]);

const searchOpen = ref(true);
const searchErrorMessage = ref<string | null>(null);
const pointSelectionActive = ref(false);
const rectangleSelectionActive = ref(false);
function activateRectangleSelectionMode() {
  rectangleSelectionActive.value = !rectangleSelectionActive.value;
}

function activatePointSelectionMode() {
  pointSelectionActive.value = !pointSelectionActive.value;
}

const colorMap = ref<AllAvailableColorMaps>('None');
const currentColormap = computed(() => {
  return (x: number): string => {
    const rgb = colormap(colorMap.value, 0 ,1 ,x);
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},1)`;
  };
});

const mapTitle = computed(() => {
  const currentMolecule = MOLECULE_OPTIONS.find(m => m.value === whichMolecule.value);
  if (!currentMolecule) {
    return '';
  }
  return currentMolecule.title;
});

const defaultMapboxOptions = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  types: ["place", "postcode"] as MapBoxFeatureType[],
  countries: ["US", "CA", "MX", "CU", "BM", "HT", "DO"],
  limit: 5,
};
async function geocodingInfoForSearchLimited(searchText: string, options?: MapBoxForwardGeocodingOptions): Promise<MapBoxFeatureCollection | null> {
  const token = process.env.VUE_APP_MAPBOX_ACCESS_TOKEN;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const opts = options ?? { ...defaultMapboxOptions, access_token: token ?? "" };
  return geocodingInfoForSearch(searchText, opts).catch(_err => null);
}

function setLocationFromSearch(items: [MapBoxFeature | null, string]) {
  const [feature, text] = items;
  if (feature !== null) {
    // Latitude, Longitude order
    const coordinates: LatLngPair = [feature.center[1], feature.center[0]] as LatLngPair;
    maplibreMap.value?.setView(coordinates, 12);
    setMarker(coordinates);
    store.userSelectedLocations.push(text);
  }
}

function onZoomhome() {
  if (locationMarker.value !== null) {
    removeMarker();
  }
}

const currentUrl = ref(window.location.href);
function updateURL() {
  if (map.value) {
    const center = map.value.getCenter();
    let stateObj = null as Record<string, string> | null;
    stateObj = {
      lat: `${center.lat.toFixed(4)}`,
      lon: `${center.lng.toFixed(4)}`,
      zoom: `${map.value.getZoom()}`,
      t: `${timestamp.value}`
    };
    const url = new URL(location.origin);
    const searchParams = new URLSearchParams(stateObj ?? {});
    // const hash = window.location.hash;
    // url.hash = hash;
    url.pathname = location.pathname;
    window.history.replaceState(null, '', url.toString());
    url.search = searchParams.toString();
    currentUrl.value = url.toString();
    // window.history.replaceState(stateObj, '', url);
  }
}

// ESRI timesteps arrive from EsriMap component; store directly in timestamps
function onEsriTimestepsLoaded(steps: number[]) {
  if (!Array.isArray(steps) || steps.length === 0) return;
  const sorted = steps.slice().sort();
  timestamps.value = sorted;
  if (timeIndex.value >= sorted.length) {
    timeIndex.value = 0;
  }
}

</script>

<style scoped>
.map-container {
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  padding-right: 10px;

  .location-and-sharing {
    position: absolute;
    bottom: 0;
    z-index: 1000;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    width: fit-content;
  }

  .forward-geocoding-container {
    width: 250px;
    border: 2px solid black;
  }

  .map-show-hide-controls {
    z-index: 1000;
    position: absolute;
    top: calc(48px + 1rem);
    right: 80px;
  }

  .map-legend {
    position: absolute;
    top: 48px;
    right: 80px;
    width: fit-content;
    z-index: 1000;

    display: flex;
    align-items: center;
    gap: 0.5rem;

    color: black;
    background-color: #fff5;
    padding-left: 0.5rem;
    padding-right: 0.25rem;

    backdrop-filter: blur(5px);

    hr.line-legend {
      display: inline-block;
      border: 0.5px solid #c10124;
      width: 3rem;
    }
  }

}
</style>
