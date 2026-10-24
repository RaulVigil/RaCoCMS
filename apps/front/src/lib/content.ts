import { createElement, type ReactElement } from 'react';
import type { IPageBlock } from '@raco/shared';
import { ArchiveContext, EntryContext, PageContent, toEntryData, toPostItem } from '@raco/blocks';
import type { EntryContext as EntryCtx, EntryList } from './api';
import EntryTemplate from '../templates/EntryTemplate';
import ArchiveTemplate from '../templates/ArchiveTemplate';
import Notice from '../templates/Notice';

export interface Content {
  element: ReactElement;
  blocks: IPageBlock[]; // para saber qué listados de entradas hay que cargar
}

// Una entrada se muestra, por orden: con su diseño propio, con la plantilla de su colección
// (datos dinámicos) o con la plantilla genérica
export function entryContent(ctx: EntryCtx): Content {
  const own = ctx.collection?.useBuilder ? (ctx.entry.blocks ?? []) : [];
  if (own.length) return { element: createElement(PageContent, { blocks: own }), blocks: own };

  const template = ctx.template?.blocks ?? [];
  if (template.length) {
    const data = toEntryData(ctx.entry, ctx.fieldGroups.flatMap((g) => g.fields));
    return {
      element: createElement(EntryContext.Provider, { value: data }, createElement(PageContent, { blocks: template })),
      blocks: template,
    };
  }
  return { element: createElement(EntryTemplate, ctx), blocks: [] };
}

// Listado de una colección: con su plantilla de listado o con la genérica
export function archiveContent(list: EntryList): Content {
  const template = list.template?.blocks ?? [];
  if (!template.length) return { element: createElement(ArchiveTemplate, list), blocks: [] };

  const archive = {
    items: list.items.map((e) => toPostItem(e)),
    page: list.page,
    totalPages: list.totalPages,
    baseUrl: `/${list.collection.id}`,
  };
  return {
    element: createElement(ArchiveContext.Provider, { value: archive }, createElement(PageContent, { blocks: template })),
    blocks: template,
  };
}

export const notFoundElement = () =>
  createElement(Notice, {
    code: '404',
    title: 'No encontramos esta página',
    text: 'Puede que la dirección esté mal escrita o que la página ya no exista.',
    link: true,
  });
