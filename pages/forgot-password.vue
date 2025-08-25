<template>
  <div
    class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800"
  >
    <!-- Background pattern -->
    <div
      class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fill-rule=%22evenodd%22%3E%3Cg%20fill=%22%2316a34a%22%20fill-opacity=%220.03%22%3E%3Ccircle%20cx=%2230%22%20cy=%2230%22%20r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"
    ></div>

    <div class="relative w-full max-w-md space-y-8">
      <!-- Header Section -->
      <div class="text-center">
        <NuxtLink
          to="/"
          class="inline-flex items-center justify-center mb-8 group"
          aria-label="Home"
        >
          <div
            class="w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300"
          >
            <UIcon name="i-heroicons-bolt-solid" class="w-7 h-7 text-white" />
          </div>
        </NuxtLink>

        <h1
          class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3"
        >
          Reset Password
        </h1>
        <p class="text-base text-gray-600 dark:text-gray-400">
          Enter your email address and we'll send you a link to reset your
          password
        </p>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Remember your password?
          <NuxtLink
            to="/login"
            class="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors duration-200"
          >
            Sign in here
          </NuxtLink>
        </p>
      </div>

      <!-- Main Card -->
      <UCard
        class="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
      >
        <div class="px-6 py-8 space-y-6">
          <UForm
            ref="formRef"
            :state="formState"
            :schema="forgotPasswordSchema"
            @submit="handleForgotPassword"
            class="space-y-6"
          >
            <!-- Email Field -->
            <UFormGroup
              label="Email address"
              name="email"
              required
              help="We'll send password reset instructions to this email"
            >
              <UInput
                v-model="formState.email"
                type="email"
                placeholder="Enter your email address"
                icon="i-heroicons-envelope"
                :disabled="loading"
                size="lg"
                :ui="{
                  icon: { leading: { pointer: '' } },
                  base: 'focus:ring-2 focus:ring-emerald-500 transition-all duration-200',
                }"
                autocomplete="email"
                required
              />
            </UFormGroup>

            <!-- Submit Button -->
            <UButton
              type="submit"
              size="lg"
              block
              :loading="loading"
              class="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
            >
              <template #leading>
                <UIcon name="i-heroicons-paper-airplane" class="w-5 h-5" />
              </template>
              Send Reset Link
            </UButton>
          </UForm>

          <!-- Back to Login -->
          <div class="text-center pt-4">
            <NuxtLink
              to="/login"
              class="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
            >
              <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 mr-2" />
              Back to sign in
            </NuxtLink>
          </div>
        </div>
      </UCard>

      <!-- Help Section -->
      <div class="text-center">
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Need additional help?
          <NuxtLink
            to="/support"
            class="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium transition-colors duration-200"
          >
            Contact support
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted } from 'vue'; // Added reactive
import { z } from 'zod';
import type { FormSubmitEvent } from '#ui/types'; // For UForm @submit event type
import { useAppToast } from '~/composables/useAppToast'; // CORRECTED: useAppToast for consistency

// Meta and SEO
useSeoMeta({
  title: 'Reset Password - TaskForge',
  description: 'Reset your TaskForge account password.',
  robots: 'noindex, nofollow',
});

// Protect guest routes
definePageMeta({
  layout: 'auth',
});

// Composables
const toast = useAppToast(); // CORRECTED: Use useAppToast

// Reactive state
const loading = ref(false);
const formRef = ref();

// Validation schema
const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(254, 'Email is too long'),
});

// Form state (using reactive for consistency, though ref also works)
const formState = reactive({ // Changed to reactive
  email: '',
});

// Handle form submission
// CRITICAL FIX: Correctly access event.data.email
const handleForgotPassword = async (event: FormSubmitEvent<typeof forgotPasswordSchema._type>) => { // Corrected type
  loading.value = true;

  try {
    const emailToReset = event.data.email.toLowerCase().trim(); // CRITICAL FIX: Access event.data.email
    console.log('Sending reset link for email:', emailToReset);

    const response = await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: {
        email: emailToReset,
      },
    });

    console.log('Forgot password API response:', response); // Log API response for debugging

    toast.add({
      title: 'Reset link sent!',
      description: 'Check your email for password reset instructions.',
      icon: 'i-heroicons-check-circle',
      color: 'green',
      timeout: 5000,
    });

    setTimeout(() => {
      navigateTo('/login');
    }, 2000);
  } catch (error: any) { // Type error as 'any' for robust handling
    console.error('Forgot password error:', error);

    let errorMessage = 'Unable to send reset link. Please try again.';

    if (error?.data?.message) {
      errorMessage = error.data.message;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    toast.add({
      title: 'Unable to send reset link',
      description: errorMessage,
      icon: 'i-heroicons-exclamation-triangle',
      color: 'red',
      timeout: 5000,
    });
  } finally {
    loading.value = false;
  }
};

// Auto-focus email field on mount
onMounted(() => {
  nextTick(() => {
    const emailInput = document.querySelector('input[type="email"]');
    emailInput?.focus();
  });
});
</script>