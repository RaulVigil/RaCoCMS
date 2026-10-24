import { useEffect, useState } from 'react';
import type { IMenu } from '@raco/shared';
import { api } from './api';

// Menús del sitio para el constructor (lienzo y selector del módulo Menú).
// Se vuelven a pedir al volver a la pestaña, por si se editaron en otra.
export function useMenus() {
  const [menus, setMenus] = useState<IMenu[]>([]);

  useEffect(() => {
    const load = () => api.get<IMenu[]>('/menus').then(setMenus).catch(() => {});
    load();
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, []);

  return menus;
}
