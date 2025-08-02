<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Privacy Policy
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Last updated: {{ new Date().toLocaleDateString() }}
          </p>
        </div>

        <div class="prose prose-gray dark:prose-invert max-w-none">
          <h2>1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us, such as when you
            create an account, update your profile, or contact us for support.
          </p>

          <h2>2. How We Use Your Information</h2>
          <p>
            We use the information we collect to provide, maintain, and improve
            our services, process transactions, and communicate with you.
          </p>

          <h2>3. Information Sharing</h2>
          <p>
            We do not sell, trade, or otherwise transfer your personal
            information to third parties without your consent, except as
            described in this policy.
          </p>

          <h2>4. Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal
            information against unauthorized access, alteration, disclosure, or
            destruction.
          </p>

          <h2>5. Google OAuth Integration</h2>
          <p>
            When you sign in with Google, we only access your basic profile
            information (name, email) as permitted by Google's OAuth scope. We
            do not store your Google password.
          </p>

          <h2>6. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to
            provide our services and fulfill the purposes outlined in this
            policy.
          </p>

          <h2>7. Your Rights</h2>
          <p>
            You have the right to access, update, or delete your personal
            information. You can manage your account settings or contact us for
            assistance.
          </p>

          <h2>8. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact
            us at privacy@taskforge.com.
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
                to="/terms"
                class="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
              >
                Terms of Service
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
  title: "Privacy Policy - TaskForge",
  description: "Privacy Policy for TaskForge task management platform.",
});
</script>
