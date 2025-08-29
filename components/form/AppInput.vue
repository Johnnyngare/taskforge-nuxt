// components/form/AppInput.vue
<template>
  <div class="space-y-1">
    <label
      v-if="label"
      :for="inputId"
      class="block text-sm font-medium text-slate-200"
    >
      {{ label }}
      <span v-if="required" class="ml-1 text-rose-400">*</span>
    </label>

    <div class="relative">
      <input
        :id="inputId"
        :type="type"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :readonly="readonly"
        :class="inputClasses"
        :value="modelValue"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <!-- FIX: Add a slot to render child elements like the password toggle button -->
      <slot />

      <div
        v-if="error"
        class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"
      >
        <Icon
          name="heroicons:exclamation-circle"
          class="h-5 w-5 text-rose-400"
        />
      </div>
    </div>

    <p v-if="error" class="text-sm text-rose-400">
      {{ error }}
    </p>
    <p v-else-if="helpText" class="text-sm text-slate-400">
      {{ helpText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  modelValue?: string | number;
  label?: string;
  type?: "text" | "email" | "password" | "number" | "tel" | "url" | "search";
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  error?: string;
  helpText?: string;
  size?: "sm" | "md" | "lg";
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  label: "",
  type: "text",
  placeholder: "",
  required: false,
  disabled: false,
  readonly: false,
  error: "",
  helpText: "",
  size: "md",
});

const emit = defineEmits<{
  "update:modelValue": [value: string | number];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}>();

// FIX: Use Nuxt's built-in useId() for SSR-safe unique IDs.
const inputId = useId();

const inputClasses = computed(() => {
  const baseClasses =
    "block w-full rounded-md shadow-sm bg-slate-700 text-slate-200 border border-slate-600 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed placeholder-slate-400";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-3 text-base",
  };

  const errorClasses = props.error
    ? "border-rose-400 focus:ring-rose-500 focus:border-rose-500"
    : "";

  return [baseClasses, sizeClasses[props.size], errorClasses]
    .filter(Boolean)
    .join(" ");
});

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = props.type === "number" ? Number(target.value) : target.value;
  emit("update:modelValue", value);
};

const handleBlur = (event: FocusEvent) => {
  emit("blur", event);
};

const handleFocus = (event: FocusEvent) => {
  emit("focus", event);
};
</script>