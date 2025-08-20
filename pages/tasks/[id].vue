<!-- pages/tasks/[id].vue -->
<template>
  <div>
    <h1>Viewing Task ID: {{ taskId }}</h1>
    
    <div v-if="pending">
      Loading task details...
    </div>
    
    <div v-else-if="error">
      Failed to load task details.
    </div>
    
    <div v-else>
      <h2>{{ task?.title }}</h2>
      <p>{{ task?.description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

// ✅ Define page meta with middleware as an array
definePageMeta({
  middleware: ["auth"],
})

// ✅ Get task ID from route params
const route = useRoute()
const taskId = computed(() => route.params.id as string)

// ✅ Fetch task data from API (adjust API endpoint as needed)
const { data: task, pending, error } = await useAsyncData(`task-${taskId.value}`, () =>
  $fetch(`/api/tasks/${taskId.value}`)
)
</script>
