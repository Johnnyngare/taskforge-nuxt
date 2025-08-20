// composables/useAuth.ts
import { ref, computed, readonly, watch } from 'vue';
import { useCookie } from '#app';
import { navigateTo } from '#app';
import { useNuxtApp } from '#app';
import { useNotifier } from '~/composables/useNotifier';

interface User {
  id: string;
  role: string;
  email: string;
  name?: string;
  profilePhoto?: string;
}

const user = ref<User | null>(null);
const loading = ref(false);
const initialized = ref(false);
const notifier = useNotifier();

export const useAuth = () => {
  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isTeamManager = computed(() => user.value?.role === 'manager');
  const isFieldOfficer = computed(() => user.value?.role === 'field_officer');
  const isDispatcher = computed(() => user.value?.role === 'dispatcher');

  const setAuthenticatedUser = (userData: User) => {
    user.value = userData;
    initialized.value = true;
    console.log('[useAuth] setAuthenticatedUser: User state set:', userData.id, userData.role, 'Name:', userData.name);
  };

  const clearUser = () => {
    user.value = null;
    initialized.value = true;
    useCookie('auth_token').value = null;
    console.log('[useAuth] clearUser: User state cleared.');
  };

  const fetchUser = async (): Promise<boolean> => {
    console.log("useAuth: fetchUser started. Current state - user:", user.value?.id || "null", "initialized:", initialized.value);
    if (loading.value) {
      console.log("useAuth: fetchUser skipped (already loading, awaiting previous fetch).");
      return await new Promise(resolve => {
        const unwatch = watch(loading, (newVal) => {
          if (!newVal) { unwatch(); resolve(!!user.value); }
        });
      });
    }

    if (initialized.value && user.value && user.value.name && user.value.email) {
      console.log("useAuth: fetchUser skipped (already fully hydrated with user and full data).");
      return true;
    }

    loading.value = true;
    let success = false;

    try {
      if (process.server) {
        const nuxtApp = useNuxtApp();
        const event = nuxtApp.ssrContext?.event;
        if (event && (event.context as any)?.user) {
          const contextUser = (event.context as any).user;
          user.value = typeof contextUser.toJSON === 'function' ? contextUser.toJSON() : { ...contextUser };
          console.log("useAuth: fetchUser hydrated from SSR context. User:", user.value?.id, user.value?.role, 'Name:', user.value?.name);
          success = true;
          return true;
        }
        console.log("useAuth: SSR context had no user. Client will try API.");
      }

      console.log("useAuth: Calling /api/auth/me for user data (client or unauthenticated SSR fallback).");
      const response: { statusCode: number; message: string; user?: User } = await $fetch("/api/auth/me", {
        method: "GET",
        credentials: "include"
      });

      if (response.statusCode === 200 && response.user) {
        user.value = response.user;
        console.log("useAuth: fetchUser successful via API. User:", user.value.id, user.value.role, 'Name:', user.value.name);
        success = true;
        return true;
      } else {
        console.warn("useAuth: API response for /api/auth/me missing user data or non-200 status:", response);
        clearUser();
        return false;
      }

    } catch (e: any) {
      user.value = null;
      const errorMessage = e.response?._data?.message || e.message || "Unknown error during fetchUser.";
      console.error("useAuth: fetchUser failed:", errorMessage);
      if (process.client) { notifier.error({ title: "Session Expired", description: "Please log in again." }); }
      return false;
    } finally {
      loading.value = false;
      initialized.value = true;
      console.log(`useAuth: fetchUser finished. Final user: ${user.value?.id || 'null'}. Success: ${success}.`);
    }
  };

  const register = async (userData: { name: string; email: string; password: string; role?: string }): Promise<boolean> => {
    loading.value = true;
    try {
      console.log("useAuth: Register started for:", userData.email);
      const response: { statusCode: number; message: string; user?: User } = await $fetch("/api/auth/register", {
        method: "POST",
        body: userData,
      });

      if (response.statusCode === 200 && response.user) {
        user.value = response.user;
        initialized.value = true;
        console.log("useAuth: Register successful. User state updated. Redirecting to dashboard.");
        notifier.success({ title: "Welcome!", description: "Registration successful. You are now logged in." });
        if (process.client) { window.location.href = '/dashboard'; } else { await navigateTo("/dashboard"); }
        return true;
      } else {
        const msg = response?.message || "Registration failed (API response problem).";
        console.error("useAuth: Register API responded unexpectedly:", response.statusCode, response);
        notifier.error({ title: "Registration Failed", description: msg });
        throw new Error(msg);
      }
    } catch (error: any) {
      user.value = null;
      const msg = error?.response?._data?.message || error?.message || "Unknown error during registration.";
      console.error("useAuth: Register failed:", msg);
      notifier.error({ title: "Registration Failed", description: msg });
      throw error;
    } finally {
      loading.value = false;
      console.log("useAuth: Register finished.");
    }
  };

  const login = async (credentials: { email: string; password: string }): Promise<boolean> => {
    loading.value = true;
    try {
      console.log("useAuth: Login started for:", credentials.email);
      const response: { statusCode: number; message: string; user?: User } = await $fetch("/api/auth/login", {
        method: "POST",
        body: credentials,
      });

      if (response.statusCode === 200 && response.user) {
        user.value = response.user;
        initialized.value = true;
        console.log("useAuth: Login successful. User state updated. Redirecting to dashboard.");
        notifier.success({ title: "Welcome back!", description: "Successfully signed in." });
        if (process.client) { window.location.href = '/dashboard'; } else { await navigateTo("/dashboard"); }
        return true;
      } else {
        const msg = response?.message || "Login failed (API response problem).";
        console.error("useAuth: Login API responded unexpectedly:", response.statusCode, response);
        notifier.error({ title: "Login Failed", description: msg });
        throw new Error(msg);
      }
    } catch (error: any) {
      user.value = null;
      const msg = error?.response?._data?.message || error?.message || "Invalid credentials or server error.";
      console.error("useAuth: Login failed:", msg);
      notifier.error({ title: "Login Failed", description: msg });
      throw error;
    } finally {
      loading.value = false;
      console.log("useAuth: Login finished.");
    }
  };

  const logout = async (): Promise<boolean> => {
    loading.value = true;
    try {
      console.log("useAuth: Logout started.");
      const response: { statusCode: number; message: string } = await $fetch("/api/auth/logout", {
        method: "POST",
        credentials: 'include'
      });

      if (response.statusCode === 200) {
        clearUser();
        console.log("useAuth: Logout successful. Redirecting to login.");
        notifier.info({ title: "Logged Out", description: "You have been successfully logged out." });
        await navigateTo("/login");
        return true;
      } else {
        const msg = response?.message || "Logout failed (API response problem).";
        console.error("useAuth: Logout API responded unexpectedly:", response.statusCode, response);
        notifier.error({ title: "Logout Failed", description: msg });
        throw new Error(msg);
      }
    } catch (error: any) {
      const msg = error?.response?._data?.message || error?.message || "Unknown error during logout.";
      console.error("useAuth: Logout failed:", msg);
      notifier.error({ title: "Logout Failed", description: msg });
      throw error;
    } finally {
      loading.value = false;
      console.log("useAuth: Logout finished.");
    }
  };

  return {
    user: readonly(user),
    loading: readonly(loading),
    initialized: readonly(initialized),
    isAuthenticated,
    isAdmin,
    isTeamManager,
    isFieldOfficer,
    isDispatcher,
    register,
    login,
    logout,
    fetchUser,
    setAuthenticatedUser,
    clearUser,
  };
};