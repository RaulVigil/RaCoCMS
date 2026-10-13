import { createContext, useContext, type HTMLAttributes, type ReactNode } from 'react';
import type { IPageBlock } from '@raco/shared';
import type { Visibility } from './types';

// En el editor se muestran marcadores para módulos vacíos; en la web no se renderizan
export const EditorContext = createContext(false);
export const useIsEditor = () => useContext(EditorContext);

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
