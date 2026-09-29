<template>
  <div class="map-view">
    <h2>Explore Map View</h2>
    <p class="my-2">Select a date and timezone to display</p>
    <div class="map-view-controls">
      <div class="date-view-controls mt-2">
        <div class="d-flex flex-row align-center">
          <v-radio-group v-model="radio">
            <date-picker
              class="cds__date-picker tall"
              ref="calendar"
              :model-value="singleDateSelected"
              @internal-model-change="(value: Date) => {
                if (value != null && value.getTime() != singleDateSelected.getTime()) {
                  radio = null;
                  singleDateSelected = value;
                  closeCalendarAfterSelection();
                }
              }"
              :allowed-dates="uniqueDays"
              :teleport="true"
              :arrow-navigation="true"
              @open="focusCalendarMenu"
              @closed="returnFocusToInput"
              :input-atters="{clearable: false}"
              :time-config="{ enableTimePicker: false }"
              :multi-dates="false"
              :transitions="false"
              :formats="{'input': (date: Date | null) => date?.toDateString(), 'preview': (date: Date | null) => date?.toDateString()}"
              :week-start="0"
              no-today
              dark
              :year-range="[uniqueDays[0]?.getFullYear(), uniqueDays[uniqueDays.length - 1]?.getFullYear()]"
              six-weeks
            >
              <template #action-buttons>
                <button
                  class="dp__action_button dp__action-latest"
                  @click="() => singleDateSelected = uniqueDays[uniqueDays.length - 1]"
                  @keyup.enter="() => singleDateSelected = uniqueDays[uniqueDays.length - 1]"
                  :disabled="singleDateSelected === uniqueDays[uniqueDays.length - 1]"
                  elevation="0"
                  size="sm"
                >
                  Latest
              </button>
              </template>
              <!-- <template #action-extra="{ selectCurrentDate }">
              
              </template> -->
            </date-picker>
            <!-- time chips to select time specifically for esri times -->
          </v-radio-group>
        </div>        
        <!-- add buttons to increment and decrement the singledateselected -->
        <div class="d-flex flex-row align-center my-2">
          <v-tooltip :disabled="touchscreen" text="Previous Date">
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                class="rounded-icon-wrapper"
                @click="store.moveBackwardOneDay"
                @keyup.enter="store.moveBackwardOneDay"
                :disabled="singleDateSelected === uniqueDays[0]"
                color="#009ade"
                variant="outlined"
                elevation="0"
                size="md"
              >
                <v-icon>mdi-chevron-double-left</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
          <v-spacer></v-spacer>
          <v-tooltip :disabled="touchscreen" text="Get Data for latest available day">
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                style="padding-inline: 4px;"
                @click="() => singleDateSelected = uniqueDays[uniqueDays.length - 1]"
                @keyup.enter="() => singleDateSelected = uniqueDays[uniqueDays.length - 1]"
                :disabled="singleDateSelected === uniqueDays[uniqueDays.length - 1]"
                color="#009ade"
                variant="outlined"
                elevation="0"
                size="md"
              >
                Latest Available Data
              </v-btn>
            </template>
          </v-tooltip>
          <v-spacer></v-spacer>
          <v-tooltip :disabled="touchscreen" text="Next Date">
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                class="rounded-icon-wrapper"
                @click="store.moveForwardOneDay"
                @keyup.enter="store.moveForwardOneDay"
                :disabled="singleDateSelected === uniqueDays[uniqueDays.length - 1]"
                color="#009ade"
                variant="outlined"
                elevation="0"
                size="md"
              >
                <v-icon>mdi-chevron-double-right</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </div>
      </div>
      <div class="map-dropdown-container d-flex flex-row flex-wrap">
        <v-select
          v-model="selectedTimezone"
          class="map-dropdowns timezone-dropdown"
          label="Timezone"
          :items="timezoneOptions"
          item-title="name"
          item-value="tz"
          hide-details
          dense
          variant="outlined"
        ></v-select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { VueDatePicker } from "@vuepic/vue-datepicker";
import { supportsTouchscreen } from "@cosmicds/vue-toolkit";

import { type MoleculeType } from "@/esri/utils";
import { useTempoStore } from "@/stores/app";
// import { useEsriTimesteps } from "@/composables/useEsriTimesteps";

// import TimeChips from "@/components/TimeChips.vue";

const store = useTempoStore();
const {
  singleDateSelected,
  uniqueDays,
  selectedTimezone,
  timezoneOptions,
} = storeToRefs(store);

const emit = defineEmits<{
  (event: "molecule", molecule: MoleculeType): void;
}>();

const molecule = ref<MoleculeType>('no2');

const radio = ref<number | null>(null);
const touchscreen = supportsTouchscreen();

const calendar = ref<typeof VueDatePicker | null>(null);

// The menu is teleported to <body> so the scrolling controls panel can't clip it,
// but that also drops it at the end of the document's tab order: measured 8 Tab
// presses from the input to reach the calendar, against 2 when it renders in
// place. Moving focus into the menu as it opens fixes that and beats both -- the
// keyboard is on the calendar straight away -- and putting focus back on the
// input when it closes keeps the reader's place in the page.
// Only one picker menu can be open at a time, so the open one is unambiguous;
// vue-datepicker exposes no per-instance handle on the teleported node.
//
// This also fixes the calendar being unreachable during a tour. Teleporting puts
// the menu outside both the tour popup and the tour's highlighted target, and
// Shepherd's Tab handler wraps focus between those two ranges -- so with a tour
// step up, every Tab stayed in the tour. Once focus is inside the menu Shepherd
// has no listener there and Tab moves through the calendar normally.
//
// Two things make this awkward. `open` fires before the teleported menu is in
// the DOM, so a plain nextTick focused nothing at all. And once the menu is
// there, the picker re-renders the grid a moment later, which destroys whatever
// cell was focused -- focus then falls out of the menu entirely, to <body>
// normally and to the tour dialog while a tour is up. So: wait for the menu,
// focus it, then check on the following frame and take focus back if that
// re-render stole it. Bounded, so it cannot spin.
//
// The selected day is the target, which is also what the picker's own arrow
// navigation focuses, so the two agree rather than fight.
function focusCalendarMenu() {
  let attemptsLeft = 20;
  const claimFocus = () => {
    if (attemptsLeft-- <= 0) {
      return;
    }
    const menu = document.querySelector<HTMLElement>(".dp__menu");
    const cell = menu?.querySelector<HTMLElement>(".dp__cell_inner.dp__active_date")
      ?.closest<HTMLElement>(".dp__calendar_item")
      ?? menu?.querySelector<HTMLElement>(".dp__calendar_item");
    if (!menu || !cell) {
      requestAnimationFrame(claimFocus);
      return;
    }
    cell.focus();
    requestAnimationFrame(() => {
      if (!menu.contains(document.activeElement)) {
        claimFocus();
      }
    });
  };
  requestAnimationFrame(claimFocus);
}

// Closing has to wait for the picker to finish reacting to the new date.
// Setting singleDateSelected changes :model-value, which makes the component
// re-initialise; with arrow-navigation on, that remount re-focuses the active
// cell via a double requestAnimationFrame and leaves the menu standing. A close
// issued before that -- directly in the emit, or on nextTick, which is only a
// microtask -- gets undone by it: on the keyboard path the date applied and the
// map updated while the calendar stayed open, with the focus ring flicking
// across the menu and settling on the day just chosen. Two frames puts the
// close after the library's own frames. A mouse click never triggered this
// because it does not go through the arrow-navigation remount.
function closeCalendarAfterSelection() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => calendar.value?.closeMenu());
  });
}

function returnFocusToInput() {
  nextTick(() => {
    document.querySelector<HTMLElement>(".cds__date-picker input")?.focus();
  });
}


watch(molecule, (newMol: MoleculeType) => {
  emit("molecule", newMol);
});
</script>

<style lang="less">

.map-view {
  margin: 1rem;
}

.map-view-controls {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1rem;
}

.date-view-controls {
  flex: 0 0 auto; /* Don't shrink, don't grow, auto width */
  min-width: 220px; /* Minimum width before parent wraps */
}

.cds__date-picker .tall {
  height: 58px;
}

.map-dropdown-container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1rem;
  flex: 1 1 210px; 

  .map-dropdowns {

    font-family: var(--dp-font-family);
    height: 56px !important;

    .v-field--variant-outlined .v-field__outline__start, .v-field--variant-outlined .v-field__outline__end {
      border-color: rgba(255, 255, 255, 0.7);
      opacity: 1;
    }

    .v-field--variant-outlined .v-field__outline__notch {
      border-bottom: solid 1px rgba(255, 255, 255, 0.7);
    }

    .v-field--variant-outlined .v-field__outline__notch::after {
      border-bottom: solid 1px rgba(255, 255, 255, 0.6);
    }

    &.timezone-dropdown {
      width: 220px !important;
      max-width: 220px !important;
    }

    &.molecule-dropdown {
      width: 220px !important;
      max-width: 220px !important;
    }

  }
}

</style>
