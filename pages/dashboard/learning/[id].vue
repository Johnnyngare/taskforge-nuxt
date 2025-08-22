<!-- pages/dashboard/learning/[id].vue -->
<template>
  <div>
    <div v-if="pending" class="flex justify-center p-12"><UiSpinner /></div>
    <div v-else-if="error || !sop" class="text-center text-rose-400">
      <h2>SOP Not Found</h2>
      <p>The requested SOP could not be loaded.</p>
    </div>
    <article
      v-else
      class="prose prose-invert max-w-none rounded-xl bg-slate-800 p-6"
    >
      <h1>{{ sop.title }}</h1>
      <div class="text-sm text-slate-400">
        <span>Category: {{ sop.category }}</span> |
        <span>Authored by: {{ sop.author?.name || 'Unknown User' }}</span> |
        <span>Last updated: {{ new Date(sop.updatedAt).toLocaleDateString() }}</span>
      </div>
      <div v-if="sop.tags.length > 0" class="mt-4 flex flex-wrap gap-2">
        <span
          v-for="tag in sop.tags"
          :key="tag"
          class="rounded-full bg-slate-700 px-2 py-1 text-xs"
          >{{ tag }}</span
        >
      </div>
      <hr />
      <p style="white-space: pre-wrap">{{ sop.content }}</p>

      <!-- NEW: Attachments Display Section -->
      <div class="mt-8">
        <h3 class="text-lg font-semibold text-slate-200 mb-4">Attachments</h3>
        <div v-if="sop.attachments && sop.attachments.length > 0">
          <ul class="space-y-2">
            <li v-for="attachment in sop.attachments" :key="attachment.id"
                class="flex items-center justify-between rounded-md border border-slate-700 bg-slate-700 p-3"
            >
              <div class="flex flex-col">
                <span class="text-sm font-medium text-white">{{ attachment.originalName }}</span>
                <span class="text-xs text-slate-400">
                  {{ (attachment.size / 1024).toFixed(1) }} KB |
                  Uploaded by {{ attachment.uploadedBy?.name || 'Unknown' }} on {{ new Date(attachment.uploadedAt).toLocaleDateString() }}
                </span>
              </div>
              <div class="flex space-x-2">
                <button @click="downloadSopAttachment(sop.id, attachment.id, attachment.originalName)"
                        title="Download Attachment"
                        class="text-emerald-400 hover:text-emerald-300">
                  <Icon name="heroicons:arrow-down-tray" class="w-5 h-5" />
                </button>
                <button v-if="canManageSOPs" @click="deleteSopAttachment(sop.id, attachment.id)"
                        title="Delete Attachment"
                        class="text-rose-400 hover:text-rose-300">
                  <Icon name="heroicons:trash" class="w-5 h-5" />
                </button>
              </div>
            </li>
          </ul>
        </div>
        <div v-else class="text-sm text-slate-400 py-4 text-center border border-dashed border-slate-700 rounded-lg">
          No attachments for this SOP.
        </div>
      </div>
      <!-- END NEW: Attachments Display Section -->

    </article>
    <div class="mt-6">
      <NuxtLink
        to="/dashboard/learning"
        class="text-emerald-400 hover:underline"
        >&larr; Back to all SOPs</NuxtLink
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useAsyncData } from '#app';
import { useApi } from '~/composables/useApi';
import type { ISop } from '~/types/sop';
import { useAuth } from '~/composables/useAuth'; // NEW: Import useAuth
import { useSops } from '~/composables/useSops'; // NEW: Import useSops for delete/download functions

definePageMeta({ layout: 'dashboard' });

const route = useRoute();
const api = useApi();
const id = route.params.id as string;

// Destructure from useSops for attachment operations
const { deleteSopAttachment, downloadSopAttachment } = useSops();
const { canManageSOPs } = useAuth(); // Determine if user can manage attachments

// Fetch the SOP data
const { data: sop, pending, error } = await useAsyncData(`sop-${id}`, () =>
  api<ISop>(`/sops/${id}`)
);

// Optional: Console log sop after fetch for debugging, to confirm attachments are in the data
watch(sop, (newSop) => {
  if (newSop) {
    console.log("SOP Detail Page: Fetched SOP with attachments:", newSop.attachments);
  }
}, { immediate: true }); // immediate to log on initial fetch
</script>