import { createContext } from 'react';
import type { IEntry, IFieldDefinition, IPageBlock } from '@raco/shared';
import type { RichDoc } from './types';

// --- Datos dinámicos (Theme Builder) ---
// Un módulo puede tomar una propiedad de la entrada que se está mostrando:
// block.props.dynamic = { text: 'title', src: 'field:foto', content: 'field:descripcion' }

export type BindKind = 'text' | 'rich' | 'image' | 'url';

// Qué propiedades de cada módulo se pueden vincular y de qué tipo son
export const BINDABLE: Record<string, { prop: string; kind: BindKind; label: string }[]> = {
  heading: [
    { prop: 'text', kind: 'text', label: 'Texto' },
    { prop: 'url', kind: 'url', label: 'Enlace' },
  ],
  text: [{ prop: 'content', kind: 'rich', label: 'Contenido' }],
  image: [
    { prop: 'src', kind: 'image', label: 'Imagen' },
    { prop: 'alt', kind: 'text', label: 'Descripción' },
    { prop: 'url', kind: 'url', label: 'Enlace' },
  ],
  button: [
    { prop: 'text', kind: 'text', label: 'Texto' },
    { prop: 'url', kind: 'url', label: 'Enlace' },
  ],
  card: [
    { prop: 'title', kind: 'text', label: 'Título' },
    { prop: 'text', kind: 'text', label: 'Texto' },
    { prop: 'image', kind: 'image', label: 'Imagen' },
    { prop: 'url', kind: 'url', label: 'Enlace' },
  ],
  counter: [{ prop: 'number', kind: 'text', label: 'Número' }],
  testimonial: [
    { prop: 'quote', kind: 'text', label: 'Testimonio' },
    { prop: 'name', kind: 'text', label: 'Nombre' },
    { prop: 'photo', kind: 'image', label: 'Foto' },
  ],
  video: [{ prop: 'url', kind: 'url', label: 'Video' }],
  map: [{ prop: 'address', kind: 'text', label: 'Dirección' }],
};

// La entrada que se está mostrando, ya preparada para la plantilla
export interface EntryData {
  title: string;
  url: string;
  createdAt?: string;
  updatedAt?: string;
  excerpt: string;
  data: Record<string, unknown>;
  fields: IFieldDefinition[];
}

export const EntryContext = createContext<EntryData | null>(null);

// --- Listados ---

export interface PostItem {
  id: number;
  title: string;
  url: string;
  date?: string;
  excerpt: string;
  image: string | null;
}

// En la plantilla de listado: las entradas de la página actual y la paginación
export interface ArchiveData {
  items: PostItem[];
  page: number;
  totalPages: number;
  baseUrl: string;
}

export const ArchiveContext = createContext<ArchiveData | null>(null);

// Para el módulo "Listado de entradas" con una colección fija: { [collectionId]: entradas }
export const PostsContext = createContext<Record<string, PostItem[]>>({});

// --- Fuentes disponibles ---

export interface DynamicSource {
  value: string;
  label: string;
  kinds: BindKind[];
}

const fieldKinds: Record<string, BindKind[]> = {
  text: ['text', 'rich'],
  textarea: ['text', 'rich'],
  richtext: ['rich', 'text'],
  image: ['image', 'url'],
  number: ['text'],
  date: ['text'],
  select: ['text'],
  toggle: ['text'],
  url: ['url', 'text'],
};

export function dynamicSources(fields: IFieldDefinition[]): DynamicSource[] {
  return [
    { value: 'title', label: 'Título de la entrada', kinds: ['text', 'rich'] },
    { value: 'excerpt', label: 'Extracto', kinds: ['text', 'rich'] },
    { value: 'date', label: 'Fecha de publicación', kinds: ['text', 'rich'] },
    { value: 'updated', label: 'Última actualización', kinds: ['text', 'rich'] },
    { value: 'url', label: 'Enlace a la entrada', kinds: ['url'] },
    ...fields.map((f) => ({ value: `field:${f.key}`, label: `Campo: ${f.label}`, kinds: fieldKinds[f.type] ?? ['text'] })),
  ];
}

export const bindingKind = (type: string, prop: string): BindKind => BINDABLE[type]?.find((b) => b.prop === prop)?.kind ?? 'text';

// --- Conversión de valores ---

export function formatDate(value?: string | null, locale = 'es') {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

export function docToText(doc: unknown): string {
  const d = doc as RichDoc | null;
  if (!d) return '';
  if (d.text) return d.text;
  const inline = d.type === 'paragraph' || d.type === 'heading';
  return (d.content ?? []).map(docToText).join(inline ? '' : '\n').trim();
}

function textToDoc(text: string): RichDoc {
  return {
    type: 'doc',
    content: text
      .split(/\n{2,}/)
      .filter(Boolean)
      .map((p) => ({ type: 'paragraph', content: [{ type: 'text', text: p }] })),
  };
}

const isDoc = (v: unknown): v is RichDoc => !!v && typeof v === 'object' && (v as RichDoc).type === 'doc';

function rawValue(source: string, entry: EntryData): { value: unknown; field?: IFieldDefinition } {
  switch (source) {
    case 'title':
      return { value: entry.title };
    case 'excerpt':
      return { value: entry.excerpt };
    case 'date':
      return { value: formatDate(entry.createdAt) };
    case 'updated':
      return { value: formatDate(entry.updatedAt) };
    case 'url':
      return { value: entry.url };
  }
  if (source.startsWith('field:')) {
    const key = source.slice(6);
    return { value: entry.data?.[key], field: entry.fields.find((f) => f.key === key) };
  }
  return { value: '' };
}

function convert(value: unknown, kind: BindKind, field?: IFieldDefinition): unknown {
  if (kind === 'rich') {
    if (isDoc(value)) return value;
    const text = value === undefined || value === null ? '' : String(value);
    return text ? textToDoc(text) : null;
  }
  if (value === undefined || value === null) return '';
  if (isDoc(value)) return docToText(value);
  if (field?.type === 'toggle') return value ? 'Sí' : 'No';
  if (field?.type === 'date') return formatDate(String(value));
  if (typeof value === 'number') return value.toLocaleString('es');
  return String(value);
}

// Devuelve el bloque con sus propiedades vinculadas ya reemplazadas por los datos de la entrada
export function resolveDynamic(block: IPageBlock, entry: EntryData | null): IPageBlock {
  const map = block.props?.dynamic as Record<string, string> | undefined;
  if (!entry || !map || !Object.keys(map).length) return block;
  const props = { ...block.props };
  for (const [prop, source] of Object.entries(map)) {
    const { value, field } = rawValue(source, entry);
    props[prop] = convert(value, bindingKind(block.type, prop), field);
  }
  return { ...block, props };
}

// Entrada de muestra para diseñar sin datos: cada dato se ve como {Nombre}
export function placeholderEntry(fields: IFieldDefinition[]): EntryData {
  const data: Record<string, unknown> = {};
  for (const f of fields) data[f.key] = f.type === 'image' ? '' : `{${f.label}}`;
  return {
    title: '{Título de la entrada}',
    url: '#',
    excerpt: '{Extracto de la entrada}',
    createdAt: undefined,
    data,
    fields,
  };
}

// --- De entrada a dato de plantilla ---

// Las páginas viven en la raíz (/contacto); el resto de colecciones bajo su id (/noticias/mi-nota)
export function entryUrl(collectionId: string, slug: string) {
  return collectionId === 'pages' ? `/${slug}` : `/${collectionId}/${slug}`;
}

// Primer texto largo de la entrada (para extractos cuando no hay descripción SEO)
export function excerptOf(entry: Pick<IEntry, 'data' | 'seoData'>, max = 160) {
  const seo = entry.seoData?.description;
  if (seo) return seo;
  for (const v of Object.values(entry.data ?? {})) {
    const text = isDoc(v) ? docToText(v) : typeof v === 'string' ? v : '';
    if (text.length > 40 && !text.startsWith('/uploads/') && !/^https?:/.test(text)) {
      return text.length > max ? `${text.slice(0, max - 3).trimEnd()}…` : text;
    }
  }
  return '';
}

// Imagen destacada: el primer campo de imagen, o el primer valor que sea una imagen subida
export function imageOf(entry: Pick<IEntry, 'data'>, fields: IFieldDefinition[] = []) {
  for (const f of fields) {
    const v = entry.data?.[f.key];
    if (f.type === 'image' && typeof v === 'string' && v) return v;
  }
  for (const v of Object.values(entry.data ?? {})) {
    if (typeof v === 'string' && /^\/uploads\/.+\.(webp|png|jpe?g|gif|avif)$/i.test(v)) return v;
  }
  return null;
}

export function toEntryData(entry: IEntry, fields: IFieldDefinition[]): EntryData {
  return {
    title: entry.title,
    url: entryUrl(entry.collectionId, entry.slug),
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    excerpt: excerptOf(entry),
    data: entry.data ?? {},
    fields,
  };
}

export function toPostItem(entry: IEntry, fields: IFieldDefinition[] = []): PostItem {
  return {
    id: entry.id,
    title: entry.title,
    url: entryUrl(entry.collectionId, entry.slug),
    date: formatDate(entry.createdAt),
    excerpt: excerptOf(entry, 140),
    image: imageOf(entry, fields),
  };
}
