// composables/useAuth.ts
import { ref, readonly } from "vue";

// Define a type for the user object for better type safety
interface User {
  _id: string;
  name: string;
  email: string;
  profilePhoto?: string;
  provider?: "google" | "local";
}

export const useAuth = () => {
  // `useState` is Nuxt's SSR-friendly version of `ref` for shared state
  const user = useState<User | null>("user", () => null);
  const loading = useState<boolean>("auth-loading", () => false);

  // --- REGISTER FUNCTION ---
  const register = async (userData: {
    name: string;
    email: string;
    password: string;
  }) => {
    loading.value = true;
    try {
      // The backend will handle validation and user creation
      return await $fetch("/api/auth/register", {
        method: "POST",
        body: userData,
      });
    } catch (error) {
      // Re-throw the error so the page component can catch it and show a toast
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // --- LOGIN FUNCTION ---
  const login = async (credentials: { email: string; password: string }) => {
    loading.value = true;
    try {
      // The login endpoint sets the cookie but doesn't return the user
      await $fetch("/api/auth/login", {
        method: "POST",
        body: credentials,
      });

      // After a successful login, fetch the user's data to update the state
      await fetchUser();

      // Redirect to the dashboard after successful login and user fetch
      await navigateTo("/dashboard");
    } catch (error) {
      // Clear user state on failed login attempt
      user.value = null;
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // --- LOGOUT FUNCTION ---
  const logout = async () => {
    loading.value = true;
    try {
      await $fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error(
        "Logout API call failed, but logging out client-side anyway:",
        error
      );
    } finally {
      // Always clear user state and redirect, even if API call fails
      user.value = null;
      loading.value = false;
      await navigateTo("/login");
    }
  };

  // --- FETCH CURRENT USER ---
  // This function checks if a user is already logged in (e.g., on page refresh)
  const fetchUser = async () => {
    if (user.value) {
      return; // Don't re-fetch if user is already in state
    }
    try {
      const data = await $fetch<User>("/api/auth/me", {
        method: "GET",
        // We don't need to manually send cookies; the browser handles it.
      });
      user.value = data;
    } catch (error) {
      user.value = null; // If it fails (e.g., 401), ensure user is logged out
    }
  };

  return {
    user: readonly(user), // Expose user as readonly to prevent external mutation
    loading: readonly(loading),
    register,
    login,
    logout,
    fetchUser,
  };
};
