import { createContext, useContext, type HTMLAttributes, type ReactNode } from 'react';
import type { IMenu, IPageBlock } from '@raco/shared';
import type { Visibility } from './types';

// En el editor se muestran marcadores para módulos vacíos; en la web no se renderizan
export const EditorContext = createContext(false);
export const useIsEditor = () => useContext(EditorContext);

// Datos del sitio que algunos módulos necesitan (el menú lee sus elementos de aquí)
export interface SiteData {
  menus: IMenu[];
  currentPath?: string; // para marcar el enlace de la página actual
}

export const SiteContext = createContext<SiteData>({ menus: [] });
export const useSite = () => useContext(SiteContext);

// Solo enlaces web, rutas del sitio, anclas, correo y teléfono: nada de javascript:, data:, etc.
export function safeUrl(url: string | undefined | null, fallback = '#'): string {
  const u = (url ?? '').trim();
  if (!u) return fallback;
  if (/^(https?:|mailto:|tel:)/i.test(u) || /^[/#?]/.test(u)) return u;
  // Sin esquema (ej. "contacto" o "www.sitio.com"): se trata como relativo, salvo que traiga uno desconocido
  return /^[a-z][a-z0-9+.-]*:/i.test(u) ? fallback : u;
}

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n) || min));

export function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-current/25 px-4 py-8 text-center text-sm opacity-60">
      {label}
    </div>
  );
}

export interface BlockComponentProps {
  block: IPageBlock;
  visible?: Visibility; // en la web oculta por dispositivo; el editor no lo pasa
  attrs?: HTMLAttributes<HTMLElement>;
  overlay?: ReactNode; // controles del editor, como hijo directo del contenedor
  children?: ReactNode;
}
