import { onBeforeUnmount, Ref, watch } from "vue";

import { DragInfo } from "../types";

export function useDraggableDialog(
  root: Ref<HTMLElement | null>,
  dialogSelector: string = ".v-dialog.v-overlay--active",
) {

  let dragInfo: DragInfo | null = null;
  type MouseEventHandler = (event: MouseEvent) => void;
  let mousedown: MouseEventHandler | null = null;
  let mouseup: MouseEventHandler | null = null;
  let mousemove: MouseEventHandler | null = null;

  function removeListeners(element: HTMLElement) {
    if (mousedown) {
      element.removeEventListener("mousedown", mousedown);
    }
    if (mouseup) {
      element.removeEventListener("mouseup", mouseup);
    }
    if (mousemove) {
      element.removeEventListener("mousemove", mousemove);
    }
  }

  function setupDraggable(element: HTMLElement) {
    removeListeners(element);

    console.log(element);

    mousedown = (event: MouseEvent) => {
      const closestDialog = element.closest(dialogSelector);
      if (event.button === 0 && closestDialog != null) {
        const boundingRect = closestDialog.getBoundingClientRect();
        const d: DragInfo = {
          el: closestDialog as HTMLElement,
          title: element,
          mouseStartX: event.clientX,
          mouseStartY: event.clientY,
          elStartX: boundingRect.left,
          elStartY: boundingRect.top,
          overlays: document.querySelectorAll(".v-overlay__scrim"),
        };
        if (dragInfo && dragInfo.el) {
          d.oldTransition = dragInfo.el.style.transition;
        }
        if (d.el) {
          d.el.style.position = "fixed";
          d.el.style.margin = "0";
          d.el.style.transition = "none";
          d.el.style.left = Math.min(
            Math.max(d.elStartX + event.clientX - d.mouseStartX, 0),
            window.innerWidth - boundingRect.width
          ) + "px";
          d.el.style.top = Math.min(
            Math.max(d.elStartY + event.clientY - d.mouseStartY , 0),
            window.innerHeight - boundingRect.height
          ) - 0.5 * window.innerHeight + "px";
        }
        d.title.classList.add("dragging");
        d.overlays.forEach(overlay => (overlay as HTMLElement).style.display = "none");

        dragInfo = d;
      }
    };
    element.addEventListener("mousedown", mousedown);

    mousemove = (event: MouseEvent) => {
      if (dragInfo === null || dragInfo.el == null) {
        return;
      }
      const boundingRect = dragInfo.el.getBoundingClientRect();
      dragInfo.el.style.left = Math.min(
        Math.max(dragInfo.elStartX + event.clientX - dragInfo.mouseStartX, 0),
        window.innerWidth - boundingRect.width
      ) + "px";
      dragInfo.el.style.top = Math.min(
        Math.max(dragInfo.elStartY + event.clientY - dragInfo.mouseStartY , 0),
        window.innerHeight - boundingRect.height
      ) - 0.5 * window.innerHeight + "px";
    };
    document.addEventListener("mousemove", mousemove);

    mouseup = (_event: MouseEvent) => {
      if (dragInfo === null) {
        return;
      }
      if (dragInfo.oldTransition && dragInfo.el) {
        dragInfo.el.style.transition = dragInfo.oldTransition;
      }
      dragInfo.el = undefined;
      dragInfo.title.classList.remove("dragging");
      dragInfo.overlays.forEach(overlay => (overlay as HTMLElement).style.display = '');
    };
    document.addEventListener("mouseup", mouseup);
    
    // If the window changes size, the dialog may be partially/completely out of bounds
    // We fix that here
    const resizeObserver = new ResizeObserver(entries => {
      entries.forEach(entry => {
        const dialogs = entry.target.querySelectorAll(dialogSelector);
        dialogs.forEach(d => {
          const dialog = d as HTMLElement;
          const boundingRect = dialog.getBoundingClientRect();
          dialog.style.left = Math.min(parseInt(dialog.style.left), window.innerWidth - boundingRect.width) + "px";
          dialog.style.top = Math.min(parseInt(dialog.style.top), window.innerHeight - boundingRect.height) + "px";
        });
      });
    });
    resizeObserver.observe(document.body);
  }

  if (root.value) {
    setupDraggable(root.value);
  }

  watch(root, newRoot => {
    if (newRoot !== null) {
      setupDraggable(newRoot);
    }
  });

  onBeforeUnmount(() => {
    const element = root.value;
    if (element) {
      removeListeners(element);
    }
  });

}
