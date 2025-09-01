// composables/useSops.ts - COMPLETE UPDATED CODE
import { useAsyncData, useFetch, createError } from '#app';
import { useApi } from '~/composables/useApi';
import { useAuth } from '~/composables/useAuth';
import { useAppToast } from '~/composables/useAppToast';
import type { ISop, ISopAttachment } from '~/types/sop';

export const useSops = () => {
  const api = useApi();
  const toast = useAppToast();
  const { isAuthenticated } = useAuth();

  const {
    data: sops,
    pending,
    error,
    refresh,
  } = useAsyncData<ISop[]>(
    'sops',
    async () => {
      if (!isAuthenticated.value) {
        return [];
      }
      try {
        const response = await api<ISop[]>('/sops');
        return response.map(sop => {
          if (sop.authorId && typeof sop.authorId === 'object' && (sop.authorId as any).name) {
            sop.author = { id: (sop.authorId as any)._id?.toString() || (sop.authorId as any).id, name: (sop.authorId as any).name };
          } else if (sop.authorId) {
            sop.author = { id: sop.authorId.toString(), name: 'Unknown User' };
          } else {
            sop.author = null;
          }
          if (!(sop as any).id && (sop as any)._id) {
            (sop as any).id = (sop as any)._id.toString();
          }
          return sop;
        });
      } catch (e: any) {
        console.error('useSops: Failed to fetch SOPs:', e);
        toast.add({
          title: 'Error loading SOPs',
          description: e.message || 'An unexpected error occurred.',
          color: 'red',
          icon: 'i-heroicons-exclamation-triangle',
        });
        return [];
      }
    },
    {
      default: () => [],
      watch: [isAuthenticated],
    }
  );

  // Helper for consistent error messages in toasts
  const getErrorMessage = (err: any) => {
    if (err.data && typeof err.data === 'string') return err.data;
    if (err.data && typeof err.data === 'object' && err.data.message) return err.data.message;
    if (err.data && typeof err.data === 'object' && err.data._errors) return `Validation: ${err.data._errors.join(', ')}`;
    if (err.data && typeof err.data === 'object' && Object.keys(err.data).length > 0) {
      return 'Validation Errors: ' + Object.entries(err.data)
        .map(([key, value]) => `${key}: ${(value as any)._errors?.join(', ') || 'invalid'}`)
        .join('; ');
    }
    return err.message || 'An unexpected error occurred.';
  };


  const createSop = async (
    sopData: Omit<ISop, 'id' | 'author' | 'createdAt' | 'updatedAt' | 'attachments'>,
    filesToUpload: File[] // filesToUpload is now passed directly here
  ) => {
    try {
      const formData = new FormData();
      formData.append('data', JSON.stringify(sopData)); // Append text data as a JSON string

      filesToUpload.forEach((file) => {
        formData.append('attachments', file); // Append each file
      });

      await api('/sops', {
        method: 'POST',
        body: formData,
        // CRITICAL: DO NOT set 'Content-Type' header here.
        // When FormData is used, the browser sets the correct 'Content-Type: multipart/form-data'
        // along with the boundary. Manually setting it breaks the upload.
        headers: {
          // 'Content-Type': 'multipart/form-data', // REMOVE OR COMMENT THIS LINE OUT
        },
      });
      await refresh();
      toast.add({
        title: 'SOP Created',
        description: 'New SOP added successfully!',
        color: 'green',
        icon: 'i-heroicons-check-circle',
      });
    } catch (err: any) {
      console.error('useSops: Error creating SOP:', err);
      toast.add({
        title: 'Error Creating SOP',
        description: getErrorMessage(err),
        color: 'red',
        icon: 'i-heroicons-exclamation-triangle',
      });
      throw err;
    }
  };

  const updateSop = async (
    id: string,
    updates: Partial<ISop>,
    options: { filesToUpload?: File[]; attachmentsToDelete?: string[] } = {}
  ) => {
    try {
      const { filesToUpload = [], attachmentsToDelete = [] } = options;

      const formData = new FormData();
      formData.append('data', JSON.stringify(updates)); // Append text data as a JSON string
      formData.append('attachmentsToDelete', JSON.stringify(attachmentsToDelete)); // Append IDs of attachments to delete

      filesToUpload.forEach((file) => {
        formData.append('attachments', file); // Append new files
      });

      await api(`/sops/${id}`, {
        method: 'PATCH',
        body: formData,
        // CRITICAL: DO NOT set 'Content-Type' header here.
        headers: {
          // 'Content-Type': 'multipart/form-data', // REMOVE OR COMMENT THIS LINE OUT
        },
      });
      await refresh();
      toast.add({
        title: 'SOP Updated',
        description: 'Changes saved successfully!',
        color: 'green',
        icon: 'i-heroicons-check-circle',
      });
    } catch (err: any) {
      console.error(`useSops: Error updating SOP ${id}:`, err);
      toast.add({
        title: 'Error Updating SOP',
        description: getErrorMessage(err),
        color: 'red',
        icon: 'i-heroicons-exclamation-triangle',
      });
      throw err;
    }
  };


  const deleteSop = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SOP?')) return;
    try {
      await api(`/sops/${id}`, { method: 'DELETE' });
      await refresh();
      toast.add({
        title: 'SOP Deleted',
        description: 'SOP removed successfully.',
        color: 'green',
        icon: 'i-heroicons-check-circle',
      });
    } catch (err: any) {
      console.error(`useSops: Error deleting SOP ${id}:`, err);
      toast.add({
        title: 'Error Deleting SOP',
        description: getErrorMessage(err),
        color: 'red',
        icon: 'i-heroicons-exclamation-triangle',
      });
    }
  };

  const uploadSopAttachment = async (sopId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file); // Assuming backend expects 'file' for single upload
    try {
        await api(`/sops/${sopId}/attachments`, {
          method: 'POST',
          body: formData,
          // CRITICAL: DO NOT set 'Content-Type' header here for FormData
        });
        await refresh();
        toast.add({
            title: 'Attachment Uploaded',
            description: 'File attached successfully.',
            color: 'green',
            icon: 'i-heroicons-paper-clip',
        });
    } catch (err: any) {
        console.error('useSops: Error uploading attachment:', err);
        toast.add({
            title: 'Upload Failed',
            description: getErrorMessage(err),
            color: 'red',
            icon: 'i-heroicons-exclamation-triangle',
        });
        throw err;
    }
  };

  const deleteSopAttachment = async (sopId: string, attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;
    try {
        await api(`/sops/${sopId}/attachments/${attachmentId}`, { method: 'DELETE' });
        await refresh();
        toast.add({
            title: 'Attachment Deleted',
            description: 'Attachment removed successfully.',
            color: 'green',
            icon: 'i-heroicons-check-circle',
        });
    } catch (err: any) {
        console.error('useSops: Error deleting attachment:', err);
        toast.add({
            title: 'Deletion Failed',
            description: getErrorMessage(err),
            color: 'red',
            icon: 'i-heroicons-exclamation-triangle',
        });
    }
  };

  const downloadSopAttachment = async (sopId: string, attachmentId: string, fileName: string) => {
    try {
        const response = await api<Blob>(`/sops/${sopId}/attachments/${attachmentId}/download`, {
            method: 'GET',
            responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        toast.add({
            title: 'Download Started',
            description: `${fileName} download initiated.`,
            color: 'info',
            icon: 'i-heroicons-arrow-down-tray',
        });
    } catch (err: any) {
        console.error('useSops: Error downloading attachment:', err);
        toast.add({
            title: 'Download Failed',
            description: getErrorMessage(err),
            color: 'red',
            icon: 'i-heroicons-exclamation-triangle',
        });
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
    uploadSopAttachment,
    deleteSopAttachment,
    downloadSopAttachment,
  };
};