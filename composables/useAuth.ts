// composables/useAuth.ts (The Absolute Final, Definitive Guard Logic)

import { readonly, computed } from "vue";
import { useState, navigateTo } from "#app";
import type { IUser } from "~/types/user";
import { UserRole } from "~/types/user";
import { useRequestEvent, useNuxtApp } from '#app';
import { watch } from "vue"; // Watch is needed for fetchUser's Promise logic


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


  // fetchUser is the core function for universal (SSR + Client) state hydration.
  const fetchUser = async () => {
    console.log("useAuth: fetchUser started. Current user state:", user.value ? user.value.id : "null");

    // CRITICAL FINAL GUARD LOGIC (REFINED):
    // 1. If 'loading' is true, it means another fetchUser is already in flight.
    //    We await its completion to avoid redundant fetches and race conditions.
    if (loading.value) { 
      console.log("useAuth: fetchUser skipped (already loading, awaiting previous fetch).");
      // Return a new promise that resolves when 'loading' becomes false
      return await new Promise(resolve => {
        const unwatch = watch(loading, (newVal) => {
          if (!newVal) { // When loading becomes false
            unwatch();
            resolve(user.value ? true : false); // Resolve based on final user state
          }
        });
      });
    }

    // 2. If 'initialized' is true AND 'user.value' is set, state is valid.
    //    This means SSR hydrated it, or a previous client fetch populated it.
    if (initialized.value && user.value) {
      console.log("useAuth: fetchUser skipped (already initialized with user).");
      return true;
    }

    // 3. If we reach here, 'loading' is false, and 'user.value' is null/not initialized.
    //    We MUST initiate a fetch/hydration. Set loading and proceed.
    loading.value = true; // Set loading to true ONLY ONCE at the start of a new fetch.
    
    let success = false; // Flag to track success within this specific execution path.

    try {
      // --- SERVER-SIDE INITIALIZATION (SSR Hydration Attempt) ---
      // This part runs on the server during the initial SSR render.
      if (process.server) {
        const nuxtApp = useNuxtApp();
        const event = nuxtApp.ssrContext?.event;
        
        if (event && (event.context as any)?.user) {
          const contextUser = (event.context as any).user;
          // Convert Mongoose Document to plain POJO for useState
          user.value = typeof contextUser.toJSON === 'function' ? contextUser.toJSON() : { ...contextUser };
          console.log("useAuth: fetchUser hydrated from SSR context. User:", user.value?.id, user.value?.role); 
          success = true; 
          return true; // Stop server execution here if hydrated.
        }
        console.log("useAuth: SSR context had no user or incomplete event. Proceeding to API fetch if on client.");
      }
      
      // --- CLIENT-SIDE FALLBACK / Subsequent Fetches ---
      // This part runs if:
      // 1. process.client is true (always client-side).
      // 2. process.server was true, but the SSR hydration attempt failed (user.value still null).
      // This is the only path that makes the actual /api/auth/me API call to populate user.value.
      console.log("useAuth: fetchUser calling /api/auth/me (client or unauthenticated SSR fallback). Current user state:", user.value ? user.value.id : "null");
      const data = await $fetch<IUser>("/api/auth/me", { method: "GET" });
      user.value = data; 
      console.log("useAuth: fetchUser successful via API. User:", user.value.id, user.value.role);
      success = true; 
      return true;
    } catch (e: any) {
      user.value = null; 
      console.error("useAuth: fetchUser failed via API:", e?.data?.message || e?.message || "Unknown error during fetchUser.");
      success = false; 
      return false;
    } finally {
      loading.value = false; // Always reset loading
      initialized.value = true; // Always mark as initialized after an attempt
      console.log(`useAuth: fetchUser finished. Final user state: ${user.value ? user.value.id : 'null'}. Success: ${success}.`);
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
      
      // Crucial for HTTP-only cookies: force a full browser reload
      if (process.client) { 
        window.location.href = '/dashboard'; 
      } else { 
        await navigateTo("/dashboard"); // Fallback for SSR redirect
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
      
      // Crucial for HTTP-only cookies: force a full browser reload
      if (process.client) { 
        window.location.href = '/dashboard'; 
      } else { 
        await navigateTo("/dashboard"); // Fallback for SSR redirect
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
    loading,
    initialized,
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