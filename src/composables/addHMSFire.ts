import { ref, watch, computed, type WritableComputedRef, type Ref, onBeforeUnmount, toRef } from 'vue';
import M from 'maplibre-gl';
import { Popup } from 'maplibre-gl';
import { useKML } from './useKML';



export type InternalMapLayerEventType = M.MapMouseEvent & {features?: M.MapGeoJSONFeature[];};
export type InternalMapLayerEventTypeHandler = (e: InternalMapLayerEventType) => void;

export interface HMSLayer {
  addToMap: (map: M.Map) => Promise<void>
  removeFromMap: (map: M.Map) => void
  geoJsonData: Ref<GeoJSON.FeatureCollection | null>
  loading: Ref<boolean>
  error: Ref<Error | null>
  layerVisible: WritableComputedRef<boolean>
  toggleHMSVisibility: (vis?: boolean | undefined) => void
  setUrl: (newUrl: string) => Promise<void>
}

// Optional settings for labels
export interface UseKMLOptions {
  labelMinZoom?: number;            // min zoom at which labels appear
  layerName: string;               // custom id base for source/layers, e.g. 'fire'
  showPopup?: boolean;            // whether to show popup on click/hover
  showLabel?: boolean;           // whether to show labels
  visible?: boolean;              // initial visibility state; defaults to true
}

// description
function description2props(desc: string | null): Record<string, string | number> {
  const props: Record<string, string | number> = {};
  if (!desc) return props;
  const vals = desc.split('<br>');
  vals.reduce((acc, pair) => {
    const [key, value] = pair.split(':').map(s => s.trim());
    if (key && value) {
      acc[key] = isNaN(parseFloat(value)) ? value : parseFloat(value);
    }
    return acc;
  }, props);
  return props;
}

// Post-process GeoJSON to apply styleUrl-based HMS coloring
const postProcessGeoJson = (geoJson: GeoJSON.FeatureCollection): GeoJSON.FeatureCollection => {
  const processedFeatures = geoJson.features.map((feature) => {
    const processedFeature = { ...feature };
    const props = processedFeature.properties || {};
    // const styleUrl = props.styleUrl ?? props.styleURL ?? null;
    processedFeature.properties = {
      ...props,
      ...props.description ? description2props(props.description as string) : {},
    };
    return processedFeature;
  });
  
  const features = processedFeatures
    .filter(f => f.properties && f.properties.FRP > 0)
    .sort((a, b) => (a?.properties?.FRP || 0) - (b?.properties?.FRP || 0)); // descending FRP

  return {
    ...geoJson,
    features: features,
  };
};


export function addHMSFire(date: Ref<Date>, options: UseKMLOptions = {layerName: 'hms-layer'}) {

  const url = computed(() => {
    const _date = date.value;
    if (!_date) {
      return 'https://satepsanone.nesdis.noaa.gov/pub/FIRE/web/HMS/Fire_Points/KML/2025/09/hms_fire20250914.kml';
    }
    const year = _date.getUTCFullYear();
    const month = (_date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = _date.getUTCDate().toString().padStart(2, '0');
    return `https://worldwidetelescope.org/webserviceproxy.aspx?targeturl=https://satepsanone.nesdis.noaa.gov/pub/FIRE/web/HMS/Fire_Points/KML/${year}/${month}/hms_fire${year}${month}${day}.kml`;
  });
  
  const { kmlUrl, geoJsonData, loading, error, setUrl: internalSetUrl, loadKML, cleanUp } = useKML(url.value);
  
  watch(url, (newUrl) => {
    setUrl(newUrl).catch(() => {/* ignore */});
  });
  
  function getYearDay(date: Date): number {
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return Math.floor(date.getFullYear() * 1000 + dayOfYear);
  }
  
  const yearDay = computed(() => {
    const _date = date.value;
    if (!_date) {
      return 2025001; // Jan 1, 2025
    }
    console.log("HMS: Computing YearDay for date", _date, getYearDay(_date));
    return getYearDay(_date);
  });

  const showPopup = options.showPopup ?? true;

  // Store runtime state in refs (avoid caching on the function)
  const mapRef = ref<M.Map | null>(null);
  const idBase = options.layerName ? options.layerName : '';
  const sourceId = `${idBase}-source`;
  const layerId = idBase;
  const labelLayerId = layerId + '-label';

  const popupRef = ref<Popup | null>(null);
  const onEnterRef = ref<InternalMapLayerEventTypeHandler | null>(null);
  const onMoveRef = ref<InternalMapLayerEventTypeHandler | null>(null);
  const onLeaveRef = ref<InternalMapLayerEventTypeHandler | null>(null);
  const onStyleDataRef = ref<InternalMapLayerEventTypeHandler | null>(null);

  // Track the last known layer visibility across URL changes (persisted)
  const lastKnownVisible = ref<boolean>(options.visible ?? true); 

  // layerVisible reflects actual map state; falls back to lastKnownVisible if layer missing
  const layerVisible = computed<boolean>({
    get() {
      const map = mapRef.value;
      if (!map) {
        console.warn(`HMS: Tried to get ${layerId} but map is not set`);
        return lastKnownVisible.value;
      }
      if (!map.getLayer(layerId)) {
        console.warn(`HMS: Tried to get ${layerId} but layer is not present on map`);
        return lastKnownVisible.value;
      }
      
      const vis = map.getLayoutProperty(layerId, 'visibility');
      console.log(`HMS: Layer ${layerId} visibility is`, vis);
      return vis === 'visible';
    },
    set(val: boolean) {
      lastKnownVisible.value = val;
      const map = mapRef.value;
      if (!map) {
        console.warn(`HMS: Tried to get ${layerId} but map is not set`);
        return lastKnownVisible.value;
      }
      if (!map.getLayer(layerId)) {
        console.warn(`HMS: Tried to get ${layerId} but layer is not present on map`);
        return lastKnownVisible.value;
      }
      
      const vis = val ? 'visible' : 'none';
      map.setLayoutProperty(layerId, 'visibility', vis);
      if (map.getLayer(labelLayerId)) {
        map.setLayoutProperty(labelLayerId, 'visibility', vis);
      }
    }
  });


  
  function preloadImages(map: M.Map, images: Record<string, string>)  {
    return Promise.all(Object.entries(images).map(([name, url]) => {
      url = "./FireIcon.png";
      if (map.hasImage(name)) {
        return;
      }
      return map.loadImage(url)
        .then((img) => {
          map.addImage(name, img.data);
        });
    }));
  }

  
  function setupLayerPopup(map: M.Map, layerId: string) {
    const popup = new Popup({ closeButton: false, closeOnClick: false, maxWidth: '200px' });
    const onEnter = (e: InternalMapLayerEventType) => {
      map.getCanvas().style.cursor = 'pointer';
      const f = e.features && e.features[0];
      if (f?.properties?.description) {
        const desc = f?.properties?.description ; 
        popup
          .setLngLat(e.lngLat)
          .setHTML(desc)
          .addTo(map)
          .addClassName('hms-popup');
      }
    };
    const onMove = (e: InternalMapLayerEventType) => {
      popup.setLngLat(e.lngLat);
      const f = e.features && e.features[0];
      if (f?.properties?.description) {
        popup.setHTML(f?.properties?.description);
      }
    };
    const onLeave = () => {
      map.getCanvas().style.cursor = '';
      popup.remove();
    };
    
    map.on('mouseenter', layerId, () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('click', layerId, onEnter);
    map.on('mousemove', layerId, onMove);
    map.on('mouseleave', layerId, onLeave);

    // Store state in refs (not on function)
    popupRef.value = popup;
    onEnterRef.value = onEnter;
    onMoveRef.value = onMove;
    onLeaveRef.value = onLeave;
  }

  function setupVisibilitySync(map: M.Map) {
    // Keep label visibility equal to main layer & sync external visibility changes
    const syncLabelVisibility = () => {
      if (!map.getLayer(layerId)) return;
      const mainVis = (map.getLayoutProperty(layerId, 'visibility') as string) || 'visible';
      const isVisible = mainVis === 'visible';
      if (lastKnownVisible.value !== isVisible) {
        lastKnownVisible.value = isVisible;
      }
      if (map.getLayer(labelLayerId)) {
        const labelVis = (map.getLayoutProperty(labelLayerId, 'visibility') as string) || 'visible';
        if (labelVis !== mainVis) {
          map.setLayoutProperty(labelLayerId, 'visibility', mainVis);
        }
      }
    };
    
    syncLabelVisibility();
    // idle takes a bit longer than styledata, and the user can tell
    // but idle would be less frequent i think
    map.on('styledata', syncLabelVisibility); 
    onStyleDataRef.value = syncLabelVisibility;
  }


  const cleanupMapLayers = () => {
    const map = mapRef.value;
    if (map) {
      if (map.getLayer(labelLayerId)) { 
        map.removeLayer(labelLayerId);
      }
      
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getLayer(layerId+'-circle')) {
        map.removeLayer(layerId+'-circle');
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    }
  };

  // Add GeoJSON to map
  const addToMap = async (map: M.Map): Promise<void> => {
    // Always store map first so subsequent retries have a reference
    mapRef.value = map;
    
    // Load KML if not already loaded
    if (!geoJsonData.value) {
      // console.log('HMS: No GeoJSON data, loading KML from URL:', kmlUrl.value);
      await loadKML();
    }
    if (!geoJsonData.value) {
      throw new Error('No GeoJSON data available');
    }

    // Remove existing layer and source if they exist
    cleanupMapLayers();
    
    console.log("=================", postProcessGeoJson(geoJsonData.value));
    // }
    const images: Record<string, string> = {};
    geoJsonData.value.features.forEach((feature) => {
      const props = feature.properties || {};
      const iconUrl: string = props.icon;
      const styleUrl = props.styleUrl || iconUrl.split('/').pop(); 
      if (iconUrl && typeof iconUrl === 'string' && !(iconUrl in images)) {
        images[styleUrl] = iconUrl;
      }
    });
    // Preload all icons
    preloadImages(map, images)
      .then(() => {
        if (!geoJsonData.value) {
          throw new Error('No GeoJSON data available after image preload');
        }
        // Add new source and layer
        map.addSource(sourceId, {
          type: 'geojson',
          data: postProcessGeoJson(geoJsonData.value)
        });

        // Add point layer colored by 'marker-color'
        map.addLayer({
          id: layerId,
          type: 'symbol',
          source: sourceId,
          paint: {
            'icon-opacity': 1,
          },
          layout: {
            'icon-image': ['coalesce', ['get', 'styleUrl'], 'circle-15'],
            'icon-size': [
              "*", 
              .025, 
              ['abs',['log10', [
                '*', 10,
                ['number', ['get', 'FRP']]
              ]
              ]]
            ],
            'icon-allow-overlap': true,
          },
          filter: ['>', ['get', 'FRP'], 1]
        });
        
        
        
        
        function circleRadiusExpression(meters: number, stops = [0, 5, 10, 15, 20]): M.DataDrivenPropertyValueSpecification<number> {
          return [
            "interpolate", ["linear"], ["zoom"],
            ...stops.flatMap(z => [
              z,
              [
                "/",
                ["*", meters, Math.pow(2, z)],
                ["*", 156543.03392, ["cos", ["/", ["*", Math.PI, ["get", "Lat"]], 180]]]
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ] as any
            ])
          ];
        }
        
        
        
        map.addLayer({
          id: layerId+'-circle',
          type: 'circle',
          source: sourceId,
          minzoom: 9,
          // paint with a pale yellow to dark red scale based on FRP
          paint: {
            // 375 meter radius using zoom, 'Lat', and 'Lon'
            'circle-radius': circleRadiusExpression(375/2),
            'circle-color': [
              "interpolate",
              ["linear"],
              ["get", "FRP"],
              0, "rgb(255, 255, 204)",       // pale yellow
              1, "rgb(255, 237, 160)",
              5, "rgb(254, 178, 76)",
              10, "rgb(240, 59, 32)",
              20, "rgb(189, 0, 38)",
              50, "rgb(128, 0, 38)",           // dark red
              1000, "rgb(77, 0, 75)"            // very dark red
            ],
            'circle-opacity': 0.5,
            'circle-stroke-color': 'black',
            // 'circle-stroke-width': 0.5,
            // 'circle-stroke-opacity': 0.8
          },
          // filter for TimeDay 
          filter: ['>', ['get', 'YearDay'], yearDay.value-2],
        });

        // Optionally add labels
        

        
        // Add popup/handlers if it hasn't been added yet
        if (showPopup && popupRef.value === null) {
          console.log('HMS: Setting up popups for layer', layerId);
          setupLayerPopup(map, layerId);
        }
        
        // Even without labels still sync visibility (for external toggles)
        if (onStyleDataRef.value === null) {
          setupVisibilitySync(map);

        }

        // Apply last known visibility after layers are added
        // const vis = lastKnownVisible.value ? 'visible' : 'none';
        // map.setLayoutProperty(layerId, 'visibility', vis);
        // if (map.getLayer(labelLayerId)) {
        //   map.setLayoutProperty(labelLayerId, 'visibility', vis);
        // }

        console.log('HMS: Successfully added KML layer to map');
      })
      .catch((err) => {
        console.error('HMS: Error adding KML layer to map:', err);
        throw err;
      });
        
    
  };
  
  
  // Optional: debug logging
  // watch(layerVisible, (newVis) => {
  //   console.log('HMS layer visibility changed to:', newVis);
  // });

  // Toggle visibility for main and label layers using the computed setter
  const toggleFireVisibility = (val?: boolean | undefined): void => {
    const next = val ?? !layerVisible.value;
    layerVisible.value = next;
  };

  // Change URL and refresh layer
  const setUrl = async (newUrl: string): Promise<void> => {
    console.log('HMS: Setting new KML URL:', newUrl);
    cleanupMapLayers();
    internalSetUrl(newUrl) // will automatically load new and abort prior
      .then(() => {
        const map = mapRef.value;

        if (map) {
          addToMap(map as never);
        }
      }).catch((err) => {
        console.error('HMS: Error setting new KML URL:', err);
      });
  };

  // Watch for URL changes to auto-reload (will be idempotent due to early return)
  watch(kmlUrl, (newUrl) => {
    setUrl(newUrl).catch(err => {
      console.error('HMS: Error reloading KML after URL change:', err);
    });
  });

  // Remove from map
  const removeFromMap = (map: M.Map): void => {
    cleanUp();
    
    // Remove hover handlers and popup
    if (onEnterRef.value) map.off('click', layerId, onEnterRef.value);
    if (onMoveRef.value) map.off('mousemove', layerId, onMoveRef.value);
    if (onLeaveRef.value) map.off('mouseleave', layerId, onLeaveRef.value);
    if (popupRef.value) popupRef.value.remove();
    if (onStyleDataRef.value) map.off('styledata', onStyleDataRef.value);
    // if (onStyleDataRef.value) map.off('idle', onStyleDataRef.value); 

    // Remove layers and source
    cleanupMapLayers();

    // Clear stored handlers/popup; keep mapRef so we can re-add later
    popupRef.value = null;
    onEnterRef.value = null;
    onMoveRef.value = null;
    onLeaveRef.value = null;
  };
  
  onBeforeUnmount(() => {
    const map = mapRef.value;
    if (map) {
      removeFromMap(map as never);
      mapRef.value = null;
    }
  });
  
  return {
    addToMap,
    layerId,
    removeFromMap,
    geoJsonData,
    loading,
    error,
    layerVisible,
    toggleFireVisibility,
    setUrl
  };
}
