<!-- pages/index.vue -->
<template>
  <div class="overflow-hidden">
    <!-- Hero Section with Gradient Background -->
    <section class="relative">
      <!-- Background Elements -->
      <div
        class="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/20 dark:via-gray-900 dark:to-teal-950/20"
      ></div>
      <div
        class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fill-rule=%22evenodd%22%3E%3Cg%20fill=%22%2316a34a%22%20fill-opacity=%220.05%22%3E%3Ccircle%20cx=%2230%22%20cy=%2230%22%20r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"
      ></div>
      <UContainer class="relative">
        <div class="text-center py-20 lg:py-32">
          <!-- Badge -->
          <div
            class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-full text-sm text-emerald-700 dark:text-emerald-300 mb-8 animate-fade-in-up"
          >
            <UIcon name="i-heroicons-sparkles" class="w-4 h-4" />
            <span>New: Advanced Calendar Integration</span>
          </div>

          <!-- Main Heading with Gradient -->
          <h1
            class="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up animation-delay-200"
          >
            <span class="text-gray-900 dark:text-white">Transform Your</span>
            <br />
            <span
              class="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent"
            >
              Productivity
            </span>
          </h1>

          <!-- Subtitle -->
          <p
            class="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400"
          >
            TaskForge revolutionizes how you manage tasks, deadlines, and goals.
            <span class="text-emerald-600 dark:text-emerald-400 font-medium"
              >Boost your efficiency</span
            >
            with our intuitive platform.
          </p>

          <!-- CTA Buttons -->
          <div
            class="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up animation-delay-600"
          >
            <UButton
              to="/register"
              size="xl"
              icon="i-heroicons-rocket-launch"
              class="shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/40 transform hover:scale-105 transition-all duration-300"
            >
              Start Free Today
            </UButton>

            <UButton
              to="/demo"
              variant="outline"
              size="xl"
              icon="i-heroicons-play"
              class="border-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transform hover:scale-105 transition-all duration-300"
            >
              Watch Demo
            </UButton>
          </div>

          <!-- Trust Indicators -->
          <div
            class="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400 animate-fade-in-up animation-delay-800"
          >
            <div class="flex items-center gap-2">
              <UIcon
                name="i-heroicons-check-circle"
                class="w-5 h-5 text-emerald-500"
              />
              <span>Free 14-day trial</span>
            </div>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-heroicons-shield-check"
                class="w-5 h-5 text-emerald-500"
              />
              <span>No credit card required</span>
            </div>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-heroicons-heart"
                class="w-5 h-5 text-emerald-500"
              />
              <span>Loved by 10k+ users</span>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Features Section -->
    <section class="py-20 lg:py-32 bg-white dark:bg-gray-900">
      <UContainer>
        <!-- Section Header -->
        <div class="text-center mb-20">
          <h2
            class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Why Choose <span class="text-emerald-600">TaskForge</span>?
          </h2>
          <p class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Discover the features that make TaskForge the ultimate productivity
            companion for individuals and teams.
          </p>
        </div>

        <!-- Features Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Feature 1: Smart Task Management -->
          <UCard
            class="group hover:shadow-2xl hover:shadow-emerald-500/10 transform hover:-translate-y-2 transition-all duration-500 border-0 shadow-lg"
          >
            <template #header>
              <div class="flex items-start gap-4">
                <div
                  class="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300"
                >
                  <!-- CORRECTED ICON NAME: i-heroicons-bolt-solid -->
                  <UIcon
                    name="i-heroicons-bolt-solid"
                    class="w-6 h-6 text-white"
                  />
                </div>
                <div>
                  <h3
                    class="text-xl font-bold text-gray-900 dark:text-white mb-2"
                  >
                    Smart Task Management
                  </h3>
                  <p class="text-gray-600 dark:text-gray-300">
                    AI-powered task organization with intelligent prioritization
                    and automated scheduling suggestions.
                  </p>
                </div>
              </div>
            </template>

            <div class="space-y-3">
              <div
                class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <UIcon
                  name="i-heroicons-check"
                  class="w-4 h-4 text-emerald-500"
                />
                <span>Drag & drop organization</span>
              </div>
              <div
                class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <UIcon
                  name="i-heroicons-check"
                  class="w-4 h-4 text-emerald-500"
                />
                <span>Smart due date suggestions</span>
              </div>
              <div
                class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <UIcon
                  name="i-heroicons-check"
                  class="w-4 h-4 text-emerald-500"
                />
                <span>Priority-based sorting</span>
              </div>
            </div>
          </UCard>

          <!-- Feature 2: Advanced Calendar -->
          <UCard
            class="group hover:shadow-2xl hover:shadow-blue-500/10 transform hover:-translate-y-2 transition-all duration-500 border-0 shadow-lg"
          >
            <template #header>
              <div class="flex items-start gap-4">
                <div
                  class="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300"
                >
                  <UIcon
                    name="i-heroicons-calendar-days"
                    class="w-6 h-6 text-white"
                  />
                </div>
                <div>
                  <h3
                    class="text-xl font-bold text-gray-900 dark:text-white mb-2"
                  >
                    Advanced Calendar
                  </h3>
                  <p class="text-gray-600 dark:text-gray-300">
                    Integrated calendar with timeline view, deadline tracking,
                    and seamless scheduling.
                  </p>
                </div>
              </div>
            </template>

            <div class="space-y-3">
              <div
                class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-blue-500" />
                <span>Multiple view modes</span>
              </div>
              <div
                class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-blue-500" />
                <span>Deadline notifications</span>
              </div>
              <div
                class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-blue-500" />
                <span>Time blocking</span>
              </div>
            </div>
          </UCard>

          <!-- Feature 3: Cross-Platform Access -->
          <UCard
            class="group hover:shadow-2xl hover:shadow-purple-500/10 transform hover:-translate-y-2 transition-all duration-500 border-0 shadow-lg md:col-span-2 lg:col-span-1"
          >
            <template #header>
              <div class="flex items-start gap-4">
                <div
                  class="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300"
                >
                  <UIcon
                    name="i-heroicons-device-phone-mobile"
                    class="w-6 h-6 text-white"
                  />
                </div>
                <div>
                  <h3
                    class="text-xl font-bold text-gray-900 dark:text-white mb-2"
                  >
                    Cross-Platform Access
                  </h3>
                  <p class="text-gray-600 dark:text-gray-300">
                    Seamlessly sync across all your devices with real-time
                    updates and offline support.
                  </p>
                </div>
              </div>
            </template>

            <div class="space-y-3">
              <div
                class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <UIcon
                  name="i-heroicons-check"
                  class="w-4 h-4 text-purple-500"
                />
                <span>Real-time sync</span>
              </div>
              <div
                class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <UIcon
                  name="i-heroicons-check"
                  class="w-4 h-4 text-purple-500"
                />
                <span>Offline functionality</span>
              </div>
              <div
                class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <UIcon
                  name="i-heroicons-check"
                  class="w-4 h-4 text-purple-500"
                />
                <span>Responsive design</span>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Additional Features Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <!-- Team Collaboration -->
          <UCard
            class="group hover:shadow-2xl hover:shadow-orange-500/10 transform hover:-translate-y-2 transition-all duration-500 border-0 shadow-lg"
          >
            <template #header>
              <div class="flex items-start gap-4">
                <div
                  class="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300"
                >
                  <UIcon name="i-heroicons-users" class="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3
                    class="text-xl font-bold text-gray-900 dark:text-white mb-2"
                  >
                    Team Collaboration
                  </h3>
                  <p class="text-gray-600 dark:text-gray-300">
                    Share projects, assign tasks, and collaborate seamlessly
                    with your team members.
                  </p>
                </div>
              </div>
            </template>
          </UCard>

          <!-- Analytics & Insights -->
          <UCard
            class="group hover:shadow-2xl hover:shadow-teal-500/10 transform hover:-translate-y-2 transition-all duration-500 border-0 shadow-lg"
          >
            <template #header>
              <div class="flex items-start gap-4">
                <div
                  class="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300"
                >
                  <UIcon
                    name="i-heroicons-chart-bar"
                    class="w-6 h-6 text-white"
                  />
                </div>
                <div>
                  <h3
                    class="text-xl font-bold text-gray-900 dark:text-white mb-2"
                  >
                    Analytics & Insights
                  </h3>
                  <p class="text-gray-600 dark:text-gray-300">
                    Track your productivity with detailed analytics and
                    personalized insights.
                  </p>
                </div>
              </div>
            </template>
          </UCard>
        </div>
      </UContainer>
    </section>

    <!-- CTA Section -->
    <section
      class="py-20 bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
    >
      <UContainer>
        <div class="text-center">
          <h2 class="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Transform Your Productivity?
          </h2>
          <p class="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who have already revolutionized their
            workflow with TaskForge.
          </p>

          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <UButton
              to="/register"
              size="xl"
              variant="solid"
              color="white"
              icon="i-heroicons-arrow-right"
              class="bg-white text-emerald-600 hover:bg-gray-50 shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              Get Started Now
            </UButton>

            <UButton
              to="/contact"
              size="xl"
              variant="outline"
              color="white"
              icon="i-heroicons-chat-bubble-left"
              class="border-white text-white hover:bg-white/10 transform hover:scale-105 transition-all duration-300"
            >
              Talk to Sales
            </UButton>
          </div>
        </div>
      </UContainer>
    </section>
  </div>
</template>

<script setup>
// Meta tags for SEO
useSeoMeta({
  title: "TaskForge - Transform Your Productivity",
  ogTitle: "TaskForge - Transform Your Productivity",
  description:
    "Revolutionary task management platform that helps you organize, prioritize, and accomplish your goals with ease.",
  ogDescription:
    "Revolutionary task management platform that helps you organize, prioritize, and accomplish your goals with ease.",
  ogImage: "/og-image.jpg",
  twitterCard: "summary_large_image",
});

// Redirect authenticated users
const { user } = useAuth();

watch(
  user,
  (newUser) => {
    if (newUser) {
      navigateTo("/dashboard");
    }
  },
  { immediate: true }
);
</script>

<style scoped>
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.6s ease-out forwards;
  opacity: 0;
}

.animation-delay-200 {
  animation-delay: 0.2s;
}

.animation-delay-400 {
  animation-delay: 0.4s;
}

.animation-delay-600 {
  animation-delay: 0.6s;
}

.animation-delay-800 {
  animation-delay: 0.8s;
}
</style>
