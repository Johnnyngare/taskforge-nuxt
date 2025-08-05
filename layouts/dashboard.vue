<template>
  <div class="flex h-screen bg-slate-900 text-slate-200">
    <!-- Mobile sidebar backdrop -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
      @click="sidebarOpen = false"
    ></div>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
        'border-r border-slate-700 bg-slate-900 shadow-lg', // Dark theme colors
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <!-- Logo and App Name -->
      <div class="flex h-16 items-center justify-center px-4">
        <div class="flex items-center space-x-2">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500"
          >
            <Icon name="heroicons:bolt-solid" class="h-5 w-5 text-white" />
          </div>
          <span class="text-xl font-bold text-white">TaskForge</span>
        </div>
      </div>

      <!-- Main Navigation Links -->
      <nav class="mt-8 px-4">
        <div class="space-y-2">
          <NuxtLink
            to="/dashboard"
            class="flex items-center rounded-lg px-4 py-3 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            active-class="bg-emerald-500/10 text-emerald-400 font-semibold"
          >
            <Icon name="heroicons:home" class="mr-3 h-5 w-5 shrink-0" />
            Dashboard
          </NuxtLink>

          <NuxtLink
            to="/dashboard/tasks"
            class="flex items-center rounded-lg px-4 py-3 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            active-class="bg-emerald-500/10 text-emerald-400 font-semibold"
          >
            <Icon name="heroicons:list-bullet" class="mr-3 h-5 w-5 shrink-0" />
            All Tasks
          </NuxtLink>

          <NuxtLink
            to="/dashboard/projects"
            class="flex items-center rounded-lg px-4 py-3 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            active-class="bg-emerald-500/10 text-emerald-400 font-semibold"
          >
            <Icon
              name="heroicons:rectangle-stack"
              class="mr-3 h-5 w-5 shrink-0"
            />
            Projects
          </NuxtLink>

          <NuxtLink
            to="/dashboard/calendar"
            class="flex items-center rounded-lg px-4 py-3 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            active-class="bg-emerald-500/10 text-emerald-400 font-semibold"
          >
            <Icon
              name="heroicons:calendar-days"
              class="mr-3 h-5 w-5 shrink-0"
            />
            Calendar
          </NuxtLink>

          <NuxtLink
            to="/dashboard/settings"
            class="flex items-center rounded-lg px-4 py-3 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            active-class="bg-emerald-500/10 text-emerald-400 font-semibold"
          >
            <Icon name="heroicons:cog-6-tooth" class="mr-3 h-5 w-5 shrink-0" />
            Settings
          </NuxtLink>
        </div>
      </nav>

      <!-- User Profile Card in Sidebar -->
      <div
        class="absolute bottom-0 left-0 right-0 border-t border-slate-700 p-4"
      >
        <div class="flex items-center space-x-3">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500"
          >
            <!-- Check if user.value exists before accessing properties -->
            <span v-if="user?.name" class="text-sm font-medium text-white">{{
              getInitials(user.name)
            }}</span>
            <span v-else class="text-sm font-medium text-white">JD</span>
          </div>
          <div class="min-w-0 flex-1">
            <p
              v-if="user?.name"
              class="truncate text-sm font-medium text-white"
            >
              {{ user.name }}
            </p>
            <p v-else class="truncate text-sm font-medium text-white">
              John Doe
            </p>

            <p v-if="user?.email" class="truncate text-xs text-slate-400">
              {{ user.email }}
            </p>
            <p v-else class="truncate text-xs text-slate-400">
              john@example.com
            </p>
          </div>
          <!-- Logout button -->
          <FormAppButton
            variant="ghost"
            size="sm"
            class="shrink-0 text-slate-400 hover:bg-slate-700 hover:text-white"
            title="Logout"
            @click="logout"
          >
            <Icon name="heroicons:arrow-right-on-rectangle" class="h-5 w-5" />
          </FormAppButton>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex min-w-0 flex-1 flex-col">
      <!-- Top Header Bar -->
      <header
        class="flex-shrink-0 border-b border-slate-700 bg-slate-900 shadow-sm"
      >
        <div class="flex items-center justify-between px-4 py-4 lg:px-6">
          <!-- Mobile menu button (hamburger) -->
          <button
            @click="sidebarOpen = !sidebarOpen"
            class="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 lg:hidden"
            title="Toggle sidebar"
          >
            <Icon name="heroicons:bars-3" class="h-6 w-6" />
          </button>

          <!-- Page Title (can be dynamic based on current route if needed) -->
          <div class="flex-1 lg:flex-none">
            <h1 class="text-2xl font-bold text-white">Dashboard</h1>
          </div>

          <!-- Header Actions (Theme Toggle, Notifications, etc.) -->
          <div class="flex items-center space-x-4">
            <!-- Theme Toggle Button -->
            <ClientOnly>
              <button
                @click="toggleTheme"
                class="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                title="Toggle theme"
              >
                <!-- Corrected icon logic for theme toggle based on current colorMode.value -->
                <Icon
                  :name="
                    colorMode.value === 'dark'
                      ? 'heroicons:sun' // If current mode is dark, show sun icon to switch to light
                      : 'heroicons:moon' // If current mode is light, show moon icon to switch to dark
                  "
                  class="h-5 w-5"
                />
              </button>
              <template #fallback>
                <!-- Placeholder to prevent layout shift during SSR -->
                <div class="h-9 w-9"></div>
              </template>
            </ClientOnly>

            <!-- Notifications Button -->
            <button
              class="relative rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              title="Notifications"
            >
              <Icon name="heroicons:bell" class="h-5 w-5" />
              <span
                class="absolute right-0 top-0 block h-2 w-2 rounded-full bg-rose-400 ring-2 ring-slate-900"
              ></span>
            </button>
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
import { ref, onMounted, onUnmounted } from "vue"; // Ensure all lifecycle hooks are imported
import { useColorMode } from "@vueuse/core";
import { useAuth } from "~/composables/useAuth"; // Import your useAuth composable

const sidebarOpen = ref(false);
const colorMode = useColorMode();
const { user, logout } = useAuth(); // Destructure user and logout from useAuth composable

const toggleTheme = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};

const handleResize = () => {
  if (window.innerWidth >= 1024) {
    // Tailwind's 'lg' breakpoint
    sidebarOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

// FIX: Corrected typo from onUnUnmounted to onUnmounted
onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

// Helper for initials in sidebar (if user is available)
const getInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .substring(0, 2);
};
</script>

<style>
/* Basic layout styles, ensure these are still relevant */
html,
body,
#__nuxt {
  height: 100vh;
  margin: 0;
  padding: 0;
}
</style>
