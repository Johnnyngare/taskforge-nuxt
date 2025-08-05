import { readonly, computed } from "vue";
import { useState, navigateTo } from "#app";

interface User {
  _id: string;
  name: string;
  email: string;
  profilePhoto?: string;
  provider?: "google" | "local";
}

export const useAuth = () => {
  const user = useState<User | null>("user", () => null);
  const loading = useState<boolean>("auth-loading", () => false);
  const initialized = useState<boolean>("auth-initialized", () => false);

  const isAuthenticated = computed(() => !!user.value);

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
  }) => {
    loading.value = true;
    try {
      await $fetch("/api/auth/register", {
        method: "POST",
        body: userData,
      });
      await fetchUser();
    } catch (error) {
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    loading.value = true;
    try {
      await $fetch("/api/auth/login", {
        method: "POST",
        body: credentials,
      });
      await fetchUser();
      await navigateTo("/dashboard");
    } catch (error) {
      user.value = null;
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    loading.value = true;
    try {
      await $fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      user.value = null;
      initialized.value = false;
      loading.value = false;
      await navigateTo("/login");
    }
  };

  const fetchUser = async () => {
    // Don't fetch if already loading or already have user data
    if (loading.value || (initialized.value && user.value)) {
      return;
    }

    loading.value = true;
    try {
      const data = await $fetch<User>("/api/auth/me", {
        method: "GET",
      });
      user.value = data;
    } catch (error) {
      user.value = null;
    } finally {
      loading.value = false;
      initialized.value = true;
    }
  };

  return {
    user: readonly(user),
    loading: readonly(loading),
    initialized: readonly(initialized),
    isAuthenticated,
    register,
    login,
    logout,
    fetchUser,
  };
};
