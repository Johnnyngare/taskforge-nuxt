<!-- C:/Users/HomePC/taskforge-nuxt/pages/reset-password.vue -->
<template>
  <div
    class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800"
  >
    <div class="relative w-full max-w-md space-y-8">
      <div class="text-center">
        <NuxtLink to="/" class="inline-flex items-center justify-center mb-8 group" aria-label="Home">
          <div class="w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
            <UIcon name="i-heroicons-bolt-solid" class="w-7 h-7 text-white" />
          </div>
        </NuxtLink>
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
          Set New Password
        </h1>
        <p class="text-base text-gray-600 dark:text-gray-400">
          Enter your new password below.
        </p>
      </div>

      <UCard class="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div class="px-6 py-8 space-y-6">
          <UAlert v-if="tokenError" icon="i-heroicons-exclamation-triangle" color="red" variant="subtle" :title="tokenError" class="mb-4" />
          
          <UForm
            v-if="!tokenError"
            ref="formRef"
            :state="formState"
            :schema="resetPasswordSchema"
            @submit="handleResetPassword"
            class="space-y-6"
          >
            <UFormGroup label="New Password" name="password" required>
              <UInput
                v-model="formState.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Create a strong password"
                icon="i-heroicons-lock-closed"
                :disabled="loading"
                size="lg"
                autocomplete="new-password"
                required
              >
                <template #trailing>
                  <UButton
                    :icon="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                    variant="ghost"
                    color="gray"
                    size="xs"
                    :aria-label="showPassword ? 'Hide password' : 'Show password'"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </UInput>
            </UFormGroup>

            <UFormGroup label="Confirm Password" name="confirmPassword" required>
              <UInput
                v-model="formState.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Confirm your new password"
                icon="i-heroicons-lock-closed"
                :disabled="loading"
                size="lg"
                autocomplete="new-password"
                required
              >
                <template #trailing>
                  <UButton
                    :icon="showConfirmPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                    variant="ghost"
                    color="gray"
                    size="xs"
                    :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                    @click="showConfirmPassword = !showConfirmPassword"
                  />
                </template>
              </UInput>
            </UFormGroup>

            <UButton
              type="submit"
              size="lg"
              block
              :loading="loading"
              class="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
            >
              Set New Password
            </UButton>
          </UForm>
          
          <div v-if="successMessage" class="text-center text-green-500">
            <p>{{ successMessage }}</p>
            <NuxtLink to="/login" class="mt-4 inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-500">
              <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 mr-2" />
              Back to Login
            </NuxtLink>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted } from 'vue';
import { z } from 'zod';
import type { FormSubmitEvent } from '#ui/types';
import { useAppToast } from '~/composables/useAppToast';
import { useRoute, navigateTo } from '#app';

definePageMeta({
  layout: 'auth',
  auth: false, // Ensure this page is accessible to unauthenticated users
});

useSeoMeta({
  title: 'Reset Password - TaskForge',
  description: 'Set a new password for your TaskForge account.',
  robots: 'noindex, nofollow',
});

const toast = useAppToast();
const route = useRoute();

const loading = ref(false);
const formRef = ref();
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const tokenError = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const resetPasswordSchema = z.object({
  password: z
    .string({ required_error: 'New password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number'),
  confirmPassword: z
    .string({ required_error: 'Please confirm your new password' })
    .min(1, 'Please confirm your new password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

const formState = reactive<ResetPasswordSchema>({
  password: '',
  confirmPassword: '',
});

onMounted(() => {
  const token = route.query.token as string | undefined;
  if (!token) {
    tokenError.value = 'Password reset token is missing from the URL. Please use the link from your email.';
    console.error('Reset Password: Missing token in URL query.');
  }
});

const handleResetPassword = async (event: FormSubmitEvent<ResetPasswordSchema>) => {
  if (loading.value || tokenError.value) return;

  const token = route.query.token as string | undefined;
  if (!token) {
    tokenError.value = 'Password reset token is missing from the URL. Please try again.';
    console.error('Reset Password: No token in URL for submission.');
    return;
  }

  loading.value = true;
  try {
    const payload = {
      token,
      password: event.data.password,
    };

    const response = await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: payload,
    });

    console.log('Password reset API response:', response);
    successMessage.value = response.message || 'Your password has been successfully reset. You can now log in.';

    toast.add({
      title: 'Password Reset!',
      description: 'Your password has been updated. Please sign in.',
      icon: 'i-heroicons-check-circle',
      color: 'green',
      timeout: 5000,
    });

    setTimeout(() => {
      navigateTo('/login');
    }, 2000);
  } catch (error: any) {
    console.error('Password reset error:', error);
    let errorMessage = error.data?.message || error.statusMessage || 'Failed to reset password. Please try again or request a new link.';
    tokenError.value = errorMessage; // Display error at the top
    toast.add({
      title: 'Reset Failed',
      description: errorMessage,
      icon: 'i-heroicons-exclamation-triangle',
      color: 'red',
      timeout: 7000,
    });
  } finally {
    loading.value = false;
  }
};
</script>