// ============================================================
// RaCo CMS — Shared TypeScript Interfaces (packages/shared)
// ============================================================

// --- 1. Usuarios y Roles (RBAC) ---
export interface IUser {
  id: number;
  email: string;
  role: UserRole;
}

export type UserRole = 'admin' | 'editor' | 'author';

// --- 2. Colecciones y Entradas ---
export interface ICollection {
  id: string; // ej: "noticias", "faqs"
  name: string;
  schema: Record<string, unknown>;
}

export interface IEntry {
  id: number;
  collectionId: string;
  slug: string;
  status: EntryStatus;
  locale: string; // Futuro soporte i18n
  data: Record<string, unknown>;
  seoData: ISeoMetadata;
}

export type EntryStatus = 'draft' | 'published' | 'archived';

// --- 3. Theme Builder y Partes Globales ---
export interface ITemplate {
  id: number;
  name: string;
  collectionId: string; // A qué colección aplica (ej. "single-noticia")
  blocks: IPageBlock[];
}

export interface IGlobalPart {
  id: string; // ej: "header", "footer"
  name: string;
  blocks: IPageBlock[];
}

// --- 4. Sistema de Menús (Drag & Drop) ---
export interface IMenu {
  id: string;
  name: string;
  items: IMenuItem[];
}

export interface IMenuItem {
  id: string;
  label: string;
  url: string;
  type: MenuItemType;
  target: '_self' | '_blank';
  children: IMenuItem[];
}

export type MenuItemType = 'custom' | 'page' | 'entry';

// --- 5. Estructura de Bloques (Motor Responsivo) ---
export interface IPageBlock {
  id: string;
  type: string; // ej: "Hero", "Cards", "FAQ"
  order: number;
  props: Record<string, unknown>;
  settings: IBlockSettings;
}

export interface IBlockSettings {
  visibility: {
    desktop: boolean; // lg:block / lg:hidden
    tablet: boolean; // md:block / md:hidden
    mobile: boolean; // block / hidden
  };
  customClasses?: string;
}

// --- 6. SEO Metadata ---
export interface ISeoMetadata {
  title: string;
  description: string;
  openGraphImage?: string;
  noIndex: boolean;
}

// --- 7. API Response Wrappers ---
export interface IApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface IPaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
