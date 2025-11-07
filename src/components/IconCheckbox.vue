<template>
  <v-checkbox
    v-model="modelValue"
    :value="value"
    v-bind="props"
  >
    <template #input="{ model }">
      <!-- Using <component :is="..."/> didn't work with v-icon for some reason -->
      <font-awesome-icon
          v-if="(model.value ? onIcon : offIcon)?.startsWith('fa-')"
          :icon="model.value ? onIcon : offIcon"
          class="fa-icon"
          :color="model.value ? onColor : offColor"
          @click="model.value = !model.value"
        ></font-awesome-icon>
        <v-icon
          v-else
          class="md-icon"
          :color="model.value ? onColor : offColor"
          @click="model.value = !model.value"
        >{{ model ? onIcon : offIcon }}
      </v-icon>
    </template>
  </v-checkbox>
</template>

<script setup lang="ts">
export interface IconCheckboxProps {
  value: string;
  onIcon: string;
  offIcon: string;
  onColor?: string;
  offColor?: string;
}

const modelValue = defineModel();
const props = withDefaults(defineProps<IconCheckboxProps>(), {
  onColor: "white",
  offColor: "gray",
});
</script>
