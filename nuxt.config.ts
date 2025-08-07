// nuxt.config.ts (Cleaned)
import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  ssr: true,

  modules: ["@nuxt/ui", "@pinia/nuxt", "@vueuse/motion/nuxt", "@vueuse/nuxt"],

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
        "http://localhost:3000/api/auth/google/callback",
      baseUrlPublic: process.env.BASE_URL_PUBLIC || "http://localhost:3000",
    },
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

  css: ["~/assets/css/main.css"],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

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

  plugins: [],
  middleware: ["auth", "guest", "admin"],
});
