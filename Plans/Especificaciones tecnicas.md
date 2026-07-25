Software Requirements Specification (SRS) - RaCo CMS (Headless IA)

0. Visión y Descripción del Proyecto

¿Qué estamos construyendo?
RaCo CMS es un gestor de contenidos Headless de próxima generación, 100% autoalojado, enfocado en la modularidad y el rendimiento extremo. A diferencia de los CMS tradicionales (WordPress) que acoplan el código a la base de datos, RaCo almacena estructuras de datos (JSON) interpretadas por Astro.

Innovación principal:

Figma-to-Code y Prompt-to-Site: La IA (Gemini) ensambla estructuras modulares en formato JSON que el usuario puede editar visualmente después.

Theme Builder Nativo: Permite definir plantillas de diseño globales para Tipos de Contenido (Noticias) y Partes Globales (Header, Footer).

Responsive Engine Nativo: Control total de visibilidad por dispositivo mapeado directamente a clases de Tailwind (hidden, md:block).

Pipeline Multimedia Edge: Procesamiento asíncrono y conversión a WebP al vuelo con Sharp, sin dependencias de S3 externos.

1. Reglas de Sistema para la IA (Diksi/DeepSeek)

Stack Forzado: NestJS (Backend), React+Vite (Admin SPA), Astro (Front), TypeORM (DB).

Gestor de Paquetes: Usar exclusivamente pnpm (workspaces) con monorepo.

Compartición de Tipos: Todas las interfaces residen en packages/shared.

Cero CSS Custom: Uso estricto de clases de Tailwind CSS.

2. Lógica Estricta de Generación IA (Regla de "Bloques LEGO")

ATENCIÓN AGENTE CODIFICADOR: La IA NUNCA debe generar y guardar código HTML crudo en la base de datos.
La IA se comporta como un "ensamblador". Debe devolver un array de JSONs que mapeen a los módulos nativos del CMS (ej. [{ "type": "Hero", "props": { "title": "Hola" } }]). El panel de React lee esto y permite al usuario arrastrar, editar visualmente y reordenar.

3. Variables de Entorno Requeridas (.env global)

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=secret
DB_NAME=raco_cms
JWT_SECRET=tu_super_secreto_aqui
GEMINI_API_KEY=tu_api_key
REDIS_HOST=localhost
API_PORT=3000
ADMIN_PORT=5173
FRONT_PORT=4321


4. Contratos de Datos y Entidades Core (TypeScript Interfaces)

// packages/shared/src/index.ts

// 1. Usuarios y Roles (RBAC)
export interface IUser {
  id: number;
  email: string;
  role: 'admin' | 'editor' | 'author'; // Control de acceso al Theme Builder vs Contenido
}

// 2. Colecciones y Entradas (Borradores y Publicaciones)
export interface ICollection {
  id: string; // ej: "noticias", "faqs"
  name: string;
  schema: Record<string, any>; 
}

export interface IEntry {
  id: number;
  collectionId: string;
  slug: string;
  status: 'draft' | 'published' | 'archived'; // Ciclo de vida del contenido
  locale: string; // Para futuro soporte multi-idioma (i18n)
  data: Record<string, any>; 
  seoData: ISeoMetadata;
}

// 3. Theme Builder y Partes Globales
export interface ITemplate {
  id: number;
  name: string;
  collectionId: string; // A qué colección aplica (ej. single-noticia)
  blocks: IPageBlock[]; 
}

export interface IGlobalPart {
  id: string; // ej: "header", "footer"
  name: string;
  blocks: IPageBlock[]; 
}

// 4. Sistema de Menús (Drag & Drop)
export interface IMenu {
  id: string;
  name: string;
  items: IMenuItem[];
}

export interface IMenuItem {
  id: string;
  label: string;
  url: string;
  type: 'custom' | 'page' | 'entry';
  target: '_self' | '_blank';
  children: IMenuItem[]; 
}

// 5. Estructura de Bloques (Motor Responsivo)
export interface IPageBlock {
  id: string;
  type: string; 
  order: number;
  props: Record<string, any>; 
  settings: {
    visibility: {
      desktop: boolean; // lg:block / lg:hidden
      tablet: boolean;  // md:block / md:hidden
      mobile: boolean;  // block / hidden
    };
    customClasses?: string;
  };
}

export interface ISeoMetadata {
  title: string;
  description: string;
  openGraphImage?: string;
  noIndex: boolean;
}


5. Arquitectura Frontend (Astro)

Layout Base (src/layouts/Layout.astro): Fetch a /api/v1/global-parts para inyectar Header/Footer. Inyecta ISeoMetadata en el <head>.

Rutas Dinámicas (src/pages/[collection]/[slug].astro): Resuelve las entradas, carga su ITemplate asignado y fusiona los datos del usuario con los bloques visuales. Genera el XML del sitemap dinámicamente.

6. Definición de Endpoints REST (NestJS Controllers - prefijo /api/v1)

GET/POST /collections -> Gestiona esquemas de Custom Post Types.

GET /entries/:collectionId -> Lista entradas filtrando por status.

GET/PUT /templates/:id -> Gestiona el Theme Builder.

GET/PUT /global-parts/:id -> Gestiona Header/Footer.

GET/PUT /menus/:id -> Gestiona árboles JSON de navegación.

POST /ai/generate-site -> Gemini API. Genera el array de IPageBlock.

POST /media/upload -> Usa FileInterceptor + sharp (Pipeline a WebP).

7. Sistema de Plugins (Event Bus)

Implementar EventBusService en NestJS (EventEmitter2) para acciones y filtros (ej. filter.entry.seo, action.after.publish).