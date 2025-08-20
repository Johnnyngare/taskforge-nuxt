// composables/useAuth.ts
import { computed, readonly } from 'vue';
import { useCookie, navigateTo, useState, useRequestHeaders } from '#app';
import { useNotifier } from '~/composables/useNotifier';
import type { IUser } from '~/types/user';

export const useAuth = () => {
  const user = useState<IUser | null>('user', () => null);
  const authToken = useCookie<string | null>('auth_token');
  const notifier = useNotifier();

  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isManager = computed(() => user.value?.role === 'manager');

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
    login,
    logout,
    fetchUser,
  };
};