import type { APIRoute } from 'astro';
import { getSite, getSitemap } from '../lib/api';
import { SITE_URL } from '../lib/env';
import { entryUrl } from '../lib/urls';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Sitemap dinámico: portada, listados de colecciones y todo lo publicado que no sea noindex
export const GET: APIRoute = async () => {
  const [data, site] = await Promise.all([getSitemap(), getSite()]);
  const urls: { loc: string; lastmod?: string }[] = [{ loc: '/' }];

  for (const id of data?.archives ?? []) urls.push({ loc: `/${id}` });
  for (const e of data?.entries ?? []) {
    if (e.id === site.general.homePageId) urls[0].lastmod = e.updatedAt;
    else urls.push({ loc: entryUrl(e.collectionId, e.slug), lastmod: e.updatedAt });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${esc(SITE_URL + u.loc)}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ''}</url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
