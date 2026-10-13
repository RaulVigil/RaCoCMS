import type { IPageBlock } from '@raco/shared';
import type { Device } from './types';
import { CUSTOM_COLOR, defaultDesign, designThemeCss } from './design';

// Estilos libres (px, rem, %, colores hex...) traducidos a clases arbitrarias de Tailwind.
// Se editan como en Divi: escritorio es la base y tablet/móvil solo sobrescriben,
// por eso se usan variantes "max" (@max-5xl = menos de 1024px, @max-3xl = menos de 768px).

export const STYLE_PROPS = [
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'width',
  'maxWidth',
  'minHeight',
  'contentWidth',
  'gap',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'textTransform',
  'textAlign',
  'color',
  'backgroundColor',
  'borderWidth',
  'borderStyle',
  'borderColor',
  'borderRadius',
  'boxShadow',
  'opacity',
] as const;

export type StyleProp = (typeof STYLE_PROPS)[number];
export type StyleValues = Partial<Record<StyleProp, string>>;
export type BlockStyle = Partial<Record<Device, StyleValues>>;

const devicePrefix: Record<Device, string> = { desktop: '', tablet: '@max-5xl:', mobile: '@max-3xl:' };

// --- Validación: solo valores conocidos llegan a una clase (evita inyectar CSS) ---

const LENGTH = /^-?(\d+(\.\d+)?|\.\d+)(px|rem|em|%|vh|vw)$/;
const NUMBER = /^\d+(\.\d+)?$/;
const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export const COLOR_TOKENS = ['primary', 'secondary', 'tertiary', 'background', 'white', 'black', 'transparent'];

export const isLength = (v: string) => v === '0' || LENGTH.test(v);
const length = (v: string, allowAuto = false) => (allowAuto && v === 'auto' ? 'auto' : isLength(v) ? `[${v}]` : null);

function color(prefix: string, v: string) {
  if (COLOR_TOKENS.includes(v) || CUSTOM_COLOR.test(v)) return `${prefix}-${v}`;
  return HEX.test(v) ? `${prefix}-[${v}]` : null;
}

const weights: Record<string, string> = {
  '100': 'font-thin',
  '200': 'font-extralight',
  '300': 'font-light',
  '400': 'font-normal',
  '500': 'font-medium',
  '600': 'font-semibold',
  '700': 'font-bold',
  '800': 'font-extrabold',
  '900': 'font-black',
};

const oneOf = (allowed: string[], cls: (v: string) => string) => (v: string) => (allowed.includes(v) ? cls(v) : null);

const sized = (prefix: string, allowAuto = false) => (v: string) => {
  const val = length(v, allowAuto);
  return val ? `${prefix}-${val}` : null;
};

const builders: Record<StyleProp, (v: string) => string | null> = {
  marginTop: sized('mt', true),
  marginRight: sized('mr', true),
  marginBottom: sized('mb', true),
  marginLeft: sized('ml', true),
  paddingTop: sized('pt'),
  paddingRight: sized('pr'),
  paddingBottom: sized('pb'),
  paddingLeft: sized('pl'),
  width: sized('w', true),
  maxWidth: sized('max-w'),
  minHeight: sized('min-h'),
  contentWidth: sized('max-w'),
  gap: sized('gap'),
  fontFamily: oneOf(['heading', 'body'], (v) => `font-${v}`),
  fontSize: (v) => (isLength(v) ? `text-[length:${v}]` : null),
  fontWeight: (v) => weights[v] ?? null,
  lineHeight: (v) => (NUMBER.test(v) || isLength(v) ? `leading-[${v}]` : null),
  letterSpacing: (v) => (isLength(v) ? `tracking-[${v}]` : null),
  textTransform: oneOf(['uppercase', 'lowercase', 'capitalize', 'none'], (v) => (v === 'none' ? 'normal-case' : v)),
  textAlign: oneOf(['left', 'center', 'right', 'justify'], (v) => `text-${v}`),
  color: (v) => color('text', v),
  backgroundColor: (v) => color('bg', v),
  borderWidth: (v) => (isLength(v) ? `border-[length:${v}]` : null),
  borderStyle: oneOf(['solid', 'dashed', 'dotted', 'none'], (v) => `border-${v}`),
  borderColor: (v) => color('border', v),
  borderRadius: sized('rounded'),
  boxShadow: oneOf(['none', 'sm', 'md', 'lg', 'xl', '2xl'], (v) => `shadow-${v}`),
  opacity: (v) => (NUMBER.test(v) && Number(v) <= 100 ? `opacity-[${Number(v) / 100}]` : null),
};

// A dónde va cada propiedad: margen fuera, ancho/espacio del contenido dentro del contenedor
const OUTER: StyleProp[] = ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'];
const CONTENT: StyleProp[] = ['contentWidth'];

export interface StyleClasses {
  outer: string; // márgenes
  inner: string; // todo lo visual del elemento
  content: string; // contenedor interno (ancho del contenido de una sección)
  has: (...props: StyleProp[]) => boolean; // si hay valor propio (para no aplicar el preset)
}

export function styleOf(block: IPageBlock): BlockStyle {
  return (block.settings?.style ?? {}) as BlockStyle;
}

export function styleClasses(block: IPageBlock, contentProps: StyleProp[] = CONTENT): StyleClasses {
  const style = styleOf(block);
  const outer: string[] = [];
  const inner: string[] = [];
  const content: string[] = [];
  const used = new Set<StyleProp>();

  for (const device of ['desktop', 'tablet', 'mobile'] as Device[]) {
    const values = style[device];
    if (!values) continue;
    for (const prop of STYLE_PROPS) {
      const raw = values[prop]?.trim();
      if (!raw) continue;
      const cls = builders[prop](raw);
      if (!cls) continue;
      used.add(prop);
      const full = devicePrefix[device] + cls;
      (OUTER.includes(prop) ? outer : contentProps.includes(prop) ? content : inner).push(full);
    }
  }

  return {
    outer: outer.join(' '),
    inner: inner.join(' '),
    content: content.join(' '),
    has: (...props) => props.some((p) => used.has(p)),
  };
}

// Valor efectivo en un dispositivo (lo propio o lo heredado del más grande), para mostrar en el editor
export function inheritedValue(style: BlockStyle, prop: StyleProp, device: Device): string | undefined {
  const order: Device[] = device === 'mobile' ? ['mobile', 'tablet', 'desktop'] : device === 'tablet' ? ['tablet', 'desktop'] : ['desktop'];
  for (const d of order) {
    const v = style[d]?.[prop];
    if (v) return v;
  }
  return undefined;
}

// Tema por defecto (sin diseño guardado): lo usan el compilador en tiempo real y el front
export const blocksThemeCss = designThemeCss(defaultDesign);
