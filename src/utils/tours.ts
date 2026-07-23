import { useShepherd } from "vue-shepherd";
import type { Step, StepOptionsButton, Tour } from "shepherd.js";
import { offset } from "@floating-ui/dom";

import type { TempoStore } from "@/stores/app";
import { storeToRefs } from "pinia";

const backButton: StepOptionsButton = {
  action() { return this.back(); },
  classes: "shepherd-button-back",
  text: "Back",
};

const nextButton: StepOptionsButton = {
  action() { return this.next(); },
  classes: "shepherd-button-next",
  text: "Next",
};

const endButton: StepOptionsButton = {
  action() { return this.next(); },
  classes: "shepherd-button-next",
  text: "Finish",
};

const defaultButtons: StepOptionsButton[] = [backButton, nextButton];

export function addProgressDots(step: Step) {
  const stepElement = step.getElement();
  const tour = step.tour;
  if (!stepElement) {
    return;
  }
  const footer = stepElement.querySelector(".shepherd-footer");
  if (!footer) {
    return;
  }
  const dotsContainer = document.createElement("div");
  dotsContainer.classList.add("progress-dots");
  const currentIndex = tour.steps.indexOf(step);
  tour.steps.forEach((_, index) => {
    const dot = document.createElement("div");
    dot.classList.add("progress-dot");
    if (index === currentIndex) {
      dot.classList.add("active");
    }
    dotsContainer.appendChild(dot);
  });
  footer.appendChild(dotsContainer);
}

function useMdiCloseIcon(step: Step) {
  const stepElement = step.getElement();
  const cancelIcon = stepElement?.querySelector(".shepherd-cancel-icon");
  if (!cancelIcon) {
    return;
  }
  cancelIcon.replaceChildren();
  const icon = document.createElement("span");
  icon.classList.add("mdi", "mdi-close");
  icon.setAttribute("aria-hidden", "true");
  cancelIcon.appendChild(icon);
}

function addImage(step: Step, src: URL) {
  const stepElement = step.getElement();
  const textContainer = stepElement?.querySelector(".shepherd-text");
  if (!(stepElement && textContainer)) {
    return;
  }
  const img = document.createElement("img");
  const width = stepElement.getBoundingClientRect().width;
  img.src = src.href;
  img.style.width = `${width - 20}px`;
  img.style.display = "block";
  img.style.marginTop = "12px";
  img.style.marginLeft = "auto";
  img.style.marginRight = "auto";
  img.style.marginBottom = "10px";
  img.style.border = "1px solid rgba(255, 255, 255, 0.35)";
  img.style.borderRadius = "4px";
  textContainer.appendChild(img);
}

export function getIntroTour(store: TempoStore): Tour {

  const { datasetControlsOpen, layerControlsOpen } = storeToRefs(store);

  function defaultStepShow(step: Step) {
    addProgressDots(step);
    useMdiCloseIcon(step);
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
    title: "The Map",
    attachTo: { element: map, on: "bottom" },
    text: "The map displays TEMPO data and other layers!",
    buttons: [nextButton],
  });

  const timeSlider = document.querySelector(".slider-row") as HTMLElement;
  tour.addStep({
    title: "Time Slider",
    attachTo: { element: timeSlider, on: "top" },
    text: "Control the time for the currently displayed day using the slider",
  });

  const mapControls = document.querySelector(".map-view") as HTMLElement;
  tour.addStep({
    title: "Date & Timezone",
    attachTo: { element: mapControls, on: "top" },
    text: "Adjust the date and timezone of the map display",
  });

  const layersPanel = document.querySelector("#layers-panel") as HTMLElement;
  tour.addStep({
    title: "Layers Panel",
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
    title: "Collapse & Expand",
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
    title: "Datasets Panel",
    attachTo: { element: datasetsPanel, on: "left" },
    text: "This is the datasets panel! From this panel you can create and view graphs that look like this:",
    when: {
      show: () => {
        addImage(tour.currentStep, new URL("@/assets/example_graph.png", import.meta.url));
        defaultStepShow(tour.currentStep);
        datasetControlsOpen.value = true;
      },
    },
  });

  const openCloseDatasets = datasetsPanel.querySelector(".open-close-container") as HTMLElement;
  tour.addStep({
    title: "Collapse & Expand",
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
    title: "Restart the Tour",
    attachTo: { element: tourButton, on: "left" },
    text: "Click here to (re)open tour",
    buttons: [backButton, endButton],
  });

  return tour;
}
