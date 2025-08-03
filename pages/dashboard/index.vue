<template>
  <div class="p-6 space-y-8 max-w-7xl mx-auto">
    <!-- Welcome Banner -->
    <div class="animate-fadeIn">
      <WelcomeBanner :tasks="tasks" />
    </div>

    <!-- Main Dashboard Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-4 gap-8">
      <!-- Left Column - Tasks (3/4 width) -->
      <div class="xl:col-span-3 space-y-6">
        <!-- My Tasks Section -->
        <div
          class="bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-xl shadow-slate-900/20 overflow-hidden transition-all duration-300 hover:border-slate-600/50"
        >
          <!-- Header -->
          <div
            class="p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-700/30"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <div class="p-2 bg-emerald-600/20 rounded-xl">
                  <svg
                    class="w-6 h-6 text-emerald-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div>
                  <h2 class="text-xl font-bold text-white">My Tasks</h2>
                  <div class="flex items-center space-x-3 mt-1">
                    <span
                      class="bg-emerald-600/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium border border-emerald-500/20"
                    >
                      {{ activeTasks.length }} active
                    </span>
                    <span
                      v-if="completedTasks.length > 0"
                      class="bg-slate-600/30 text-slate-400 px-3 py-1 rounded-full text-sm"
                    >
                      {{ completedTasks.length }} completed
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex items-center space-x-3">
                <button
                  @click="showQuickAdd = !showQuickAdd"
                  class="group relative bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-emerald-500/25 transform hover:scale-105"
                >
                  <svg
                    class="w-5 h-5 group-hover:rotate-90 transition-transform duration-200"
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
                  <span>Add Task</span>
                </button>

                <button
                  class="p-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200 group"
                >
                  <svg
                    class="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Quick Add Task Form -->
          <Transition
            name="slide-down"
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="transform -translate-y-2 opacity-0"
            enter-to-class="transform translate-y-0 opacity-100"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="transform translate-y-0 opacity-100"
            leave-to-class="transform -translate-y-2 opacity-0"
          >
            <QuickAddTask
              v-if="showQuickAdd"
              @task-added="handleTaskAdded"
              @cancel="showQuickAdd = false"
            />
          </Transition>

          <!-- Tasks List -->
          <div class="p-6">
            <div v-if="loading" class="space-y-4">
              <!-- Skeleton loaders -->
              <div
                v-for="i in 3"
                :key="i"
                class="animate-pulse bg-slate-700/50 rounded-xl p-4 border border-slate-600/30"
              >
                <div class="flex items-start space-x-3">
                  <div class="w-4 h-4 bg-slate-600 rounded mt-1"></div>
                  <div class="flex-1 space-y-2">
                    <div class="h-4 bg-slate-600 rounded w-3/4"></div>
                    <div class="h-3 bg-slate-700 rounded w-1/2"></div>
                  </div>
                  <div class="w-16 h-6 bg-slate-600 rounded-full"></div>
                </div>
              </div>
            </div>

            <div v-else-if="tasks.length === 0" class="text-center py-16">
              <div
                class="w-20 h-20 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-6"
              >
                <svg
                  class="w-10 h-10 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-white mb-3">
                No tasks yet
              </h3>
              <p class="text-slate-400 mb-6 max-w-md mx-auto">
                Create your first task to get started with productivity! Tasks
                help you stay organized and focused.
              </p>
              <button
                @click="showQuickAdd = true"
                class="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-emerald-500/25 transform hover:scale-105"
              >
                Create Your First Task
              </button>
            </div>

            <TaskList
              v-else
              :tasks="tasks"
              @task-updated="handleTaskUpdated"
              @task-deleted="handleTaskDeleted"
            />
          </div>
        </div>
      </div>

      <!-- Right Column - Widgets (1/4 width) -->
      <div class="xl:col-span-1 space-y-6">
        <!-- Upcoming Deadlines -->
        <div class="animate-slideInRight" style="animation-delay: 100ms">
          <UpcomingDeadlines :tasks="tasks" />
        </div>

        <!-- Productivity Stats -->
        <div class="animate-slideInRight" style="animation-delay: 200ms">
          <ProductivityStats :tasks="tasks" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "auth",
  layout: "dashboard",
});

interface Task {
  _id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority?: "low" | "medium" | "high";
  dueDate?: string | Date;
  project?: string | { name: string; _id: string };
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Reactive state
const tasks = ref<Task[]>([]);
const loading = ref(true);
const showQuickAdd = ref(false);

// Computed properties
const activeTasks = computed(() =>
  tasks.value.filter((task) => !task.completed)
);
const completedTasks = computed(() =>
  tasks.value.filter((task) => task.completed)
);

// Fetch tasks on component mount
const fetchTasks = async () => {
  try {
    loading.value = true;
    const response = await $fetch<Task[]>("/api/tasks");
    tasks.value = response || [];
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    tasks.value = [];
  } finally {
    loading.value = false;
  }
};

// Event handlers
const handleTaskAdded = (newTask: Task) => {
  tasks.value.unshift(newTask);
  showQuickAdd.value = false;

  // Add visual feedback
  nextTick(() => {
    const newTaskElement = document.querySelector(".task-item:first-child");
    if (newTaskElement) {
      newTaskElement.classList.add("pulse-emerald");
      setTimeout(() => {
        newTaskElement.classList.remove("pulse-emerald");
      }, 2000);
    }
  });
};

const handleTaskUpdated = (updatedTask: Task) => {
  const index = tasks.value.findIndex((task) => task._id === updatedTask._id);
  if (index !== -1) {
    tasks.value[index] = updatedTask;
  }
};

const handleTaskDeleted = (taskId: string) => {
  tasks.value = tasks.value.filter((task) => task._id !== taskId);
};

// Initialize data
onMounted(() => {
  fetchTasks();
});

// Auto-refresh tasks every 30 seconds
onMounted(() => {
  const interval = setInterval(fetchTasks, 30000);
  onUnmounted(() => clearInterval(interval));
});
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse-emerald {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.6s ease-out;
}

.animate-slideInRight {
  animation: slideInRight 0.6s ease-out both;
}

.pulse-emerald {
  animation: pulse-emerald 2s infinite;
}
</style>
