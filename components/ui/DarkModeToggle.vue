<!-- components/ui/DarkModeToggle.vue -->
<template>
  <button
    @click="toggleMode"
    class="p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
  >
    <span v-if="colorMode.preference === 'dark'">☀️ Light</span>
    <span v-else>🌙 Dark</span>
  </button>
</template>

<script setup>
const colorMode = useColorMode(); // Nuxt provides this composable via @nuxtjs/tailwindcss

const toggleMode = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};
</script>
