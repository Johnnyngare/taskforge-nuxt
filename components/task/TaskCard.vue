<template>
  <div
    class="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 group hover:-translate-y-0.5"
  >
    <div class="flex items-start justify-between">
      <!-- Task content -->
      <div class="flex items-start space-x-3 flex-1">
        <!-- Checkbox -->
        <div class="relative">
          <input
            type="checkbox"
            :checked="task.completed"
            @change="toggleComplete"
            class="mt-1 w-4 h-4 text-emerald-600 bg-slate-700 border-slate-600 rounded focus:ring-emerald-500 focus:ring-2 focus:ring-offset-0 transition-all duration-200 hover:border-emerald-500"
          />
        </div>

        <!-- Task details -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-2 mb-1">
            <h3
              class="text-white font-medium truncate transition-all duration-200"
              :class="{ 'line-through text-slate-400': task.completed }"
            >
              {{ task.title }}
            </h3>
            <TaskPriorityBadge :priority="safeTaskPriority" />
          </div>

          <p
            v-if="task.description"
            class="text-slate-400 text-sm mb-2 transition-all duration-200"
            :class="{ 'line-through text-slate-500': task.completed }"
          >
            {{ task.description }}
          </p>

          <!-- Task metadata -->
          <div class="flex items-center space-x-4 text-xs text-slate-500">
            <span v-if="task.dueDate" class="flex items-center space-x-1">
              <svg
                class="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span
                :class="{
                  'text-red-400': isOverdue,
                  'text-amber-400': isDueToday,
                  'text-slate-400': !isOverdue && !isDueToday,
                }"
              >
                {{ formatDate(task.dueDate) }}
              </span>
            </span>

            <span v-if="task.project" class="flex items-center space-x-1">
              <svg
                class="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <span>{{ projectName }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div
        class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2"
      >
        <button
          @click="editTask"
          type="button"
          class="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-50/10 rounded-md transition-colors duration-200"
          title="Edit task"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>

        <button
          @click="deleteTask"
          type="button"
          class="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-50/10 rounded-md transition-colors duration-200"
          title="Delete task"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
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

interface Props {
  task: Task;
}

interface Emits {
  (e: "update:task", task: Task): void;
  (e: "delete:task", taskId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Computed properties for safe access and formatting
const safeTaskPriority = computed(() => {
  return props.task.priority || "medium";
});

const projectName = computed(() => {
  if (!props.task.project) return "";
  return typeof props.task.project === "string"
    ? props.task.project
    : props.task.project.name;
});

const isOverdue = computed(() => {
  if (!props.task.dueDate || props.task.completed) return false;
  const dueDate = new Date(props.task.dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return dueDate < now;
});

const isDueToday = computed(() => {
  if (!props.task.dueDate || props.task.completed) return false;
  const dueDate = new Date(props.task.dueDate);
  const today = new Date();
  return dueDate.toDateString() === today.toDateString();
});

// Methods
const toggleComplete = async () => {
  try {
    const updatedTask = { ...props.task, completed: !props.task.completed };

    // Call API to update task
    await $fetch(`/api/tasks/${props.task._id}`, {
      method: "PATCH",
      body: { completed: updatedTask.completed },
    });

    // Emit the updated task
    emit("update:task", updatedTask);
  } catch (error) {
    console.error("Failed to update task:", error);
  }
};

const editTask = () => {
  // TODO: Implement edit functionality (modal, inline edit, or navigate to edit page)
  console.log("Edit task:", props.task._id);
};

const deleteTask = async () => {
  if (!confirm("Are you sure you want to delete this task?")) return;

  try {
    await $fetch(`/api/tasks/${props.task._id}`, {
      method: "DELETE",
    });

    emit("delete:task", props.task._id);
  } catch (error) {
    console.error("Failed to delete task:", error);
  }
};

const formatDate = (date: string | Date) => {
  const d = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.toDateString() === today.toDateString()) {
    return "Today";
  } else if (d.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  } else {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  }
};
</script>
