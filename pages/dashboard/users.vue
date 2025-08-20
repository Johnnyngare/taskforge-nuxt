<!-- pages/dashboard/admin/users.vue -->
<script setup lang="ts">
definePageMeta({
  layout: "dashboard",
  // Chain middleware: 'auth' runs first, then 'admin'
  middleware: ["auth", "admin"],
});
</script>

<template>
  <section class="p-6">
    <h1 class="text-2xl font-bold mb-4">Manage Users</h1>
    <p class="text-gray-600 mb-6">Here you can view and manage all registered users.</p>

    <!-- Example: Users Table -->
    <table class="min-w-full bg-white shadow rounded-lg">
      <thead>
        <tr class="bg-gray-100">
          <th class="px-4 py-2 text-left">Name</th>
          <th class="px-4 py-2 text-left">Email</th>
          <th class="px-4 py-2 text-left">Role</th>
          <th class="px-4 py-2 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="px-4 py-2">John Doe</td>
          <td class="px-4 py-2">john@example.com</td>
          <td class="px-4 py-2">Admin</td>
          <td class="px-4 py-2">
            <button class="px-3 py-1 text-white bg-blue-500 rounded hover:bg-blue-600">Edit</button>
            <button class="px-3 py-1 text-white bg-red-500 rounded hover:bg-red-600">Delete</button>
          </td>
        </tr>
        <!-- More rows dynamically generated later -->
      </tbody>
    </table>
  </section>
</template>
