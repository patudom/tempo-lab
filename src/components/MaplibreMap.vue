<template>
  <!-- this will automatically gets the class maplibregl-map added to it -->
  <div :id="mapID" class="tempo-map">
    <slot></slot>
  </div>
</template>
  
<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, defineModel } from "vue";
import { LatLngPair, InitMapOptions } from "@/types";
import type { PropType } from 'vue';
import type { Map, MapEventType, Listener } from 'maplibre-gl';
import { useMap } from "@/composables/maplibre/useMap";
import { usezoomhome } from '@/composables/maplibre/useZoomHome';


// should be using a defined Prop type and widthDefaults, but 
// i could not get that to work with the center (LatLngPair is a weird type)
// but apparently the old options syntax is still good
const props = defineProps({
  mapID: {
    type: String as PropType<string>,
    required: true
  },
  home: {
    type: Object as PropType<InitMapOptions>,
    required: false,
    default: () => {
      return {
        loc: [39.8283, -98.5795] as LatLngPair, 
        zoom: 4, 
        t: null
      };
    }
  },
  initial: {
    type: Object as PropType<InitMapOptions>,
    required: false,
    default: null
  },
  showRoads: {
    type: Boolean as PropType<boolean>,
    required: false,
    default: true
  },
  // events: { moveend: handler, zoomend: handler, click: handler, etc. }
  events: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: Object as PropType<Record<keyof MapEventType | string, Listener>>,
    default: () => ({})
  },
});

// define model values that set and return the current map center and zoom
const latitude = defineModel<number>(
  'latitude', 
  {
    default: 0
  });
const longitude = defineModel<number>(
  'longitude', 
  {
    default: 0
  });
const zoom = defineModel<number>(
  'zoom', 
  {
    default: 0
  });




const showRoadsRef = ref(props.showRoads);
watch(() => props.showRoads, (value) => {
  showRoadsRef.value = value;
});

const emit = defineEmits<{
  (e: 'ready', map: Map): void;
  (e: 'zoomhome'): void;
}>();






function attachAllEvents(m: Map, handlers: typeof props.events) {
  Object.entries(handlers).forEach(([evt, handler]) => {
    m.on(evt, handler);
  });
}

function detachAllEvents(m: Map, handlers: typeof props.events) {
  Object.entries(handlers).forEach(([evt, handler]) => {
    m.off(evt, handler);
  });
}

const mapReady = ref(false);
// https://stackoverflow.com/a/36072263/11594175
let promiseResolve: (value: Map) => void;
// let promiseReject: (reason?: any) => void; // we won't use the reject
const whenMapReady: Promise<Map> = new Promise((resolve, _reject) => {
  promiseResolve = resolve; /**   this is just javascript, so this pulls 
                                  the resolve function
                                  out of the promise constructor and makes it 
                                  available for us to use
                            **/
  // promiseReject = reject;
});

const onMapReady = (m: Map) => {
  console.log("Map is ready", m);
  mapReady.value = true;
  attachAllEvents(m, props.events);
  emit('ready', m);
  promiseResolve(m);
};

const {
  map,
  createMap,
  setView,
  resetView,
  getCenter,
  cleanupMap
} = useMap(props.mapID, props.initial ?? props.home, showRoadsRef, onMapReady);

watch(() => [latitude.value, longitude.value, zoom.value], ([newLat, newLng, newZoom]) => {
  if (map.value && mapReady.value) {
    setView([newLat, newLng] as LatLngPair, newZoom);
  }
});

onMounted(() => {

  const mMap = createMap(); // just use the return value instead of map.value. eases type checking
  
  usezoomhome(mMap, props.home.loc, props.home.zoom, () => {
    emit('zoomhome');
  });

  mMap.value.on('moveend', () => {
    if (map.value) {
      const center = map.value.getCenter();
      latitude.value = center.lat;
      longitude.value = center.lng;
      zoom.value = map.value.getZoom();
    }
  });
  
});

onBeforeUnmount(() => {
  if (map.value) {
    detachAllEvents(map.value, props.events);
    cleanupMap();
  }
});


// provide only works downwards and i don't think we need it
// const MAPLIBRE_PROVIDE_KEY = props.mapID;
// provide(MAPLIBRE_PROVIDE_KEY, 
const exposedMapApi = {
  map,
  setView,
  resetView,
  getCenter,
  on: (evt: keyof MapEventType | string, handler: Listener) => {
    if (map.value) {
      map.value.on(evt, handler);
    }
  },
  off: (evt: keyof MapEventType | string, handler: Listener) => {
    if (map.value) {
      map.value.off(evt, handler);
    }
  },
  once: (evt: keyof MapEventType | string, handler: Listener) => {
    if (map.value) {
      map.value.once(evt, handler);
    }
  },
  mapReady,
  onReady: whenMapReady
};

// we will also expose these on the template ref
defineExpose(exposedMapApi);



</script>
  
<style lang="less">
@font-face {
  font-family: "Highway Gothic Narrow";
  src: url("@/assets/HighwayGothicNarrow.ttf");
}

// import Lexand from google fonts
// @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap');


div.dataset-loading {
  width: 100%;
  height: 100%;
}





/* Leaflet crispness override */
// @JobLeonard - https://github.com/Leaflet/Leaflet/issues/5883#issue-269071844
// .leaflet-container .leaflet-overlay-pane svg,
// .leaflet-container .leaflet-marker-pane img,
// .leaflet-container .leaflet-shadow-pane img,
// .leaflet-container .leaflet-tile-pane img,
.leaflet-container img.leaflet-image-layer {
  max-width: none !important;
  /* Preserve crisp pixels with scaled up images */
  image-rendering: optimizeSpeed;
  /* Legal fallback */
  image-rendering: -moz-crisp-edges;
  /* Firefox        */
  image-rendering: -o-crisp-edges;
  /* Opera          */
  image-rendering: -webkit-optimize-contrast;
  /* Safari         */
  image-rendering: optimize-contrast;
  /* CSS3 Proposed  */
  image-rendering: crisp-edges;
  /* CSS4 Proposed  */
  image-rendering: pixelated;
  /* CSS4 Proposed  */
  -ms-interpolation-mode: nearest-neighbor;
  /* IE8+           */
}

.pulse {
  animation-name: pulse;
  animation-duration: 1.5s;
  animation-iteration-count: 3;
}


@keyframes pulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.2);
  }

  100% {
    transform: scale(1);
  }
}

canvas.maplibregl-canvas {
  background-color: whitesmoke;
}

.dataset-loading {
  display: flex;
  flex-direction: row;
}

.dataset-loading-failed {
  width: 70%;
  max-width: calc(100% - 32px);
}
</style>

