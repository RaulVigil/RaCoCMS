import type { IPageBlock } from '@raco/shared';

// Diseño inicial del header y el footer: el sitio se ve completo desde el primer arranque.
// Es el mismo JSON que genera el constructor, así que se edita igual que cualquier página.

const visible = { visibility: { desktop: true, tablet: true, mobile: true } };

const block = (id: string, type: string, props: Record<string, unknown>, children?: IPageBlock[]): IPageBlock => ({
  id,
  type,
  order: 0,
  props,
  settings: visible,
  ...(children ? { children } : {}),
});

export const defaultHeader: IPageBlock[] = [
  block('hdr-section', 'section', { paddingY: 'sm', background: 'white', width: 'wide' }, [
    block('hdr-row', 'row', { align: 'center', gap: 'md' }, [
      block('hdr-col-brand', 'column', { span: { desktop: 4, tablet: 6, mobile: 8 }, verticalAlign: 'center' }, [
        block('hdr-title', 'heading', { text: 'Mi sitio', url: '/', level: 4, size: 'sm' }),
      ]),
      block('hdr-col-menu', 'column', { span: { desktop: 8, tablet: 6, mobile: 4 }, verticalAlign: 'center' }, [
        block('hdr-menu', 'menu', { menuId: 'main', align: 'right' }),
      ]),
    ]),
  ]),
];

const year = new Date().getFullYear();

export const defaultFooter: IPageBlock[] = [
  block('ftr-section', 'section', { paddingY: 'md', background: 'dark', width: 'wide' }, [
    block('ftr-row', 'row', {}, [
      block('ftr-col', 'column', { textAlign: 'center' }, [
        block('ftr-text', 'text', {
          size: 'sm',
          align: 'center',
          content: {
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: `© ${year} Mi sitio · Hecho con RaCo CMS` }] }],
          },
        }),
      ]),
    ]),
  ]),
];
