<!-- pages/dashboard/admin/users.vue -->
<script setup lang="ts">
definePageMeta({
  layout: "dashboard",
  // Chain middleware: 'auth' runs first, then 'admin'
  middleware: ["auth", "admin"],
});
</script>
