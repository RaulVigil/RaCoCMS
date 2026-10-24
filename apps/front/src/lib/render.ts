import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { IPageBlock } from '@raco/shared';
import { PageContent, PostsContext, SiteContext, designThemeCss, designVarClasses } from '@raco/blocks';
import type { Site } from './api';
import { classesIn, pageCss } from './css';
import { loadPosts } from './posts';

export interface RenderedPage {
  header: string;
  html: string;
  footer: string;
  css: string;
  bodyClass: string;
  stickyHeader: boolean;
}

// Renderiza header, contenido y footer a HTML estático y calcula el CSS que usan entre los tres.
// No viaja nada de JavaScript al visitante.
export async function renderPage(
  element: ReactElement,
  site: Site,
  currentPath: string,
  contentBlocks: IPageBlock[] = [],
): Promise<RenderedPage> {
  const posts = await loadPosts([...contentBlocks, ...site.header.blocks, ...site.footer.blocks]);
  const withSite = (el: ReactElement) =>
    renderToStaticMarkup(
      createElement(
        SiteContext.Provider,
        { value: { menus: site.menus, currentPath } },
        createElement(PostsContext.Provider, { value: posts }, el),
      ),
    );

  const header = site.header.blocks.length ? withSite(createElement(PageContent, { blocks: site.header.blocks })) : '';
  const html = withSite(element);
  const footer = site.footer.blocks.length ? withSite(createElement(PageContent, { blocks: site.footer.blocks })) : '';

  const bodyClass = `${designVarClasses(site.design)} flex min-h-screen flex-col bg-white font-body text-primary antialiased`;
  const sticky = site.header.sticky ? 'sticky top-0 z-40' : '';
  const classes = classesIn(`${header}${html}${footer} class="${bodyClass} ${sticky} flex-1"`);
  const css = await pageCss(classes, designThemeCss(site.design));
  return { header, html, footer, css, bodyClass, stickyHeader: site.header.sticky };
}
