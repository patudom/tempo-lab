<template>
  <v-app id="app">
    <div ref="root" class="layout-root"></div>

    <teleport v-if="mapTarget" :to="mapTarget">
      <map-with-controls />
    </teleport>

    <teleport v-if="controlsTarget" :to="controlsTarget">
      <dataset-controls />
    </teleport>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted, ref, useTemplateRef, type Ref } from "vue";
import { GoldenLayout, LayoutConfig } from "golden-layout";

const root = useTemplateRef("root");
const mapTarget = ref<HTMLElement | null>(null);
const controlsTarget = ref<HTMLElement | null>(null);

onMounted(() => {
  const rootEl = root.value as HTMLElement;
  if (!rootEl) {
    return;
  }
  const layout = new GoldenLayout(rootEl);
  const components: [string, Ref<HTMLElement | null>][] = [
    ["map", mapTarget],
    ["controls", controlsTarget]
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
  height: 100vh;
}

html, body {
  padding: 0;
  margin: 0;
}
</style>
