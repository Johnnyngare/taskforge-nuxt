<!-- pages/profile.vue -->
<template>
  <div>
    <h1>User Profile</h1>
    <!-- Profile settings will go here -->
  </div>
</template>

<script setup>
// This tells Nuxt to run the 'auth' middleware before rendering this page
definePageMeta({
  middleware: "02-auth",
});
</script>