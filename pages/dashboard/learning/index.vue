<!-- pages/dashboard/learning/index.vue - UPDATED -->
<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold text-slate-200">Learning & SOPs</h1>
      <FormAppButton v-if="canManageSOPs" @click="openCreateModal">
        <Icon name="heroicons:plus" class="mr-2 h-4 w-4" />
        Add New SOP
      </FormAppButton>
    </div>

    <div class="mt-8 rounded-xl border border-slate-700 bg-slate-800">
      <div v-if="pending" class="flex justify-center p-12"><UiSpinner /></div>
      <div v-else-if="error" class="p-12 text-center text-rose-400">
        <p>Failed to load SOPs. Please try again.</p>
      </div>
      <div
        v-else-if="sops.length === 0"
        class="p-12 text-center text-slate-400"
      >
        <Icon
          name="heroicons:document-magnifying-glass"
          class="mx-auto h-12 w-12 opacity-50"
        />
        <h3 class="mt-4 text-lg font-semibold">No SOPs Found</h3>
        <p class="mt-1 text-sm">
          Get started by creating the first Standard Operating Procedure.
        </p>
      </div>
      <ul v-else class="divide-y divide-slate-700">
        <li v-for="sop in sops" :key="sop.id" class="group p-4">
          <div class="flex items-start justify-between">
            <NuxtLink
              :to="`/dashboard/learning/${sop.id}`"
              class="flex-grow pr-4"
            >
              <h3 class="font-semibold text-emerald-400 group-hover:underline">
                {{ sop.title }}
              </h3>
              <p class="mt-2 text-sm text-slate-400">
                Authored by: {{ sop.author?.name || 'Unknown User' }} on   <!-- FIX HERE -->
                {{ new Date(sop.createdAt).toLocaleDateString() }}
              </p>
            </NuxtLink>
            <div class="flex shrink-0 items-center space-x-2">
              <span
                class="rounded-full bg-slate-700 px-2 py-1 text-xs font-medium text-slate-300"
                >{{ sop.category }}</span
              >
              <div v-if="canManageSOPs" class="flex">
                <button
                  @click="openEditModal(sop)"
                  class="p-1 text-slate-400 hover:text-white"
                  title="Edit SOP"
                >
                  <Icon name="heroicons:pencil" />
                </button>
                <button
                  @click="deleteSop(sop.id)"
                  class="p-1 text-rose-400 hover:text-rose-300"
                  title="Delete SOP"
                >
                  <Icon name="heroicons:trash" />
                </button>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <SopEditModal v-model="isModalOpen" :sop="editingSop" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSops } from '~/composables/useSops';
import { useAuth } from '~/composables/useAuth';
import type { ISop } from '~/types/sop';
import SopEditModal from '~/components/sop/SopEditModal.vue';

definePageMeta({
  layout: 'dashboard',
});

const { sops, pending, error, deleteSop } = useSops();
const { canManageSOPs } = useAuth();

const isModalOpen = ref(false);
const editingSop = ref<ISop | null>(null);

const openCreateModal = () => {
  editingSop.value = null;
  isModalOpen.value = true;
};

const openEditModal = (sop: ISop) => {
  editingSop.value = sop;
  isModalOpen.value = true;
};
</script>