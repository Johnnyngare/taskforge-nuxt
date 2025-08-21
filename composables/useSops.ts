// composables/useSops.ts
import { useAsyncData } from '#app';
import type { ISop, ISopAttachment } from '~/types/sop';
import { useAuth } from '~/composables/useAuth';
import { useApi } from '~/composables/useApi';
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

  // --- NEW: Helper to send data with/without files --- // CORRECTED: Comment syntax
  const sendSopRequest = async (method: 'POST' | 'PUT', url: string, payload: {
    data: Partial<Omit<ISop, 'id' | 'author' | 'createdAt' | 'updatedAt' | 'attachments'>>; // NEW: Made data partial
    attachmentsToDelete?: string[]; // Array of attachment IDs to delete
    filesToUpload?: File[]; // Array of new File objects to upload
  }) => {
    const formData = new FormData();

    // Append JSON data as a string (important for multipart)
    formData.append('data', JSON.stringify(payload.data));

    // Append files
    if (payload.filesToUpload && payload.filesToUpload.length > 0) {
      payload.filesToUpload.forEach(file => {
        formData.append('attachments', file); // 'attachments' field for backend
      });
    }

    // Append attachments to delete (as a stringified array)
    if (payload.attachmentsToDelete && payload.attachmentsToDelete.length > 0) {
      formData.append('attachmentsToDelete', JSON.stringify(payload.attachmentsToDelete));
    }

    // $fetch handles Content-Type for FormData automatically, DO NOT set it manually.
    return api(url, {
      method: method,
      body: formData,
    });
  };

  const createSop = async (
    data: Omit<ISop, 'id' | 'author' | 'createdAt' | 'updatedAt' | 'attachments'>,
    filesToUpload: File[] = [] // Default to empty array
  ) => {
    try {
      // Ensure 'data' passed to sendSopRequest is of correct type.
      // Since `createSop`'s data is non-partial, it's compatible with Partial<...>
      await sendSopRequest('POST', '/sops', { data, filesToUpload });
      toast.success('SOP created successfully!');
      await refresh(); // Re-fetch the list
    } catch (err: any) {
      toast.error(err.data?.message || 'Failed to create SOP.');
      throw err;
    }
  };

  const updateSop = async (
    id: string,
    data: Partial<Omit<ISop, 'id' | 'author' | 'createdAt' | 'updatedAt' | 'attachments'>>, // Make data partial here
    options: { filesToUpload?: File[]; attachmentsToDelete?: string[] } = {} // NEW: Restructure options
  ) => {
    try {
      await sendSopRequest('PUT', `/sops/${id}`, {
        data, // data is already Partial here, matching sendSopRequest payload.data
        filesToUpload: options.filesToUpload,
        attachmentsToDelete: options.attachmentsToDelete,
      });
      toast.success('SOP updated successfully!');
      await refresh(); // Re-fetch the list
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

   // --- NEW: Delete a single attachment from an SOP ---
  const deleteSopAttachment = async (sopId: string, attachmentId: string) => {
    if (!confirm('Are you sure you want to remove this attachment?')) return;
    try {
      await api(`/sops/${sopId}/attachments/${attachmentId}`, { method: 'DELETE' });
      toast.info('Attachment removed.');
      await refresh();
    } catch (err: any) {
      toast.error(err.data?.message || 'Failed to remove attachment.');
      throw err;
    }
  };

  // --- NEW: Download a single attachment ---
  const downloadSopAttachment = (sopId: string, attachmentId: string, filename: string) => {
    // This will directly navigate the browser to the download URL
    window.open(`/api/sops/${sopId}/attachments/${attachmentId}`, '_blank');
  };
  return {
    sops,
    pending,
    error,
    refresh,
    createSop,
    updateSop,
    deleteSop,
    deleteSopAttachment, // NEW: Expose delete attachment function
    downloadSopAttachment, // NEW: Expose download function
  };
}