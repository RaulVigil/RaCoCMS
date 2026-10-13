import type { Align, Background, Device, Size, TextColor, Visibility } from './types';

// Todas las clases van escritas completas para que Tailwind las detecte al compilar.
// Los breakpoints son container queries (@3xl = 768px, @5xl = 1024px) sobre el contenedor
// raíz de la página: así el lienzo del admin responde igual que la web real.

type Display = 'block' | 'flex' | 'grid';

const shown: Record<Display, Record<Device, string>> = {
  block: { mobile: 'block', tablet: '@3xl:block', desktop: '@5xl:block' },
  flex: { mobile: 'flex', tablet: '@3xl:flex', desktop: '@5xl:flex' },
  grid: { mobile: 'grid', tablet: '@3xl:grid', desktop: '@5xl:grid' },
};
const hidden: Record<Device, string> = { mobile: 'hidden', tablet: '@3xl:hidden', desktop: '@5xl:hidden' };

// Clase de display del elemento según en qué dispositivos se ve
export function displayClass(display: Display, visible?: Visibility) {
  if (!visible || (visible.mobile && visible.tablet && visible.desktop)) return shown[display].mobile;
  return (['mobile', 'tablet', 'desktop'] as Device[])
    .map((d) => (visible[d] ? shown[display][d] : hidden[d]))
    .join(' ');
}

export const colSpan: Record<Device, string[]> = {
  mobile: ['', 'col-span-1', 'col-span-2', 'col-span-3', 'col-span-4', 'col-span-5', 'col-span-6', 'col-span-7', 'col-span-8', 'col-span-9', 'col-span-10', 'col-span-11', 'col-span-12'],
  tablet: ['', '@3xl:col-span-1', '@3xl:col-span-2', '@3xl:col-span-3', '@3xl:col-span-4', '@3xl:col-span-5', '@3xl:col-span-6', '@3xl:col-span-7', '@3xl:col-span-8', '@3xl:col-span-9', '@3xl:col-span-10', '@3xl:col-span-11', '@3xl:col-span-12'],
  desktop: ['', '@5xl:col-span-1', '@5xl:col-span-2', '@5xl:col-span-3', '@5xl:col-span-4', '@5xl:col-span-5', '@5xl:col-span-6', '@5xl:col-span-7', '@5xl:col-span-8', '@5xl:col-span-9', '@5xl:col-span-10', '@5xl:col-span-11', '@5xl:col-span-12'],
};

export const rowSpan = ['', '', '@3xl:row-span-2', '@3xl:row-span-3'];

// Fondo y tono de texto van separados: un color de texto propio reemplaza solo el tono
export const backgrounds: Record<Background, string> = {
  none: '',
  white: 'bg-white',
  light: 'bg-background',
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  dark: 'bg-slate-900',
};

export const backgroundTone: Record<Background, string> = {
  none: '',
  white: 'text-primary',
  light: 'text-primary',
  primary: 'text-white',
  secondary: 'text-slate-900',
  dark: 'text-white',
};

// Arriba y abajo por separado, para poder reemplazar solo uno con un valor propio
export const sectionPaddingTop: Record<Size, string> = {
  none: 'pt-0',
  sm: 'pt-8 @3xl:pt-10',
  md: 'pt-12 @3xl:pt-16',
  lg: 'pt-16 @3xl:pt-24',
  xl: 'pt-20 @3xl:pt-32',
};

export const sectionPaddingBottom: Record<Size, string> = {
  none: 'pb-0',
  sm: 'pb-8 @3xl:pb-10',
  md: 'pb-12 @3xl:pb-16',
  lg: 'pb-16 @3xl:pb-24',
  xl: 'pb-20 @3xl:pb-32',
};

export const sectionWidth = {
  narrow: 'max-w-3xl',
  normal: 'max-w-6xl',
  wide: 'max-w-7xl',
  full: 'max-w-none',
};

export const sectionGutter = 'px-4 @3xl:px-6';

export const sectionMinHeight = { auto: '', half: 'min-h-[50vh]', screen: 'min-h-screen' };

export const justify = { start: 'justify-start', center: 'justify-center', end: 'justify-end' };

export const rowGap: Record<Size, string> = {
  none: 'gap-0',
  sm: 'gap-4',
  md: 'gap-6 @3xl:gap-8',
  lg: 'gap-8 @3xl:gap-12',
  xl: 'gap-10 @3xl:gap-16',
};

export const rowAlign = { start: 'items-start', center: 'items-center', end: 'items-end', stretch: 'items-stretch' };

type Side = 'top' | 'right' | 'bottom' | 'left';

export const columnPadding: Record<Side, Record<Size, string>> = {
  top: { none: '', sm: 'pt-4', md: 'pt-6', lg: 'pt-8 @3xl:pt-10', xl: 'pt-10 @3xl:pt-14' },
  right: { none: '', sm: 'pr-4', md: 'pr-6', lg: 'pr-8 @3xl:pr-10', xl: 'pr-10 @3xl:pr-14' },
  bottom: { none: '', sm: 'pb-4', md: 'pb-6', lg: 'pb-8 @3xl:pb-10', xl: 'pb-10 @3xl:pb-14' },
  left: { none: '', sm: 'pl-4', md: 'pl-6', lg: 'pl-8 @3xl:pl-10', xl: 'pl-10 @3xl:pl-14' },
};

export const textAlign: Record<Align | 'inherit', string> = {
  inherit: '',
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export const flexAlign: Record<Align, string> = { left: 'justify-start', center: 'justify-center', right: 'justify-end' };

export const textColor: Record<TextColor, string> = {
  auto: '',
  primary: 'text-primary',
  secondary: 'text-secondary',
  muted: 'opacity-75',
  white: 'text-white',
  dark: 'text-slate-900',
};

export const headingSize = {
  sm: 'text-xl',
  md: 'text-2xl @3xl:text-3xl',
  lg: 'text-3xl @3xl:text-4xl',
  xl: 'text-4xl @3xl:text-5xl',
  '2xl': 'text-4xl @3xl:text-6xl',
};

export const bodySize = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' };

export const imageAspect = {
  auto: '',
  square: 'aspect-square object-cover',
  video: 'aspect-video object-cover',
  portrait: 'aspect-[3/4] object-cover',
};

// Cada parte del estilo del botón se puede reemplazar por separado con valores propios
export const buttonVariant = {
  primary: { bg: 'bg-primary hover:bg-primary/90', text: 'text-white', border: '', radius: 'rounded-md' },
  secondary: { bg: 'bg-secondary hover:bg-secondary/90', text: 'text-slate-900', border: '', radius: 'rounded-md' },
  outline: { bg: 'hover:opacity-80', text: '', border: 'border-2 border-current', radius: 'rounded-md' },
  link: { bg: 'hover:opacity-80', text: 'underline underline-offset-4', border: '', radius: '' },
};

export const buttonSize = {
  sm: { x: 'px-4', y: 'py-2', text: 'text-sm' },
  md: { x: 'px-6', y: 'py-3', text: 'text-base' },
  lg: { x: 'px-8', y: 'py-4', text: 'text-lg' },
};

export const dividerSpacing = { sm: 'my-2', md: 'my-6', lg: 'my-10' };

export const spacerSize = { sm: 'h-4', md: 'h-8', lg: 'h-16', xl: 'h-24' };

export const richTextClass =
  '[&_p]:my-3 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:font-heading [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_li]:my-1 [&_blockquote]:border-l-4 [&_blockquote]:border-secondary [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:underline [&>*:first-child]:mt-0 [&>*:last-child]:mb-0';

// --- Filas: cuadrícula o slider por dispositivo (mobile-first, igual que la visibilidad) ---

const mobileFirst: Record<Device, string> = { mobile: '', tablet: '@3xl:', desktop: '@5xl:' };
const ORDER: Device[] = ['mobile', 'tablet', 'desktop'];

export function rowLayoutClasses(layout: Record<Device, 'grid' | 'slider'>, visible?: Visibility) {
  const classes: string[] = [];
  let prev: 'grid' | 'slider' | 'hidden' | null = null;
  let sliderBefore = false; // un dispositivo más chico fue slider: hay que deshacer su scroll
  for (const d of ORDER) {
    const pre = mobileFirst[d];
    const mode = visible && !visible[d] ? 'hidden' : layout[d];
    if (mode === prev) continue; // hereda del dispositivo anterior
    if (mode === 'hidden') classes.push(hidden[d]);
    else if (mode === 'grid') {
      classes.push(`${pre}grid`);
      if (sliderBefore) classes.push(`${pre}overflow-visible`, `${pre}snap-none`);
      sliderBefore = false;
    } else {
      // Carrusel con scroll horizontal y encaje: se desliza con el dedo, sin JavaScript
      classes.push(
        `${pre}flex`,
        `${pre}overflow-x-auto`,
        `${pre}snap-x`,
        `${pre}snap-mandatory`,
        `${pre}[scrollbar-width:none]`,
        `${pre}[&::-webkit-scrollbar]:hidden`,
      );
      sliderBefore = true;
    }
    prev = mode;
  }
  return classes.join(' ');
}

// Ancho de cada tarjeta según cuántas se ven a la vez (descontando un poco por el espacio entre ellas)
const slideBasis: Record<string, string> = {
  '1': '100%',
  '1.2': '85%',
  '1.5': '66%',
  '2': '48%',
  '2.5': '40%',
  '3': '31.5%',
  '4': '23.5%',
};

export const SLIDES_VISIBLE = [1, 1.2, 1.5, 2, 2.5, 3, 4];

export function slideClasses(layout: Record<Device, 'grid' | 'slider'>, visibleSlides: Record<Device, number>) {
  if (!ORDER.some((d) => layout[d] === 'slider')) return '';
  const classes = ['shrink-0', 'snap-start'];
  for (const d of ORDER) {
    if (layout[d] !== 'slider') continue;
    classes.push(`${mobileFirst[d]}basis-[${slideBasis[String(visibleSlides[d])] ?? '85%'}]`);
  }
  return classes.join(' ');
}

export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');
