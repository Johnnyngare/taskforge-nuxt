<!-- components/sop/SopForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="space-y-4 p-4">
    <div>
      <label for="title" class="block text-sm font-medium text-slate-300">Title</label>
      <FormAppInput id="title" v-model="formState.title" required />
    </div>
    <div>
      <label for="category" class="block text-sm font-medium text-slate-300">Category</label>
      <FormAppInput id="category" v-model="formState.category" required />
    </div>
    <div>
      <label for="tags" class="block text-sm font-medium text-slate-300">Tags (comma-separated)</label>
      <FormAppInput id="tags" v-model="tagsInput" />
    </div>
    <div>
      <label for="content" class="block text-sm font-medium text-slate-300">Content</label>
      <textarea
        id="content"
        v-model="formState.content"
        required
        rows="10"
        class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
      ></textarea>
    </div>

    <!-- NEW: Attachments Section -->
    <div class="space-y-2">
      <h4 class="text-sm font-medium text-slate-300">Attachments</h4>

      <!-- Existing Attachments (for Edit mode) -->
      <div v-if="initialData && initialData.attachments && initialData.attachments.length > 0" class="space-y-1">
        <p class="text-xs text-slate-400 mb-1">Existing files:</p>
        <div v-for="att in initialData.attachments" :key="att.id"
             class="flex items-center justify-between rounded-md bg-slate-700 px-3 py-2 text-sm text-slate-200">
          <span>{{ att.originalName }} ({{ (att.size / 1024).toFixed(1) }} KB)</span>
          <div class="flex items-center space-x-2">
            <button type="button" @click="$emit('download-attachment', att.id, att.originalName)"
                    title="Download" class="text-emerald-400 hover:text-emerald-300">
              <Icon name="heroicons:arrow-down-tray" class="w-4 h-4" />
            </button>
            <button type="button" @click="markAttachmentForDeletion(att.id)"
                    title="Remove" class="text-rose-400 hover:text-rose-300">
              <Icon name="heroicons:x-mark" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- New File Input -->
      <div>
        <label for="file-upload" class="block text-xs font-medium text-slate-400 mb-1">Add new files (Max 5 files, 10MB each):</label>
        <input id="file-upload" type="file" multiple @change="handleFileSelect"
               class="block w-full text-sm text-slate-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-emerald-500 file:text-white
                      hover:file:bg-emerald-600 cursor-pointer"
        />
        <p v-if="fileErrors.length > 0" class="mt-1 text-xs text-rose-400">{{ fileErrors.join(' ') }}</p>
      </div>

      <!-- List of files selected for upload -->
      <div v-if="filesToUpload.length > 0" class="space-y-1">
        <p class="text-xs text-slate-400 mb-1">Selected for upload:</p>
        <div v-for="(file, index) in filesToUpload" :key="file.name + file.size"
             class="flex items-center justify-between rounded-md bg-slate-700 px-3 py-2 text-sm text-slate-200">
          <span>{{ file.name }} ({{ (file.size / 1024).toFixed(1) }} KB)</span>
          <button type="button" @click="removeSelectedFile(index)"
                  title="Remove from upload" class="text-rose-400 hover:text-rose-300">
            <Icon name="heroicons:x-mark" class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- List of attachments marked for deletion -->
      <div v-if="attachmentsToDelete.length > 0" class="space-y-1 text-rose-400 text-sm">
        <p class="text-xs mb-1">Marked for deletion (will be removed on save):</p>
        <span v-for="attId in attachmentsToDelete" :key="attId" class="inline-block bg-rose-500/10 rounded-full px-2 py-1 text-xs">
          {{ initialData?.attachments?.find(a => a.id === attId)?.originalName || attId }}
          <button type="button" @click="unmarkAttachmentForDeletion(attId)" class="ml-1 text-rose-300 hover:text-rose-200" title="Undo delete">
            <Icon name="heroicons:x-mark" class="w-3 h-3 inline-block" />
          </button>
        </span>
      </div>
    </div>

    <div class="flex justify-end space-x-3 border-t border-slate-700 pt-4">
      <FormAppButton type="button" variant="secondary" @click="$emit('cancel')">Cancel</FormAppButton>
      <FormAppButton type="submit">Save SOP</FormAppButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from 'vue';
import type { ISop, ISopAttachment } from '~/types/sop'; // Import ISopAttachment

type SopFormData = Omit<ISop, 'id' | 'author' | 'createdAt' | 'updatedAt' | 'attachments'>;

const props = defineProps<{
  initialData?: ISop | null;
}>();

const emit = defineEmits<{
  (e: 'save', data: SopFormData, filesToUpload: File[], attachmentsToDelete: string[]): void; // NEW: Emit files and delete list
  (e: 'cancel'): void;
  (e: 'download-attachment', attachmentId: string, filename: string): void; // NEW: Emit for download
}>();

const formState = ref<SopFormData>({
  title: '',
  content: '',
  category: '',
  tags: [],
});

const tagsInput = ref('');
const filesToUpload = ref<File[]>([]); // NEW: Files selected by user for new upload
const attachmentsToDelete = ref<string[]>([]); // NEW: IDs of attachments marked for deletion
const fileErrors = ref<string[]>([]); // NEW: Errors during file selection

const MAX_FILE_COUNT = 5;
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_MIMES = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

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
      // When editing, clear new files and deletion list from previous open/edit
      filesToUpload.value = [];
      attachmentsToDelete.value = [];
      fileErrors.value = [];
    } else {
      // Reset form when creating a new one
      formState.value = { title: '', content: '', category: '', tags: [] };
      tagsInput.value = '';
      filesToUpload.value = [];
      attachmentsToDelete.value = [];
      fileErrors.value = [];
    }
  },
  { immediate: true }
);

const handleFileSelect = (event: Event) => {
  fileErrors.value = [];
  const input = event.target as HTMLInputElement;
  if (!input.files) return;

  const newFiles: File[] = Array.from(input.files);
  const currentTotalFiles = (props.initialData?.attachments?.length || 0) - attachmentsToDelete.value.length + filesToUpload.value.length + newFiles.length;

  if (currentTotalFiles > MAX_FILE_COUNT) {
    fileErrors.value.push(`Max ${MAX_FILE_COUNT} attachments allowed. You selected too many.`);
    input.value = ''; // Clear input
    return;
  }

  newFiles.forEach(file => {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      fileErrors.value.push(`${file.name}: Max size ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    if (!ALLOWED_MIMES.includes(file.type)) {
      fileErrors.value.push(`${file.name}: Disallowed type ${file.type}.`);
      return;
    }
    filesToUpload.value.push(file);
  });

  input.value = ''; // Clear input to allow selecting same files again if needed
};

const removeSelectedFile = (index: number) => {
  filesToUpload.value.splice(index, 1);
};

const markAttachmentForDeletion = (id: string) => {
  if (!attachmentsToDelete.value.includes(id)) {
    attachmentsToDelete.value.push(id);
  }
};

const unmarkAttachmentForDeletion = (id: string) => {
  const index = attachmentsToDelete.value.indexOf(id);
  if (index > -1) {
    attachmentsToDelete.value.splice(index, 1);
  }
};

const handleSubmit = () => {
  formState.value.tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(Boolean);
  emit('save', formState.value, filesToUpload.value, attachmentsToDelete.value); // Emit all relevant data
};
</script>