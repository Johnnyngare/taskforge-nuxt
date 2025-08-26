<!-- pages/register.vue -->
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
          Join TaskForge
        </h1>
        <p class="text-base text-gray-600 dark:text-gray-400">
          Create your account and start boosting productivity
        </p>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Already have an account?
          <NuxtLink
            to="/login"
            class="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 rounded-sm"
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
            @click="handleGoogleRegister"
          >
            <template #leading>
              <UIcon name="i-simple-icons-google" class="w-5 h-5" />
            </template>
            Sign up with Google
          </UButton>

          <UDivider
            label="or create account with email"
            class="text-gray-400 dark:text-gray-500"
          />

          <!-- Registration Form -->
          <UForm
            ref="formRef"
            :state="formState"
            :schema="registerSchema"
            @submit="handleRegister"
            @error="handleFormError"
            class="space-y-6"
            :validate-on="['blur', 'input', 'change']"
          >
            <!-- Full Name Field -->
            <UFormGroup
              label="Full name"
              name="name"
              required
              help="This will be displayed on your profile"
            >
              <UInput
                v-model="formState.name"
                type="text"
                placeholder="Enter your full name"
                icon="i-heroicons-user"
                :disabled="loading || googleLoading"
                size="lg"
                :ui="{
                  icon: { leading: { pointer: '' } },
                  base: 'focus:ring-2 focus:ring-emerald-500 transition-all duration-200',
                }"
                autocomplete="name"
                required
              />
            </UFormGroup>

            <!-- Email Field -->
            <UFormGroup
              label="Email address"
              name="email"
              required
              help="We'll send you important updates here"
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
                placeholder="Create a strong password"
                icon="i-heroicons-lock-closed"
                :disabled="loading || googleLoading"
                size="lg"
                :ui="{
                  icon: { leading: { pointer: '' } },
                  base: 'focus:ring-2 focus:ring-emerald-500 transition-all duration-200',
                }"
                autocomplete="new-password"
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

              <!-- Password Strength Indicator -->
              <div class="mt-2">
                <div class="flex items-center gap-2 text-xs">
                  <span class="text-gray-500 dark:text-gray-400"
                    >Strength:</span
                  >
                  <div class="flex gap-1">
                    <div
                      v-for="i in 4"
                      :key="i"
                      class="w-6 h-1 rounded-full transition-colors duration-200"
                      :class="getPasswordStrengthColor(i)"
                    ></div>
                  </div>
                  <span
                    class="font-medium transition-colors duration-200"
                    :class="getPasswordStrengthTextColor()"
                  >
                    {{ passwordStrengthText }}
                  </span>
                </div>
                <ul
                  class="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1"
                >
                  <li class="flex items-center gap-2">
                    <UIcon
                      :name="
                        passwordCriteria.length
                          ? 'i-heroicons-check-circle'
                          : 'i-heroicons-x-circle'
                      "
                      :class="
                        passwordCriteria.length
                          ? 'text-green-500'
                          : 'text-gray-400'
                      "
                      class="w-3 h-3"
                    />
                    At least 8 characters
                  </li>
                  <li class="flex items-center gap-2">
                    <UIcon
                      :name="
                        passwordCriteria.uppercase
                          ? 'i-heroicons-check-circle'
                          : 'i-heroicons-x-circle'
                      "
                      :class="
                        passwordCriteria.uppercase
                          ? 'text-green-500'
                          : 'text-gray-400'
                      "
                      class="w-3 h-3"
                    />
                    One uppercase letter
                  </li>
                  <li class="flex items-center gap-2">
                    <UIcon
                      :name="
                        passwordCriteria.number
                          ? 'i-heroicons-check-circle'
                          : 'i-heroicons-x-circle'
                      "
                      :class="
                        passwordCriteria.number
                          ? 'text-green-500'
                          : 'text-gray-400'
                      "
                      class="w-3 h-3"
                    />
                    One number
                  </li>
                </ul>
              </div>
            </UFormGroup>

            <!-- Confirm Password Field -->
            <UFormGroup
              label="Confirm password"
              name="confirmPassword"
              required
            >
              <UInput
                v-model="formState.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Confirm your password"
                icon="i-heroicons-lock-closed"
                :disabled="loading || googleLoading"
                size="lg"
                :ui="{
                  icon: { leading: { pointer: '' } },
                  base: 'focus:ring-2 focus:ring-emerald-500 transition-all duration-200',
                }"
                autocomplete="new-password"
                required
              >
                <template #trailing>
                  <UButton
                    :icon="
                      showConfirmPassword
                        ? 'i-heroicons-eye-slash'
                        : 'i-heroicons-eye'
                    "
                    variant="ghost"
                    color="gray"
                    size="xs"
                    :aria-label="
                      showConfirmPassword ? 'Hide password' : 'Show password'
                    "
                    @click="showConfirmPassword = !showConfirmPassword"
                  />
                </template>
              </UInput>
            </UFormGroup>

            <!-- Terms and Privacy -->
            <UFormGroup name="acceptTerms" required>
              <UCheckbox
                v-model="formState.acceptTerms"
                :disabled="loading || googleLoading"
                required
              >
                <template #label>
                  <span class="text-sm text-gray-600 dark:text-gray-300">
                    I agree to the
                    <NuxtLink
                      to="/terms"
                      target="_blank"
                      class="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium transition-colors duration-200"
                    >
                      Terms of Service
                    </NuxtLink>
                    and
                    <NuxtLink
                      to="/privacy"
                      target="_blank"
                      class="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium transition-colors duration-200"
                    >
                      Privacy Policy
                    </NuxtLink>
                  </span>
                </template>
              </UCheckbox>
            </UFormGroup>

            <!-- Marketing Opt-in -->
            <UFormGroup name="acceptMarketing">
              <UCheckbox
                v-model="formState.acceptMarketing"
                :disabled="loading || googleLoading"
              >
                <template #label>
                  <span class="text-sm text-gray-600 dark:text-gray-300">
                    Send me productivity tips and product updates (optional)
                  </span>
                </template>
              </UCheckbox>
            </UFormGroup>

            <!-- Submit Button -->
            <UButton
              type="submit"
              size="lg"
              block
              :loading="loading"
              :disabled="googleLoading || !formState.acceptTerms"
              class="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <template #leading>
                <UIcon name="i-heroicons-user-plus" class="w-5 h-5" />
              </template>
              Create your account
            </UButton>
          </UForm>

          <!-- Additional Help -->
          <div class="text-center pt-4">
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Need help getting started?
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
  title: "Create Account - TaskForge",
  description:
    "Join TaskForge today and transform your productivity with our powerful task management platform.",
  robots: "noindex, nofollow",
});

// Protect guest routes
definePageMeta({
  layout: "auth",
});

// Composables
const { register } = useAuth(); // Import `register` from `useAuth`
const toast = useToast();

// Reactive state
const loading = ref(false);
const googleLoading = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const formRef = ref();

// Zod validation schema (this is already good and used by UForm)
const registerSchema = z
  .object({
    name: z
      .string({ required_error: "Full name is required" })
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be less than 50 characters")
      .regex(
        /^[a-zA-Z\s'-]+$/,
        "Name can only contain letters, spaces, hyphens, and apostrophes"
      ),
    email: z
      .string({ required_error: "Email is required" })
      .min(1, "Email is required")
      .email("Please enter a valid email address")
      .max(254, "Email is too long"),
    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long")
      .regex(
        /(?=.*[a-z])/,
        "Password must contain at least one lowercase letter"
      )
      .regex(
        /(?=.*[A-Z])/,
        "Password must contain at least one uppercase letter"
      )
      .regex(/(?=.*\d)/, "Password must contain at least one number"),
    confirmPassword: z
      .string({ required_error: "Please confirm your password" })
      .min(1, "Please confirm your password"),
    acceptTerms: z
      .boolean({ required_error: "You must accept the terms of service" })
      .refine((val) => val === true, "You must accept the terms of service"),
    acceptMarketing: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"], // Apply error to confirmPassword field
  });

// Form state (already reactive) - use `reactive` for complex objects
const formState = reactive({
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
  acceptMarketing: false,
});

// Password strength calculation
const passwordStrength = computed(() => {
  const password = formState.password;
  if (!password) return 0;

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++; // Check for special characters
  return score;
});

const passwordStrengthText = computed(() => {
  switch (passwordStrength.value) {
    case 0: return "None"; // Added for initial state
    case 1: return "Weak";
    case 2: return "Fair";
    case 3: return "Good";
    case 4: return "Strong";
    default: return "Weak";
  }
});

const passwordCriteria = computed(() => ({
  length: formState.password.length >= 8,
  uppercase: /[A-Z]/.test(formState.password),
  number: /[0-9]/.test(formState.password),
  specialChar: /[^A-Za-z0-9]/.test(formState.password), // Added special character check
}));

const getPasswordStrengthColor = (index) => {
  const strength = passwordStrength.value;
  if (index === 0) return "bg-gray-300 dark:bg-gray-600"; // No strength
  if (index <= strength) {
    switch (strength) {
      case 1: return "bg-red-500";
      case 2: return "bg-yellow-500";
      case 3: return "bg-blue-500";
      case 4: return "bg-green-500";
      default: return "bg-gray-300 dark:bg-gray-600";
    }
  }
  return "bg-gray-300 dark:bg-gray-600";
};

const getPasswordStrengthTextColor = () => {
  const strength = passwordStrength.value;
  switch (strength) {
    case 0: return "text-gray-500 dark:text-gray-400"; // None
    case 1: return "text-red-600 dark:text-red-400";
    case 2: return "text-yellow-600 dark:text-yellow-400";
    case 3: return "text-blue-600 dark:text-blue-400";
    case 4: return "text-green-600 dark:text-green-400";
    default: return "text-gray-500 dark:text-gray-400";
  }
};

// Handle form submission (UForm handles validation before this runs)
const handleRegister = async () => {
  loading.value = true;

  try {
    // UForm has already validated based on `registerSchema` before @submit is called.
    // The `data` parameter from UForm's @submit event should be the validated object.
    // However, if you're not receiving `data` as a parameter to handleRegister,
    // we take the data directly from `formState`.
    const payload = {
      name: formState.name.trim(),
      email: formState.email.toLowerCase().trim(),
      password: formState.password,
      // Only include acceptMarketing if your backend user model has it defined.
      // Otherwise, explicitly omit it from the payload if the backend is strict.
      // Assuming your backend schema now includes optional acceptMarketing
      acceptMarketing: formState.acceptMarketing,
    };

    console.log('Final payload sent to backend:', payload); // Keep for debugging

    // Call the register action from useAuth
    await register(payload);

    toast.add({
      title: "Welcome to TaskForge!",
      description:
        "Your account has been created successfully. You can now sign in.",
      icon: "i-heroicons-check-circle",
      color: "green",
      timeout: 5000,
    });

    await nextTick();
    await navigateTo("/login"); // Redirect to login page after successful registration
  } catch (error) {
    console.error("Registration error:", error);

    let errorMessage = "An unexpected error occurred during registration";

    // Access specific error message from server if available (e.g., from createError)
    if (error && typeof error === 'object' && 'data' in error && error.data && 'message' in error.data) {
      errorMessage = error.data.message;
    } else if (error instanceof Error && error.message) {
      errorMessage = error.message;
    } else if (error && typeof error === 'object' && 'statusMessage' in error && typeof error.statusMessage === 'string') {
        errorMessage = error.statusMessage;
    }


    // Handle common registration errors for user feedback
    if (errorMessage.includes("email already exists")) {
      errorMessage = "This email address is already registered. Please use a different email or sign in.";
    } else if (errorMessage.includes("password must be") || errorMessage.includes("Password does not meet criteria")) {
      errorMessage = "Password does not meet criteria.";
    } else if (errorMessage.includes("name")) { // Check for name error
        errorMessage = "Please check name field.";
    }


    toast.add({
      title: "Registration failed",
      description: errorMessage,
      icon: "i-heroicons-exclamation-triangle",
      color: "red",
      timeout: 5000,
    });

    // Focus back to the problematic field (simplified for common cases)
    await nextTick();
    if (errorMessage.includes("email")) {
      const emailInput = document.querySelector('input[type="email"]');
      emailInput?.focus();
    } else if (errorMessage.includes("password")) {
      const passwordInput = document.querySelector('input[autocomplete="new-password"]');
      passwordInput?.focus();
    } else if (errorMessage.includes("name")) {
      const nameInput = document.querySelector('input[autocomplete="name"]');
      nameInput?.focus();
    }
  } finally {
    loading.value = false;
  }
};

// Handle form validation errors (UForm will call this if schema validation fails)
const handleFormError = (event) => {
  console.warn("Client-side form validation error (via UForm schema):", event);
  toast.add({
    title: "Please check your input",
    description: "Some fields contain invalid information or are missing.",
    icon: "i-heroicons-exclamation-circle",
    color: "orange",
    timeout: 4000,
  });
};

// Handle Google OAuth registration
const handleGoogleRegister = async () => {
  googleLoading.value = true;

  try {
    toast.add({
      title: "Redirecting to Google...",
      description:
        "Please wait while we redirect you to Google for registration.",
      icon: "i-heroicons-arrow-top-right-on-square",
      color: "blue",
      timeout: 2000,
    });

    await new Promise((resolve) => setTimeout(resolve, 500));
    await navigateTo("/api/oauth/google", { external: true });
  } catch (error) {
    console.error("Google registration error:", error);

    toast.add({
      title: "Google sign-up unavailable",
      description:
        "Unable to connect to Google. Please try creating an account with email instead.",
      icon: "i-heroicons-exclamation-triangle",
      color: "red",
      timeout: 5000,
    });
  } finally {
    googleLoading.value = false;
  }
};

// Auto-focus name field on mount
onMounted(() => {
  nextTick(() => {
    const nameInput = document.querySelector('input[autocomplete="name"]');
    nameInput?.focus();
  });
});

// Handle keyboard shortcuts
onMounted(() => {
  const handleKeydown = (event) => {
    // Alt + G for Google registration
    if (event.altKey && event.key === "g" && !loading.value) {
      event.preventDefault();
      handleGoogleRegister();
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

.custom-focus:focus-visible {
  outline: 2px solid theme("colors.emerald.500");
  outline-offset: 2px;
}

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

.password-strength-bar {
  transition: all 0.3s ease;
}
</style>```

### The Problem: `Cannot read properties of undefined (reading 'req')` in `middleware/auth.ts`

The log confirms that `middleware/auth.ts` (your server-side middleware) is still the source of the crash, specifically pointing to `getCookie(event, 'auth_token')`. This error happens when the `event` object's `node.req` property is missing or `undefined` for certain internal requests that Nuxt's Nitro server handles.

**The code for `server/middleware/auth.ts` that handles this should be:**

```typescript
// server/middleware/auth.ts
import { defineEventHandler, getCookie } from "h3";
import { verifyJwt } from "~/server/utils/jwtHelper";

export default defineEventHandler(async (event) => {
  const url = event.node?.req?.url;

  // FIX: Skip authentication for known internal Nuxt/Vite paths that don't have full HTTP contexts.
  if (url && (url.startsWith('/__nuxt_icon') || url.startsWith('/__nuxt_error') || url.startsWith('/_nuxt/'))) {
    return;
  }
  
  // FIX: CRITICAL GUARD for 'Cannot read properties of undefined (reading 'req')'
  // Ensure event.node.req and event.node.req.headers are defined before proceeding.
  if (!event || !event.node || !event.node.req || !event.node.req.headers) {
      // Log for debugging these specific skipped cases
      console.error("SERVER MIDDLEWARE ERROR: Incomplete event context (missing req/headers). Skipping auth check for URL:", url || 'unknown');
      return; 
  }

  const token = getCookie(event, "auth_token");

  if (!token) {
    return;
  }

  const decoded = await verifyJwt(token);

  if (decoded) {
    event.context.user = decoded;
  }
});