// nuxt.config.ts - FINAL CORRECTED VERSION
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
    // Removed: "nuxt-nodemailer" → Using custom Nodemailer implementation
  ],

  runtimeConfig: {
    private: {
    mongodbUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/taskforge",
    jwtSecret: process.env.JWT_SECRET || "supersecretjwt",
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    authSecret: process.env.AUTH_SECRET || "",
    blobReadWriteToken: process.env.BLOB_READ_WRITE_TOKEN || "",
  },


    // Email Configuration
    email: {
      // Mailtrap (Dev)
      mailtrapHost: process.env.MAILTRAP_HOST || "sandbox.smtp.mailtrap.io",
      mailtrapPort: parseInt(process.env.MAILTRAP_PORT || "2525"),
      mailtrapUser: process.env.MAILTRAP_USER || "",
      mailtrapPass: process.env.MAILTRAP_PASS || "",
      mailtrapInboxId: process.env.MAILTRAP_INBOX_ID || "",

      // Gmail (Prod)
      gmailHost: process.env.GMAIL_SMTP_HOST || "smtp.gmail.com",
      gmailPort: parseInt(process.env.GMAIL_SMTP_PORT || "587"),
      gmailUser: process.env.GMAIL_SMTP_USER || "",
      gmailPass: process.env.GMAIL_SMTP_PASS || "",

      // Default Sender
      fromEmail: process.env.EMAIL_FROM || "noreply@taskforge.com",
      fromName: process.env.EMAIL_FROM_NAME || "TaskForge",
    },

    // Public keys (Client-side)
    public: {
      googleClientId: process.env.GOOGLE_CLIENT_ID || "",
      googleOauthRedirectUri:
        process.env.GOOGLE_OAUTH_REDIRECT_URI ||
        (process.dev
          ? "http://localhost:3000/api/oauth/google/callback"
          : "https://taskforge-nuxt.vercel.app/api/oauth/google/callback"),
      baseUrlPublic:
        process.env.BASE_URL_PUBLIC ||
        (process.dev
          ? "http://localhost:3000"
          : "https://taskforge-nuxt.vercel.app"),
    },
  },

  // Nuxt UI Config
  ui: {
    global: true,
    icons: ["heroicons", "simple-icons"],
    primary: "emerald",
    gray: "slate",
  },

  // Color Mode (Dark/Light)
  colorMode: {
    classSuffix: "",
    preference: "system",
    fallback: "light",
    storageKey: "taskforge-color-mode",
  },

  // Global CSS
  css: ["~/assets/css/main.css"],

  // PostCSS (Tailwind)
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  // App Metadata
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
            "The ultimate productivity platform to organize, prioritize, and conquer your tasks.",
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
