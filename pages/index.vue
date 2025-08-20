// pages/index.vue
<template>
  <!-- Main container, ensuring full screen height and dark theme base -->
  <div
    class="relative min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-200 p-4 sm:p-6 lg:p-8"
  >
    <!-- Background elements (subtle pattern for texture) -->
    <div
      class="absolute inset-0 opacity-10"
      style="
        background-image: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2364748b\' fill-opacity=\'0.08\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'1\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');
      "
    ></div>

    <main
      class="relative z-10 flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-6"
    >
      <!-- Logo and Brand Name -->
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-3 mb-4 group"
        aria-label="TaskForge Home"
      >
        <div
          class="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300"
        >
          <Icon name="heroicons:bolt-solid" class="w-8 h-8 text-white" />
        </div>
        <span class="text-4xl font-extrabold text-white">TaskForge</span>
      </NuxtLink>

      <!-- Hero Headline -->
      <h1
        class="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight"
      >
        Master Your Day, Forge Your Future.
      </h1>

      <!-- Subheadline/Description -->
      <p class="text-lg text-slate-300 leading-relaxed">
        The ultimate productivity platform designed to help you organize,
        prioritize, and conquer your tasks with ease.
      </p>

      <!-- Call to Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 mt-8">
        <FormAppButton to="/register" size="lg" class="px-8 py-3">
          Get Started - It's Free
          <Icon name="heroicons:arrow-right" class="ml-2 w-5 h-5" />
        </FormAppButton>
        <FormAppButton
          to="/login"
          variant="outline"
          size="lg"
          class="px-8 py-3"
        >
          Sign In
        </FormAppButton>
      </div>
    </main>

    <!-- Footer for copyright/legal links (optional) -->
    <footer class="relative z-10 mt-auto pt-16 pb-4 text-xs text-slate-500">
      &copy; {{ new Date().getFullYear() }} TaskForge. All rights reserved.
    </footer>
  </div>
</template>

<script setup>
// This is the root page, no specific layout needed (defaults to default.vue)
// No middleware needed.

useSeoMeta({
  title: "TaskForge - Master Your Day, Forge Your Future",
  description:
    "The ultimate productivity platform designed to help you organize, prioritize, and conquer your tasks with ease.",
});
</script>

<style scoped>
/* Optional custom styles for subtle animations or specific positioning */
</style>
