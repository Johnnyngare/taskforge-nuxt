<!-- layouts/default.vue -->
<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"
  >
    <!-- Enhanced Header with Glass Effect -->
    <header
      class="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50 transition-all duration-300"
    >
      <UContainer>
        <div class="flex justify-between items-center py-4">
          <!-- Logo Section with Gradient -->
          <NuxtLink
            to="/"
            class="group flex items-center gap-2 transition-transform duration-300 hover:scale-105"
          >
            <div
              class="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg"
            >
              <!-- CORRECTED ICON NAME HERE: i-heroicons-bolt-solid -->
              <UIcon name="i-heroicons-bolt-solid" class="w-5 h-5 text-white" />
            </div>
            <span
              class="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
            >
              TaskForge
            </span>
          </NuxtLink>

          <!-- Navigation Actions -->
          <div class="flex items-center gap-3">
            <!-- Theme Toggle with Enhanced Design -->
            <!-- Using ClientOnly to prevent hydration mismatch for color mode toggle -->
            <ClientOnly>
              <UButton
                :icon="
                  $colorMode.value === 'dark'
                    ? 'i-heroicons-moon-20-solid' // Show moon icon when dark mode is active
                    : 'i-heroicons-sun-20-solid' // Show sun icon when light mode is active
                "
                variant="ghost"
                size="sm"
                class="transition-all duration-300 hover:scale-110"
                @click="toggleColorMode"
                aria-label="Toggle theme"
              >
                <span class="hidden sm:inline ml-1">
                  {{ $colorMode.value === "dark" ? "Dark" : "Light" }}
                </span>
              </UButton>
            </ClientOnly>

            <!-- Navigation Buttons (visible on larger screens) -->
            <div class="hidden md:flex items-center gap-2">
              <UButton to="/login" variant="ghost" size="sm"> Login </UButton>
              <UButton
                to="/register"
                variant="solid"
                size="sm"
                class="shadow-md"
              >
                Sign Up
              </UButton>
            </div>

            <!-- Mobile Menu Button -->
            <UButton
              icon="i-heroicons-bars-3"
              variant="ghost"
              size="sm"
              class="md:hidden"
              @click="mobileMenuOpen = !mobileMenuOpen"
            />
          </div>
        </div>

        <!-- Mobile Navigation Menu -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <div
            v-if="mobileMenuOpen"
            class="md:hidden border-t border-gray-200 dark:border-gray-700 py-4"
          >
            <div class="flex flex-col gap-2">
              <UButton
                to="/login"
                variant="ghost"
                block
                @click="mobileMenuOpen = false"
              >
                Login
              </UButton>
              <UButton
                to="/register"
                variant="solid"
                block
                @click="mobileMenuOpen = false"
              >
                Sign Up
              </UButton>
              <!-- Add other mobile navigation links here if needed -->
              <UButton
                to="/features"
                variant="ghost"
                block
                @click="mobileMenuOpen = false"
              >
                Features
              </UButton>
              <UButton
                to="/pricing"
                variant="ghost"
                block
                @click="mobileMenuOpen = false"
              >
                Pricing
              </UButton>
              <UButton
                to="/support"
                variant="ghost"
                block
                @click="mobileMenuOpen = false"
              >
                Support
              </UButton>
              <UButton
                to="/contact"
                variant="ghost"
                block
                @click="mobileMenuOpen = false"
              >
                Contact
              </UButton>
            </div>
          </div>
        </Transition>
      </UContainer>
    </header>

    <!-- Main Content with Smooth Transitions -->
    <main class="transition-all duration-300">
      <slot />
    </main>

    <!-- Enhanced Footer -->
    <footer
      class="relative mt-20 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-900 dark:to-gray-800 border-t border-gray-200 dark:border-gray-700"
    >
      <UContainer>
        <div class="py-12">
          <!-- Footer Content -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <!-- Brand Section -->
            <div class="space-y-4">
              <div class="flex items-center gap-2">
                <div
                  class="w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-md flex items-center justify-center"
                >
                  <!-- CORRECTED ICON NAME HERE: i-heroicons-bolt-solid -->
                  <UIcon
                    name="i-heroicons-bolt-solid"
                    class="w-4 h-4 text-white"
                  />
                </div>
                <span class="text-lg font-bold text-gray-900 dark:text-white"
                  >TaskForge</span
                >
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 max-w-sm">
                Streamline your productivity with our intuitive task management
                platform.
              </p>
            </div>

            <!-- Quick Links -->
            <div class="space-y-4">
              <h3 class="font-semibold text-gray-900 dark:text-white">
                Quick Links
              </h3>
              <div class="space-y-2">
                <NuxtLink
                  to="/features"
                  class="block text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  Features
                </NuxtLink>
                <NuxtLink
                  to="/pricing"
                  class="block text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  Pricing
                </NuxtLink>
                <NuxtLink
                  to="/support"
                  class="block text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  Support
                </NuxtLink>
              </div>
            </div>

            <!-- Social Links -->
            <div class="space-y-4">
              <h3 class="font-semibold text-gray-900 dark:text-white">
                Connect
              </h3>
              <div class="flex gap-3">
                <UButton
                  icon="i-heroicons-envelope"
                  variant="ghost"
                  size="sm"
                />
                <UButton
                  icon="i-heroicons-chat-bubble-left-ellipsis"
                  variant="ghost"
                  size="sm"
                />
                <UButton icon="i-heroicons-heart" variant="ghost" size="sm" />
              </div>
            </div>
          </div>

          <!-- Copyright -->
          <div
            class="pt-8 border-t border-gray-200 dark:border-gray-700 text-center"
          >
            <p class="text-sm text-gray-600 dark:text-gray-400">
              © {{ new Date().getFullYear() }} TaskForge. Crafted with ❤️ for
              productivity enthusiasts.
            </p>
          </div>
        </div>
      </UContainer>
    </footer>
  </div>
</template>

<script setup>
const mobileMenuOpen = ref(false);

const toggleColorMode = () => {
  const colorMode = useColorMode();
  // Toggle between 'dark' and 'light' preferences
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};

// Close mobile menu when route changes
const route = useRoute();
watch(
  () => route.path,
  () => {
    mobileMenuOpen.value = false;
  }
);
</script>
