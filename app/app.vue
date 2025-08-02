<!-- app.vue -->
<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <UNotifications />
  </div>
</template>

<script setup>
// Initial setup
const { fetchUser } = useAuth();
await fetchUser();
</script>

<style>
/* Minimal global styles - @nuxt/ui handles most styling */
html {
  font-family: "Inter", sans-serif;
}
</style>
