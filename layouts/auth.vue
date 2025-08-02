<!-- layouts/auth.vue -->
<template>
  <div class="auth-layout min-h-screen flex flex-col">
    <!-- Background container with gradient and pattern -->
    <div
      class="fixed inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800"
    >
      <!-- Subtle pattern overlay -->
      <div
        class="absolute inset-0 opacity-30 dark:opacity-20"
        :style="{ backgroundImage: patternUrl }"
      ></div>

      <!-- Animated gradient orbs for visual interest -->
      <div class="absolute inset-0 overflow-hidden">
        <div
          class="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-blob"
        ></div>
        <div
          class="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-blob animation-delay-2000"
        ></div>
        <div
          class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-blob animation-delay-4000"
        ></div>
      </div>
    </div>

    <!-- Header with branding (optional, can be hidden) -->
    <header
      v-if="showHeader"
      class="relative z-10 w-full px-4 py-6 sm:px-6 lg:px-8"
      :class="headerClass"
    >
      <div class="flex items-center justify-between max-w-7xl mx-auto">
        <!-- Logo/Brand -->
        <NuxtLink
          to="/"
          class="flex items-center gap-3 group"
          aria-label="Home"
        >
          <div
            class="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg"
          >
            <UIcon name="i-heroicons-bolt-solid" class="w-5 h-5 text-white" />
          </div>
          <span class="text-xl font-bold text-gray-900 dark:text-white">
            TaskForge
          </span>
        </NuxtLink>

        <!-- Theme toggle -->
        <div class="flex items-center gap-4">
          <UButton
            :icon="isDark ? 'i-heroicons-sun' : 'i-heroicons-moon'"
            variant="ghost"
            color="gray"
            size="sm"
            :aria-label="
              isDark ? 'Switch to light mode' : 'Switch to dark mode'
            "
            @click="toggleColorMode"
            class="hover:bg-white/10 dark:hover:bg-gray-800/50"
          />

          <!-- Language selector (if i18n is enabled) -->
          <UButton
            v-if="showLanguageSelector"
            icon="i-heroicons-language"
            variant="ghost"
            color="gray"
            size="sm"
            aria-label="Change language"
            @click="showLanguageMenu = !showLanguageMenu"
            class="hover:bg-white/10 dark:hover:bg-gray-800/50"
          />
        </div>
      </div>
    </header>

    <!-- Main content area -->
    <main
      class="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8"
      :class="mainClass"
    >
      <div class="w-full max-w-md">
        <!-- Loading overlay -->
        <Transition
          name="fade"
          enter-active-class="transition-opacity duration-300"
          leave-active-class="transition-opacity duration-300"
          enter-from-class="opacity-0"
          leave-to-class="opacity-0"
        >
          <div
            v-if="isLoading"
            class="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-50"
          >
            <div class="flex flex-col items-center gap-4">
              <div
                class="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"
              ></div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ loadingMessage }}
              </p>
            </div>
          </div>
        </Transition>

        <!-- Page content slot -->
        <slot />
      </div>
    </main>

    <!-- Footer with minimal links -->
    <footer
      v-if="showFooter"
      class="relative z-10 w-full px-4 py-6 sm:px-6 lg:px-8"
      :class="footerClass"
    >
      <div class="max-w-7xl mx-auto">
        <div
          class="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400"
        >
          <div class="flex items-center gap-4">
            <NuxtLink
              to="/privacy"
              class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
            >
              Privacy
            </NuxtLink>
            <NuxtLink
              to="/terms"
              class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
            >
              Terms
            </NuxtLink>
            <NuxtLink
              to="/support"
              class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
            >
              Support
            </NuxtLink>
          </div>

          <div class="flex items-center gap-1">
            <UIcon
              name="i-heroicons-shield-check"
              class="w-4 h-4 text-emerald-500"
            />
            <span>Secured by TaskForge</span>
          </div>
        </div>
      </div>
    </footer>

    <!-- Language selector menu (if enabled) -->
    <Transition
      name="slide-fade"
      enter-active-class="transition-all duration-200"
      leave-active-class="transition-all duration-200"
      enter-from-class="opacity-0 transform scale-95"
      leave-to-class="opacity-0 transform scale-95"
    >
      <div
        v-if="showLanguageMenu && showLanguageSelector"
        class="fixed top-20 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-50"
        @click.outside="showLanguageMenu = false"
      >
        <UButton
          v-for="locale in availableLocales"
          :key="locale.code"
          :label="locale.name"
          variant="ghost"
          size="sm"
          block
          @click="switchLanguage(locale.code)"
          class="justify-start"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
// <-- ADD lang="ts" HERE
// Props for layout customization
interface AuthLayoutProps {
  showHeader?: boolean;
  showFooter?: boolean;
  showLanguageSelector?: boolean;
  isLoading?: boolean;
  loadingMessage?: string;
  headerClass?: string;
  mainClass?: string;
  footerClass?: string;
}

const props = withDefaults(defineProps<AuthLayoutProps>(), {
  showHeader: true,
  showFooter: true,
  showLanguageSelector: false,
  isLoading: false,
  loadingMessage: "Loading...",
  headerClass: "",
  mainClass: "",
  footerClass: "",
});

// Composables
const colorMode = useColorMode();
const { $i18n } = useNuxtApp(); // Note: $i18n will be undefined if @nuxtjs/i18n is not installed/configured.

// Reactive state
const showLanguageMenu = ref(false);

// Computed properties
const isDark = computed(() => colorMode.value === "dark");

const patternUrl = computed(
  () =>
    `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${
      isDark.value ? "6b7280" : "16a34a"
    }' fill-opacity='${
      isDark.value ? "0.03" : "0.05"
    }'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
);

const availableLocales = computed(() => {
  // Check if $i18n is defined before trying to access its properties
  if (!$i18n || !$i18n.locales) return [];
  return $i18n.locales.filter((locale) => locale.code !== $i18n.locale.value); // Use .value for reactive locale
});

// Methods
const toggleColorMode = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};

const switchLanguage = async (localeCode: string) => {
  if ($i18n && $i18n.setLocale) {
    // Check if $i18n and setLocale are defined
    await $i18n.setLocale(localeCode);
  }
  showLanguageMenu.value = false;
};

// SEO and meta tags for auth pages
useSeoMeta({
  robots: "noindex, nofollow", // Don't index auth pages
  viewport: "width=device-width, initial-scale=1",
});

useHead({
  htmlAttrs: {
    class: "h-full",
  },
  bodyAttrs: {
    class: "h-full overflow-x-hidden",
  },
});

// Handle escape key to close modals
onMounted(() => {
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      showLanguageMenu.value = false;
    }
  };

  document.addEventListener("keydown", handleEscape);

  onUnmounted(() => {
    document.removeEventListener("keydown", handleEscape);
  });
});

// Provide layout state to child components
provide("authLayout", {
  isLoading: toRef(props, "isLoading"),
  // Removed `setLoading` for now, as it needs more complex setup for global state
  // to be effective and is causing undefined errors if not fully configured.
  // We'll manage loading states within the pages themselves for now.
});
</script>

<style scoped>
/* Custom animations */
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

/* Smooth transitions for theme changes */
.auth-layout {
  transition: background-color 0.3s ease;
}

/* Custom scrollbar for auth pages */
.auth-layout ::-webkit-scrollbar {
  width: 6px;
}

.auth-layout ::-webkit-scrollbar-track {
  background: transparent;
}

.auth-layout ::-webkit-scrollbar-thumb {
  background: rgba(16, 185, 129, 0.3);
  border-radius: 3px;
}

.auth-layout ::-webkit-scrollbar-thumb:hover {
  background: rgba(16, 185, 129, 0.5);
}

/* Focus trap for better accessibility */
.auth-layout:focus-within {
  /* Styles for when layout contains focused elements */
}

/* Loading overlay blur effect */
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}

/* Transition classes */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Print styles */
@media print {
  .auth-layout {
    background: white !important;
  }

  .auth-layout::before,
  .auth-layout::after {
    display: none !important;
  }
}

/* Reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .animate-blob {
    animation: none;
  }

  .transition-all,
  .transition-opacity,
  .transition-colors {
    transition: none !important;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .auth-layout {
    background: white;
    color: black;
  }

  .dark .auth-layout {
    background: black;
    color: white;
  }
}
</style>
