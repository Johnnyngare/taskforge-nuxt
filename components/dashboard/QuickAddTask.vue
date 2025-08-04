<template>
  <div
    class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    @keydown.esc="$emit('close')"
  >
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900">Quick Add Task</h3>
      <button
        @click="$emit('close')"
        class="p-1 text-gray-400 transition-colors hover:text-gray-600"
        title="Close"
      >
        <Icon name="heroicons:x-mark" class="h-5 w-5" />
      </button>
    </div>

    <form @submit.prevent="submitTask" class="space-y-4">
      <div>
        <label
          for="quick-title"
          class="mb-1 block text-sm font-medium text-gray-700"
        >
          Task Title
        </label>
        <FormAppInput
          id="quick-title"
          v-model="form.title"
          placeholder="What needs to be done?"
          required
          class="w-full"
          :disabled="submitting"
        />
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            for="quick-priority"
            class="mb-1 block text-sm font-medium text-gray-700"
          >
            Priority
          </label>
          <select
            id="quick-priority"
            v-model="form.priority"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            :disabled="submitting"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label
            for="quick-due-date"
            class="mb-1 block text-sm font-medium text-gray-700"
          >
            Due Date
          </label>
          <input
            id="quick-due-date"
            v-model="form.dueDate"
            type="date"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            :disabled="submitting"
            :min="today"
          />
        </div>
      </div>

      <div class="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
        <FormAppButton
          type="button"
          @click="$emit('close')"
          class="w-full sm:w-auto"
          variant="secondary"
          :disabled="submitting"
        >
          Cancel
        </FormAppButton>
        <FormAppButton
          type="submit"
          class="w-full sm:w-auto"
          :disabled="submitting || !form.title.trim()"
        >
          <UiSpinner v-if="submitting" size="sm" class="mr-2" />
          {{ submitting ? "Creating..." : "Create Task" }}
        </FormAppButton>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

const emit = defineEmits(["task-created", "close"]);
const { createTask } = useTasks();

const submitting = ref(false);
const form = ref({
  title: "",
  priority: "medium",
  dueDate: "",
});

const today = computed(() => new Date().toISOString().split("T")[0]);

const submitTask = async () => {
  if (!form.value.title.trim() || submitting.value) return;
  submitting.value = true;
  try {
    await createTask({
      ...form.value,
      status: "pending",
    });
    emit("task-created");
    emit("close");
  } catch (error) {
    console.error("Error creating task:", error);
    // Optionally show a toast notification for the error
  } finally {
    submitting.value = false;
  }
};
</script>
