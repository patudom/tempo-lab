import { useShepherd } from "vue-shepherd";
import type { Step, StepOptionsButton, Tour } from "shepherd.js";
import { offset } from "@floating-ui/dom";

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

export function addProgressBar(step: Step) {
  console.log(step);
  const currentStepElement = step.getElement();
  const tour = step.tour;
  const content = currentStepElement?.querySelector(".shepherd-content");
  const footer = currentStepElement?.querySelector(".shepherd-footer");
  const progressContainer = document.createElement("div");
  progressContainer.classList.add("progress-container");
  const progress = document.createElement("div");
  progress.classList.add("progress-bar");
  const percent = 100 * (tour.steps.indexOf(step) + 1) / tour.steps.length;
  progress.style.width = `${percent}%`;
  progress.style.backgroundColor = "#068ede";
  progressContainer.appendChild(progress);
  if (footer) {
    content?.insertBefore(progressContainer, footer);
  }
}

export function getIntroTour(store: TempoStore): Tour {

  const { datasetControlsOpen, layerControlsOpen } = storeToRefs(store);

  function defaultStepShow(step: Step) {
    addProgressBar(step);
  }

  const tour = useShepherd({
    useModalOverlay: true,
    defaultStepOptions: {
      buttons: defaultButtons,
      cancelIcon: {
        enabled: true,
      },
      when: {
        show() {
          defaultStepShow(this as Step);
        },
      },
    },
  });

  const map = document.querySelector(".map-contents") as HTMLElement;
  tour.addStep({
    attachTo: { element: map, on: "bottom" },
    text: "The map displays TEMPO data and other layers!",
    buttons: [nextButton],
  });

  const timeSlider = document.querySelector(".slider-row") as HTMLElement;
  tour.addStep({
    attachTo: { element: timeSlider, on: "top" },
    text: "Control the time for the currently displayed day using the slider",
  });

  const mapControls = document.querySelector(".map-view") as HTMLElement;
  tour.addStep({
    attachTo: { element: mapControls, on: "top" },
    text: "Adjust the date and timezone of the map display",
  });

  const layersPanel = document.querySelector("#layers-panel") as HTMLElement;
  tour.addStep({
    attachTo: { element: layersPanel, on: "right" },
    text: "This is the layers panel!",
    when: {
      show: () => {
        defaultStepShow(tour.currentStep);
        layerControlsOpen.value = true;
      },
    },
    floatingUIOptions: {
      middleware: [
        offset({crossAxis: 75 - 0.5 * layersPanel.getBoundingClientRect().height}),
      ],
    },
  });

  const openCloseLayers = layersPanel.querySelector(".open-close-container") as HTMLElement;
  tour.addStep({
    attachTo: { element: openCloseLayers, on: "right" },
    text: "The layers panel can be opened and closed",
    when: {
      show: () => {
        defaultStepShow(tour.currentStep);
        layerControlsOpen.value = false;
      },
    },
  });

  const datasetsPanel = document.querySelector("#datasets-panel") as HTMLElement;
  tour.addStep({
    attachTo: { element: datasetsPanel, on: "left" }, 
    text: "This is the datasets panel! From this panel you can create and view graphs that look like this",
    when: {
      show: () => {
        defaultStepShow(tour.currentStep);
        datasetControlsOpen.value = true;
      },
    },
  });

  const openCloseDatasets = datasetsPanel.querySelector(".open-close-container") as HTMLElement;
  tour.addStep({
    attachTo: { element: openCloseDatasets, on: "left" },
    text: "The datasets panel can also be opened and closed",
    when: {
      show: () => {
        defaultStepShow(tour.currentStep);
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
