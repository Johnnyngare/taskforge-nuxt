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
      authSecret: process.env.AUTH_SECRET, // FIXED: Added missing authSecret
    },
    public: {
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      // FIXED: Proper environment-aware fallback logic
      googleOauthRedirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI || 
        (process.dev 
          ? "http://localhost:3000/api/oauth/google/callback"
          : "https://taskforge-nuxt.vercel.app/api/oauth/google/callback"),
        
      baseUrlPublic: process.env.BASE_URL_PUBLIC || 
        (process.dev ? "http://localhost:3000" : "https://taskforge-nuxt.vercel.app"),
        
      uploadsBaseUrl: process.env.UPLOADS_BASE_URL || 
        (process.dev ? "http://localhost:3000/uploads" : "https://taskforge-nuxt.vercel.app/uploads"),
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

  css: [
    "~/assets/css/main.css",
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
      ],
    },
  },
});