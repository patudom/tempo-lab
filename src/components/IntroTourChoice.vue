<template>
  <v-dialog
    v-model="showPopup"
    width="50%"
  >
    <v-card>
      <v-card-text class="intro-popup">
        <v-row>
          <v-col cols="6">
            <v-btn
              @click="() => {
                getIntroTour(store).start();
                showPopup = false;
              }"
            >Give me a quick tour!</v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn
              @click="showPopup = false"
            >I want to dive right in!</v-btn>
          </v-col>
        </v-row>
        <v-row>
          <v-spacer />
          <v-checkbox
            v-model="dontShowPopupAgain"
            label="Don't show this again"
          ></v-checkbox>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
</script>
