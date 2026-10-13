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
  isNative?: boolean; // colecciones del sistema (ej. "pages"), no se pueden borrar
  useBuilder?: boolean; // sus entradas se diseñan con el constructor visual
  createdAt?: string;
}

export interface IEntry {
  id: number;
  collectionId: string;
  title: string;
  slug: string;
  status: EntryStatus;
  locale: string; // Futuro soporte i18n
  data: Record<string, unknown>; // valores de los Field Groups, por key
  terms: Record<string, string[]> | null; // { [taxonomyId]: termId[] }
  blocks: IPageBlock[] | null; // diseño del constructor visual
  seoData: ISeoMetadata;
  createdAt?: string;
  updatedAt?: string;
}

export type EntryStatus = 'draft' | 'published' | 'archived';

// --- 2.1 Taxonomías (tipo ACF) ---
export interface ITaxonomy {
  id: string;
  name: string;
  collectionId: string;
  hierarchical: boolean;
  terms: ITaxonomyTerm[];
}

export interface ITaxonomyTerm {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
}

// --- 2.2 Grupos de Campos (tipo ACF Field Groups) ---
export type FieldType = 'text' | 'textarea' | 'richtext' | 'image' | 'select' | 'toggle' | 'number' | 'date' | 'url';

export interface IFieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  instructions?: string; // texto de ayuda bajo la etiqueta
  required?: boolean;
  placeholder?: string;
  defaultValue?: unknown;
  options?: string[]; // select
  min?: number; // number
  max?: number;
  step?: number;
  maxLength?: number; // text, textarea
  rows?: number; // textarea
  width?: FieldWidth; // ancho dentro del editor de entradas (%), como el wrapper de ACF
}

export type FieldWidth = 25 | 33 | 50 | 100;

export interface IFieldGroup {
  id: number;
  name: string;
  collectionId: string;
  fields: IFieldDefinition[];
}

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
// Estructura tipo Divi pero más flexible: section > row > column > módulos (o filas anidadas)
export interface IPageBlock {
  id: string;
  type: string; // "section" | "row" | "column" | "heading" | "text" | "image" | "button"...
  order: number;
  props: Record<string, unknown>;
  settings: IBlockSettings;
  children?: IPageBlock[]; // solo en contenedores (section, row, column)
}

export interface IBlockSettings {
  visibility: {
    desktop: boolean; // lg:block / lg:hidden
    tablet: boolean; // md:block / md:hidden
    mobile: boolean; // block / hidden
  };
  customClasses?: string;
  // Estilos libres por dispositivo (desktop es la base; tablet y mobile solo sobrescriben)
  style?: Partial<Record<'desktop' | 'tablet' | 'mobile', Record<string, string>>>;
}

// --- 5.1 Diseño global del sitio (paleta y tipografías del constructor) ---
export interface ISiteColor {
  id: string; // "primary", "secondary", "tertiary", "background" o personalizados "c-xxxxx"
  name: string;
  value: string; // hex
}

export interface ISiteDesign {
  colors: ISiteColor[];
  fonts: { heading: string; body: string }; // familias de Google Fonts
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
