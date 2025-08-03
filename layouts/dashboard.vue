<!-- file: layouts/dashboard.vue -->
<template>
  <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Mobile sidebar backdrop (appears when sidebar is open on small screens) -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
      @click="sidebarOpen = false"
    ></div>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full', // Controls mobile sidebar visibility
      ]"
    >
      <!-- Logo and App Name -->
      <div class="flex items-center justify-center h-16 px-4 bg-emerald-600">
        <div class="flex items-center space-x-2">
          <div
            class="w-8 h-8 bg-white rounded-lg flex items-center justify-center"
          >
            <span class="text-emerald-600 font-bold text-lg">⚡</span>
          </div>
          <span class="text-white font-bold text-xl">TaskForge</span>
        </div>
      </div>

      <!-- Main Navigation Links -->
      <nav class="mt-8 px-4">
        <div class="space-y-2">
          <NuxtLink
            to="/dashboard"
            class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            active-class="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 font-semibold"
          >
            <svg
              class="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
              ></path>
            </svg>
            Dashboard
          </NuxtLink>

          <NuxtLink
            to="/dashboard/tasks"
            class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            active-class="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 font-semibold"
          >
            <svg
              class="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              ></path>
            </svg>
            All Tasks
          </NuxtLink>

          <NuxtLink
            to="/dashboard/projects"
            class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            active-class="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 font-semibold"
          >
            <svg
              class="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              ></path>
            </svg>
            Projects
          </NuxtLink>

          <NuxtLink
            to="/dashboard/calendar"
            class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            active-class="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 font-semibold"
          >
            <svg
              class="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v16a2 2 0 002 2z"
              ></path>
            </svg>
            Calendar
          </NuxtLink>

          <NuxtLink
            to="/dashboard/settings"
            class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            active-class="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 font-semibold"
          >
            <svg
              class="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10.325 4.317c.522-1.42 2.536-1.42 3.058 0L16.2 8.3c.27.73.473 1.5.602 2.278L19.5 13.5c1.42.52 1.42 2.536 0 3.058L16.8 19.7c-.73.27-1.5.473-2.278.602L13.5 22.5c-.52.0-2.536-.0-3.058 0L7.8 19.7c-.27-.73-.473-1.5-.602-2.278L4.5 13.5c-1.42-.52-1.42-2.536 0-3.058L7.2 8.3c.73-.27 1.5-.473 2.278-.602L10.325 4.317zM12 14.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
              ></path>
            </svg>
            Settings
          </NuxtLink>
        </div>
      </nav>

      <!-- User Profile Card in Sidebar -->
      <div
        class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-center space-x-3">
          <div
            class="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <!-- Replace with actual user avatar -->
            <span class="text-white font-medium text-sm">JD</span>
          </div>
          <div class="flex-1 min-w-0">
            <p
              class="text-sm font-medium text-gray-900 dark:text-white truncate"
            >
              John Doe
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
              john@example.com
            </p>
          </div>
          <!-- Logout button or dropdown trigger -->
          <UButton
            icon="i-heroicons-arrow-right-on-rectangle"
            color="gray"
            variant="ghost"
            size="sm"
            class="flex-shrink-0"
            title="Logout"
          />
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Top Header Bar -->
      <header
        class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 flex-shrink-0"
      >
        <div class="flex items-center justify-between px-4 py-4 lg:px-6">
          <!-- Mobile menu button (hamburger) -->
          <button
            @click="sidebarOpen = !sidebarOpen"
            class="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </button>

          <!-- Page Title (can be dynamic based on current route if needed) -->
          <div class="flex-1 lg:flex-none">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
          </div>

          <!-- Header Actions (Theme Toggle, Notifications, etc.) -->
          <div class="flex items-center space-x-4">
            <!-- Theme Toggle Button -->
            <ClientOnly>
              <button
                @click="toggleTheme"
                class="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                title="Toggle theme"
              >
                <!-- UIcon is automatically available if @nuxt/ui is configured -->
                <UIcon
                  :name="
                    $colorMode.value === 'dark'
                      ? 'i-heroicons-sun'
                      : 'i-heroicons-moon'
                  "
                  class="w-5 h-5"
                />
              </button>
              <template #fallback>
                <!-- Placeholder to prevent layout shift during SSR -->
                <div class="w-9 h-9"></div>
              </template>
            </ClientOnly>

            <!-- Notifications Button -->
            <button
              class="relative p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              title="Notifications"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 17h5l-5-5 5-5h-5m-6 10v-2a6 6 0 10-12 0v2a2 2 0 002 2h8a2 2 0 002-2z"
                ></path>
              </svg>
              <span
                class="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"
              ></span>
            </button>
            <!-- Add other header actions here, e.g., user dropdown -->
          </div>
        </div>
      </header>

      <!-- Page Content Slot -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
// All functions like ref, onMounted, useColorMode are auto-imported by Nuxt 3.
// Rely on the auto-imports to prevent Vite errors.

// Sidebar state for mobile/tablet visibility
const sidebarOpen = ref(false);

// Theme management using @nuxtjs/color-mode
const colorMode = useColorMode();

const toggleTheme = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};

// --- Optional: Logic to close sidebar on larger screens ---
// This prevents the sidebar from being 'stuck open' if resized from mobile
const handleResize = () => {
  if (window.innerWidth >= 1024) {
    // Equivalent to Tailwind's 'lg' breakpoint
    sidebarOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style>
/* Ensure the layout takes the full height of the viewport */
html,
body,
#__nuxt {
  height: 100vh;
  margin: 0;
  padding: 0;
}
</style>
