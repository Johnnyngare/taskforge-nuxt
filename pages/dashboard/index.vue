<template>
  <div>
    <TaskProvider
      v-slot="{
        tasks,
        pending,
        error,
        refresh,
        createTask,
        updateTask,
        deleteTask,
        editTask,
      }"
    >
      <!-- Welcome Banner -->
      <DashboardWelcomeBanner :tasks="tasks" />

      <!-- Quick Actions Bar -->
      <div
        class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div class="flex flex-wrap gap-3">
          <FormAppButton @click="showQuickAdd = true">
            <Icon name="heroicons:plus" class="mr-2 h-4 w-4" />
            Add Task
          </FormAppButton>
        </div>
        <div class="text-sm text-gray-500">
          {{ tasks.length }} {{ tasks.length === 1 ? "task" : "tasks" }} total
        </div>
      </div>

      <!-- Quick Add Task (Modal-like) -->
      <div v-if="showQuickAdd" class="mb-6">
        <DashboardQuickAddTask
          @task-created="handleTaskCreated"
          @close="showQuickAdd = false"
        />
      </div>

      <!-- Dashboard Grid -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Main Task List -->
        <div class="lg:col-span-2">
          <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div class="mb-6 flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900">Recent Tasks</h2>
              <NuxtLink
                to="/dashboard/tasks"
                class="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
              >
                View All
              </NuxtLink>
            </div>

            <div v-if="pending" class="flex justify-center py-8">
              <UiSpinner class="h-6 w-6 text-blue-600" />
            </div>
            <div v-else-if="error" class="py-8 text-center">
              <p class="mb-4 text-red-600">Failed to load tasks</p>
              <FormAppButton @click="refresh" variant="secondary">
                Try Again
              </FormAppButton>
            </div>
            <TaskTaskList
              v-else
              :tasks="tasks.slice(0, 6)"
              @task-updated="updateTask"
              @task-deleted="deleteTask"
              @edit-task="editTask"
            />
          </div>
        </div>

        <!-- Sidebar Widgets -->
        <div class="space-y-6">
          <DashboardProductivityStats :tasks="tasks" />
          <DashboardUpcomingDeadlines :tasks="tasks" />
          <DashboardActivityFeed />
        </div>
      </div>
    </TaskProvider>
  </div>
</template>

<script setup>
import { ref } from "vue";

definePageMeta({ layout: "dashboard", middleware: "auth" });
useSeoMeta({
  title: "Dashboard - TaskForge",
  description: "Manage your tasks and projects efficiently.",
});

const showQuickAdd = ref(false);

const handleTaskCreated = () => {
  showQuickAdd.value = false;
  // The useTasks composable handles the state update, so no need to call refresh() manually.
  // You could add a success toast notification here.
};
</script>
