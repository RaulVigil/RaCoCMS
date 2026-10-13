import type { IPageBlock } from '@raco/shared';
import { createBlock } from './tree';

export interface RowLayout {
  id: string;
  label: string;
  spans: number[]; // ancho de cada columna en escritorio, sobre 12
  rowSpans?: number[]; // alto en filas de la grilla (bento)
  tabletSameAsDesktop?: boolean;
}

// Estructuras para empezar rápido; después cada columna se ajusta por dispositivo
export const rowLayouts: RowLayout[] = [
  { id: '1', label: 'Una columna', spans: [12] },
  { id: '1-1', label: 'Dos iguales', spans: [6, 6] },
  { id: '1-1-1', label: 'Tres iguales', spans: [4, 4, 4] },
  { id: '1-1-1-1', label: 'Cuatro iguales', spans: [3, 3, 3, 3] },
  { id: '2-1', label: 'Ancha + angosta', spans: [8, 4] },
  { id: '1-2', label: 'Angosta + ancha', spans: [4, 8] },
  { id: '5-7', label: 'Texto + imagen', spans: [5, 7] },
  { id: '1-2-1', label: 'Centro destacado', spans: [3, 6, 3] },
  { id: '1-3', label: 'Lateral + contenido', spans: [3, 9] },
  { id: '6', label: 'Seis columnas', spans: [2, 2, 2, 2, 2, 2] },
  { id: 'bento', label: 'Bento', spans: [6, 6, 3, 3], rowSpans: [2, 1, 1, 1], tabletSameAsDesktop: true },
  { id: 'bento-2', label: 'Bento invertido', spans: [3, 3, 6, 6], rowSpans: [1, 1, 2, 1], tabletSameAsDesktop: true },
];

// Cómo se reacomoda por defecto: en tablet las angostas van de a dos y en móvil todo apilado
function tabletSpan(span: number) {
  if (span <= 2) return 4;
  if (span <= 4) return 6;
  return 12;
}

export function createRow(layout: RowLayout): IPageBlock {
  const columns = layout.spans.map((span, i) =>
    createBlock('column', {
      span: {
        desktop: span,
        tablet: layout.tabletSameAsDesktop ? span : tabletSpan(span),
        mobile: span <= 2 ? 6 : 12,
      },
      rowSpan: layout.rowSpans?.[i] ?? 1,
    }),
  );
  return createBlock('row', {}, columns);
}

export function createSection(layout: RowLayout): IPageBlock {
  return createBlock('section', {}, [createRow(layout)]);
}
