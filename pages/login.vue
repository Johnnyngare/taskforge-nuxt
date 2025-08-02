<!-- pages/login.vue -->
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
      <UCard
        class="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
      >
        <div class="px-6 py-8 space-y-6">
          <!-- Google OAuth Button -->
          <UButton
            icon="i-simple-icons-google"
            size="lg"
            block
            variant="outline"
            color="gray"
            :loading="googleLoading"
            :disabled="loading"
            class="justify-center border-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            @click="handleGoogleLogin"
          >
            <template #leading>
              <UIcon name="i-simple-icons-google" class="w-5 h-5" />
            </template>
            Continue with Google
          </UButton>

          <UDivider
            label="or continue with email"
            class="text-gray-400 dark:text-gray-500"
          />

          <!-- Login Form -->
          <UForm
            ref="formRef"
            :state="formState"
            :schema="loginSchema"
            @submit="handleLogin"
            @error="handleFormError"
            class="space-y-6"
            :validate-on="['blur', 'input', 'change']"
          >
            <!-- Email Field -->
            <UFormGroup
              label="Email address"
              name="email"
              required
              help="We'll never share your email"
            >
              <UInput
                v-model="formState.email"
                type="email"
                placeholder="Enter your email"
                icon="i-heroicons-envelope"
                :disabled="loading || googleLoading"
                size="lg"
                :ui="{
                  icon: { leading: { pointer: '' } },
                  base: 'focus:ring-2 focus:ring-emerald-500 transition-all duration-200',
                }"
                autocomplete="email"
                required
              />
            </UFormGroup>

            <!-- Password Field -->
            <UFormGroup label="Password" name="password" required>
              <UInput
                v-model="formState.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter your password"
                icon="i-heroicons-lock-closed"
                :disabled="loading || googleLoading"
                size="lg"
                :ui="{
                  icon: { leading: { pointer: '' } },
                  base: 'focus:ring-2 focus:ring-emerald-500 transition-all duration-200',
                }"
                autocomplete="current-password"
                required
              >
                <template #trailing>
                  <UButton
                    :icon="
                      showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'
                    "
                    variant="ghost"
                    color="gray"
                    size="xs"
                    :aria-label="
                      showPassword ? 'Hide password' : 'Show password'
                    "
                    @click="showPassword = !showPassword"
                  />
                </template>
              </UInput>
            </UFormGroup>

            <!-- Remember Me & Forgot Password -->
            <div class="flex items-center justify-between">
              <UCheckbox
                v-model="formState.rememberMe"
                label="Remember me"
                :disabled="loading || googleLoading"
                class="text-sm"
              />
              <NuxtLink
                to="/forgot-password"
                class="text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 rounded-sm"
              >
                Forgot password?
              </NuxtLink>
            </div>

            <!-- Submit Button -->
            <UButton
              type="submit"
              size="lg"
              block
              :loading="loading"
              :disabled="googleLoading"
              class="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <template #leading>
                <UIcon
                  name="i-heroicons-arrow-right-on-rectangle"
                  class="w-5 h-5"
                />
              </template>
              Sign in to your account
            </UButton>
          </UForm>

          <!-- Additional Help -->
          <div class="text-center pt-4">
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Having trouble signing in?
              <NuxtLink
                to="/support"
                class="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium transition-colors duration-200"
              >
                Contact support
              </NuxtLink>
            </p>
          </div>
        </div>
      </UCard>

      <!-- Security Notice -->
      <div class="text-center">
        <p
          class="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1"
        >
          <UIcon
            name="i-heroicons-shield-check"
            class="w-4 h-4 text-emerald-500"
          />
          Your data is protected with enterprise-grade security
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { z } from "zod";

// Meta and SEO
useSeoMeta({
  title: "Sign In - TaskForge",
  description:
    "Sign in to your TaskForge account to access your productivity dashboard.",
  robots: "noindex, nofollow", // Don't index login pages
});

// Protect guest routes
definePageMeta({
  middleware: ["guest"],
  layout: "auth", // Use a minimal auth layout without header/footer
});

// Composables
const { login } = useAuth();
const toast = useToast();

// Reactive state
const loading = ref(false);
const googleLoading = ref(false);
const showPassword = ref(false);
const formRef = ref();

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

// Handle form submission - UForm passes the validated data as the first argument
const handleLogin = async (event) => {
  loading.value = true;
  const data = event.data; // Get validated data from the event

  try {
    // Pass the validated data directly to the login function
    await login({
      email: data.email,
      password: data.password,
      rememberMe: data.rememberMe,
    });

    toast.add({
      title: "Welcome back!",
      description: "Successfully signed in to your account.",
      icon: "i-heroicons-check-circle",
      color: "green",
      timeout: 3000,
    });

    // Navigation will be handled by the auth composable
  } catch (error) {
    console.error("Login error:", error);

    // Handle specific error types
    const errorMessage =
      error?.data?.message || error?.message || "An unexpected error occurred";

    toast.add({
      title: "Sign in failed",
      description: errorMessage,
      icon: "i-heroicons-exclamation-triangle",
      color: "red",
      timeout: 5000,
    });

    // Focus back to email field for better UX
    await nextTick();
    const emailInput = document.querySelector('input[type="email"]');
    emailInput?.focus();
  } finally {
    loading.value = false;
  }
};

// Handle form validation errors
const handleFormError = (event) => {
  console.warn("Form validation error:", event);

  toast.add({
    title: "Please check your input",
    description: "Some fields contain invalid information.",
    icon: "i-heroicons-exclamation-circle",
    color: "orange",
    timeout: 4000,
  });
};

// Handle Google OAuth
const handleGoogleLogin = async () => {
  googleLoading.value = true;

  try {
    // Add some user feedback
    toast.add({
      title: "Redirecting to Google...",
      description:
        "Please wait while we redirect you to Google for authentication.",
      icon: "i-heroicons-arrow-top-right-on-square",
      color: "blue",
      timeout: 2000,
    });

    // Small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Redirect to Google OAuth
    await navigateTo("/api/auth/google", { external: true });
  } catch (error) {
    console.error("Google login error:", error);

    toast.add({
      title: "Google sign-in unavailable",
      description:
        "Unable to connect to Google. Please try signing in with email instead.",
      icon: "i-heroicons-exclamation-triangle",
      color: "red",
      timeout: 5000,
    });
  } finally {
    googleLoading.value = false;
  }
};

// Auto-focus email field on mount
onMounted(() => {
  nextTick(() => {
    const emailInput = document.querySelector('input[type="email"]');
    emailInput?.focus();
  });
});

// Handle keyboard shortcuts
onMounted(() => {
  const handleKeydown = (event) => {
    // Alt + G for Google login
    if (event.altKey && event.key === "g" && !loading.value) {
      event.preventDefault();
      handleGoogleLogin();
    }
  };

  document.addEventListener("keydown", handleKeydown);

  onUnmounted(() => {
    document.removeEventListener("keydown", handleKeydown);
  });
});
</script>

<style scoped>
/* Enhanced animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

/* Custom focus styles for better accessibility */
.custom-focus:focus-visible {
  outline: 2px solid theme("colors.emerald.500");
  outline-offset: 2px;
}

/* Loading shimmer effect */
@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.loading-shimmer {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  background-size: 200px 100%;
  animation: shimmer 1.5s infinite;
}
</style>
