import { useShepherd } from "vue-shepherd";
import type { Step, StepOptionsButton, Tour } from "shepherd.js";

import type { TempoStore } from "@/stores/app";
import { storeToRefs } from "pinia";

const backButton: StepOptionsButton = {
  action() { return this.back(); },
  classes: "shepherd-button-secondary",
  text: "Back",
};

const nextButton: StepOptionsButton = {
  action() { return this.next(); },
  classes: "shepherd-button-secondary",
  text: "Next",
};

const endButton: StepOptionsButton = {
  action() { return this.next(); },
  classes: "shepherd-button-secondary",
  text: "Finish",
};

const defaultButtons: StepOptionsButton[] = [backButton, nextButton];

export function getIntroTour(store: TempoStore): Tour {

  const { datasetControlsOpen, layerControlsOpen } = storeToRefs(store);

  console.log(datasetControlsOpen, layerControlsOpen);

  const tour = useShepherd({
    useModalOverlay: true,
    defaultStepOptions: {
      buttons: defaultButtons,
      cancelIcon: {
        enabled: true,
      },
      when: {
        show() {
          const currentStep = tour.getCurrentStep();
          const currentStepElement = currentStep?.getElement();
          const content = currentStepElement?.querySelector(".shepherd-content");
          const footer = currentStepElement?.querySelector(".shepherd-footer");
          const progressContainer = document.createElement("div");
          progressContainer.classList.add("progress-container");
          const progress = document.createElement("div");
          progress.classList.add("progress-bar");
          const percent = 100 * (tour.steps.indexOf(currentStep) + 1) / tour.steps.length;
          progress.style.width = `${percent}%`;
          progress.style.backgroundColor = "#068ede";
          progressContainer.appendChild(progress);
          content?.insertBefore(progressContainer, footer);
        },
      },
    },
  });

  const map = document.querySelector("canvas.maplibregl-canvas") as HTMLElement;
  tour.addStep({
    attachTo: { element: map, on: "top" },
    text: "The map displays TEMPO data and other layers!",
    buttons: [nextButton],
  });

  const mapControls = document.querySelector(".map-view") as HTMLElement;
  tour.addStep({
    attachTo: { element: mapControls, on: "top" },
    text: "Adjust the date and timezone of the map display",
  });

  const timeSlider = document.querySelector(".slider-row") as HTMLElement;
  tour.addStep({
    attachTo: { element: timeSlider, on: "top" },
    text: "Control the time for the currently displayed day using the slider",
  });

  const layersPanel = document.querySelector("#layers-panel") as HTMLElement;
  tour.addStep({
    attachTo: { element: layersPanel, on: "right" },
    text: "This is the layers panel!",
    when: {
      show: (_step: Step) => {
        layerControlsOpen.value = true;
      },
    },
  });

  const openCloseLayers = layersPanel.querySelector(".open-close-container") as HTMLElement;
  tour.addStep({
    attachTo: { element: openCloseLayers, on: "right" },
    text: "The layers panel can be opened and closed",
    when: {
      show: (_step: Step) => {
        layerControlsOpen.value = false;
      },
    },
  });

  const datasetsPanel = document.querySelector("#datasets-panel") as HTMLElement;
  tour.addStep({
    attachTo: { element: datasetsPanel, on: "left" }, 
    text: "This is the datasets panel!",
    when: {
      show: (_step: Step) => {
        datasetControlsOpen.value = true;
      },
    },
  });

  const openCloseDatasets = datasetsPanel.querySelector(".open-close-container") as HTMLElement;
  tour.addStep({
    attachTo: { element: openCloseDatasets, on: "left" },
    text: "The datasets panel can also be opened and closed",
    when: {
      show: (_step: Step) => {
        datasetControlsOpen.value = false;
      },
    },
  });

  const tourButton = document.querySelector("#tour-button") as HTMLElement;
  tour.addStep({
    attachTo: { element: tourButton, on: "left" },
    text: "Click here to (re)open tour",
    buttons: [backButton, endButton],
  });

  return tour;
}
