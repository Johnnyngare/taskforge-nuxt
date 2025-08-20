<!-- components/sop/SopEditModal.vue -->
<template>
  <UModal v-model="isOpen">
    <div class="rounded-xl border border-slate-700 bg-slate-800">
      <div class="p-4">
        <h2 class="text-lg font-semibold text-white">{{ isEditing ? 'Edit SOP' : 'Create New SOP' }}</h2>
      </div>
      <SopForm :initial-data="sop" @save="handleSave" @cancel="isOpen = false" />
    </div>
  </UModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSops } from '~/composables/useSops';
import type { ISop } from '~/types/sop';

const props = defineProps<{
  modelValue: boolean;
  sop?: ISop | null;
}>();

const emit = defineEmits(['update:modelValue']);

const { createSop, updateSop } = useSops();

const isEditing = computed(() => !!props.sop);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const handleSave = async (data: Omit<ISop, 'id' | 'author' | 'createdAt' | 'updatedAt'>) => {
  if (isEditing.value && props.sop) {
    await updateSop(props.sop.id, data);
  } else {
    await createSop(data);
  }
  isOpen.value = false;
};
</script>