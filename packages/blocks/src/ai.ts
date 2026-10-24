import type { IAiModuleSpec, IAiPageSpec, IAiRowSpec, IAiSectionSpec, IPageBlock } from '@raco/shared';
import { createBlock, normalizeOrder } from './tree';
import { createRow, rowLayouts } from './layouts';
import { ICONS } from './icons';
import type { Align, RichDoc } from './types';

// Convierte la receta que arma la IA (3.15) en bloques normales del constructor.
// La API ya la valida; aquí se vuelve a ser estricto con tipos, íconos y diseños por si llega de otro lado

const iconNames = new Set(ICONS.map((i) => i.name));
const iconOr = (name: string | undefined, fallback: string) => (name && iconNames.has(name) ? name : fallback);

// "Un párrafo con **negrita**" → documento de Tiptap (nunca HTML)
export function textToDoc(text: string): RichDoc | null {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!paragraphs.length) return null;
  return {
    type: 'doc',
    content: paragraphs.map((p) => {
      const content: RichDoc[] = [];
      p.split(/(\*\*[^*]+\*\*)/).forEach((part, i) => {
        if (!part) return;
        const bold = i % 2 === 1;
        const lines = (bold ? part.slice(2, -2) : part).split('\n');
        lines.forEach((line, j) => {
          if (j > 0) content.push({ type: 'hardBreak' });
          if (line) content.push({ type: 'text', text: line, ...(bold ? { marks: [{ type: 'bold' }] } : {}) });
        });
      });
      return { type: 'paragraph', content };
    }),
  };
}

function moduleBlock(m: IAiModuleSpec, align: Align): IPageBlock | null {
  switch (m.type) {
    case 'heading': {
      const level = Math.min(4, Math.max(1, m.level ?? 2)) as 1 | 2 | 3 | 4;
      const size = ({ 1: '2xl', 2: 'lg', 3: 'sm', 4: 'sm' } as const)[level];
      return createBlock('heading', { text: m.text ?? '', level, size, align });
    }
    case 'text':
      return createBlock('text', { content: textToDoc(m.text ?? ''), align });
    case 'button':
      return createBlock('button', { text: m.text ?? 'Botón', url: m.url || '#', variant: m.variant ?? 'primary', align });
    case 'list':
      return createBlock('list', { items: m.items ?? [] });
    case 'card':
      return createBlock('card', {
        media: m.icon ? 'icon' : 'none',
        icon: iconOr(m.icon, 'Star'),
        title: m.title ?? '',
        text: m.text ?? '',
        linkText: m.label ?? '',
        url: m.label ? m.url || '#' : '',
        align,
      });
    case 'icon':
      return createBlock('icon', { name: iconOr(m.icon, 'Star'), shape: 'circle', align });
    case 'counter':
      return createBlock('counter', { number: m.number ?? '', prefix: m.prefix ?? '', suffix: m.suffix ?? '', label: m.label ?? '', align });
    case 'testimonial':
      return createBlock('testimonial', { quote: m.text ?? '', name: m.name ?? '', role: m.role ?? '', rating: m.rating ?? 5, align });
    case 'accordion':
    case 'tabs': {
      const items = (m.entries ?? []).map((e) => ({ title: e.title, content: textToDoc(e.text) }));
      return m.type === 'accordion' ? createBlock('accordion', { items }) : createBlock('tabs', { items });
    }
    case 'image':
      return createBlock('image', { src: m.src ?? '', alt: m.alt ?? '', rounded: true });
    case 'map':
      return createBlock('map', { address: m.address ?? '' });
    case 'spacer':
      return createBlock('spacer');
    case 'divider':
      return createBlock('divider');
    default:
      return null;
  }
}

function rowBlock(spec: IAiRowSpec): IPageBlock {
  const layout =
    rowLayouts.find((l) => l.id === spec.layout && l.spans.length === spec.columns.length) ??
    rowLayouts.find((l) => l.spans.length === spec.columns.length && !l.rowSpans) ??
    rowLayouts[0];
  const row = createRow(layout);
  const card = spec.columnStyle === 'card';
  const align: Align = spec.align === 'center' ? 'center' : 'left';

  row.props = {
    ...row.props,
    ...(card ? { align: 'stretch' } : {}),
    ...(spec.mobile === 'slider' ? { layout: { desktop: 'grid', tablet: 'grid', mobile: 'slider' } } : {}),
  };
  row.children = (row.children ?? []).map((column, i) => ({
    ...column,
    // La alineación va en cada módulo, no en la columna: un acordeón o una lista centrados se leen mal
    props: card ? { ...column.props, background: 'white', padding: 'md', rounded: true, shadow: true } : column.props,
    children: (spec.columns[i]?.modules ?? [])
      .map((m) => moduleBlock(m, align))
      .filter((b): b is IPageBlock => !!b),
  }));
  return row;
}

function sectionBlock(spec: IAiSectionSpec): IPageBlock {
  const hero = spec.height !== 'auto';
  return createBlock(
    'section',
    {
      // Con imagen de fondo va el velo oscuro: el texto tiene que ser claro
      background: spec.image && spec.background === 'none' ? 'dark' : spec.background,
      backgroundImage: spec.image,
      paddingY: hero ? 'xl' : 'lg',
      width: spec.width,
      minHeight: spec.height,
      verticalAlign: 'center',
      anchor: spec.anchor,
    },
    spec.rows.map(rowBlock),
  );
}

export function specToBlocks(spec: IAiPageSpec): IPageBlock[] {
  return normalizeOrder(spec.sections.map(sectionBlock));
}
