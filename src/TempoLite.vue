<template>
  <div>
    <div ref="root" class="layout-root"></div>

    <teleport v-if="mapTarget" :to="mapTarget">
      <div>MAP CONTENT</div>
    </teleport>

    <teleport v-if="controlsTarget" :to="controlsTarget">
      <div>CONTROLS</div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import "golden-layout/dist/css/goldenlayout-base.css";
import "golden-layout/dist/css/themes/goldenlayout-dark-theme.css";

import { onMounted, ref, useTemplateRef, type Ref } from "vue";
import { GoldenLayout } from "golden-layout";

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

  layout.loadLayout({
    settings: {
      hasHeaders: false,
    },
    root: {
      type: 'row',
      content: [
        {
          type: 'component',
          componentType: 'map',
          title: 'Map',
        },
        {
          type: 'component',
          componentType: 'controls',
          title: 'Controls',
        },
      ],
    },
  });
});
</script>

<style>
.layout-root {
  width: 100%;
  height: 100vh;
}
</style>
