// composables/useNotifier.ts
import { useToast as useVueToast } from 'vue-toastification';
import { getCurrentInstance } from 'vue';

interface NotifierOptions {
  title?: string;
  description?: string;
  icon?: string;
  color?: string;
  timeout?: number;
}

function normalizeToastApi(toastInstance: any) {
  if (toastInstance && typeof toastInstance.success === 'function' && typeof toastInstance.error === 'function') {
    return {
      success: (options: string | NotifierOptions) => {
        const message = typeof options === 'string' ? options : options.description || options.title || 'Success';
        toastInstance.success(message, {
          timeout: options && typeof options !== 'string' && options.timeout !== undefined ? options.timeout : 3000,
        });
      },
      info: (options: string | NotifierOptions) => {
        const message = typeof options === 'string' ? options : options.description || options.title || 'Info';
        toastInstance.info(message, {
          timeout: options && typeof options !== 'string' && options.timeout !== undefined ? options.timeout : 4000,
        });
      },
      error: (options: string | NotifierOptions) => {
        const message = typeof options === 'string' ? options : options.description || options.title || 'Error';
        toastInstance.error(message, {
          timeout: options && typeof options !== 'string' && options.timeout !== undefined ? options.timeout : 5000,
        });
      },
      add: toastInstance.add || ((message: string, type: string, options: any) => { console.log(`Notifier (ADD): ${type.toUpperCase()}: ${message}`, options); }),
    };
  }

  // Fallback for server-side or if toast not available on client
  return {
    success: (options: string | NotifierOptions) => console.log('Notifier (SUCCESS - Fallback):', typeof options === 'string' ? options : options.description || options.title),
    info: (options: string | NotifierOptions) => console.info('Notifier (INFO - Fallback):', typeof options === 'string' ? options : options.description || options.title),
    error: (options: string | NotifierOptions) => console.error('Notifier (ERROR - Fallback):', typeof options === 'string' ? options : options.description || options.title),
    add: (options: any) => console.log('Notifier (ADD - Fallback):', options),
  };
}

export const useNotifier = () => {
  let toastInstance: any = null;

  // Only attempt to get/initialize the toast instance on the client-side
  if (process.client) {
    try {
      toastInstance = useVueToast();
    } catch (e) {
      console.warn("useNotifier: vue-toastification's useToast is not available on client. Falling back.", e);
      const nuxtApp = getCurrentInstance()?.appContext.app;
      if (nuxtApp && (nuxtApp as any).$toast) {
        toastInstance = (nuxtApp as any).$toast;
      }
    }
  } else {
    // Return a mock/fallback on the server when not on client
  }

  return normalizeToastApi(toastInstance);
};