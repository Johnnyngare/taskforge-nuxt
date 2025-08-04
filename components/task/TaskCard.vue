<template>
  <div
    class="group rounded-lg border border-gray-200 bg-white p-4 transition-all duration-200 hover:shadow-md"
  >
    <!-- Task Header -->
    <div class="mb-3 flex items-start justify-between">
      <div class="min-w-0 flex-1">
        <h3
          class="truncate font-medium text-gray-900 transition-colors group-hover:text-blue-600"
        >
          {{ task.title }}
        </h3>
      </div>

      <!-- Actions Dropdown -->
      <div class="relative ml-3" v-click-outside="closeDropdown">
        <button
          @click="toggleDropdown"
          class="rounded-md p-1 text-gray-400 opacity-0 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
        >
          <Icon name="heroicons:ellipsis-vertical" class="h-5 w-5" />
        </button>

        <div
          v-if="showDropdown"
          class="absolute right-0 top-8 z-10 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg animate-in fade-in duration-200"
        >
          <button
            @click="handleStatusToggle"
            class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50"
          >
            <Icon
              :name="
                task.status === 'completed'
                  ? 'heroicons:arrow-uturn-left'
                  : 'heroicons:check'
              "
              class="h-4 w-4"
            />
            {{ task.status === "completed" ? "Mark Pending" : "Mark Complete" }}
          </button>
          <button
            @click="handleEdit"
            class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50"
          >
            <Icon name="heroicons:pencil" class="h-4 w-4" />
            Edit Task
          </button>
          <hr class="my-1 border-gray-200" />
          <button
            @click="handleDelete"
            class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            <Icon name="heroicons:trash" class="h-4 w-4" />
            Delete Task
          </button>
        </div>
      </div>
    </div>

    <!-- Task Meta Information -->
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <TaskPriorityBadge :priority="task.priority" />
      <span
        class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
        :class="statusClasses"
      >
        <span
          class="mr-1.5 h-1.5 w-1.5 rounded-full"
          :class="statusDotClasses"
        ></span>
        {{ statusLabel }}
      </span>
    </div>

    <!-- Due Date and Created Date -->
    <div class="flex items-center justify-between text-sm">
      <div class="flex items-center gap-4">
        <div
          v-if="task.dueDate"
          class="flex items-center gap-1"
          :class="dueDateClasses"
        >
          <Icon name="heroicons:calendar-days" class="h-4 w-4" />
          <span>{{ formatDueDate(task.dueDate) }}</span>
        </div>
        <div class="flex items-center gap-1 text-gray-500">
          <Icon name="heroicons:clock" class="h-4 w-4" />
          <span>{{ formatRelativeDate(task.createdAt) }}</span>
        </div>
      </div>
      <button
        @click="handleStatusToggle"
        class="flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-gray-100"
        :class="
          task.status === 'completed' ? 'text-green-600' : 'text-gray-500'
        "
      >
        <Icon
          :name="
            task.status === 'completed'
              ? 'heroicons:check-circle'
              : 'heroicons:circle'
          "
          class="h-4 w-4"
        />
        <span class="text-xs font-medium">
          {{ task.status === "completed" ? "Done" : "Mark Done" }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  task: { type: Object, required: true },
});
const emit = defineEmits(["edit", "delete", "status-changed"]);

const showDropdown = ref(false);

const statusInfo = computed(() => {
  const statuses = {
    pending: {
      label: "Pending",
      classes: "bg-yellow-100 text-yellow-700",
      dot: "bg-yellow-500",
    },
    in_progress: {
      label: "In Progress",
      classes: "bg-blue-100 text-blue-700",
      dot: "bg-blue-500",
    },
    completed: {
      label: "Completed",
      classes: "bg-green-100 text-green-700",
      dot: "bg-green-500",
    },
    cancelled: {
      label: "Cancelled",
      classes: "bg-red-100 text-red-700",
      dot: "bg-red-500",
    },
  };
  return statuses[props.task.status] || statuses.pending;
});

const statusClasses = computed(() => statusInfo.value.classes);
const statusDotClasses = computed(() => statusInfo.value.dot);
const statusLabel = computed(() => statusInfo.value.label);

const dueDateClasses = computed(() => {
  if (!props.task.dueDate || props.task.status === "completed")
    return "text-gray-500";
  const dueDate = new Date(props.task.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dueDate < today) return "text-red-600";
  if (dueDate.toDateString() === today.toDateString()) return "text-orange-600";
  return "text-gray-500";
});

const toggleDropdown = () => (showDropdown.value = !showDropdown.value);
const closeDropdown = () => (showDropdown.value = false);

const handleEdit = () => {
  emit("edit", props.task._id);
  closeDropdown();
};
const handleDelete = () => {
  if (confirm("Are you sure you want to delete this task?")) {
    emit("delete", props.task._id);
  }
  closeDropdown();
};
const handleStatusToggle = () => {
  const newStatus = props.task.status === "completed" ? "pending" : "completed";
  emit("status-changed", props.task._id, { status: newStatus });
  closeDropdown();
};

const formatDueDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatRelativeDate = (dateString) => {
  const diff = new Date() - new Date(dateString);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value();
      }
    };
    document.addEventListener("click", el.clickOutsideEvent);
  },
  unmounted(el) {
    document.removeEventListener("click", el.clickOutsideEvent);
  },
};
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-in {
  animation: fade-in 0.2s ease-out;
}
</style>
