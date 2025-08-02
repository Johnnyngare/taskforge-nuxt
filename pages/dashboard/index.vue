<template>
  <!-- Main layout for the dashboard -->
  <TaskProvider
    v-slot="{
      tasks,
      loading: tasksLoading,
      pendingTasksCount,
      onTaskAdded,
      onTaskUpdated,
      onTaskDeleted,
      refreshTasks,
      error: tasksError,
    }"
  >
    <!-- Use ProjectProvider to fetch and provide project data -->
    <ProjectProvider
      v-slot="{ projects, loading: projectsLoading, error: projectsError }"
    >
      <div
        class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800"
      >
        <!-- Welcome Banner - Full Width with enhanced styling -->
        <div class="mb-8">
          <!-- Pass the 'tasks' data from the provider down as a prop. -->
          <DashboardWelcomeBanner :tasks="tasks" />
        </div>

        <!-- Main Dashboard Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8">
          <!-- Left Column: Main Task Area (Takes up most space on desktop) -->
          <div class="lg:col-span-8 space-y-6">
            <!-- Quick Actions Bar -->
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 backdrop-blur-sm"
            >
              <div class="flex items-center space-x-4">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                  My Tasks
                </h2>
                <span
                  class="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium"
                >
                  {{ pendingTasksCount }} active
                </span>
              </div>

              <!-- Task Controls -->
              <div class="flex items-center space-x-3">
                <FormAppButton
                  @click="showQuickAdd = true"
                  class="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 transition-all duration-200"
                  size="sm"
                >
                  <svg
                    class="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Add Task
                </FormAppButton>
                <button
                  @click="showFilters = !showFilters"
                  :class="[
                    'p-2 rounded-xl border transition-all duration-200',
                    showFilters
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600',
                  ]"
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
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Quick Add Task (Expandable) -->
            <Transition
              enter-active-class="transition-all duration-300 ease-out"
              enter-from-class="opacity-0 transform -translate-y-4"
              enter-to-class="opacity-100 transform translate-y-0"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="opacity-100 transform translate-y-0"
              leave-to-class="opacity-0 transform -translate-y-4"
            >
              <!-- Pass the fetched projects data to DashboardQuickAddTask -->
              <DashboardQuickAddTask
                v-if="showQuickAdd"
                @close="showQuickAdd = false"
                @task-added="onTaskAdded"
                :projects="projects"
                :projectsLoading="projectsLoading"
                class="mb-6"
              />
            </Transition>

            <!-- Filter Bar -->
            <Transition
              enter-active-class="transition-all duration-300 ease-out"
              enter-from-class="opacity-0 transform -translate-y-2"
              enter-to-class="opacity-100 transform translate-y-0"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="opacity-100 transform translate-y-0"
              leave-to-class="opacity-0 transform -translate-y-2"
            >
              <DashboardTaskFilters
                v-if="showFilters"
                v-model:filters="activeFilters"
                class="mb-6"
              />
            </Transition>

            <!-- Main Task List -->
            <div
              class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-sm"
            >
              <div class="p-6">
                <!-- Pass down the data and handlers from the provider. -->
                <TaskList
                  :tasks="tasks"
                  :filters="activeFilters"
                  :loading="tasksLoading"
                  :error="tasksError"
                  @task-updated="onTaskUpdated"
                  @task-deleted="onTaskDeleted"
                  :refreshList="refreshTasks"
                  class="min-h-[400px]"
                />
              </div>
            </div>
          </div>

          <!-- Right Column: Sidebar Widgets -->
          <div class="lg:col-span-4 space-y-6">
            <!-- These components correctly receive the 'tasks' prop. -->
            <div
              class="transform transition-all duration-300 hover:scale-[1.02]"
            >
              <DashboardUpcomingDeadlines
                :tasks="tasks"
                class="enhanced-card"
              />
            </div>
            <div
              class="transform transition-all duration-300 hover:scale-[1.02]"
            >
              <DashboardProductivityStats
                :tasks="tasks"
                class="enhanced-card"
              />
            </div>
            <div
              class="transform transition-all duration-300 hover:scale-[1.02]"
            >
              <!-- Also pass projects data to ProjectOverview if it needs it -->
              <DashboardProjectOverview
                :tasks="tasks"
                :projects="projects"
                :projectsLoading="projectsLoading"
                class="enhanced-card"
              />
            </div>
            <div
              class="transform transition-all duration-300 hover:scale-[1.02]"
            >
              <DashboardActivityFeed class="enhanced-card" />
            </div>
          </div>
        </div>
      </div>
    </ProjectProvider>
  </TaskProvider>
</template>

<script setup>
// Define layout
definePageMeta({
  layout: "dashboard",
});

// Composables for non-task related data
const { user } = useAuth();

// Reactive state for UI visibility ONLY
const showQuickAdd = ref(false);
const showFilters = ref(false);
const activeFilters = ref({
  status: "all",
  priority: "all",
  project: "all", // This will now correspond to projectId
  dueDate: "all",
});

// Lifecycle for animations
onMounted(() => {
  nextTick(() => {
    const cards = document.querySelectorAll(".enhanced-card");
    cards.forEach((card, index) => {
      card.style.animationDelay = `${index * 100}ms`;
      card.classList.add("animate-fade-in-up");
    });
  });
});

// SEO
useSeoMeta({
  title: "Dashboard - TaskForge",
  description:
    "Manage your tasks and boost productivity with TaskForge dashboard",
});
</script>

<style scoped>
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.6s ease-out forwards;
}

.enhanced-card {
  @apply bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 backdrop-blur-sm;
  @apply hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50;
  @apply transition-all duration-300 ease-out;
}
</style>
