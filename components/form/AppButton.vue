<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="handleClick"
  >
    <UiSpinner v-if="loading" size="sm" class="mr-2" :color="spinnerColor" />
    <slot>{{ label }}</slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue"; // Explicit import

interface Props {
  label?: string;
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
  block?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: "",
  variant: "primary",
  size: "md",
  type: "button",
  disabled: false,
  loading: false,
  block: false,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const buttonClasses = computed(() => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantClasses = {
    primary:
      "bg-emerald-500 hover:bg-emerald-600 text-white focus:ring-emerald-500",
    secondary:
      "bg-slate-700 hover:bg-slate-600 text-white focus:ring-slate-500",
    danger: "bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500",
    outline:
      "border border-border text-slate-200 hover:bg-surface-alt focus:ring-emerald-500",
    ghost:
      "hover:bg-slate-700 text-slate-400 hover:text-white focus:ring-slate-500",
  };

  const blockClass = props.block ? "w-full" : "";

  return [
    baseClasses,
    sizeClasses[props.size],
    variantClasses[props.variant],
    blockClass,
  ]
    .filter(Boolean)
    .join(" ");
});

const spinnerColor = computed(() => {
  // Determine spinner color based on button variant
  if (props.variant === "primary" || props.variant === "danger") return "white";
  return "current"; // Inherit text color for other variants
});

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit("click", event);
  }
};
</script>
