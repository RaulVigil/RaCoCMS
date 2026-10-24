import { useState } from 'react';
import type { IMedia, IMediaUsage } from '@raco/shared';
import { api, uploadFile } from './api';

export interface MediaPage {
  items: IMedia[];
  total: number;
  page: number;
  totalPages: number;
}

export const listMedia = (search = '', page = 1, limit = 60) =>
  api.get<MediaPage>(`/media?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`);

export const updateMedia = (id: number, data: { alt: string }) => api.put<IMedia>(`/media/${id}`, data);
export const mediaUsage = (id: number) => api.get<IMediaUsage[]>(`/media/${id}/usage`);
export const deleteMedia = (id: number) => api.delete<{ deleted: boolean }>(`/media/${id}`);

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// Sube varios archivos de a uno (cada uno se procesa a WebP en el servidor) y avisa del progreso
export function useUploader(onUploaded: (items: IMedia[]) => void) {
  const [pending, setPending] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  async function upload(files: FileList | File[] | null) {
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith('image/'));
    if (!list.length) return;
    setErrors([]);
    setPending(list.length);
    const done: IMedia[] = [];
    for (const file of list) {
      try {
        done.push(await uploadFile(file));
      } catch (err) {
        setErrors((e) => [...e, `${file.name}: ${(err as Error).message}`]);
      }
      setPending((n) => n - 1);
    }
    if (done.length) onUploaded(done);
  }

  return { upload, pending, errors };
}
