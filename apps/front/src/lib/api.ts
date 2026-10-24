import type { ICollection, IEntry, IFieldGroup, IMenu, IPageBlock, ISiteDesign, ISiteGeneral, ITemplate } from '@raco/shared';
import { resolveDesign } from '@raco/blocks';
import { API_URL } from './env';

// Cliente de los endpoints públicos (solo contenido publicado)

export interface EntryContext {
  entry: IEntry;
  collection: ICollection;
  fieldGroups: IFieldGroup[];
  template: ITemplate | null; // plantilla "single" de la colección (Theme Builder)
}

export interface EntryList {
  collection: ICollection;
  items: IEntry[];
  total: number;
  page: number;
  totalPages: number;
  template: ITemplate | null; // plantilla "archive" de la colección
}

export interface Site {
  general: ISiteGeneral;
  design: ISiteDesign;
  header: { blocks: IPageBlock[]; sticky: boolean };
  footer: { blocks: IPageBlock[] };
  menus: IMenu[];
}

const defaultGeneral: ISiteGeneral = { siteName: '', tagline: '', homePageId: null, language: 'es' };

async function get<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_URL}/api/v1/public${path}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status} en ${path}`);
  const text = await res.text(); // Nest devuelve cuerpo vacío cuando el resultado es null
  return text ? (JSON.parse(text) as T) : null;
}

type SiteResponse = Omit<Site, 'general' | 'design'> & { general: Partial<ISiteGeneral> | null; design: ISiteDesign | null };

export async function getSite(): Promise<Site> {
  const site = await get<SiteResponse>('/site');
  return {
    general: { ...defaultGeneral, ...site?.general },
    design: resolveDesign(site?.design),
    header: site?.header ?? { blocks: [], sticky: false },
    footer: site?.footer ?? { blocks: [] },
    menus: site?.menus ?? [],
  };
}

export const getHome = () => get<EntryContext>('/home');

export const getEntry = (collectionId: string, slug: string) =>
  get<EntryContext>(`/entries/${encodeURIComponent(collectionId)}/${encodeURIComponent(slug)}`);

export const getEntries = (collectionId: string, page = 1, limit = 12) =>
  get<EntryList>(`/entries/${encodeURIComponent(collectionId)}?page=${page}&limit=${limit}`);

export const getCollections = async () => (await get<ICollection[]>('/collections')) ?? [];

export const getSitemap = () =>
  get<{ entries: { id: number; collectionId: string; slug: string; updatedAt: string }[]; archives: string[] }>('/sitemap');
