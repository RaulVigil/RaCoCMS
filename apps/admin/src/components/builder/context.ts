import { createContext, useContext } from 'react';
import type { IPageBlock, ISiteDesign } from '@raco/shared';
import type { Device } from '@raco/blocks';

export type AddKind = 'section' | 'row' | 'module';

export interface AddRequest {
  kind: AddKind;
  parentId: string | null;
  index: number;
}

export interface DropTarget {
  parentId: string | null;
  index: number;
  anchorId: string | null; // bloque junto al que se suelta (null = dentro del contenedor)
  position: 'before' | 'after' | 'inside';
  horizontal?: boolean;
}

export interface BuilderApi {
  blocks: IPageBlock[];
  design: ISiteDesign; // paleta y fuentes globales del sitio
  device: Device;
  selectedId: string | null;
  hoveredId: string | null;
  activeIds: Set<string>; // seleccionado/hover y sus ancestros: muestran sus botones "+"
  drag: { id: string; type: string } | null;
  dropTarget: DropTarget | null;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  startAdd: (req: AddRequest) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  move: (id: string, delta: -1 | 1) => void;
  startDrag: (block: IPageBlock) => void;
  endDrag: () => void;
  setDropTarget: (t: DropTarget | null) => void;
  drop: () => void;
}

export const BuilderContext = createContext<BuilderApi | null>(null);

export function useBuilder() {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error('useBuilder fuera del constructor');
  return ctx;
}
