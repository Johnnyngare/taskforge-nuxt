// composables/useAuth.ts
import { computed, readonly } from 'vue';
import { useCookie, navigateTo, useState, useRequestHeaders } from '#app';
import { useNotifier } from '~/composables/useNotifier';
import type { IUser } from '~/types/user'; // Ensure IUser is correctly defined

export const useAuth = () => {
  const user = useState<IUser | null>('user', () => null);
  const authToken = useCookie<string | null>('auth_token');
  const notifier = useNotifier();

  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isManager = computed(() => user.value?.role === 'manager');
  // Add other roles if they exist in your IUser interface and you want to check them
  // const isFieldOfficer = computed(() => user.value?.role === 'field_officer');
  // const isDispatcher = computed(() => user.value?.role === 'dispatcher');

  // --- THE FIX IS HERE ---
  // Define a computed property that determines if the user can manage SOPs.
  // Adjust the roles included here based on your actual permissions for SOPs.
  const canManageSOPs = computed(() =>
    isAdmin.value ||
    isManager.value ||
    user.value?.role === 'dispatcher' // Include 'dispatcher' role for SOP management
    // Add other roles that should manage SOPs, e.g., || user.value?.role === 'another_sop_manager_role'
  );

  const clearUser = () => {
    user.value = null;
    authToken.value = null;
  };

  const fetchUser = async () => {
    if (user.value) return; // Already fetched

    const token = authToken.value;
    if (!token) return; // No token, no user

    try {
      const headers: HeadersInit = {};
      if (process.server) {
        headers.cookie = useRequestHeaders(['cookie']).cookie || '';
      } else {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await $fetch<{ user: IUser }>('/api/auth/me', { headers });
      if (response.user) {
        user.value = response.user;
      } else {
        clearUser();
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      clearUser();
    }
  };

  const login = async (credentials: { email: string; password: string }): Promise<boolean> => {
    try {
      const response = await $fetch<{ user: IUser }>('/api/auth/login', {
        method: 'POST',
        body: credentials,
      });

      if (response.user) {
        user.value = response.user;
        notifier.success({ title: 'Welcome back!', description: 'Successfully signed in.' });
        await navigateTo('/dashboard', { external: true });
        return true;
      }
      return false;
    } catch (error: any) {
      const msg = error.data?.message || 'Invalid credentials or server error.';
      notifier.error({ title: 'Login Failed', description: msg });
      return false;
    }
  };

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      clearUser();
      notifier.info({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      await navigateTo('/login');
    }
  };

  return {
    user: readonly(user),
    isAuthenticated,
    isAdmin,
    isManager,
    canManageSOPs, // --- NEW: Expose this computed property ---
    login,
    logout,
    fetchUser,
  };
};