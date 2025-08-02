<!-- components/dashboard/TaskFilters.vue -->
<template>
  <div class="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
    <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-3">Filter Tasks</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div>
        <label for="status-filter" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
        <select id="status-filter" v-model="localFilters.status" class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm">
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div>
        <label for="priority-filter" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
        <select id="priority-filter" v-model="localFilters.priority" class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm">
          <option value="all">All</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>
      <!-- Add more filters for Project, Due Date etc. -->
    </div>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue';
const props = defineProps({
  filters: {
    type: Object,
    default: () => ({ status: 'all', priority: 'all' }),
  },
});
const emit = defineEmits(['update:filters']);

const localFilters = ref({ ...props.filters });

watch(localFilters, (newFilters) => {
  emit('update:filters', newFilters);
}, { deep: true });
</script>