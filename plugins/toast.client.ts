// plugins/toast.client.ts
import { defineNuxtPlugin } from '#app';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Toast, {
    // You can customize these options as needed for your application
    timeout: 3000, // Default timeout for toasts in ms
    position: 'top-right', // Position of the toast notifications
    hideProgressBar: false, // Show/hide progress bar
    closeButton: 'button', // Show close button as a standard button
    icon: true, // Show default icons for success/error/info etc.
    transition: 'Vue-Toastification__fade', // Default transition effect
  });
});