import { createApp } from 'vue';
import '@hostkit-ui/tokens/tokens.css';
// Define hk-button before Vue mounts. Vue binds `:disabled` as a property
// only if the element already has it (`'disabled' in el`); on an
// un-upgraded element it sets the attribute, and `false` becomes
// disabled="false", which is still disabled.
import '@hostkit-ui/components/button.js';
import App from './App.vue';

createApp(App).mount('#app');
