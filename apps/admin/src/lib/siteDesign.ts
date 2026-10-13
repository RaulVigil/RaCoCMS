import { useEffect, useState } from 'react';
import type { ISiteDesign } from '@raco/shared';
import { googleFontsUrl, resolveDesign } from '@raco/blocks';
import { api } from './api';

// Diseño global del sitio (paleta y fuentes): se pide una vez y se comparte entre pantallas
let cache: ISiteDesign | null = null;
let pending: Promise<ISiteDesign> | null = null;
const listeners = new Set<(d: ISiteDesign) => void>();

export function loadSiteDesign(): Promise<ISiteDesign> {
  if (cache) return Promise.resolve(cache);
  pending ??= api
    .get<{ value: ISiteDesign | null }>('/settings/design')
    .then((res) => (cache = resolveDesign(res.value)))
    .catch(() => (cache = resolveDesign(null)))
    .finally(() => (pending = null));
  return pending;
}

export async function saveSiteDesign(design: ISiteDesign) {
  const res = await api.put<{ value: ISiteDesign }>('/settings/design', { value: design });
  cache = resolveDesign(res.value);
  listeners.forEach((fn) => fn(cache!));
  return cache;
}

export function useSiteDesign() {
  const [design, setDesign] = useState<ISiteDesign | null>(cache);
  useEffect(() => {
    loadSiteDesign().then(setDesign);
    listeners.add(setDesign);
    return () => {
      listeners.delete(setDesign);
    };
  }, []);
  return design;
}

// Carga las fuentes del sitio desde Google Fonts (un solo <link>, se actualiza al cambiarlas)
export function useGoogleFonts(design: ISiteDesign | null) {
  const href = design ? googleFontsUrl(design) : null;
  useEffect(() => {
    if (!href) return;
    let link = document.getElementById('raco-site-fonts') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = 'raco-site-fonts';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
  }, [href]);
}
