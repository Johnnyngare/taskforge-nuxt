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
            <Icon name="heroicons:bolt-solid" class="w-7 h-7 text-white" />
          </div>
        </NuxtLink>

        <h1
          class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3"
        >
          Welcome back
        </h1>
        <p class="text-base text-gray-600 dark:text-gray-400">
          Sign in to your TaskForge account
        </p>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?
          <NuxtLink
            to="/register"
            class="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 rounded-sm"
          >
            Create one now
          </NuxtLink>
        </p>
      </div>

      <!-- Main Card -->
      <div
        class="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-2xl"
      >
        <div class="space-y-6">
          <!-- Google OAuth Button -->
          <FormAppButton
            block
            variant="outline"
            :loading="googleLoading"
            :disabled="loading"
            class="border-slate-600 hover:bg-slate-700 hover:border-slate-500 text-slate-200"
            @click="handleGoogleLogin"
          >
            <Icon name="simple-icons:google" class="w-5 h-5 mr-2" />
            Continue with Google
          </FormAppButton>

          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-slate-800 px-2 text-slate-500">or continue with email</span>
          </div>

          <!-- Login Form -->
          <form @submit.prevent="handleLogin" class="space-y-6">
            <!-- Email Field -->
            <FormAppInput
              label="Email address"
              name="email"
              type="email"
              placeholder="Enter your email"
              v-model="formState.email"
              :disabled="loading || googleLoading"
              required
              help-text="We'll never share your email"
            />

            <!-- Password Field -->
            <FormAppInput
              label="Password"
              name="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter your password"
              v-model="formState.password"
              :disabled="loading || googleLoading"
              required
            >
              <!-- Manual trailing button for password visibility -->
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
              >
                <Icon
                  :name="
                    showPassword ? 'heroicons:eye-slash' : 'heroicons:eye'
                  "
                  class="w-5 h-5"
                />
              </button>
            </FormAppInput>

            <!-- Remember Me & Forgot Password -->
            <div class="flex items-center justify-between">
              <label class="flex items-center text-sm text-slate-400">
                <input
                  type="checkbox"
                  v-model="formState.rememberMe"
                  :disabled="loading || googleLoading"
                  class="rounded border-slate-600 bg-slate-700 text-emerald-500 shadow-sm focus:ring-emerald-500"
                />
                <span class="ml-2">Remember me</span>
              </label>
              <NuxtLink
                to="/forgot-password"
                class="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-sm"
              >
                Forgot password?
              </NuxtLink>
            </div>

            <!-- Submit Button -->
            <FormAppButton
              type="submit"
              block
              size="lg"
              :loading="loading"
              :disabled="googleLoading"
              class="shadow-lg hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300"
            >
              <Icon
                name="heroicons:arrow-right-on-rectangle"
                class="w-5 h-5 mr-2"
              />
              Sign in to your account
            </FormAppButton>
          </form>

          <!-- Additional Help -->
          <div class="pt-4 text-center">
            <p class="text-xs text-slate-500">
              Having trouble signing in?
              <NuxtLink
                to="/support"
                class="font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Contact support
              </NuxtLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> <!-- THIS is the final closing template tag for the file -->

<script setup lang="ts">
import { z } from "zod";
import { reactive, ref, onMounted, onUnmounted, nextTick } from "vue";
import { useAuth } from "~/composables/useAuth";

// Meta and SEO
useSeoMeta({
  title: "Sign In - TaskForge",
  description:
    "Sign in to your TaskForge account to access your productivity dashboard.",
  robots: "noindex, nofollow",
});

// Protect guest routes
definePageMeta({
  middleware: ["guest"],
  layout: "auth",
});

// Composables
const { login } = useAuth();
const toast = useToast();

// Reactive state
const loading = ref(false);
const googleLoading = ref(false);
const showPassword = ref(false);
const formRef = ref<HTMLFormElement | null>(null);

// Zod validation schema
const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters long"),
  rememberMe: z.boolean().optional(),
});

// Form state - Use reactive() for objects
const formState = reactive({
  email: "",
  password: "",
  rememberMe: false,
});

// Handle form submission
const handleLogin = async () => {
  loading.value = true;

  // Manual Zod validation
  try {
    loginSchema.parse(formState);
  } catch (validationError: any) {
    const errorDetails = validationError.errors.map(e => e.message).join(', ');
    toast.add({
      title: "Validation Failed",
      description: errorDetails,
      icon: "i-heroicons-exclamation-circle",
      color: "orange",
      timeout: 4000,
    });
    loading.value = false;
    return;
  }

  try {
    await login({
      email: formState.email,
      password: formState.password,
    });

    toast.add({
      title: "Welcome back!",
      description: "Successfully signed in.",
      icon: "i-heroicons-check-circle",
      color: "green",
      timeout: 3000,
    });

    // Navigation is handled by the auth composable on success
  } catch (error: any) {
    const errorMessage =
      error?.data?.message || error?.message || "An unexpected error occurred during login.";
    toast.add({
      title: "Sign in failed",
      description: errorMessage,
      icon: "i-heroicons-exclamation-triangle",
      color: "red",
      timeout: 5000,
    });
  } finally {
    loading.value = false;
  }
};

// handleFormError is less critical if manual validation is done
const handleFormError = (event: Event) => {
  console.warn("Form validation error (UForm):", event);
  toast.add({
    title: "Please check your input",
    description: "Some fields contain invalid information.",
    icon: "i-heroicons-exclamation-circle",
    color: "orange",
    timeout: 4000,
  });
};

const handleGoogleLogin = async () => {
  googleLoading.value = true;
  try {
    await navigateTo("/api/auth/google", { external: true });
  } catch (error: any) {
    toast.add({
      title: "Google sign-in unavailable",
      description: error?.message || "Could not redirect to Google. Please try again later.",
      icon: "i-heroicons-exclamation-triangle",
      color: "red",
      timeout: 5000,
    });
  } finally {
    googleLoading.value = false;
  }
};

onMounted(() => {
  nextTick(() => {
    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement | null;
    emailInput?.focus();
  });
});

onUnmounted(() => {
  // Add cleanup for keyboard shortcuts if implemented
});
</script>