// composables/useSops.ts
import { useAsyncData } from '#app';
import type { ISop, ISopAttachment } from '~/types/sop';
import { useAuth } from '~/composables/useAuth';
import { useApi } from '~/composables/useApi';
import { useAppToast } from '~/composables/useAppToast';
export function useSops() {
  const { user } = useAuth();
  const api = useApi();
  const toast = useAppToast();

  const {
    data: sops,
    pending,
    error,
    refresh,
  } = useAsyncData<ISop[]>(
    'sops',
    () => {
      if (!user.value) return Promise.resolve([]);
      return api<ISop[]>('/sops');
    },
    {
      default: () => [],
      watch: [user],
    }
  );

  const sendSopRequest = async (method: 'POST' | 'PUT', url: string, payload: {
    data: Partial<Omit<ISop, 'id' | 'author' | 'createdAt' | 'updatedAt' | 'attachments'>>;
    attachmentsToDelete?: string[];
    filesToUpload?: File[];
  }) => {
    const formData = new FormData();

    formData.append('data', JSON.stringify(payload.data));

    if (payload.filesToUpload && payload.filesToUpload.length > 0) {
      payload.filesToUpload.forEach(file => {
        formData.append('attachments', file);
      });
    }

    if (payload.attachmentsToDelete && payload.attachmentsToDelete.length > 0) {
      formData.append('attachmentsToDelete', JSON.stringify(payload.attachmentsToDelete));
    }

    return api(url, {
      method: method,
      body: formData,
    });
  };

  const createSop = async (
    data: Omit<ISop, 'id' | 'author' | 'createdAt' | 'updatedAt' | 'attachments'>,
    filesToUpload: File[] = []
  ) => {
    try {
      await sendSopRequest('POST', '/sops', { data, filesToUpload });
      toast.success('SOP created successfully!');
      await refresh();
    } catch (err: any) {
      toast.error(err.data?.message || 'Failed to create SOP.');
      throw err;
    }
  };

  const updateSop = async (
    id: string,
    data: Partial<Omit<ISop, 'id' | 'author' | 'createdAt' | 'updatedAt' | 'attachments'>>,
    options: { filesToUpload?: File[]; attachmentsToDelete?: string[] } = {}
  ) => {
    try {
      await sendSopRequest('PUT', `/sops/${id}`, {
        data,
        filesToUpload: options.filesToUpload,
        attachmentsToDelete: options.attachmentsToDelete,
      });
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

  const downloadSopAttachment = (sopId: string, attachmentId: string, filename: string) => {
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
    deleteSopAttachment,
    downloadSopAttachment,
  };
}