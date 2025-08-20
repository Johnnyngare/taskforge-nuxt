// composables/useSops.ts
import { useAsyncData } from '#app';
import type { ISop } from '~/types/sop';
import { useAuth } from '~/composables/useAuth';
import { useApi } from '~/composables/useApi'; // CORRECTED: Changed `=~` to `from`
import { useToast } from 'vue-toastification';

export function useSops() {
  const { user } = useAuth();
  const api = useApi();
  const toast = useToast();

  const {
    data: sops,
    pending,
    error,
    refresh,
  } = useAsyncData<ISop[]>(
    'sops', // A unique key for this data fetch
    () => {
      // This guard prevents the API call from running if the user is not logged in.
      if (!user.value) {
        return Promise.resolve([]);
      }
      // The API call now directly returns the ISop[] array.
      return api<ISop[]>('/sops');
    },
    {
      default: () => [],
      watch: [user], // This automatically re-runs the fetcher when the user logs in.
    }
  );

  const createSop = async (data: Omit<ISop, 'id' | 'author' | 'createdAt' | 'updatedAt'>) => {
    try {
      await api('/sops', { method: 'POST', body: data });
      toast.success('SOP created successfully!');
      await refresh(); // Re-fetch the list
    } catch (err: any) {
      toast.error(err.data?.message || 'Failed to create SOP.');
      throw err;
    }
  };

  const updateSop = async (id: string, data: Partial<Omit<ISop, 'id'>>) => {
    try {
      await api(`/sops/${id}`, { method: 'PUT', body: data });
      toast.success('SOP updated successfully!');
      await refresh();
    } catch (err: any) {
      toast.error(err.data?.message || 'Failed to update SOP.');
      throw err;
    }
  };

  const deleteSop = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SOP?')) return;
    try {
      await api(`/sops/${id}`, { method: 'DELETE' });
      toast.info('SOP deleted.');
      await refresh();
    } catch (err: any) {
      toast.error(err.data?.message || 'Failed to delete SOP.');
      throw err;
    }
  };

  return {
    sops,
    pending,
    error,
    refresh,
    createSop,
    updateSop,
    deleteSop,
  };
}