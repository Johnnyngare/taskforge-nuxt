<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-white mb-2">Settings</h1>
      <p class="text-slate-400">Customize your TaskForge experience</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Settings Navigation -->
      <div class="lg:col-span-1">
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-1">
          <nav class="space-y-1">
            <button
              class="w-full text-left px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium transition-colors"
            >
              General
            </button>
            <button
              class="w-full text-left px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              Notifications
            </button>
            <button
              class="w-full text-left px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              Appearance
            </button>
            <button
              class="w-full text-left px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              Privacy
            </button>
            <button
              class="w-full text-left px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              Account
            </button>
          </nav>
        </div>
      </div>

      <!-- Settings Content -->
      <div class="lg:col-span-3">
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 class="text-xl font-semibold text-white mb-6">
            General Settings
          </h2>

          <div class="space-y-6">
            <!-- Theme Setting -->
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-white font-medium">Theme</h3>
                <p class="text-slate-400 text-sm">
                  Choose your preferred color scheme
                </p>
              </div>
              <select
                class="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option>Dark</option>
                <option>Light</option>
                <option>System</option>
              </select>
            </div>

            <!-- Language Setting -->
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-white font-medium">Language</h3>
                <p class="text-slate-400 text-sm">
                  Select your preferred language
                </p>
              </div>
              <select
                class="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
              </select>
            </div>

            <!-- Default Priority Setting -->
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-white font-medium">Default Task Priority</h3>
                <p class="text-slate-400 text-sm">
                  Set the default priority for new tasks
                </p>
              </div>
              <select
                class="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option>Low</option>
                <option selected>Medium</option>
                <option>High</option>
              </select>
            </div>

            <!-- Auto-save Setting -->
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-white font-medium">Auto-save</h3>
                <p class="text-slate-400 text-sm">
                  Automatically save changes as you type
                </p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer" checked />
                <div
                  class="w-11 h-6 bg-slate-600 peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"
                ></div>
              </label>
            </div>

            <!-- Notifications Setting -->
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-white font-medium">Desktop Notifications</h3>
                <p class="text-slate-400 text-sm">
                  Get notified about task deadlines
                </p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer" checked />
                <div
                  class="w-11 h-6 bg-slate-600 peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"
                ></div>
              </label>
            </div>

            <!-- Time Format Setting -->
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-white font-medium">Time Format</h3>
                <p class="text-slate-400 text-sm">
                  Choose 12-hour or 24-hour time display
                </p>
              </div>
              <select
                class="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option>12-hour (AM/PM)</option>
                <option>24-hour</option>
              </select>
            </div>
          </div>

          <div
            class="mt-8 pt-6 border-t border-slate-700 flex items-center space-x-3"
          >
            <button
              class="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Save Changes
            </button>
            <button
              class="text-slate-400 hover:text-white px-6 py-2 rounded-lg transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "auth",
  layout: "dashboard",
});
</script>
