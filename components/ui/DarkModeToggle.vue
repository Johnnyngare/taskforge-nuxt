<template>
  <ClientOnly>
    <button
      @click="toggleTheme"
      class="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
      :title="`Switch to ${isDark ? 'light' : 'dark'} mode`"
    >
      <svg
        v-if="isDark"
        class="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
      <svg
        v-else
        class="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    </button>
    <template #fallback>
      <!-- Fallback while hydrating -->
      <div class="w-9 h-9 bg-slate-700 rounded-lg"></div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
const isDark = ref(true); // Default to dark mode

const toggleTheme = () => {
  isDark.value = !isDark.value;
  // Add your theme switching logic here
  // For example, update a global theme store or toggle CSS classes
};

// Initialize theme from localStorage or system preference
onMounted(() => {
  const saved = localStorage.getItem("theme");
  if (saved) {
    isDark.value = saved === "dark";
  } else {
    // Check system preference
    isDark.value = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
});

// Watch for theme changes and persist to localStorage
watch(isDark, (newValue) => {
  if (process.client) {
    localStorage.setItem("theme", newValue ? "dark" : "light");
    // Apply theme to document
    document.documentElement.classList.toggle("dark", newValue);
  }
});
</script>
