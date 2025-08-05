// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: [
    "@nuxt/ui",
    "@pinia/nuxt",
    "@vueuse/motion/nuxt",
    // Removed @nuxtjs/color-mode as @nuxt/ui includes it
  ],

  runtimeConfig: {
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    public: {
      BASE_URL_PUBLIC: process.env.BASE_URL_PUBLIC || "http://localhost:3000",
      GOOGLE_OAUTH_REDIRECT_URI:
        process.env.GOOGLE_OAUTH_REDIRECT_URI ||
        "http://localhost:3000/api/auth/google/callback",
    },
  },

  ui: {
    global: true,
    icons: ["heroicons", "simple-icons"],
    // Use 'emerald' as primary and 'slate' as gray for Nuxt UI components.
    // Tailwind's JIT mode will pick these up from tailwind.config.js
    // if you define custom shades, but here we just align with defaults.
    primary: "emerald",
    gray: "slate",
  },

  colorMode: {
    classSuffix: "", // No suffix needed if using `dark` class directly
    preference: "system",
    fallback: "light",
    storageKey: "taskforge-color-mode",
  },

  css: ["~/assets/css/main.css"],

  app: {
    head: {
      htmlAttrs: { lang: "en" },
      title: "TaskForge - Transform Your Productivity",
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
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap",
        },
      ],
    },
  },
});
