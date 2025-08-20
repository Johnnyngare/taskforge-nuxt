//pages/dashboard/settings.vue
<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
      <p class="mt-1 text-gray-600">
        Manage your account preferences and application settings.
      </p>
    </div>

    <div class="space-y-6">
      <!-- Profile Settings -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 class="mb-6 text-lg font-semibold text-gray-900">
          Profile Information
        </h2>
        <form @submit.prevent="saveProfile" class="space-y-6">
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label
                for="profile-name"
                class="mb-2 block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <FormAppInput
                id="profile-name"
                v-model="profileForm.name"
                placeholder="Enter your full name"
                required
              />
            </div>
            <div>
              <label
                for="profile-email"
                class="mb-2 block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <FormAppInput
                id="profile-email"
                v-model="profileForm.email"
                type="email"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>
          <div class="flex justify-end">
            <FormAppButton type="submit" :disabled="savingProfile">
              <UiSpinner v-if="savingProfile" size="sm" class="mr-2" />
              {{ savingProfile ? "Saving..." : "Save Changes" }}
            </FormAppButton>
          </div>
        </form>
      </div>

      <!-- Preferences -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 class="mb-6 text-lg font-semibold text-gray-900">Preferences</h2>
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-medium text-gray-900">Theme</h3>
              <p class="text-sm text-gray-500">
                Choose your preferred color scheme.
              </p>
            </div>
            <!-- Add theme toggle logic here -->
          </div>
        </div>
        <div class="mt-6 flex justify-end border-t border-gray-200 pt-6">
          <FormAppButton @click="savePreferences" :disabled="savingPreferences">
            <UiSpinner v-if="savingPreferences" size="sm" class="mr-2" />
            {{ savingPreferences ? "Saving..." : "Save Preferences" }}
          </FormAppButton>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
        <h2 class="mb-6 text-lg font-semibold text-red-900">Danger Zone</h2>
        <div
          class="flex items-center justify-between rounded-lg border border-red-200 p-4"
        >
          <div>
            <h3 class="font-medium text-gray-900">Delete Account</h3>
            <p class="text-sm text-gray-500">
              Permanently delete your account and all data.
            </p>
          </div>
          <FormAppButton @click="showDeleteModal = true" variant="danger">
            Delete Account
          </FormAppButton>
        </div>
      </div>
    </div>

    <!-- Delete Account Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 class="mb-4 text-lg font-semibold text-gray-900">Delete Account</h3>
        <p class="mb-6 text-gray-600">
          This action is irreversible and will permanently delete your account.
        </p>
        <div class="flex gap-3">
          <FormAppButton
            @click="showDeleteModal = false"
            variant="secondary"
            class="flex-1"
          >
            Cancel
          </FormAppButton>
          <FormAppButton
            @click="deleteAccount"
            variant="danger"
            class="flex-1"
            :disabled="deletingAccount"
          >
            <UiSpinner v-if="deletingAccount" size="sm" class="mr-2" />
            {{ deletingAccount ? "Deleting..." : "Confirm Delete" }}
          </FormAppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

definePageMeta({ layout: "dashboard", middleware: "02-auth" });
useSeoMeta({
  title: "Settings - TaskForge",
  description: "Manage your account settings and preferences.",
});

const profileForm = ref({
  name: "John Doe",
  email: "john.doe@example.com",
});

const savingProfile = ref(false);
const savingPreferences = ref(false);
const showDeleteModal = ref(false);
const deletingAccount = ref(false);

const saveProfile = async () => {
  savingProfile.value = true;
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log("Saving profile:", profileForm.value);
  savingProfile.value = false;
};

const savePreferences = async () => {
  savingPreferences.value = true;
  await new Promise((resolve) => setTimeout(resolve, 800));
  console.log("Saving preferences...");
  savingPreferences.value = false;
};

const deleteAccount = async () => {
  deletingAccount.value = true;
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log("Deleting account...");
  deletingAccount.value = false;
  showDeleteModal.value = false;
  await navigateTo("/login");
};
</script>
