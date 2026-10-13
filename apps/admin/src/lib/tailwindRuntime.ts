import { useEffect, type RefObject } from 'react';
import { compile } from 'tailwindcss';
import themeCss from 'tailwindcss/theme.css?raw';
import utilitiesCss from 'tailwindcss/utilities.css?raw';
import { blocksThemeCss } from '@raco/blocks';

// Los estilos libres del constructor usan clases arbitrarias (pt-[37px], text-[#ff0055]...) que no
// existen en el CSS compilado del admin. Aquí se generan al vuelo con el mismo compilador de Tailwind.
// El tema (paleta y fuentes del sitio) cambia el compilador, así que hay uno por tema.

type Compiler = Awaited<ReturnType<typeof compile>>;
const compilers = new Map<string, Promise<Compiler>>();
const primed = new WeakSet<Compiler>();

function getCompiler(theme: string) {
  let c = compilers.get(theme);
  if (!c) {
    if (compilers.size > 8) compilers.clear(); // al editar la paleta se crean varios seguidos
    c = compile(
      `@import "tailwindcss/theme.css" layer(theme);\n@import "tailwindcss/utilities.css" layer(utilities);\n${theme}`,
      {
        base: '/',
        loadStylesheet: async (id: string) => ({
          path: id,
          base: '/',
          content: id.includes('theme') ? themeCss : utilitiesCss,
        }),
      },
    );
    compilers.set(theme, c);
  }
  return c;
}

const seen = new Set<string>();
let currentTheme = '';
let styleEl: HTMLStyleElement | null = null;

function collect(root: HTMLElement) {
  const fresh: string[] = [];
  const add = (node: Element) =>
    node.classList.forEach((c) => {
      if (!seen.has(c)) {
        seen.add(c);
        fresh.push(c);
      }
    });
  add(root);
  root.querySelectorAll('[class]').forEach(add);
  return fresh;
}

// Tras cada render recoge las clases del contenedor y genera el CSS que falte
export function useRuntimeTailwind(root: RefObject<HTMLElement | null>, deps: unknown[], theme: string = blocksThemeCss) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;

    const fresh = collect(el);
    const themeChanged = theme !== currentTheme;
    if (!fresh.length && !themeChanged) return;
    currentTheme = theme;

    getCompiler(theme).then((compiler) => {
      if (theme !== currentTheme) return; // llegó tarde: ya se cambió de tema
      // build() acumula candidatos: un compilador nuevo necesita todo lo visto hasta ahora
      const full = themeChanged || !primed.has(compiler);
      primed.add(compiler);
      const css = compiler.build(full ? [...seen] : fresh);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.dataset.raco = 'runtime';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = css;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, theme]);
}
