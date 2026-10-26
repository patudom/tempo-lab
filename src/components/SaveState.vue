<template>
  <div>
    <div class="save-state">
      <div class="icon-row">
        <h3>Save Data:</h3>
        <v-tooltip
          location="top"
          text="Save to local file"
        >
        <template #activator="{ props }">
            <font-awesome-icon
              v-bind="props"
              icon="fa-download"
              :color="accentColor2"
              size="xl"
              @click="() => saveLocal()"
            />
          </template>
        </v-tooltip>
        <!-- <v-tooltip
          location="top"
          text="Coming soon!"
        >
          <template #activator="{ props }">
            <span v-bind="props">
              <v-icon
                icon="mdi-google-drive"
                :color="accentColor"
                disabled
              />
            </span>
          </template>
        </v-tooltip> -->
      </div>
      <p>
        Save all your progress (including regions, time ranges, datasets, and aggregated datasets) to a file on your computer.
      </p>
    </div>
    <div class="save-state">
      <div class="icon-row">
        <h3>Load Data:</h3>
        <v-tooltip
          location="top"
          text="Load from local file"
        >
          <template #activator="{ props }">
            <font-awesome-icon
              v-bind="props"
              icon="fa-upload"
              :color="accentColor2"
              size="xl"
              @click="() => loadLocal()"
            />
          </template>
        </v-tooltip>
        <!-- <v-tooltip
          location="top"
          text="Coming soon!"
        >
          <template #activator="{ props }">
            <span v-bind="props">
              <v-icon
                icon="mdi-google-drive"
                :color="accentColor"
                disabled
              />
            </span>
          </template>
        </v-tooltip> -->
      </div>
      <p>
        Load your progress and data (including regions, time ranges, datasets, and aggregated datasets) from a file saved on your computer.
      </p>
    </div>
    <!-- The confirmation happens in place rather than in a second dialog
         stacked on top of this one. -->
    <div class="save-state danger-zone">
      <div class="icon-row">
        <h3>Clear App Data:</h3>
        <v-tooltip
            location="top"
            text="Clear all app data"
          >
          <template #activator="{ props }">
            <v-icon
              v-bind="props"
              icon="mdi-broom"
              :color="accentColor2"
              :disabled="!hasSelections"
              @click="confirmingReset = true"
            />
          </template>
        </v-tooltip>
      </div>
      <template v-if="!confirmingReset">
        <p>
          Remove all regions, time ranges, and datasets from the app. 
        </p>
        <p>
          (Saved files on your computer will not be affected.)
        </p>
      </template>
      <template v-else>
        <p>
          Are you sure you want to clear all of your data selections?
        </p>
        <p>
          <strong>Any work you haven’t saved to a file will be lost.</strong> Save your data first to keep your work.
        </p>
        <div class="danger-zone-actions mt-2">
          <v-btn
            size="small"
            variant="outlined"
            @click="confirmingReset = false"
          >
            Cancel
          </v-btn>
          <v-btn
            :color="tempoRed"
            size="small"
            @click="resetAll"
          >
            Yes, clear my data
          </v-btn>
        </div>
      </template>
    </div>
  </div>
</template>


<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { type TempoStore, useTempoStore, serializeTempoStore, updateStoreFromJSON } from "@/stores/app";

const store = useTempoStore();

const {
  accentColor2,
  tempoRed,
  regions,
  timeRanges,
} = storeToRefs(store);

const confirmingReset = ref(false);
const hasSelections = computed(() => regions.value.length > 0 || timeRanges.value.length > 0);

type OpType = "save" | "load";
type Target = "local" | "google-drive";
type EventType = `${OpType}-${Target}`;

const emit = defineEmits<{
  (event: "save-local"): void;
  (event: "load-local"): void;
  (event: "save-google-drive"): void;
  (event: "load-google-drive"): void;
  (event: "error", type: EventType, message: string): void;
  (event: "reset"): void;
}>();

const DEFAULT_FILENAME = "tempo_lab.json";

async function saveLocalFileSystemAPI(store: TempoStore): Promise<boolean> {
  const options = {
    suggestedName: DEFAULT_FILENAME,
    types: [
      {
        description: "JSON",
        accept: { "application/json": [".json"] },
      }
    ],
    multiple: false,
  };

  const content = serializeTempoStore(store, false);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore window *might* have this, and if we're here it should
  return window.showSaveFilePicker(options)
    .then((handle: FileSystemFileHandle) => handle.createWritable())
    .then((stream: FileSystemWritableFileStream) => {
      stream.write(content);
      stream.close();
      return true;
    })
    .catch((error: Error) => {
      if (error instanceof DOMException) { return false; }
      emit("error", "save-local", error.message);
      return false;
    });

}

function saveLocalLink(store: TempoStore) {
  const content = serializeTempoStore(store, false);

  const blob = new Blob([content], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = DEFAULT_FILENAME;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);

  return true;
}

async function saveLocal() {
  let result = false;
  if ('showSaveFilePicker' in window) {
    result = await saveLocalFileSystemAPI(store);
  } else {
    result = saveLocalLink(store);
  }
  if (result) {
    emit("save-local");
  }
}

async function loadLocalFileSystemAPI(): Promise<boolean> {

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore window *might* have this, and if we're here it should
  const handles: FileSystemFileHandle[] = await window.showOpenFilePicker();
  if (handles.length === 0) {
    return false;
  }

  const handle = handles[0];
  const file = await handle.getFile();
  const content = await file.text();

  const result = updateStoreFromJSON(store, content, false);
  if (result) {
    return true;
  } else {
    emit("error", "load-local", "Error loading TEMPO Lab state from local file");
    return false;
  }
}

function loadLocalInput() {
  const input = document.createElement("input");
  input.type = "file";

  input.addEventListener("change", function (event) {
    const element = event.target as HTMLInputElement;
    const files = element.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = function (evt) {
        if (!evt || !evt.target) { return; }
        const content = evt.target.result as string;
        const result = updateStoreFromJSON(store, content, false);
        if (result) {
          emit("load-local");
        } else {
          emit("error", "load-local", "Error loading TEMPO Lab state from local file");
        }
      };
      reader.readAsText(file);
    }
  });

  input.click();
}

async function loadLocal() {
  let result = false;
  if ('showOpenFilePicker' in window) {
    result = await loadLocalFileSystemAPI();
    if (result) {
      emit("load-local");
    }
  } else {
    loadLocalInput();
  }
}

function resetAll() {
  store.reset();
  confirmingReset.value = false;
  emit("reset");
}
</script>

<style scoped>

p {
  margin-bottom: 0.5em;
}

.save-state {
  display: flex;
  flex-direction: column;
}

.icon-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 15px;
  padding-block: 5px;
}

.danger-zone {
  /* v-bind, not var(--tempo-red): the dialog is teleported outside the
     TempoLab root where that variable is set */
  border: 2px solid v-bind(tempoRed);
  border-radius: 8px;
  margin-top: 1em;
  padding: 12px;
}

.danger-zone-actions {
  display: flex;
  gap: 8px;
}
</style>
