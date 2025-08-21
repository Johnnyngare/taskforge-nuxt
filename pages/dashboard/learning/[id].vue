<!-- pages/dashboard/learning/[id].vue -->
<template>
  <div>
    <div v-if="pending" class="flex justify-center p-12"><UiSpinner /></div>
    <div v-else-if="error || !sop" class="text-center text-rose-400">
      <h2>SOP Not Found</h2>
      <p>The requested SOP could not be loaded.</p>
    </div>
    <div v-else class="prose prose-invert max-w-none rounded-xl bg-slate-800 p-6">
      <h1>{{ sop.title }}</h1>
      <div class="text-sm text-slate-400">
        <span>Category: {{ sop.category }}</span> |
        <span>Authored by: {{ sop.author.name }}</span> |
        <span>Last updated: {{ new Date(sop.updatedAt).toLocaleDateString() }}</span>
      </div>
      <div v-if="sop.tags.length > 0" class="mt-4 flex flex-wrap gap-2">
        <span v-for="tag in sop.tags" :key="tag" class="rounded-full bg-slate-700 px-2 py-1 text-xs">{{ tag }}</span>
      </div>
      <hr />
      <div v-html="sop.content.replace(/\n/g, '<br />')"></div>
    </div>
    <div class="mt-6">
      <NuxtLink to="/dashboard/learning" class="text-emerald-400 hover:underline">&larr; Back to all SOPs</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi } from '~/composables/useApi';
import type { ISop } from '~/types/sop';
import { useRoute, useAsyncData } from '#app'; // ADDED: useRoute and useAsyncData from #app

const route = useRoute();
const api = useApi();
const id = route.params.id as string;

const { data: sop, pending, error } = await useAsyncData(`sop-${id}`, () =>
  api<ISop>(`/sops/${id}`)
);
</script>