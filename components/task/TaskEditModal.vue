<template>
  <!-- Modal Backdrop -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    @click.self="$emit('cancel')"
  >
    <div class="w-full max-w-2xl animate-in zoom-in duration-300" @click.stop>
      <form
        @submit.prevent="handleSubmit"
        class="max-h-[90vh] w-full overflow-y-auto rounded-xl bg-white shadow-xl"
      >
        <!-- Modal Header -->
        <div
          class="flex items-center justify-between border-b border-gray-200 p-6"
        >
          <h2 class="text-xl font-semibold text-gray-900">Edit Task</h2>
          <button
            type="button"
            @click="$emit('cancel')"
            class="p-1 text-gray-400 transition-colors hover:text-gray-600"
          >
            <Icon name="heroicons:x-mark" class="h-6 w-6" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="space-y-6 p-6">
          <div>
            <label
              for="edit-title"
              class="mb-2 block text-sm font-medium text-gray-700"
            >
              Task Title *
            </label>
            <FormAppInput
              id="edit-title"
              v-model="form.title"
              placeholder="What needs to be done?"
              required
              class="w-full"
              :disabled="submitting"
            />
          </div>
          <div>
            <label
              for="edit-description"
              class="mb-2 block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="edit-description"
              v-model="form.description"
              placeholder="Add more details about this task..."
              rows="4"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              :disabled="submitting"
            />
          </div>
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label
                for="edit-status"
                class="mb-2 block text-sm font-medium text-gray-700"
              >
                Status
              </label>
              <select
                id="edit-status"
                v-model="form.status"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                :disabled="submitting"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label
                for="edit-priority"
                class="mb-2 block text-sm font-medium text-gray-700"
              >
                Priority
              </label>
              <select
                id="edit-priority"
                v-model="form.priority"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                :disabled="submitting"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label
              for="edit-due-date"
              class="mb-2 block text-sm font-medium text-gray-700"
            >
              Due Date
            </label>
            <input
              id="edit-due-date"
              v-model="form.dueDate"
              type="date"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              :disabled="submitting"
            />
          </div>
        </div>

        <!-- Modal Footer -->
        <div
          class="flex flex-col-reverse gap-3 border-t border-gray-200 p-6 sm:flex-row sm:justify-end"
        >
          <FormAppButton
            type="button"
            @click="$emit('cancel')"
            variant="secondary"
            :disabled="submitting"
          >
            Cancel
          </FormAppButton>
          <FormAppButton
            type="submit"
            :disabled="submitting || !form.title.trim()"
          >
            <UiSpinner v-if="submitting" size="sm" class="mr-2" />
            {{ submitting ? "Saving..." : "Save Changes" }}
          </FormAppButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";

const props = defineProps({
  task: { type: Object, required: true },
});
const emit = defineEmits(["save", "cancel"]);

const submitting = ref(false);
const form = ref({});

watch(
  () => props.task,
  (newTask) => {
    form.value = {
      ...newTask,
      dueDate: newTask.dueDate
        ? new Date(newTask.dueDate).toISOString().split("T")[0]
        : "",
    };
  },
  { immediate: true }
);

const handleSubmit = async () => {
  if (!form.value.title.trim() || submitting.value) return;
  submitting.value = true;
  try {
    const payload = { ...form.value };
    if (!payload.dueDate) delete payload.dueDate;
    emit("save", payload);
  } catch (error) {
    console.error("Error preparing task updates:", error);
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  const handleEscape = (e) => e.key === "Escape" && emit("cancel");
  document.addEventListener("keydown", handleEscape);
  onUnmounted(() => document.removeEventListener("keydown", handleEscape));
});
</script>
