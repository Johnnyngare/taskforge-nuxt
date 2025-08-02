// nuxt.config.ts
export default defineNuxtConfig({
  // Nuxt 3 Compatibility Date (good practice)
  compatibilityDate: "2025-07-15",

  // Enable Nuxt DevTools for enhanced development experience
  devtools: { enabled: true },

  // --- Nuxt Modules ---
  // Order matters for some modules (e.g., @nuxt/ui usually first)
  modules: [
    "@nuxt/ui", // Integrates Tailwind CSS, Color Mode, and Nuxt Icon
    "@pinia/nuxt", // Pinia for state management
    "@vueuse/motion/nuxt", // For animations (make sure it's installed in devDependencies)
    "@nuxtjs/color-mode",
    // Removed: @nuxtjs/tailwindcss (redundant with @nuxt/ui)
    // Removed: @nuxtjs/color-mode (redundant with @nuxt/ui)
    // Removed: @nuxt/test-utils (should only be in devDependencies, not a runtime module here)
  ],

  // --- Runtime Configuration (Environment Variables Management) ---
  // Accessible via `useRuntimeConfig()` on client & server, and `useRuntimeConfig(event)` on server
  runtimeConfig: {
    // Private keys (Server-side only) - Access via `config.YOUR_KEY`
    // These match the SCREAMING_SNAKE_CASE from your .env file
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

    // Public keys (Accessible on client & server) - Access via `config.public.YOUR_KEY`
    public: {
      BASE_URL_PUBLIC: process.env.BASE_URL_PUBLIC || "http://localhost:3000",
      // This is crucial for Google OAuth redirect consistency
      GOOGLE_OAUTH_REDIRECT_URI:
        process.env.GOOGLE_OAUTH_REDIRECT_URI ||
        "http://localhost:3000/api/auth/google/callback",
    },
  },

  // --- @nuxt/ui Configuration ---
  ui: {
    global: true, // Apply @nuxt/ui components globally
    icons: ["heroicons", "simple-icons"], // Configure icon collections (make sure simple-icons is installed)
    primary: "emerald", // Define your primary color palette
    gray: "slate", // Define your gray color palette
  },

  // --- Color Mode Configuration (Managed by @nuxt/ui internally) ---
  // This is part of the @nuxt/ui integration
  colorMode: {
    preference: "system", // Default theme preference
    fallback: "light", // Fallback if system preference is not detectable
    hid: "nuxt-color-mode-script",
    globalName: "__NUXT_COLOR_MODE__",
    componentName: "ColorScheme",
    classPrefix: "",
    classSuffix: "",
    storageKey: "taskforge-color-mode", // Local storage key for preference
  },

  // --- Global CSS Files ---
  // Import your custom global CSS (after @nuxt/ui's Tailwind injection)
  css: ["~/assets/css/main.css"],

  // --- App Configuration & Head Management ---
  app: {
    head: {
      htmlAttrs: {
        lang: "en", // Set base HTML language
      },
      title: "TaskForge - Transform Your Productivity", // Default page title
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "Revolutionary task management platform that helps you organize, prioritize, and accomplish your goals with ease.",
        },
        { name: "format-detection", content: "telephone=no" },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        // Google Fonts import for 'Inter'
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap",
        },
      ],
    },
  },

  // --- Server Middleware / H3 Extensions ---
  // No explicit server middleware config here, as your API routes handle their own logic.
  // Nitro build configuration is handled implicitly by server/api structure.
});
