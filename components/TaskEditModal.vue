<!-- components/task/TaskEditModal.vue -->
<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    @click.self="$emit('cancel')"
  >
    <div class="w-full max-w-2xl animate-in zoom-in duration-300" @click.stop>
      <form
        @submit.prevent="handleSubmit"
        class="max-h-[90vh] w-full overflow-y-auto rounded-xl border border-slate-700 bg-slate-800 shadow-xl"
      >
        <div
          class="flex items-center justify-between border-b border-slate-700 p-6"
        >
          <h2 class="text-xl font-semibold text-slate-200">Edit Task</h2>
          <button
            type="button"
            @click="$emit('cancel')"
            class="p-1 text-slate-400 transition-colors hover:text-slate-200"
          >
            <Icon name="heroicons:x-mark" class="h-6 w-6" />
          </button>
        </div>

        <div class="space-y-6 p-6">
          <div>
            <!-- FIX: Use bound ID for hydration safety -->
            <label
              :for="titleId"
              class="mb-2 block text-sm font-medium text-slate-300"
              >Task Title *</label
            >
            <FormAppInput
              :id="titleId"
              v-model="form.title"
              placeholder="What needs to be done?"
              required
              class="w-full"
              :disabled="submitting"
            />
          </div>
          <div>
            <!-- FIX: Use bound ID for hydration safety -->
            <label
              :for="descriptionId"
              class="mb-2 block text-sm font-medium text-slate-300"
              >Description</label
            >
            <textarea
              :id="descriptionId"
              v-model="form.description"
              rows="4"
              class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-slate-200 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              :disabled="submitting"
            />
          </div>
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <!-- FIX: Use bound ID for hydration safety -->
              <label
                :for="statusId"
                class="mb-2 block text-sm font-medium text-slate-300"
                >Status</label
              >
              <select
                :id="statusId"
                v-model="form.status"
                class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-slate-200 transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                :disabled="submitting"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <!-- FIX: Use bound ID for hydration safety -->
              <label
                :for="priorityId"
                class="mb-2 block text-sm font-medium text-slate-300"
                >Priority</label
              >
              <select
                :id="priorityId"
                v-model="form.priority"
                class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-slate-200 transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                :disabled="submitting"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <!-- FIX: Use bound ID for hydration safety -->
            <label
              :for="dueDateId"
              class="mb-2 block text-sm font-medium text-slate-300"
              >Due Date</label
            >
            <input
              :id="dueDateId"
              v-model="form.dueDate"
              type="date"
              class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-slate-200 transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              :disabled="submitting"
            />
          </div>
        </div>

        <div
          class="flex flex-col-reverse gap-3 border-t border-slate-700 p-6 sm:flex-row sm:justify-end"
        >
          <FormAppButton
            type="button"
            @click="$emit('cancel')"
            variant="secondary"
            :disabled="submitting"
            >Cancel</FormAppButton
          >
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

<!-- FIX: Switched to TypeScript with lang="ts" -->
<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
// FIX: Import ITask for strong typing
import type { ITask } from "~/types/task";

// NEW: useId generates SSR-safe, unique IDs to prevent hydration mismatch
const titleId = useId();
const descriptionId = useId();
const statusId = useId();
const priorityId = useId();
const dueDateId = useId();

// FIX: Use strongly typed props
const props = defineProps<{
  task: ITask;
}>();

// FIX: Use strongly typed emits
const emit = defineEmits<{
  (e: "save", taskId: string, updates: Partial<ITask>): void;
  (e: "cancel"): void;
}>();

const submitting = ref(false);
// FIX: Strongly type the form ref for type safety and autocompletion
const form = ref<Partial<ITask> & { dueDate?: string }>({});

// This watch effect is now fully type-safe
watch(
  () => props.task,
  (newTask) => {
    if (newTask) {
      form.value = {
        _id: newTask._id,
        title: newTask.title || "",
        description: newTask.description || "",
        status: newTask.status || "pending",
        priority: newTask.priority || "Medium",
        // Format date for <input type="date">, which needs YYYY-MM-DD
        dueDate: newTask.dueDate
          ? new Date(newTask.dueDate).toISOString().split("T")[0]
          : "",
        projectId: newTask.projectId || undefined,
      };
    }
  },
  { immediate: true, deep: true }
);

const handleSubmit = async () => {
  if (!form.value.title?.trim() || submitting.value || !form.value._id) return;

  submitting.value = true;
  try {
    // Create a clean payload to send to the API
    const payload: Partial<ITask> = {
      title: form.value.title,
      description: form.value.description,
      status: form.value.status,
      priority: form.value.priority,
      dueDate: form.value.dueDate,
    };

    emit("save", form.value._id, payload);
  } catch (error) {
    console.error("Error preparing task updates:", error);
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  const handleEscape = (e: KeyboardEvent) =>
    e.key === "Escape" && emit("cancel");
  document.addEventListener("keydown", handleEscape);
  onUnmounted(() => document.removeEventListener("keydown", handleEscape));
});
</script>

<style scoped>
@keyframes zoom-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.animate-in {
  animation: zoom-in 0.3s ease-out;
}
</style>
