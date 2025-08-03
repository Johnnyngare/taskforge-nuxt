<template>
  <div class="space-y-4">
    <TransitionGroup name="task" tag="div" class="space-y-3" appear>
      <TaskCard
        v-for="(task, index) in sortedTasks"
        :key="task._id"
        :task="task"
        :style="{ animationDelay: `${index * 50}ms` }"
        class="task-item"
        @update:task="handleTaskUpdate"
        @delete:task="handleTaskDelete"
      />
    </TransitionGroup>
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
  tasks: Task[];
}

interface Emits {
  (e: "task-updated", task: Task): void;
  (e: "task-deleted", taskId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Sort tasks: incomplete first, then by priority, then by due date
const sortedTasks = computed(() => {
  const priorityOrder = { high: 3, medium: 2, low: 1 };

  return [...props.tasks].sort((a, b) => {
    // Completed tasks go to bottom
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    // Sort by priority (high to low)
    const aPriority = priorityOrder[a.priority || "medium"];
    const bPriority = priorityOrder[b.priority || "medium"];
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }

    // Sort by due date (earliest first)
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;

    // Finally sort by creation date (newest first)
    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    return 0;
  });
});

const handleTaskUpdate = (updatedTask: Task) => {
  emit("task-updated", updatedTask);
};

const handleTaskDelete = (taskId: string) => {
  emit("task-deleted", taskId);
};
</script>

<style scoped>
/* Task entrance animations */
.task-item {
  animation: slideInUp 0.4s ease-out both;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Vue transition animations */
.task-enter-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.task-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 1, 1);
}

.task-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.task-leave-to {
  opacity: 0;
  transform: translateX(-100%) scale(0.95);
}

.task-move {
  transition: transform 0.3s ease;
}
</style>
