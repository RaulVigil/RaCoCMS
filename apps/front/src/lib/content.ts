import { createElement } from 'react';
import { PageContent } from '@raco/blocks';
import type { EntryContext } from './api';
import EntryTemplate from '../templates/EntryTemplate';
import Notice from '../templates/Notice';

// Las entradas de colecciones con constructor muestran su diseño; el resto, la plantilla genérica
export function entryElement(ctx: EntryContext) {
  if (ctx.collection?.useBuilder) return createElement(PageContent, { blocks: ctx.entry.blocks ?? [] });
  return createElement(EntryTemplate, ctx);
}

export const notFoundElement = () =>
  createElement(Notice, {
    code: '404',
    title: 'No encontramos esta página',
    text: 'Puede que la dirección esté mal escrita o que la página ya no exista.',
    link: true,
  });
