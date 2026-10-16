import { useEffect, useState } from 'react';
import type { IPageBlock } from '@raco/shared';

// Comunica el editor con la pestaña de vista previa: localStorage guarda el último estado
// (por si la vista previa se abre o recarga después) y BroadcastChannel avisa de cada cambio en vivo.

export interface PreviewData {
  title: string;
  blocks: IPageBlock[];
  at: number;
}

const storageKey = (key: string) => `raco-preview:${key}`;
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('raco-preview') : null;

export const previewUrl = (collectionId: string, entryId: string) => `/preview/${collectionId}/${entryId}`;

export function publishPreview(key: string, title: string, blocks: IPageBlock[]) {
  const data: PreviewData = { title, blocks, at: Date.now() };
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(data));
  } catch {
    // Sin espacio o en modo privado: la vista previa en vivo sigue funcionando por el canal
  }
  channel?.postMessage({ key, data });
}

export function readPreview(key: string): PreviewData | null {
  try {
    const raw = localStorage.getItem(storageKey(key));
    return raw ? (JSON.parse(raw) as PreviewData) : null;
  } catch {
    return null;
  }
}

// Últimos datos publicados para esta clave, actualizados en vivo
export function useLivePreview(key: string) {
  const [data, setData] = useState<PreviewData | null>(() => readPreview(key));

  useEffect(() => {
    setData(readPreview(key));
    if (!channel) return;
    const onMessage = (e: MessageEvent<{ key: string; data: PreviewData }>) => {
      if (e.data?.key === key) setData(e.data.data);
    };
    channel.addEventListener('message', onMessage);
    return () => channel.removeEventListener('message', onMessage);
  }, [key]);

  return data;
}
