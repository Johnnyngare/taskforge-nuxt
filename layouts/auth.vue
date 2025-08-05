// layouts/auth.vue
<template>
  <!-- This is a minimal layout for authentication pages (login, register) -->
  <!-- It should not contain the sidebar or main dashboard header -->
  <div
    class="auth-layout min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-200"
  >
    <!-- Background pattern (Simplified for minimal version) -->
    <div
      class="fixed inset-0 opacity-10"
      style="
        background-image: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2364748b\' fill-opacity=\'0.08\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'1\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');
      "
    ></div>

    <!-- Main content area -->
    <main
      class="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8"
    >
      <div class="w-full max-w-md">
        <slot />
      </div>
    </main>

    <!-- Optional: Minimal footer or branding -->
    <footer class="relative z-10 w-full p-4 text-center text-xs text-slate-400">
      &copy; {{ new Date().getFullYear() }} TaskForge. All rights reserved.
    </footer>
  </div>
</template>

<script setup>
// No complex script needed for a basic layout
// If you want more complex background/animations, consider adding them to a specific page's template
// or using <ClientOnly> around animated parts in the layout.
</script>

<style scoped>
/* Scoped styles specific to this layout */
.auth-layout {
  /* Ensure it doesn't clash with dashboard layout */
}
</style>
