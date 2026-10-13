import type { IPageBlock } from '@raco/shared';
import { blockDefaults, defaultVisibility, type BlockPropsMap, type BlockType } from './types';

// Operaciones inmutables sobre el árbol de bloques (las usa el editor y servirán para validar lo que genere la IA)

export function newBlockId() {
  return `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function createBlock<K extends BlockType>(
  type: K,
  props: Partial<BlockPropsMap[K]> = {},
  children?: IPageBlock[],
): IPageBlock {
  return {
    id: newBlockId(),
    type,
    order: 0,
    props: { ...structuredClone(blockDefaults[type]), ...props } as Record<string, unknown>,
    settings: { visibility: { ...defaultVisibility } },
    ...(isContainer(type) ? { children: children ?? [] } : {}),
  };
}

export const isContainer = (type: string) => type === 'section' || type === 'row' || type === 'column';

// Qué puede ir dentro de qué (null = raíz de la página)
export function canContain(parentType: string | null, childType: string) {
  if (parentType === null) return childType === 'section';
  if (parentType === 'section') return childType === 'row';
  if (parentType === 'row') return childType === 'column';
  if (parentType === 'column') return !isContainer(childType) || childType === 'row';
  return false;
}

export interface Location {
  parent: IPageBlock | null;
  list: IPageBlock[];
  index: number;
  ancestors: IPageBlock[];
}

export function locate(blocks: IPageBlock[], id: string, parent: IPageBlock | null = null, ancestors: IPageBlock[] = []): Location | null {
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.id === id) return { parent, list: blocks, index: i, ancestors };
    if (b.children) {
      const found = locate(b.children, id, b, [...ancestors, b]);
      if (found) return found;
    }
  }
  return null;
}

export function findBlock(blocks: IPageBlock[], id: string): IPageBlock | null {
  const loc = locate(blocks, id);
  return loc ? loc.list[loc.index] : null;
}

// Se permite una fila dentro de una columna, pero no más niveles (se volvería inmanejable)
export function canDropInto(blocks: IPageBlock[], parentId: string | null, childType: string) {
  if (parentId === null) return canContain(null, childType);
  const loc = locate(blocks, parentId);
  if (!loc) return false;
  const parent = loc.list[loc.index];
  if (!canContain(parent.type, childType)) return false;
  if (parent.type === 'column' && childType === 'row') {
    return loc.ancestors.filter((a) => a.type === 'row').length < 2;
  }
  return true;
}

function mapTree(blocks: IPageBlock[], fn: (b: IPageBlock) => IPageBlock): IPageBlock[] {
  return blocks.map((b) => {
    const mapped = fn(b);
    return mapped.children ? { ...mapped, children: mapTree(mapped.children, fn) } : mapped;
  });
}

export function updateBlock(blocks: IPageBlock[], id: string, change: (b: IPageBlock) => IPageBlock) {
  return mapTree(blocks, (b) => (b.id === id ? change(b) : b));
}

export function removeBlock(blocks: IPageBlock[], id: string): IPageBlock[] {
  return blocks
    .filter((b) => b.id !== id)
    .map((b) => (b.children ? { ...b, children: removeBlock(b.children, id) } : b));
}

export function insertBlock(blocks: IPageBlock[], parentId: string | null, index: number, block: IPageBlock): IPageBlock[] {
  if (parentId === null) {
    const next = [...blocks];
    next.splice(index, 0, block);
    return next;
  }
  return mapTree(blocks, (b) => {
    if (b.id !== parentId) return b;
    const children = [...(b.children ?? [])];
    children.splice(index, 0, block);
    return { ...b, children };
  });
}

function isInside(blocks: IPageBlock[], ancestorId: string, id: string | null) {
  if (id === null) return false;
  if (id === ancestorId) return true;
  const loc = locate(blocks, id);
  return !!loc?.ancestors.some((a) => a.id === ancestorId);
}

export function moveBlock(blocks: IPageBlock[], id: string, parentId: string | null, index: number): IPageBlock[] {
  const from = locate(blocks, id);
  if (!from || isInside(blocks, id, parentId)) return blocks;
  const block = from.list[from.index];
  // Si se mueve dentro de la misma lista hacia abajo, el hueco que deja corre el índice
  const sameList = (from.parent?.id ?? null) === parentId;
  const target = sameList && from.index < index ? index - 1 : index;
  return insertBlock(removeBlock(blocks, id), parentId, target, block);
}

function cloneWithNewIds(block: IPageBlock): IPageBlock {
  return {
    ...structuredClone(block),
    id: newBlockId(),
    children: block.children?.map(cloneWithNewIds),
  };
}

export function duplicateBlock(blocks: IPageBlock[], id: string): { blocks: IPageBlock[]; copyId: string | null } {
  const loc = locate(blocks, id);
  if (!loc) return { blocks, copyId: null };
  const copy = cloneWithNewIds(loc.list[loc.index]);
  return { blocks: insertBlock(blocks, loc.parent?.id ?? null, loc.index + 1, copy), copyId: copy.id };
}

// Al guardar: order = posición real, recursivo
export function normalizeOrder(blocks: IPageBlock[]): IPageBlock[] {
  return blocks.map((b, i) => ({
    ...b,
    order: i,
    ...(b.children ? { children: normalizeOrder(b.children) } : {}),
  }));
}

export function sortByOrder(blocks: IPageBlock[]): IPageBlock[] {
  return [...blocks]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((b) => (b.children ? { ...b, children: sortByOrder(b.children) } : b));
}
