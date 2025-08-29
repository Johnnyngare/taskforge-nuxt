<!-- layouts/dashboard.vue - CORRECTED (ClientOnly removed from navigation) -->
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
        'border-r border-slate-700 bg-slate-900 shadow-lg',
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
          <!-- REMOVED ClientOnly from around these links -->
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
            to="/dashboard/learning"
            class="flex items-center rounded-lg px-4 py-3 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            active-class="bg-emerald-500/10 text-emerald-400 font-semibold"
          >
            <Icon
              name="heroicons:academic-cap"
              class="mr-3 h-5 w-5 shrink-0"
            />
            Learning
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
          <template v-if="isAdmin">
            <hr class="my-4 border-slate-700" />
            <NuxtLink
              to="/dashboard/admin"
              class="flex items-center rounded-lg px-4 py-3 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              active-class="bg-emerald-500/10 text-emerald-400 font-semibold"
            >
              <Icon
                name="heroicons:shield-check"
                class="mr-3 h-5 w-5 shrink-0"
              />
              Admin Panel
            </NuxtLink>
          </template>
          <!-- End of removed ClientOnly -->
        </div>
      </nav>

      <!-- User Profile Card in Sidebar -->
      <div
        v-if="user"
        class="absolute bottom-0 left-0 right-0 border-t border-slate-700 p-4"
      >
        <div class="flex items-center space-x-3">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500"
          >
            <span v-if="user.name" class="text-sm font-medium text-white">{{
              getInitials(user.name)
            }}</span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-white">
              {{ user.name }}
            </p>
            <p class="truncate text-xs text-slate-400">{{ user.email }}</p>
          </div>
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
          <button
            @click="sidebarOpen = !sidebarOpen"
            class="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 lg:hidden"
            title="Toggle sidebar"
          >
            <Icon name="heroicons:bars-3" class="h-6 w-6" />
          </button>
          <div class="flex-1 lg:flex-none">
            <!-- This H1 might be dynamic based on current route if you add that logic -->
            <h1 class="text-2xl font-bold text-white">Dashboard</h1>
          </div>
          <div class="flex items-center space-x-4">
            <ClientOnly>
              <button
                @click="toggleTheme"
                class="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                title="Toggle theme"
              >
                <Icon
                  :name="
                    colorMode === 'dark' ? 'heroicons:sun' : 'heroicons:moon'
                  "
                  class="h-5 w-5"
                />
              </button>
              <template #fallback>
                <div class="h-9 w-9"></div>
              </template>
            </ClientOnly>
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

      <main class="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useColorMode } from "@vueuse/core";
import { useAuth } from "@/composables/useAuth";
// No need for useRoute here if not directly reacting to route in layout script

const sidebarOpen = ref(false);
const colorMode = useColorMode();
const { user, logout, isAdmin } = useAuth(); // isAdmin from useAuth

const toggleTheme = () => {
  colorMode.value = colorMode.value === "dark" ? "light" : "dark";
};

const handleResize = () => {
  if (window.innerWidth >= 1024) {
    sidebarOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

const getInitials = (name: string): string => {
  if (!name) return "";
  const parts = name.split(" ");
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};
</script>

<style>
html,
body,
#__nuxt {
  height: 100vh;
  margin: 0;
  padding: 0;
}
</style>