import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { designThemeCss, designVarClasses } from '@raco/blocks';
import type { Site } from './api';
import { classesIn, pageCss } from './css';

export interface RenderedPage {
  html: string;
  css: string;
  bodyClass: string;
}

// Renderiza el contenido (bloques o plantillas en React) a HTML estático y calcula su CSS.
// No viaja nada de JavaScript al visitante.
export async function renderPage(element: ReactElement, site: Site): Promise<RenderedPage> {
  const html = renderToStaticMarkup(element);
  const bodyClass = `${designVarClasses(site.design)} bg-white font-body text-primary antialiased`;
  const classes = classesIn(`${html} class="${bodyClass}"`);
  const css = await pageCss(classes, designThemeCss(site.design));
  return { html, css, bodyClass };
}

export { createElement };
