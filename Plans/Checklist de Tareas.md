✅ Checklist de Tareas — RaCo CMS

Proyecto: CMS Headless con IA, Monorepo (NestJS + React + Astro)
Estado: 🔲 Pendiente | 🔄 En progreso | ✅ Completada

📦 Fase 1 — Configuración del Monorepo

[x] ✅ 1.1 Inicializar monorepo con pnpm y pnpm-workspace.yaml (configurado para apps/* y packages/*).

[x] ✅ 1.2 Crear estructura de carpetas: apps/api, apps/admin, apps/front y packages/shared.

[x] ✅ 1.3 Configurar tsconfig.base.json y tsconfig.json en cada paquete/app.

[x] ✅ 1.4 Crear packages/shared con interfaces TypeScript (IUser, ICollection, IEntry, ITemplate, IGlobalPart, IMenu, IPageBlock, ISeoMetadata).

[x] ✅ 1.5 Configurar variables de entorno (.env global y esquema de validación).

[x] ✅ 1.6 Configurar herramientas de desarrollo (ESLint, Prettier).

[x] ✅ 1.7 Verificar que el monorepo compila sin errores.

🖥️ Fase 2 — Backend (NestJS + TypeORM)

[ ] 🔲 2.1 Inicializar proyecto NestJS en apps/api.

[ ] 🔲 2.2 Configurar conexión a MySQL con TypeORM.

[ ] 🔲 2.3 Crear entidades: User, Collection, Entry, Template, GlobalPart, Menu, MenuItem.

[ ] 🔲 2.4 Implementar RBAC (roles: admin, editor, author).

[ ] 🔲 2.5 Crear módulo de Autenticación (JWT, login, register).

[ ] 🔲 2.6 Crear CRUD de Colecciones (/api/v1/collections).

[ ] 🔲 2.7 Crear CRUD de Entradas (/api/v1/entries/:collectionId).

[ ] 🔲 2.8 Crear CRUD de Templates — Theme Builder (/api/v1/templates/:id).

[ ] 🔲 2.9 Crear CRUD de Partes Globales (/api/v1/global-parts/:id).

[ ] 🔲 2.10 Crear CRUD de Menús (/api/v1/menus/:id).

[ ] 🔲 2.11 Implementar endpoint POST /api/v1/ai/generate-site (Gemini API + JSON Schema para Prompts).

[ ] 🔲 2.12 Implementar endpoint POST /api/v1/ai/parse-figma (Extracción de nodos de Figma a JSON modular).

[ ] 🔲 2.13 Implementar POST /api/v1/media/upload (FileInterceptor + Sharp → WebP).

[ ] 🔲 2.14 Implementar sistema de Plugins con EventEmitter2 (Event Bus).

[ ] 🔲 2.15 Pipeline de procesamiento asíncrono de imágenes con Redis/Colas.

🎨 Fase 3 — Admin SPA (React + Vite)

[ ] 🔲 3.1 Inicializar proyecto React + TypeScript + Vite en apps/admin.

[ ] 🔲 3.2 Configurar Tailwind CSS inyectando estrictamente el Design System (Primary #334155, Secondary #22D3EE, tipografías Montserrat e Inter).

[ ] 🔲 3.3 Crear layout base del panel (Sidebar + Header + Router).

[ ] 🔲 3.4 Implementar login y protección de rutas (RBAC).

[ ] 🔲 3.5 Crear módulo de gestión de Colecciones (CRUD).

[ ] 🔲 3.6 Crear módulo de gestión de Entradas (Editor con borradores).

[ ] 🔲 3.7 Crear Theme Builder (Editor visual de plantillas).

[ ] 🔲 3.8 Crear editor de Partes Globales (Header/Footer).

[ ] 🔲 3.9 Crear constructor de Menús (Drag & Drop).

[ ] 🔲 3.10 Crear Block Editor (Editor visual Drag & Drop de IPageBlock).

[ ] 🔲 3.11 Implementar visibilidad responsive por dispositivo (desktop/tablet/mobile).

[ ] 🔲 3.12 Integrar UI para generación por IA (Prompt y URL de Figma).

[ ] 🔲 3.13 Gestor multimedia (subida, previsualización, eliminación).

🚀 Fase 4 — Frontend Público (Astro)

[ ] 🔲 4.1 Inicializar proyecto Astro en apps/front.

[ ] 🔲 4.2 Configurar Tailwind CSS en Astro.

[ ] 🔲 4.3 Crear Layout.astro base (fetch a global-parts para Header/Footer + SEO).

[ ] 🔲 4.4 Crear rutas dinámicas [collection]/[slug].astro.

[ ] 🔲 4.5 Renderizar IPageBlock[] como componentes Astro.

[ ] 🔲 4.6 Implementar inyección de SEO (ISeoMetadata en <head>).

[ ] 🔲 4.7 Generar sitemap XML dinámico.

[ ] 🔲 4.8 Crear componentes de bloque reutilizables (Hero, Cards, FAQ, etc.).

[ ] 🔲 4.9 Implementar sistema de renderizado responsive (clases Tailwind).

[ ] 🔲 4.10 Integración con API del backend.

🔧 Fase 5 — Integración y Pruebas

[ ] 🔲 5.1 Probar flujo completo: Crear colección → Añadir entrada → Asignar template → Renderizar frontend.

[ ] 🔲 5.2 Probar generación por IA (Figma/Prompt → JSON → Bloques → Edición visual).

[ ] 🔲 5.3 Probar subida y procesamiento de imágenes (WebP).

[ ] 🔲 5.4 Probar RBAC (admin vs editor vs author).

[ ] 🔲 5.5 Probar sistema de plugins (Event Bus).

[ ] 🔲 5.6 Pruebas de rendimiento (Lighthouse, Core Web Vitals).

[ ] 🔲 5.7 Documentación de API (Swagger/OpenAPI).