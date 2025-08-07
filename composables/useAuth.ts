// composables/useAuth.ts
import { readonly, computed } from "vue";
import { useState, navigateTo } from "#app";
import type { IUser } from "~/types/user";
import { UserRole } from "~/types/user";


export const useAuth = () => {
  const user = useState<IUser | null>("user", () => null);
  const loading = useState<boolean>("auth-loading", () => false);
  const initialized = useState<boolean>("auth-initialized", () => false);

  const isAuthenticated = computed(() => !!user.value);

  const isAdmin = computed(() => user.value?.role === UserRole.Admin);
  const isTeamManager = computed(
    () => user.value?.role === UserRole.TeamManager
  );
  const isFieldOfficer = computed(() => user.value?.role === UserRole.FieldOfficer);
  const isDispatcher = computed(() => user.value?.role === UserRole.Dispatcher);


  const fetchUser = async () => {
    if (loading.value || (initialized.value && user.value)) {
      return;
    }

    loading.value = true;
    try {
      // The 'me' endpoint now returns the role, which will be stored in the user state
      const data = await $fetch<IUser>("/api/auth/me", { method: "GET" });
      user.value = data;
    } catch (error) {
      user.value = null; // Clear user if fetch fails (e.g., token expired)
    } finally {
      loading.value = false;
      initialized.value = true; // Mark as initialized whether successful or not
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
  }) => {
    loading.value = true;
    try {
      // Assuming register endpoint returns the new user data or success status
      await $fetch("/api/auth/register", {
        method: "POST",
        body: userData,
      });
      // Fetch user after successful registration to hydrate state
      await fetchUser();
    } catch (error) {
      console.error("Registration failed:", error);
      throw error; // Re-throw to allow component to handle errors
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
      await fetchUser(); // Hydrate user state after login
      await navigateTo("/dashboard"); // Redirect to dashboard on successful login
    } catch (error) {
      user.value = null; // Clear user state on login failure
      console.error("Login failed:", error);
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
      user.value = null; // Clear user state
      initialized.value = false; // Reset initialization status
      loading.value = false;
      await navigateTo("/login"); // Redirect to login page after logout
    }
  };

  return {
    user: readonly(user),
    loading: readonly(loading),
    initialized: readonly(initialized),
    isAuthenticated,
    isAdmin,
    isTeamManager,
    isFieldOfficer, // FIX: Expose new role helpers
    isDispatcher, // FIX: Expose new role helpers
    register, // FIX: Expose the register function
    login, // FIX: Expose the login function
    logout, // FIX: Expose the logout function
    fetchUser, // Expose fetchUser
  };
};