// composables/useAuth.ts (FINAL Guard Logic)

import { readonly, computed } from "vue";
import { useState, navigateTo } from "#app";
import type { IUser } from "~/types/user";
import { UserRole } from "~/types/user";
import { useRequestEvent, useNuxtApp } from '#app';

export const useAuth = () => {
  const user = useState<IUser | null>("user", () => null);
  const loading = useState<boolean>("auth-loading", () => false);
  const initialized = useState<boolean>("auth-initialized", () => false);
  const toast = useToast();

  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === UserRole.Admin);
  const isTeamManager = computed(() => user.value?.role === UserRole.TeamManager);
  const isFieldOfficer = computed(() => user.value?.role === UserRole.FieldOfficer);
  const isDispatcher = computed(() => user.value?.role === UserRole.Dispatcher);


  const fetchUser = async () => {
    console.log("useAuth: fetchUser started. Current user state:", user.value ? user.value.id : "null");

    // CRITICAL FINAL GUARD REFINEMENT:
    // Only proceed if a fetch is absolutely needed and not currently active.
    if (loading.value) {
      console.log("useAuth: fetchUser skipped (already loading).");
      // If it's already loading, ensure it will eventually set user or error.
      return await new Promise(resolve => { // Return a promise that resolves when loading is done
        const unwatch = watch(loading, (newVal) => {
          if (!newVal) { // When loading becomes false
            unwatch();
            resolve(user.value ? true : false); // Resolve with success/failure based on final user state
          }
        });
      });
    }

    // If user is already set AND initialized, return immediately.
    if (initialized.value && user.value) {
      console.log("useAuth: fetchUser skipped (already initialized with user).");
      return true;
    }

    // If we reach here, we are NOT currently loading, and the user is NOT set + initialized.
    // So, we MUST attempt to fetch/hydrate. Set loading and proceed.
    loading.value = true;
    
    // --- SERVER-SIDE INITIALIZATION (SSR Hydration) ---
    if (process.server) {
      const nuxtApp = useNuxtApp();
      const event = nuxtApp.ssrContext?.event;
      
      if (event && (event.context as any)?.user) {
        user.value = (event.context.user as any).toJSON();
        console.log("useAuth: fetchUser hydrated from SSR context. User:", user.value?.id, user.value?.role);
        // This server path will fall through to finally block, which sets loading=false, initialized=true
        return true;
      }
      console.log("useAuth: SSR context had no user or incomplete event. Proceeding to API fetch if on client.");
    }
    
    // --- CLIENT-SIDE FALLBACK / Subsequent Fetches (The actual API call happens here) ---
    console.log("useAuth: fetchUser calling /api/auth/me (client or unauthenticated SSR fallback). Current user state:", user.value ? user.value.id : "null");
    try {
      const data = await $fetch<IUser>("/api/auth/me", { method: "GET" });
      user.value = data; 
      console.log("useAuth: fetchUser successful via API. User:", user.value.id, user.value.role);
      return true;
    } catch (e: any) {
      user.value = null; 
      console.error("useAuth: fetchUser failed via API:", e?.data?.message || e?.message || "Unknown error during fetchUser.");
      return false;
    } finally {
      loading.value = false;
      initialized.value = true;
      console.log("useAuth: fetchUser finished.");
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<boolean> => {
    loading.value = true;
    console.log("useAuth: register started.");
    try {
      const response = await $fetch<IUser>("/api/auth/register", {
        method: "POST",
        body: userData,
      });
      
      user.value = response; 
      initialized.value = true; 
      console.log("useAuth: register successful. User state updated.");
      
      if (process.client) { 
        window.location.href = '/dashboard'; 
      } else { 
        await navigateTo("/dashboard");
      }
      console.log("useAuth: Navigating with full reload to /dashboard after registration.");
      
      toast.add({
        title: "Welcome!",
        description: "Registration successful. You are now logged in.",
        icon: "i-heroicons-check-circle",
        color: "green",
      });
      return true;
    } catch (error) {
      user.value = null;
      console.error("useAuth: register failed:", error?.data?.message || error?.message || "Unknown error during registration.");
      throw error;
    } finally {
      loading.value = false;
      console.log("useAuth: register finished.");
    }
  };

  const login = async (credentials: { email: string; password: string }): Promise<boolean> => {
    loading.value = true;
    console.log("useAuth: login started.");
    try {
      const loggedInUser = await $fetch<IUser>("/api/auth/login", {
        method: "POST",
        body: credentials,
      });
      
      user.value = loggedInUser; 
      initialized.value = true;
      console.log("useAuth: Login API call successful. User set to:", user.value.id, user.value.role);
      
      if (process.client) { 
        window.location.href = '/dashboard'; 
      } else { 
        await navigateTo("/dashboard");
      }
      console.log("useAuth: Navigating with full reload to /dashboard.");
      
      toast.add({
        title: "Welcome back!",
        description: "Successfully signed in.",
        icon: "i-heroicons-check-circle",
        color: "green",
      });
      console.log("useAuth: Toast added after navigation.");

      return true;
    } catch (error) {
      user.value = null;
      console.error("useAuth: login failed:", error?.data?.message || error?.message || "Unknown error during login.");
      throw error;
    } finally {
      loading.value = false;
      console.log("useAuth: login finished.");
    }
  };

  const logout = async (): Promise<boolean> => {
    loading.value = true;
    console.log("useAuth: logout started.");
    try {
      await $fetch("/api/auth/logout", { method: "POST" });
      user.value = null;
      initialized.value = false;
      console.log("useAuth: Logout API call successful. User state cleared.");
      await navigateTo("/login"); 
      console.log("useAuth: Navigated to /login after logout.");
      return true;
    } catch (error) {
      console.error("useAuth: logout failed:", error?.data?.message || error?.message || "Unknown error during logout.");
      throw error;
    } finally {
      loading.value = false;
      console.log("useAuth: logout finished.");
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
  };
};