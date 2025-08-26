// C:/Users/HomePC/taskforge-nuxt/composables/useAuth.ts
import { computed, readonly, ref } from 'vue';
import { useCookie, navigateTo, useState, useFetch } from '#app';
import { useAppToast } from '~/composables/useAppToast';
import type { IUser } from '~/types/user';

// Use Nuxt's useState for state that is shared across components and persists through SSR
const useUser = () => useState<IUser | null>('user', () => null);
const useAuthInitialized = () =>
  useState<boolean>('auth-initialized', () => false);

export const useAuth = () => {
  const user = useUser();
  const initialized = useAuthInitialized();
  const authToken = useCookie<string | null>('auth_token');
  const toast = useAppToast();
  const loading = ref(false); // Manages loading state for login/register actions

  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isManager = computed(() => user.value?.role === 'manager');
  const isDispatcher = computed(() => user.value?.role === 'dispatcher');
  // canManageSOPs depends on other roles being correctly defined
  const canManageSOPs = computed(() => isAdmin.value || isManager.value || isDispatcher.value); // Added isDispatcher


  const clearState = () => {
    user.value = null;
    authToken.value = null;
    initialized.value = false; // Reset initialized state on logout
  };

  /**
   * Fetches the current user based on the auth token.
   * This function is now memoized and will only run once per application load.
   */
  const fetchUser = async () => {
    if (initialized.value) {
      return; // Skips the fetch if we've already tried.
    }
    
    // Check for token first to avoid unnecessary API call
    if (!authToken.value) {
      user.value = null;
      initialized.value = true;
      return;
    }

    try {
      // useFetch is the idiomatic way to fetch data in Nuxt 3.
      // It automatically handles SSR data transfer ("dehydration").
      const { data } = await useFetch('/api/oauth/me'); // This implicitly sends cookies via server context
      user.value = data.value?.user ?? null;
      console.log('useAuth: fetchUser completed. User:', user.value ? user.value.email : 'null');
    } catch (error) {
      console.error('useAuth: Failed to fetch user:', error);
      user.value = null; // Ensure user is null on error
      // Optionally clear cookie if token is definitively invalid
      // deleteCookie(event, authToken.name); // Not accessible here directly, auth middleware should do it
    } finally {
      // IMPORTANT: Mark as initialized regardless of success or failure.
      // This prevents repeated API calls on subsequent navigation.
      initialized.value = true;
    }
  };

  // --- Register function ---
  const register = async (userData: { name: string; email: string; password: string }) => {
    if (loading.value) return;
    loading.value = true;
    try {
      console.log('useAuth: Attempting user registration for:', userData.email);
      // The register API route will handle user creation and potentially login/redirect.
      // We don't expect a direct user object back from this endpoint for security.
      await $fetch('/api/oauth/register', {
        method: 'POST',
        body: userData,
      });
      // Assuming successful response means user is created, and the client will be redirected.
      console.log('useAuth: Registration API call successful.');
      // The page component will handle success toasts and redirects.
    } catch (error: any) {
      console.error('useAuth: Registration failed:', error);
      const msg = error.data?.message || 'Registration failed.';
      toast.add({
        title: 'Registration Failed',
        description: msg,
        color: 'red',
        icon: 'i-heroicons-exclamation-triangle',
      });
      throw error; // Re-throw to allow the page component to handle loading state
    } finally {
      loading.value = false;
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    if (loading.value) return;
    loading.value = true;
    try {
      console.log('useAuth: Attempting user login for:', credentials.email);
      const response = await $fetch<{ user: IUser }>('/api/oauth/login', {
        method: 'POST',
        body: credentials,
      });

      if (response.user) {
        initialized.value = false; // Force re-fetch user context after successful login
        user.value = response.user; // Set user directly
        toast.add({
          title: 'Welcome back!',
          description: 'Successfully signed in.',
          icon: 'i-heroicons-check-circle',
          color: 'green',
        });
        await navigateTo('/dashboard', { replace: true });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('useAuth: Login failed:', error);
      const msg = error.data?.message || 'Invalid credentials or server error.';
      toast.add({
        title: 'Login Failed',
        description: msg,
        icon: 'i-heroicons-exclamation-triangle',
        color: 'red',
      });
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    try {
      console.log('useAuth: Attempting logout...');
      await $fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      clearState(); // Clear all auth state
      toast.add({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
        color: 'blue',
        icon: 'i-heroicons-information-circle',
      });
      await navigateTo('/login');
    }
  };

  return {
    user: readonly(user),
    isAuthenticated,
    isAdmin,
    isManager,
    isDispatcher,
    canManageSOPs, // Expose canManageSOPs
    loading: readonly(loading),
    fetchUser,
    register, // <--- CRITICAL: Make sure `register` is explicitly returned here
    login,
    logout,
  };
};