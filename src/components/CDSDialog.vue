<template>
  <v-dialog 
    :class="`cds-dialog ${displayedShortTitle.toLowerCase().replace(/ /g, '-')}-cds-dialog`" 
    v-model="showDialog" 
    >
    <!-- add the activator slot, but only use it if the appropriate value is given for activator -->
     <template v-slot:activator="$attrs">
      <slot name="activator" v-bind="$attrs"></slot>
    </template>
     
    <v-card
      ref="card"
      class="cds-dialog-card"
    >
      <font-awesome-icon 
        class="cds-dialog-close-icon cds-touch-pad"
        icon="square-xmark" 
        size="xl" 
        @click="showDialog = false" 
        @keyup.enter="showDialog = false" 
        :color="color" 
        tabindex="0"
        ></font-awesome-icon>
        
      <v-card-title tabindex="0">
        <h3> 
          {{title}} 
        </h3>
      </v-card-title>
      
      <v-card-text>
        
        <slot>
          Add content to the default slot
        </slot>
        
      </v-card-text>
    </v-card>
  </v-dialog>

</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick, watch, useTemplateRef } from "vue";
import { VCard } from "vuetify/components";
import { useDraggableDialog } from "../composables/useDraggableDialog";

interface CDSDialogProps {
  title: string;
  modelValue?: boolean;
  color?: string;
  shortTitle?: string;
  draggable?: boolean;
}

const props = withDefaults(defineProps<CDSDialogProps>(), {
  modelValue: false,
  color: "red",
  shortTitle: "",
  draggable: false,
});

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
}>();

const card = useTemplateRef<InstanceType<typeof VCard>>("card");
const showDialog = ref(props.modelValue);
const displayedShortTitle = computed(() => props.shortTitle || props.title);
const cardRoot = ref<HTMLElement | null>(null);

if (props.draggable) {
  useDraggableDialog(cardRoot, ".cds-dialog-card");
}

function updateRoot() {
  nextTick(() => {
    if (card.value) {
      cardRoot.value = card.value.$el;
    }
  });
}

onMounted(() => {
  if (props.draggable && props.modelValue) {
    updateRoot();
  }
});

watch(showDialog, value => {
  emit("update:modelValue", value);
});

watch(() => props.modelValue, value => {
  showDialog.value = value;
  if (value && props.draggable) {
    updateRoot();
  }
});

</script>

<style>

.cds-dialog {
  display: flex;
  width: calc(100% - 1rem);
}
.cds-dialog-card {
  align-self: center;
  max-width: 80%;
}

.cds-dialog-close-icon {
  position: absolute;
  right: 16px;
  cursor: pointer;
}

/* pad the touch area by 0.5em */
.cds-dialog-touch-pad {
  padding: 0.5em;
  margin: -0.5em;
}


.v-dialog.cds-dialog > .v-overlay__content > .v-card {
  padding: 1rem;
}

.v-dialog.cds-dialog > .v-overlay__content {
  align-self: center;
  margin: unset;
}

.cds-dialog .v-card-text {
  height: 40vh;
}
</style>
