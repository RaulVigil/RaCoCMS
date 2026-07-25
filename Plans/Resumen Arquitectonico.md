Resumen Ejecutivo y Arquitectónico: RaCo CMS

Nota para Agentes de IA (DeepSeek / Diksi / Cursor):
Este documento resume el contexto estratégico y las decisiones arquitectónicas tomadas para la construcción de RaCo CMS. Debe leerse como preámbulo al archivo ESPECIFICACIONES_TECNICAS.md para entender el modelo de negocio y las directrices de ingeniería.

1. El Problema en el Mercado

Los CMS y Page Builders tradicionales (WordPress, Divi, Elementor) presentan problemas graves:

Deuda de Rendimiento: Inyectan miles de líneas de CSS/JS innecesarias y guardan "shortcodes" en la base de datos, arruinando las métricas de Core Web Vitals.

Media Prehistórica: Subir un JPG de 5MB penaliza la web al instante si el usuario no sabe optimizarlo.

IA Rígida: Las herramientas actuales de IA generan HTML estático. Si el cliente final quiere cambiar algo, no puede hacerlo fácilmente sin romper el código.

2. La Solución: RaCo CMS

RaCo CMS es un sistema Headless, modular y 100% autoalojable que utiliza la IA como un "Ensamblador" en lugar de un generador de código duro.

IA como Asistente Modular: Cuando se le pide un diseño (por prompt o desde Figma), la IA no devuelve HTML. Devuelve un JSON que estructura componentes nativos del CMS. El usuario luego utiliza un editor visual (Drag & Drop) para modificar esa estructura como si fueran piezas de LEGO.

Experiencia de Agencia (Theme Builder): Incluye un motor de plantillas globales, menús arrastrables, Custom Post Types (Colecciones) y partes globales (Header/Footer), permitiendo controlar el diseño del sitio entero desde el panel.

Velocidad Extrema (Cero Costos Extra): Todo corre en el VPS del usuario. NestJS procesa imágenes a WebP en segundo plano, y Astro compila el frontend enviando cero JavaScript por defecto al cliente.

3. Decisiones del Stack Tecnológico (y el porqué)

Pnpm & Monorepo: Para mantener Backend, Admin y Frontend en un solo repositorio, compartiendo interfaces TypeScript y asegurando que las 3 capas hablen el mismo idioma.

NestJS (Backend): Entorno tipado, arquitectura robusta, soporte para colas (Redis) necesarias para procesamiento de medios, y Event Bus nativo para el sistema de Plugins.

React + Vite (Admin): Interfaz SPA ultrarrápida para el constructor visual de bloques. Separada completamente del frontend para no afectar el peso de la página web del visitante.

Astro (Frontend): La herramienta definitiva para lograr tiempos de carga de milisegundos y un SEO técnico impecable (SSG/SSR).

MySQL: Almacenamiento relacional estructurado, usando columnas de tipo JSON para guardar las propiedades de los bloques de manera eficiente.

4. Innovaciones Enterprise (Funciones Clave)

Gestión de Roles (RBAC) y Borradores: Separación entre Administradores (acceso al Theme Builder) y Editores (solo creación de contenido/borradores).

Motor Responsivo Nativo: El usuario oculta un bloque en móvil desde React, y el sistema simplemente inyecta la clase hidden de Tailwind CSS, sin usar media queries complejos.

Optimización de IA (Cero Alucinaciones): Uso de la API de Gemini (con control de cuotas) forzando salidas en JSON Schema para que encaje perfectamente con las interfaces del CMS.