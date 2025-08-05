<template>
  <span :class="badgeClasses" class="relative overflow-hidden">
    <span class="relative z-10">{{ priorityText }}</span>
    <div class="absolute inset-0 opacity-20" :class="backgroundClasses"></div>
  </span>
</template>

<script setup lang="ts">
type Priority = "low" | "medium" | "high";

interface Props {
  priority?: Priority | null | undefined;
}

const props = withDefaults(defineProps<Props>(), {
  priority: "medium",
});

const priorityConfig = {
  low: {
    text: "Low",
    classes:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    background: "bg-gradient-to-r from-blue-500 to-blue-600",
  },
  medium: {
    text: "Medium",
    classes:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    background: "bg-gradient-to-r from-amber-500 to-amber-600",
  },
  high: {
    text: "High",
    classes:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
    background: "bg-gradient-to-r from-red-500 to-red-600",
  },
};

// Normalize priority to handle undefined/null values
const normalizedPriority = computed((): Priority => {
  if (!props.priority || !["low", "medium", "high"].includes(props.priority)) {
    return "medium"; // Default fallback
  }
  return props.priority as Priority;
});

const priorityText = computed(() => {
  return priorityConfig[normalizedPriority.value].text;
});

const badgeClasses = computed(() => {
  const baseClasses =
    "px-2 py-1 text-xs font-medium rounded-full border transition-all duration-200";
  const priorityClasses = priorityConfig[normalizedPriority.value].classes;
  return `${baseClasses} ${priorityClasses}`;
});

const backgroundClasses = computed(() => {
  return priorityConfig[normalizedPriority.value].background;
});
</script>
