<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Terms of Service
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Last updated: {{ new Date().toLocaleDateString() }}
          </p>
        </div>

        <div class="prose prose-gray dark:prose-invert max-w-none">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using TaskForge, you accept and agree to be bound
            by the terms and provision of this agreement.
          </p>

          <h2>2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of TaskForge
            per device for personal, non-commercial transitory viewing only.
          </p>

          <h2>3. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your
            account and password and for restricting access to your computer.
          </p>

          <h2>4. Privacy Policy</h2>
          <p>
            Your privacy is important to us. Please review our Privacy Policy,
            which also governs your use of the Service.
          </p>

          <h2>5. Prohibited Uses</h2>
          <p>
            You may not use our service for any illegal or unauthorized purpose
            nor may you, in the use of the Service, violate any laws.
          </p>

          <h2>6. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please
            contact us at support@taskforge.com.
          </p>
        </div>

        <div class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div
            class="flex flex-col sm:flex-row gap-4 justify-between items-center"
          >
            <NuxtLink
              to="/"
              class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 mr-2" />
              Back to Home
            </NuxtLink>

            <div class="flex gap-4">
              <NuxtLink
                to="/privacy"
                class="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
              >
                Privacy Policy
              </NuxtLink>
              <NuxtLink
                to="/support"
                class="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
              >
                Contact Support
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
useSeoMeta({
  title: "Terms of Service - TaskForge",
  description: "Terms of Service for TaskForge task management platform.",
});
</script>
