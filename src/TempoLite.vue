<template>
  <v-app
    id="app"
    :style="cssVars"
  >
    <header-bar />
    <div ref="root" class="layout-root"></div>

    <teleport v-if="mapTarget" :to="mapTarget">
      <!--
      <map-with-controls />
      -->
    </teleport>

    <teleport v-if="sidePanelTarget" :to="sidePanelTarget">
      <dataset-controls />
    </teleport>
  </v-app>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, type Ref } from "vue";
import { storeToRefs } from "pinia";
import { GoldenLayout, LayoutConfig } from "golden-layout";

import { useTempoStore } from "@/stores/app";

const root = useTemplateRef("root");
const mapTarget = ref<HTMLElement | null>(null);
const sidePanelTarget = ref<HTMLElement | null>(null);

const store = useTempoStore();
const {
  accentColor,
  accentColor2,
} = storeToRefs(store);

const infoColor = "#092088";
const cssVars = computed(() => {
  return {
    '--accent-color': accentColor.value,
    '--accent-color-2': accentColor2.value,
    '--info-background': infoColor,
  };
});

onMounted(() => {
  const rootEl = root.value as HTMLElement;
  if (!rootEl) {
    return;
  }
  const layout = new GoldenLayout(rootEl);
  const components: [string, Ref<HTMLElement | null>][] = [
    ["map", mapTarget],
    ["controls", sidePanelTarget]
  ];

  components.forEach(([tag, elementRef]) => {
    layout.registerComponentFactoryFunction(tag, container => {
      elementRef.value = container.element;
    });
  });

  const config: LayoutConfig = {
    settings: {
      hasHeaders: false,
      responsiveMode: "always",
    },
    root: {
      type: 'row',
      content: [
        {
          type: 'component',
          componentType: 'map',
          title: 'Map',
          draggable: false,
          width: 70,
        },
        {
          type: 'component',
          componentType: 'controls',
          title: 'Controls',
          draggable: false,
          width: 30,
        },
      ],
    },
  };
  layout.resizeWithContainerAutomatically = true;
  layout.loadLayout(config);
});
</script>

<style>
html, body .layout-root {
  width: 100%;
  height: 100%;
}

html, body {
  padding: 0;
  margin: 0;
}

#app {
  userh1, h2, h3, h4, h5, h6, p, div {
    user-select: none;
    -webkit-user-select: none;
  }
}
</style>
