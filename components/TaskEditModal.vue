<!-- components/TaskEditModal.vue -->
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

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import { TaskPriority, TaskStatus, type ITask } from "~/types/task";

const titleId = useId();
const descriptionId = useId();
const statusId = useId();
const priorityId = useId();
const dueDateId = useId();

const props = defineProps<{
  task: ITask;
}>();

const emit = defineEmits<{
  (e: "save", taskId: string, updates: Partial<ITask>): void;
  (e: "cancel"): void;
}>();

const submitting = ref(false);

interface EditForm {
  id: string; // FIX: Changed from _id to id
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  projectId?: string | null;
}

const form = ref<EditForm>({
  id: "", // FIX: Changed from _id to id
  title: "",
  description: null,
  status: TaskStatus.Pending,
  priority: TaskPriority.Medium,
  dueDate: null,
  projectId: null,
});

watch(
  () => props.task,
  (newTask) => {
    if (newTask) {
      form.value = {
        id: newTask.id, // FIX: Changed from _id to id
        title: newTask.title || "",
        description: newTask.description || null,
        status: newTask.status || TaskStatus.Pending,
        priority: newTask.priority || TaskPriority.Medium,
        dueDate: newTask.dueDate
          ? new Date(newTask.dueDate).toISOString().split("T")[0]
          : null,
        projectId: newTask.projectId || null,
      };
    }
  },
  { immediate: true, deep: true }
);

const handleSubmit = async () => {
  if (!form.value.title?.trim() || submitting.value || !form.value.id) return;

  submitting.value = true;
  try {
    const payload: Partial<ITask> = {
      title: form.value.title,
      description: form.value.description?.trim() || undefined,
      status: form.value.status,
      priority: form.value.priority,
      dueDate: form.value.dueDate
        ? new Date(`${form.value.dueDate}T00:00:00`).toISOString()
        : undefined,
      projectId: form.value.projectId || undefined,
    };

    Object.keys(payload).forEach((key) => {
      // @ts-ignore
      if (payload[key] === undefined) {
        // @ts-ignore
        delete payload[key];
      }
    });

    // FIX: Emit 'id' instead of '_id'
    emit("save", form.value.id, payload);
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
