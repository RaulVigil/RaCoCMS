import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { compile } from 'tailwindcss';

// CSS por página: las clases dinámicas de los bloques (px propios, colores, slider...) no pueden
// existir en el build. Se generan con el compilador de Tailwind a partir del HTML ya renderizado
// y se cachean por combinación de clases, así cada página envía solo lo que usa.

const require = createRequire(import.meta.url);
const twDir = dirname(require.resolve('tailwindcss/package.json'));

const cache = new Map<string, string>();
const MAX_CACHE = 300;

// renderToStaticMarkup escapa los atributos: hay que volver a los caracteres reales de las clases
const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

export function classesIn(html: string): string[] {
  const set = new Set<string>();
  for (const m of html.matchAll(/class="([^"]*)"/g)) {
    for (const c of decode(m[1]).split(/\s+/)) if (c) set.add(c);
  }
  return [...set].sort();
}

export async function pageCss(classes: string[], theme: string): Promise<string> {
  const key = `${theme}|${classes.join(' ')}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  const compiler = await compile(
    `@import "tailwindcss/theme.css" layer(theme);\n@import "tailwindcss/utilities.css" layer(utilities);\n${theme}`,
    {
      base: twDir,
      loadStylesheet: async (id: string) => ({
        path: id,
        base: twDir,
        content: await readFile(join(twDir, id.replace('tailwindcss/', '')), 'utf8'),
      }),
    },
  );
  const css = compiler.build(classes);

  if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value!);
  cache.set(key, css);
  return css;
}
