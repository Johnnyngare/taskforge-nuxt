<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Support Center
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-400">
          We're here to help you get the most out of TaskForge
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <!-- Contact Form -->
        <UCard class="shadow-lg">
          <template #header>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              Contact Support
            </h2>
          </template>

          <UForm
            :state="formState"
            :schema="supportSchema"
            @submit="handleSubmit"
            class="space-y-4"
          >
            <UFormGroup label="Name" name="name" required>
              <UInput
                v-model="formState.name"
                placeholder="Your full name"
                :disabled="loading"
              />
            </UFormGroup>

            <UFormGroup label="Email" name="email" required>
              <UInput
                v-model="formState.email"
                type="email"
                placeholder="your@email.com"
                :disabled="loading"
              />
            </UFormGroup>

            <UFormGroup label="Subject" name="subject" required>
              <USelect
                v-model="formState.subject"
                :options="subjectOptions"
                placeholder="Select a topic"
                :disabled="loading"
              />
            </UFormGroup>

            <UFormGroup label="Message" name="message" required>
              <UTextarea
                v-model="formState.message"
                placeholder="Describe your question or issue..."
                rows="5"
                :disabled="loading"
              />
            </UFormGroup>

            <UButton
              type="submit"
              :loading="loading"
              block
              class="bg-emerald-600 hover:bg-emerald-700"
            >
              Send Message
            </UButton>
          </UForm>
        </UCard>

        <!-- FAQ Section -->
        <div class="space-y-6">
          <UCard class="shadow-lg">
            <template #header>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                Frequently Asked Questions
              </h2>
            </template>

            <UAccordion :items="faqItems" class="space-y-2" />
          </UCard>

          <!-- Quick Links -->
          <UCard class="shadow-lg">
            <template #header>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                Quick Links
              </h2>
            </template>

            <div class="space-y-3">
              <NuxtLink
                to="/terms"
                class="flex items-center text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
              >
                <UIcon name="i-heroicons-document-text" class="w-4 h-4 mr-2" />
                Terms of Service
              </NuxtLink>

              <NuxtLink
                to="/privacy"
                class="flex items-center text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
              >
                <UIcon name="i-heroicons-shield-check" class="w-4 h-4 mr-2" />
                Privacy Policy
              </NuxtLink>
            </div>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const formState = ref({
  name: "",
  email: "",
  subject: "",
  message: "",
});

const subjectOptions = [
  "Account Issues",
  "Technical Support",
  "Feature Requests",
  "Billing Questions",
];

const faqItems = [
  {
    label: "How do I reset my password?",
    content:
      'Click on "Forgot Password" on the login page and follow the steps.',
  },
  {
    label: "How can I contact support?",
    content:
      "Use the contact form on this page or email us directly at support@taskforge.com.",
  },
  {
    label: "Where can I find the documentation?",
    content: 'You can find it in the "Resources" section of the main menu.',
  },
];

const supportSchema = {
  name: "string",
  email: "string",
  subject: "string",
  message: "string",
};

const loading = ref(false);

const handleSubmit = async () => {
  loading.value = true;

  try {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert("Support message sent successfully!");
    formState.value = {
      name: "",
      email: "",
      subject: "",
      message: "",
    };
  } catch (err) {
    console.error(err);
    alert("There was an error sending your message.");
  } finally {
    loading.value = false;
  }
};
</script>
