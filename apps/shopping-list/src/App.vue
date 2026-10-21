<script setup lang="ts">
import { ref } from 'vue';
import type { ButtonVariant } from '@hostkit-ui/components/button.js';

// Phase 0: the Shopping Notes list renders only hk-button.
const items = ref(0);
const variant = ref<ButtonVariant>('primary');
const archiveLocked = ref(true);
</script>

<template>
  <main>
    <h1>Shopping Notes</h1>
    <hk-button id="add-item" :variant="variant" @click="items++">Add item</hk-button>
    <hk-button id="archive" :disabled="archiveLocked" @click="items = -1">Archive</hk-button>
    <p>Items added: <output id="items">{{ items }}</output></p>
    <button
      type="button"
      id="toggle-variant"
      @click="variant = variant === 'primary' ? 'secondary' : 'primary'"
    >
      Toggle variant
    </button>
    <button type="button" id="toggle-archive-lock" @click="archiveLocked = !archiveLocked">
      Toggle archive lock
    </button>
  </main>
</template>
