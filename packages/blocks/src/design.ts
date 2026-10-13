import type { ISiteColor, ISiteDesign } from '@raco/shared';

// Diseño global del sitio: paleta y tipografías que usan todos los bloques.
// Los bloques siempre usan tokens (bg-primary, font-heading...); cambiar la paleta cambia todo el sitio.

export const BASE_COLORS: { id: string; name: string; hint: string }[] = [
  { id: 'primary', name: 'Principal', hint: 'Textos, botones y fondos oscuros' },
  { id: 'secondary', name: 'Acento', hint: 'Detalles, enlaces y llamadas a la acción' },
  { id: 'tertiary', name: 'Suave', hint: 'Textos secundarios y bordes' },
  { id: 'background', name: 'Fondo claro', hint: 'Fondos de secciones alternas' },
];

export const defaultDesign: ISiteDesign = {
  colors: [
    { id: 'primary', name: 'Principal', value: '#334155' },
    { id: 'secondary', name: 'Acento', value: '#22d3ee' },
    { id: 'tertiary', name: 'Suave', value: '#94a3b8' },
    { id: 'background', name: 'Fondo claro', value: '#f8fafc' },
  ],
  fonts: { heading: 'Montserrat', body: 'Inter' },
};

export const CUSTOM_COLOR = /^c-[a-z0-9]{3,10}$/;
const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export interface FontInfo {
  family: string;
  category: 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';
  // Pesos que existen en Google Fonts (pedir uno inexistente hace fallar la hoja de estilos)
  weights: string;
}

export const FONT_LIBRARY: FontInfo[] = [
  { family: 'Inter', category: 'sans-serif', weights: '300;400;500;600;700;800;900' },
  { family: 'Montserrat', category: 'sans-serif', weights: '300;400;500;600;700;800;900' },
  { family: 'Poppins', category: 'sans-serif', weights: '300;400;500;600;700;800;900' },
  { family: 'Roboto', category: 'sans-serif', weights: '300;400;500;700;900' },
  { family: 'Open Sans', category: 'sans-serif', weights: '300;400;500;600;700;800' },
  { family: 'Lato', category: 'sans-serif', weights: '300;400;700;900' },
  { family: 'Raleway', category: 'sans-serif', weights: '300;400;500;600;700;800;900' },
  { family: 'Nunito', category: 'sans-serif', weights: '300;400;500;600;700;800;900' },
  { family: 'Work Sans', category: 'sans-serif', weights: '300;400;500;600;700;800;900' },
  { family: 'DM Sans', category: 'sans-serif', weights: '300;400;500;600;700;800;900' },
  { family: 'Manrope', category: 'sans-serif', weights: '300;400;500;600;700;800' },
  { family: 'Plus Jakarta Sans', category: 'sans-serif', weights: '300;400;500;600;700;800' },
  { family: 'Outfit', category: 'sans-serif', weights: '300;400;500;600;700;800;900' },
  { family: 'Sora', category: 'sans-serif', weights: '300;400;500;600;700;800' },
  { family: 'Space Grotesk', category: 'sans-serif', weights: '300;400;500;600;700' },
  { family: 'Rubik', category: 'sans-serif', weights: '300;400;500;600;700;800;900' },
  { family: 'Barlow', category: 'sans-serif', weights: '300;400;500;600;700;800;900' },
  { family: 'Archivo', category: 'sans-serif', weights: '300;400;500;600;700;800;900' },
  { family: 'IBM Plex Sans', category: 'sans-serif', weights: '300;400;500;600;700' },
  { family: 'Josefin Sans', category: 'sans-serif', weights: '300;400;500;600;700' },
  { family: 'Quicksand', category: 'sans-serif', weights: '300;400;500;600;700' },
  { family: 'Playfair Display', category: 'serif', weights: '400;500;600;700;800;900' },
  { family: 'Merriweather', category: 'serif', weights: '300;400;700;900' },
  { family: 'Lora', category: 'serif', weights: '400;500;600;700' },
  { family: 'PT Serif', category: 'serif', weights: '400;700' },
  { family: 'Libre Baskerville', category: 'serif', weights: '400;700' },
  { family: 'Cormorant Garamond', category: 'serif', weights: '300;400;500;600;700' },
  { family: 'DM Serif Display', category: 'serif', weights: '400' },
  { family: 'Fraunces', category: 'serif', weights: '300;400;500;600;700;800;900' },
  { family: 'Oswald', category: 'display', weights: '300;400;500;600;700' },
  { family: 'Bebas Neue', category: 'display', weights: '400' },
  { family: 'Anton', category: 'display', weights: '400' },
  { family: 'Righteous', category: 'display', weights: '400' },
  { family: 'Caveat', category: 'handwriting', weights: '400;500;600;700' },
  { family: 'Pacifico', category: 'handwriting', weights: '400' },
  { family: 'Dancing Script', category: 'handwriting', weights: '400;500;600;700' },
  { family: 'JetBrains Mono', category: 'monospace', weights: '300;400;500;600;700;800' },
];

const fallback: Record<FontInfo['category'], string> = {
  'sans-serif': 'sans-serif',
  serif: 'serif',
  display: 'sans-serif',
  handwriting: 'cursive',
  monospace: 'monospace',
};

export const fontInfo = (family: string) => FONT_LIBRARY.find((f) => f.family === family);

// Une lo guardado con los valores por defecto (por si falta algo o viene de una versión anterior)
export function resolveDesign(design?: Partial<ISiteDesign> | null): ISiteDesign {
  const colors = BASE_COLORS.map((base) => {
    const saved = design?.colors?.find((c) => c.id === base.id);
    const def = defaultDesign.colors.find((c) => c.id === base.id)!;
    return { ...def, ...(saved && HEX.test(saved.value) ? { value: saved.value } : {}) };
  });
  const custom = (design?.colors ?? []).filter((c) => CUSTOM_COLOR.test(c.id) && HEX.test(c.value));
  const fonts = {
    heading: fontInfo(design?.fonts?.heading ?? '') ? design!.fonts!.heading : defaultDesign.fonts.heading,
    body: fontInfo(design?.fonts?.body ?? '') ? design!.fonts!.body : defaultDesign.fonts.body,
  };
  return { colors: [...colors, ...custom], fonts };
}

export function colorValue(design: ISiteDesign, id: string): string | undefined {
  return design.colors.find((c) => c.id === id)?.value;
}

const fontStack = (family: string) => {
  const info = fontInfo(family);
  return `'${family}', ${fallback[info?.category ?? 'sans-serif']}`;
};

// URL de Google Fonts con las dos familias del sitio
export function googleFontsUrl(design: ISiteDesign) {
  const families = [...new Set([design.fonts.heading, design.fonts.body])]
    .map((f) => fontInfo(f))
    .filter((f): f is FontInfo => !!f)
    .map((f) => `family=${f.family.replace(/ /g, '+')}:wght@${f.weights}`);
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
}

// Variables del tema como clases de Tailwind ([--color-primary:#hex]).
// Así la paleta del sitio se aplica solo dentro del contenedor que las lleva (el lienzo del admin o el <body> del front).
export function designVarClasses(design: ISiteDesign): string {
  const colors = design.colors
    .filter((c) => HEX.test(c.value))
    .map((c) => `[--color-${c.id}:${c.value}]`);
  const fonts = [
    `[--font-heading:${fontStack(design.fonts.heading).replace(/ /g, '_')}]`,
    `[--font-body:${fontStack(design.fonts.body).replace(/ /g, '_')}]`,
  ];
  return [...colors, ...fonts].join(' ');
}

// @theme para el compilador: declara los tokens (también los colores personalizados) para que existan sus utilidades.
// "reference" evita escribir las variables en :root (en el admin pisarían los colores del propio panel);
// los valores reales llegan con designVarClasses en el contenedor de la página.
export function designThemeCss(design: ISiteDesign): string {
  const vars = [
    ...design.colors.map((c) => `  --color-${c.id}: ${c.value};`),
    `  --font-heading: ${fontStack(design.fonts.heading)};`,
    `  --font-body: ${fontStack(design.fonts.body)};`,
  ];
  return `@theme reference {\n${vars.join('\n')}\n}`;
}

export function newColorId() {
  return `c-${Math.random().toString(36).slice(2, 8)}`;
}

export type { ISiteColor, ISiteDesign };
