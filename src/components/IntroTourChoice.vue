<template>
  <v-card>
    <v-card-text class="intro-popup">
      <v-row>
        <v-col cols="6">
          <v-btn
            @click="() => {
              emit('tour');
              emit('close');
            }"
          >Give me a quick tour!</v-btn>
        </v-col>
        <v-col cols="6">
          <v-btn
            @click="() => emit('close')"
          >I want to dive right in!</v-btn>
        </v-col>
      </v-row>
      <v-row>
        <v-spacer />
        <v-checkbox
          @update:modelValue="value => emit('dont-show', !!value)"
          label="Don't show this again"
        ></v-checkbox>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (event: "close"): void;
  (event: "tour"): void;
  (event: "dont-show", value: boolean): void;
}>();
</script>
