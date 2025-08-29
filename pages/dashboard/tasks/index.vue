<!-- pages/dashboard/tasks.vue - FINAL CORRECTED -->
<template>
  <div class="p-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">All Tasks</h1>
        <p class="text-slate-400">Manage and organize all your tasks</p>
      </div>
      <!-- Changed to navigate to dashboard with query to open the Quick Add modal -->
      <FormAppButton @click="navigateToDashboardAndOpenQuickAdd">
        <Icon name="heroicons:plus" class="mr-2 h-4 w-4" />
        Add Task
      </FormAppButton>
    </div>

    <!-- Filter Options -->
    <div
      class="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-4 shadow-md"
    >
      <div class="flex flex-wrap items-center gap-4">
        <label for="status-filter" class="text-sm font-medium text-slate-300">
          Filter by Status:
        </label>
        <select
          id="status-filter"
          v-model="filterStatus"
          class="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-200"
        >
          <option :value="null">All</option>
          <option v-for="status in TaskStatus" :key="status" :value="status">
            {{ status }}
          </option>
        </select>

        <label for="type-filter" class="text-sm font-medium text-slate-300">
          Filter by Type:
        </label>
        <select
          id="type-filter"
          v-model="filterType"
          class="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-200"
        >
          <option :value="null">All</option>
          <option v-for="type in TaskType" :key="type" :value="type">
            {{ type }} Task
          </option>
        </select>
      </div>
    </div>

    <div class="rounded-xl border border-slate-700 bg-slate-800">
      <div v-if="pending" class="flex justify-center p-12">
        <UiSpinner class="h-8 w-8 text-emerald-500" />
      </div>

      <div v-else-if="error" class="p-12 text-center">
        <p class="mb-4 text-rose-400">Failed to load tasks</p>
        <FormAppButton @click="refresh()" variant="secondary">
          Try Again
        </FormAppButton>
      </div>

      <div v-else class="p-4">
        <template v-if="filteredTasks.length === 0">
          <div class="text-center text-slate-400 py-8">
            No tasks found matching your criteria.
          </div>
        </template>
        <TaskList
          v-else
          :tasks="filteredTasks"
          @task-updated="handleTaskUpdate"
          @task-deleted="handleTaskDelete"
          @edit-task="handleEditTask"
          @task-selected="handleTaskSelected"
        />
      </div>
    </div>

    <!-- Task Edit Modal - This remains here as it's for editing tasks directly from this list -->
    <TaskEditModal
      v-model="showTaskEditModal"
      :task="editingTask"
      @save="handleSaveEdit"
      @cancel="closeTaskModal"
    />
    <!-- REMOVED: The DashboardQuickAddTask modal should NOT be here -->
  </div>
</template>

<script setup lang="ts">
import { ref, type Ref, computed } from "vue";
import { useTasks } from "~/composables/useTasks";
import { TaskStatus, TaskType, type ITask } from "~/types/task";
import { useAppToast } from '~/composables/useAppToast';
// REMOVED: DashboardQuickAddTask import, as it's no longer used here
import TaskEditModal from '~/components/TaskEditModal.vue';
import TaskList from "~/components/TaskList.vue";
import { useRouter } from '#app';

definePageMeta({
  layout: "dashboard",
});

useSeoMeta({
  title: "All Tasks - TaskForge",
});

const toast = useAppToast();
const router = useRouter();

const { tasks, pending, error, refresh, updateTask, deleteTask } = useTasks();

// REMOVED: showCreateModal ref as it's no longer used here
const editingTask: Ref<ITask | null> = ref(null);
const showTaskEditModal = ref(false);

const filterStatus = ref<TaskStatus | null>(null);
const filterType = ref<TaskType | null>(null);

const filteredTasks = computed(() => {
  if (!Array.isArray(tasks.value)) return [];

  return tasks.value.filter((task: ITask) => {
    const matchesStatus = filterStatus.value ? task.status === filterStatus.value : true;
    const matchesType = filterType.value ? task.taskType === filterType.value : true;
    return matchesStatus && matchesType;
  });
});

// NEW: Function to navigate to dashboard and open Quick Add modal
const navigateToDashboardAndOpenQuickAdd = () => {
  router.push({ path: '/dashboard', query: { quickadd: 'true' } });
};

// REMOVED: openCreateModal and closeCreateModal functions

const handleTaskCreated = () => {
  // This function would only be called if the modal was here, which it isn't.
  // However, if tasks are created via the dashboard, this page's task list
  // should refresh when it becomes active or via a global event.
  refresh();
  toast.add({
    title: 'Task Created!',
    description: 'Your new task has been successfully created.',
    color: 'green',
    icon: 'i-heroicons-check-circle',
  });
};

const handleTaskUpdate = async (taskId: string, updates: Partial<ITask>) => {
  try {
    await updateTask(taskId, updates);
    refresh();
    toast.add({
      title: 'Task Updated',
      description: 'Changes saved successfully.',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    });
  } catch (err: unknown) {
    const errorMessage = (err as any).data?.message || 'An unexpected error occurred.';
    toast.error(`Error updating task: ${errorMessage}`);
  }
};

const handleTaskDelete = async (taskId: string) => {
  if (!confirm("Are you sure you want to delete this task?")) return;
  try {
    await deleteTask(taskId);
    refresh();
    toast.info("Task deleted!");
  } catch (err: unknown) {
    const errorMessage = (err as any).data?.message || 'An unexpected error occurred.';
    toast.error(`Error deleting task: ${errorMessage}`);
  }
};

const handleEditTask = (taskToEdit: ITask) => {
  editingTask.value = taskToEdit;
  showTaskEditModal.value = true;
};

const handleTaskSelected = (task: ITask) => {
  router.push(`/dashboard/tasks/${task.id}`);
};

const handleSaveEdit = async (taskId: string, updatedData: Partial<ITask>) => {
  try {
    await updateTask(taskId, updatedData);
    toast.add({
      title: 'Task Saved',
      description: 'Task updated successfully.',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    });
  } catch (err: unknown) {
    const errorMessage = (err as any).data?.message || 'An unexpected error occurred.';
    toast.error(`Error saving task: ${errorMessage}`);
  } finally {
    closeTaskModal();
    refresh();
  }
};

const closeTaskModal = () => {
  editingTask.value = null;
  showTaskEditModal.value = false;
};
</script>