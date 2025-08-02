<!-- file: components/ui/Spinner.vue -->
<template>
  <div class="flex justify-center items-center">
    <div
      :class="[spinnerSizeClasses, spinnerColorClass]"
      class="animate-spin rounded-full border-t-2 border-b-2"
      role="status"
    >
      <span class="sr-only">Loading...</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  /**
   * Defines the size of the spinner.
   * @values 'sm', 'md', 'lg'
   */
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg"].includes(value),
  },
  /**
   * Defines the color of the spinner. Uses Tailwind CSS color names (e.g., 'emerald', 'blue').
   * Supports 'inherit' to use parent's text color.
   */
  color: {
    type: String,
    default: "emerald",
    // You could add more sophisticated validation here for valid Tailwind colors
    // but for simplicity, we'll allow any string.
  },
});

// Computed property to determine Tailwind classes for size
const spinnerSizeClasses = computed(() => {
  switch (props.size) {
    case "sm":
      return "h-5 w-5";
    case "lg":
      return "h-12 w-12";
    case "md":
    default:
      return "h-8 w-8";
  }
});

// Computed property to determine Tailwind classes for color
const spinnerColorClass = computed(() => {
  if (props.color === "inherit") {
    // border-t and border-b will inherit the text color if set on parent
    return "border-current";
  }
  // Construct classes like 'border-t-emerald-500', 'border-b-emerald-500'
  return `border-t-${props.color}-500 border-b-${props.color}-500`;
});
</script>

<style scoped>
/*
  The `animate-spin` utility from Tailwind CSS provides a smooth, continuous rotation.
  No custom CSS needed for the animation itself!
*/
</style>
