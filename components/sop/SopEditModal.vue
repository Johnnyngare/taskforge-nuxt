<!-- components/sop/SopEditModal.vue -->
<template>
  <UModal v-model="isOpen">
    <div class="rounded-xl border border-slate-700 bg-slate-800">
      <div class="border-b border-slate-700 p-4">
        <h2 class="text-lg font-semibold text-white">
          {{ isEditing ? 'Edit SOP' : 'Create New SOP' }}
        </h2>
      </div>
      <SopForm
        :initial-data="sop"
        @save="handleSave"
        @cancel="isOpen = false"
        @download-attachment="handleDownloadAttachment"
      />
    </div>
  </UModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSops } from '~/composables/useSops';
import type { ISop } from '~/types/sop';
import SopForm from '~/components/sop/SopForm.vue';

const props = defineProps<{
  modelValue: boolean;
  sop?: ISop | null;
}>();

const emit = defineEmits(['update:modelValue']);

const { createSop, updateSop, deleteSopAttachment, downloadSopAttachment } = useSops();

const isEditing = computed(() => !!props.sop);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const handleSave = async (data: Omit<ISop, 'id' | 'author' | 'createdAt' | 'updatedAt' | 'attachments'>, filesToUpload: File[], attachmentsToDelete: string[]) => {
  if (isEditing.value && props.sop) {
    await updateSop(props.sop.id, data, { filesToUpload, attachmentsToDelete });
  } else {
    await createSop(data, filesToUpload);
  }
  isOpen.value = false;
};

const handleDownloadAttachment = (attachmentId: string, filename: string) => {
  if (props.sop) {
    downloadSopAttachment(props.sop.id, attachmentId, filename);
  }
};
</script>