import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// En producción (node dist/server/entry.mjs) astro.config no se ejecuta: el .env se carga aquí
for (const file of [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')]) {
  if (existsSync(file)) {
    process.loadEnvFile(file);
    break;
  }
}

const trim = (url: string) => url.replace(/\/+$/, '');

// Origen de la API (sin /api/v1): también sirve /uploads
export const API_URL = trim(process.env.API_URL || `http://localhost:${process.env.API_PORT || 3000}`);
// URL pública del sitio, para canonical, Open Graph y sitemap
export const SITE_URL = trim(process.env.SITE_URL || `http://localhost:${process.env.FRONT_PORT || 4321}`);
