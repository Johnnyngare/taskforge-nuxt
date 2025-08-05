<!-- components/TaskPriorityBadge.vue -->
<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium"
    :class="badgeClasses"
  >
    {{ priority }}
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
// FIX: Import from the new shared types file
import { TaskPriority } from "~/types/task";

const props = defineProps<{
  priority: TaskPriority;
}>();

const badgeClasses = computed(() => {
  const priorityMap: Record<TaskPriority, string> = {
    [TaskPriority.Low]: "bg-sky-500/10 text-sky-400",
    [TaskPriority.Medium]: "bg-amber-500/10 text-amber-400",
    [TaskPriority.High]: "bg-orange-500/10 text-orange-400",
    [TaskPriority.Urgent]: "bg-rose-500/10 text-rose-400",
  };
  return priorityMap[props.priority] || priorityMap.Medium;
});
</script>
