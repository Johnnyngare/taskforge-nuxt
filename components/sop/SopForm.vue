<!-- components/sop/SopForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="space-y-4 p-4">
    <div>
      <label for="title" class="block text-sm font-medium text-slate-300"
        >Title</label
      >
      <FormAppInput id="title" v-model="formState.title" required />
    </div>
    <div>
      <label for="category" class="block text-sm font-medium text-slate-300"
        >Category</label
      >
      <FormAppInput id="category" v-model="formState.category" required />
    </div>
    <div>
      <label for="tags" class="block text-sm font-medium text-slate-300"
        >Tags (comma-separated)</label
      >
      <FormAppInput id="tags" v-model="tagsInput" />
    </div>
    <div>
      <label for="content" class="block text-sm font-medium text-slate-300"
        >Content</label
      >
      <textarea
        id="content"
        v-model="formState.content"
        required
        rows="10"
        class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
      ></textarea>
    </div>
    <div class="flex justify-end space-x-3 border-t border-slate-700 pt-4">
      <FormAppButton type="button" variant="secondary" @click="$emit('cancel')"
        >Cancel</FormAppButton
      >
      <FormAppButton type="submit">Save SOP</FormAppButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { ISop } from '~/types/sop';

type SopFormData = Omit<ISop, 'id' | 'author' | 'createdAt' | 'updatedAt'>;

const props = defineProps<{
  initialData?: ISop | null;
}>();

const emit = defineEmits<{
  (e: 'save', data: SopFormData): void;
  (e: 'cancel'): void;
}>();

const formState = ref<SopFormData>({
  title: '',
  content: '',
  category: '',
  tags: [],
});

const tagsInput = ref('');

watch(
  () => props.initialData,
  (sop) => {
    if (sop) {
      formState.value = {
        title: sop.title,
        content: sop.content,
        category: sop.category,
        tags: sop.tags,
      };
      tagsInput.value = sop.tags.join(', ');
    } else {
      // NEW: Reset form when creating a new one to clear old data
      formState.value = { title: '', content: '', category: '', tags: [] };
      tagsInput.value = '';
    }
  },
  { immediate: true }
);

const handleSubmit = () => {
  formState.value.tags = tagsInput.value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
  emit('save', formState.value);
};
</script>