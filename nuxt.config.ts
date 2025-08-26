// C:/Users/HomePC/taskforge-nuxt/nuxt.config.ts

import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  ssr: true,

  modules: [
    "@nuxt/ui",
    "@pinia/nuxt",
    "@vueuse/motion/nuxt",
    "@vueuse/nuxt",
    "@nuxtjs/leaflet", 
  ],

  runtimeConfig: {
    private: {
      mongodbUri: process.env.MONGODB_URI,
      jwtSecret: process.env.JWT_SECRET,
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    public: {
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      googleOauthRedirectUri:
        process.env.GOOGLE_OAUTH_REDIRECT_URI ||
        "http://localhost:3000/api/oauth/google/callback",
      baseUrlPublic: process.env.BASE_URL_PUBLIC || "http://localhost:3000",
      uploadsBaseUrl: process.env.UPLOADS_BASE_URL || "http://localhost:3000/uploads",
    },
  },
  nitro: {
    publicAssets: [
      {
        baseURL: '/uploads',
        dir: './uploads',
        maxAge: 60 * 60 * 24 * 365,
      }
    ]
  },
  ui: {
    global: true,
    icons: ["heroicons", "simple-icons"],
    primary: "emerald",
    gray: "slate",
  },

  colorMode: {
    classSuffix: "",
    preference: "system",
    fallback: "light",
    storageKey: "taskforge-color-mode",
  },

  // CSS: The @nuxtjs/leaflet module handles `leaflet.css` automatically.
  // REMOVE any custom `leaflet/dist/leaflet.css` entries.
  css: [
    "~/assets/css/main.css",
    // REMOVED: "leaflet/dist/leaflet.css", // Module handles this
  ],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: "en" },
      title: "TaskForge - Master Your Day, Forge Your Future",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "The ultimate productivity platform designed to help you organize, prioritize, and conquer your tasks with ease.",
        },
        { name: "format-detection", content: "telephone=no" },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap",
        },
        // REMOVED: Any direct <link> tags for leaflet.css (e.g., CDN link)
        // REMOVED: Any inline <style> tags for leaflet CSS (our diagnostic fix)
      ],
      style: [], // Ensure this is empty or only contains non-Leaflet inline styles
    },
  },

  plugins: [],

  // --- NEW: Leaflet module specific configuration (optional, check module docs for options) ---
  // leaflet: {
  //   // No explicit configuration might be needed for basic usage,
  //   // but this is where you'd put global Leaflet options if needed.
  //   // e.g., default options for L.Map.
  // }
});