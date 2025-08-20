<!-- components/TaskList.vue -->
<template>
  <div class="space-y-3">
    <div
      v-if="!tasks || tasks.length === 0"
      class="py-8 text-center text-slate-400"
    >
      <Icon
        name="heroicons:clipboard-document-list"
        class="mx-auto mb-4 h-12 w-12 opacity-50"
      />
      <p class="mb-2 text-lg">No tasks found</p>
      <p class="text-sm">Try adjusting your filters or create a new task!</p>
    </div>
    <template v-else>
      <TaskCard
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        @status-changed="handleStatusChanged"
        @edit="handleEdit"
        @delete="handleDelete"
        @task-selected="handleTaskSelected"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ITask } from "~/types/task";

const props = defineProps<{
  tasks: ITask[];
}>();

// NEW: Add 'task-selected' to the list of events this component can emit.
const emit = defineEmits<{
  (e: "task-updated", taskId: string, updates: Partial<ITask>): void;
  (e: "task-deleted", taskId: string): void;
  (e: "edit-task", taskId: string): void;
  (e: "task-selected", task: ITask): void; // This is the new event
}>();

const handleStatusChanged = (taskId: string, updates: Partial<ITask>) => {
  emit("task-updated", taskId, updates);
};

const handleEdit = (taskId: string) => {
  emit("edit-task", taskId);
};

const handleDelete = (taskId: string) => {
  // CORRECTED: The original emit was "delete", but the parent expects "task-deleted".
  emit("task-deleted", taskId);
};

// NEW: This function catches the event from TaskCard and emits it up to the parent page.
const handleTaskSelected = (task: ITask) => {
  emit("task-selected", task);
};
</script>