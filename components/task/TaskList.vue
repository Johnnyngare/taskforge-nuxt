<template>
  <div class="space-y-3">
    <TaskCard
      v-for="task in tasks"
      :key="task._id"
      :task="task"
      @edit="handleEdit"
      @delete="handleDelete"
      @status-changed="handleStatusChanged"
    />

    <div v-if="!tasks.length" class="py-8 text-center">
      <Icon
        name="heroicons:clipboard-document-list"
        class="mx-auto mb-4 h-12 w-12 text-gray-400"
      />
      <h3 class="mb-2 text-lg font-medium text-gray-900">No tasks found</h3>
      <p class="text-gray-500">
        Try adjusting your filters or create a new task.
      </p>
    </div>

    <div v-if="showLoadMore" class="pt-4 text-center">
      <FormAppButton
        @click="$emit('load-more')"
        variant="secondary"
        :disabled="loadingMore"
      >
        <UiSpinner v-if="loadingMore" size="sm" class="mr-2" />
        {{ loadingMore ? "Loading..." : "Load More Tasks" }}
      </FormAppButton>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  tasks: { type: Array, required: true },
  showLoadMore: { type: Boolean, default: false },
  loadingMore: { type: Boolean, default: false },
});

const emit = defineEmits(["task-updated", "task-deleted", "edit-task"]);

const handleEdit = (taskId) => emit("edit-task", taskId);
const handleDelete = (taskId) => emit("task-deleted", taskId);
const handleStatusChanged = (taskId, updates) =>
  emit("task-updated", taskId, updates);
</script>
