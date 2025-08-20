// types/vue-shims.d.ts

// This file is used for augmenting or declaring global types.
// After removing @nuxtjs/leaflet, we no longer need to declare
// its global components (LMap, LMarker) or the $leaflet injection.

// You can keep this file for any future global type declarations you might need.
// For now, it can be left minimal or even empty.

// It's good practice to ensure Vue's core types are recognized,
// though Nuxt 3 often handles this automatically.
import '@vue/runtime-core';

// By exporting an empty object, we treat this file as a module,
// which is a requirement for ambient module declarations.
export {};