<template>
  <div
    class="border-t border-slate-700 p-6 bg-gradient-to-br from-slate-700/30 to-slate-800/30 backdrop-blur-sm"
  >
    <form @submit.prevent="addTask" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Task Title -->
        <div class="md:col-span-2">
          <input
            ref="titleInput"
            v-model="form.title"
            type="text"
            placeholder="What needs to be done?"
            required
            class="w-full bg-slate-800/80 border border-slate-600 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 placeholder-slate-400"
          />
        </div>

        <!-- Task Description -->
        <div class="md:col-span-2">
          <textarea
            v-model="form.description"
            placeholder="Add a description (optional)..."
            rows="2"
            class="w-full bg-slate-800/80 border border-slate-600 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all duration-200 placeholder-slate-400"
          ></textarea>
        </div>

        <!-- Priority -->
        <div class="relative">
          <select
            v-model="form.priority"
            class="w-full bg-slate-800/80 border border-slate-600 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none transition-all duration-200"
          >
            <option value="low" class="bg-slate-800">🔵 Low Priority</option>
            <option value="medium" class="bg-slate-800">
              🟡 Medium Priority
            </option>
            <option value="high" class="bg-slate-800">🔴 High Priority</option>
          </select>
          <svg
            class="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        <!-- Due Date -->
        <div class="relative">
          <input
            v-model="form.dueDate"
            type="date"
            :min="minDate"
            class="w-full bg-slate-800/80 border border-slate-600 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-end space-x-3 pt-2">
        <button
          type="button"
          @click="$emit('cancel')"
          class="px-6 py-2.5 text-slate-400 hover:text-white hover:bg-slate-600/50 rounded-xl transition-all duration-200 font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="!form.title.trim() || loading"
          class="relative bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-emerald-500/25 disabled:shadow-none transform hover:scale-105 disabled:transform-none"
        >
          <svg
            v-if="loading"
            class="w-4 h-4 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <svg
            v-else
            class="w-4 h-4"
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
          <span>{{ loading ? "Adding..." : "Add Task" }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
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

interface Emits {
  (e: "task-added", task: Task): void;
  (e: "cancel"): void;
}

const emit = defineEmits<Emits>();

// Form state
const form = reactive({
  title: "",
  description: "",
  priority: "medium" as "low" | "medium" | "high",
  dueDate: "",
});

const loading = ref(false);
const titleInput = ref<HTMLInputElement>();

// Minimum date (today)
const minDate = computed(() => {
  return new Date().toISOString().split("T")[0];
});

// Add task function
const addTask = async () => {
  if (!form.title.trim()) return;

  try {
    loading.value = true;

    const taskData = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
      completed: false,
    };

    const newTask = await $fetch<Task>("/api/tasks", {
      method: "POST",
      body: taskData,
    });

    // Reset form
    form.title = "";
    form.description = "";
    form.priority = "medium";
    form.dueDate = "";

    // Emit the new task
    emit("task-added", newTask);
  } catch (error) {
    console.error("Failed to create task:", error);
    // You could add a toast notification here
  } finally {
    loading.value = false;
  }
};

// Auto-focus on title input when component mounts
onMounted(() => {
  nextTick(() => {
    titleInput.value?.focus();
  });
});

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  // Ctrl/Cmd + Enter to submit
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    addTask();
  }
  // Escape to cancel
  if (event.key === "Escape") {
    emit("cancel");
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>
