import type { AiModuleType, IAiModuleSpec, IAiPageSpec, IAiRowSpec, IAiSectionSpec } from '@raco/shared';

// Receta de página que arma la IA (3.15). Gemini responde con este esquema y aquí se limpia:
// nada de lo que devuelve se guarda sin pasar por sanitizePage

// Mismos nombres que la biblioteca de íconos de @raco/blocks (si uno no existe, el render usa una estrella)
export const ICON_NAMES = [
  'Check', 'CircleCheck', 'Star', 'Heart', 'Sparkles', 'Zap', 'Rocket', 'Target', 'Lightbulb', 'Award', 'Trophy',
  'ShieldCheck', 'Lock', 'ThumbsUp', 'Smile', 'Phone', 'Mail', 'MessageCircle', 'MessagesSquare', 'Send', 'MapPin',
  'Globe', 'Clock', 'Calendar', 'Bell', 'User', 'Users', 'Handshake', 'House', 'Building2', 'Briefcase', 'ShoppingCart',
  'ShoppingBag', 'CreditCard', 'Wallet', 'Banknote', 'Percent', 'Tag', 'Gift', 'Package', 'Truck', 'Plane', 'Car',
  'Bike', 'TrendingUp', 'ChartBar', 'ChartPie', 'Activity', 'Megaphone', 'Flag', 'GraduationCap', 'BookOpen',
  'PenTool', 'Palette', 'Code', 'Laptop', 'Smartphone', 'Wifi', 'Settings', 'Wrench', 'Hammer', 'Camera', 'Image',
  'Video', 'Music', 'Headphones', 'Coffee', 'Utensils', 'Dumbbell', 'Stethoscope', 'Baby', 'Dog', 'PawPrint', 'Leaf',
  'Recycle', 'Sun', 'Moon', 'Cloud', 'Search', 'Download', 'Upload', 'Link', 'ArrowRight', 'ChevronRight',
  'Instagram', 'Facebook', 'Twitter', 'Linkedin', 'Youtube', 'Github',
];

// Diseños de fila que se le ofrecen a la IA y cuántas columnas tiene cada uno
const LAYOUTS: Record<string, { columns: number; hint: string }> = {
  '1': { columns: 1, hint: 'una columna: títulos de sección, textos, llamadas a la acción, preguntas frecuentes' },
  '1-1': { columns: 2, hint: 'dos columnas iguales' },
  '1-1-1': { columns: 3, hint: 'tres iguales: servicios, beneficios, testimonios, planes' },
  '1-1-1-1': { columns: 4, hint: 'cuatro iguales: cifras, ventajas cortas, pasos' },
  '2-1': { columns: 2, hint: 'ancha + angosta' },
  '1-2': { columns: 2, hint: 'angosta + ancha' },
  '5-7': { columns: 2, hint: 'texto + imagen (portada o "sobre nosotros")' },
  '1-2-1': { columns: 3, hint: 'tres con la del centro más ancha (plan destacado)' },
  '6': { columns: 6, hint: 'seis angostas: logos o íconos' },
};
const LAYOUT_BY_COUNT: Record<number, string> = { 1: '1', 2: '1-1', 3: '1-1-1', 4: '1-1-1-1', 6: '6' };

const MODULE_TYPES: AiModuleType[] = [
  'heading', 'text', 'button', 'list', 'card', 'icon', 'counter', 'testimonial', 'accordion', 'tabs', 'image', 'map',
  'spacer', 'divider',
];

const BUTTON_VARIANTS = ['primary', 'secondary', 'outline', 'link'] as const;

const LIMITS = { sections: 12, rows: 3, columns: 6, modules: 8, items: 12, entries: 10 };

// --- Esquema JSON para la respuesta de Gemini ---

const str = (description?: string) => ({ type: 'string', ...(description ? { description } : {}) });
const oneOf = (values: string[]) => ({ type: 'string', enum: values });

// Los mínimos van en el esquema: los modelos Lite tienden a quedarse cortos aunque el prompt pida más.
// Los máximos no: Gemini rechaza maxItems en un esquema así de anidado (400), se recortan en sanitizePage
export function pageSchema(scope: 'page' | 'sections') {
  const module = {
    type: 'object',
    properties: {
      type: oneOf(MODULE_TYPES),
      text: str('heading: el título; text: los párrafos; button: la etiqueta; testimonial: la cita; card: la descripción'),
      level: { type: 'integer', minimum: 1, maximum: 4, description: 'solo heading' },
      title: str('solo card: el título de la tarjeta'),
      icon: oneOf(ICON_NAMES),
      url: str(),
      variant: oneOf([...BUTTON_VARIANTS]),
      items: { type: 'array', items: str() },
      entries: {
        type: 'array',
        items: { type: 'object', properties: { title: str(), text: str() }, required: ['title', 'text'] },
      },
      number: str(),
      prefix: str(),
      suffix: str(),
      label: str('counter: qué mide la cifra; card: texto del enlace'),
      name: str(),
      role: str(),
      rating: { type: 'integer', minimum: 1, maximum: 5 },
      src: str(),
      alt: str(),
      address: str(),
    },
    required: ['type'],
  };
  const row = {
    type: 'object',
    properties: {
      layout: oneOf(Object.keys(LAYOUTS)),
      align: oneOf(['left', 'center']),
      columnStyle: oneOf(['plain', 'card']),
      mobile: oneOf(['stack', 'slider']),
      columns: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          properties: { modules: { type: 'array', minItems: 1, items: module } },
          required: ['modules'],
        },
      },
    },
    required: ['layout', 'align', 'columnStyle', 'mobile', 'columns'],
  };
  const section = {
    type: 'object',
    properties: {
      background: oneOf(['none', 'white', 'light', 'primary', 'secondary', 'dark']),
      image: str(),
      height: oneOf(['auto', 'half', 'screen']),
      width: oneOf(['narrow', 'normal', 'wide']),
      anchor: str(),
      rows: { type: 'array', minItems: 1, items: row },
    },
    required: ['background', 'height', 'width', 'rows'],
  };
  return {
    type: 'object',
    properties: {
      title: str(),
      description: str(),
      sections: {
        type: 'array',
        minItems: scope === 'page' ? 5 : 1,
        items: section,
      },
    },
    required: ['title', 'description', 'sections'],
  };
}

// --- Instrucciones ---

export interface PromptContext {
  prompt: string;
  scope: 'page' | 'sections';
  pageTitle?: string;
  siteName?: string;
  tagline?: string;
  language: string;
  images: { url: string; alt: string }[];
}

const languageNames: Record<string, string> = {
  es: 'español',
  en: 'inglés',
  pt: 'portugués',
  fr: 'francés',
  it: 'italiano',
  de: 'alemán',
};

export function pagePrompt(ctx: PromptContext) {
  const language = languageNames[ctx.language] ?? ctx.language ?? 'español';
  const site = [ctx.siteName && `Sitio: "${ctx.siteName}"`, ctx.tagline && `Descripción del sitio: ${ctx.tagline}`]
    .filter(Boolean)
    .join('\n');
  const layouts = Object.entries(LAYOUTS)
    .map(([id, l]) => `- "${id}": ${l.hint}`)
    .join('\n');
  const images = ctx.images.length
    ? `Imágenes disponibles en la biblioteca (usa solo estas URLs en "src" o en "image" de una sección):\n${ctx.images
        .map((i) => `- ${i.url}${i.alt ? ` — ${i.alt}` : ''}`)
        .join('\n')}\nSi ninguna encaja, deja "src" vacío y describe en "alt" qué imagen debería ir.`
    : 'La biblioteca no tiene imágenes: deja "src" e "image" vacíos y describe en "alt" qué imagen debería ir.';

  const scope =
    ctx.scope === 'sections'
      ? `Genera SOLO la o las secciones que pide el usuario (normalmente una o dos), para añadirlas a la página${
          ctx.pageTitle ? ` "${ctx.pageTitle}"` : ''
        }. Sin portada y sin títulos de nivel 1.`
      : 'Genera una página completa de entre 4 y 8 secciones. La primera es la portada: un título de nivel 1 (el único de la página), un texto breve y uno o dos botones, con height "half" o "screen". Termina con una llamada a la acción.';

  return `Eres un diseñador web experto. Arma el contenido de una página web con bloques de un constructor visual.

${site}

Pedido del usuario:
"""
${ctx.prompt}
"""

${scope}

Textos:
- Escribe todo en ${language}, listo para publicar: concreto, claro y persuasivo. Nada de lorem ipsum ni marcadores como [Nombre].
- Si faltan datos (precios, teléfonos, dirección), usa ejemplos razonables que el usuario pueda reemplazar.
- En "text" separa los párrafos con una línea en blanco; puedes resaltar alguna frase con **negrita**. Sin otro Markdown.

Estructura:
- Página > secciones > filas > columnas > módulos. Cada fila usa un "layout" y debe tener exactamente esa cantidad de columnas:
${layouts}
- Cada sección lleva su título en un módulo "heading" (level 2), nunca dentro de un "text".
- Para grupos (servicios, beneficios, planes, testimonios) usa primero una fila "1" centrada con el título y una frase, y después una fila de 3 o 4 columnas con un módulo "card" (o "testimonial", "counter") por columna.
- "columnStyle": "card" pone cada columna como tarjeta con fondo y sombra (planes, testimonios); "plain" sin fondo.
- "mobile": "slider" convierte la fila en un carrusel en el celular (testimonios, logos); "stack" apila las columnas.
- Alterna el fondo de las secciones ("none" y "light") para separarlas; usa "primary" o "dark" para la portada o la llamada a la acción final. "secondary" es el color de acento: úsalo poco.
- "width": "narrow" para secciones de lectura o preguntas frecuentes; "normal" en general.
- "anchor": un id corto sin espacios cuando otra parte de la página enlaza a esa sección (ej. "contacto").

Módulos (rellena solo los campos de su tipo):
- heading: text (el título), level (1 portada, 2 título de sección, 3 subtítulo)
- text: text
- button: text, url ("#contacto" para anclas de la misma página o rutas como "/contacto"), variant (primary, secondary, outline, link)
- list: items
- card: icon, title, text (servicio, beneficio, producto); opcional label (texto del enlace) y url. La tarjeta ya trae su título y su texto: no le pongas otro heading ni text al lado en la misma columna
- icon: icon
- counter: number, prefix, suffix, label (cifras: "+500 clientes")
- testimonial: text (la cita), name, role, rating (1-5)
- accordion: entries (preguntas frecuentes: title = pregunta, text = respuesta)
- tabs: entries (title = pestaña, text = contenido)
- image: src, alt
- map: address
- spacer, divider: sin campos

${images}

Devuelve también "title" (título corto de la página) y "description" (meta descripción de 120 a 155 caracteres).`;
}

// --- Limpieza de la respuesta ---

const MAX_TEXT = 3000;

const clean = (v: unknown, max = 200) =>
  typeof v === 'string' ? v.replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim().slice(0, max) : '';
const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback;
const list = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : []);

// Anclas de la misma página, rutas internas, http(s), correo y teléfono. Nada de javascript: ni data:
export function safeLink(v: unknown) {
  const url = clean(v, 500);
  return /^(#[\w-]*|\/(?!\/)\S*|https?:\/\/\S+|mailto:\S+|tel:[+\d\s()-]+)$/i.test(url) ? url : '#';
}

const anchorOf = (v: unknown) =>
  clean(v, 60)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

function sanitizeModule(raw: unknown, images: Set<string>): IAiModuleSpec | null {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Record<string, unknown>;
  const type = pick(m.type, MODULE_TYPES, 'text');
  if (m.type !== type) return null;
  // Los modelos a veces cruzan campos (el título de un heading en "title"): se acepta el alternativo
  const text = (max = MAX_TEXT) => clean(m.text, max) || clean(m.title, max);
  const icon = ICON_NAMES.includes(m.icon as string) ? (m.icon as string) : '';

  switch (type) {
    case 'heading': {
      const t = text(200);
      return t ? { type, text: t, level: Math.min(4, Math.max(1, Math.round(Number(m.level) || 2))) } : null;
    }
    case 'text':
      return text() ? { type, text: text() } : null;
    case 'button': {
      const t = text(60);
      return t ? { type, text: t, url: safeLink(m.url), variant: pick(m.variant, BUTTON_VARIANTS, 'primary') } : null;
    }
    case 'list': {
      const items = list(m.items, LIMITS.items).map((i) => clean(i)).filter(Boolean);
      return items.length ? { type, items } : null;
    }
    case 'card': {
      const title = clean(m.title, 120) || clean(m.name, 120);
      const body = clean(m.text, 600);
      if (!title && !body) return null;
      const label = clean(m.label, 40);
      return { type, icon, title, text: body, ...(label ? { label, url: safeLink(m.url) } : {}) };
    }
    case 'icon':
      return icon ? { type, icon } : null;
    case 'counter': {
      const number = clean(m.number, 20);
      return number ? { type, number, prefix: clean(m.prefix, 10), suffix: clean(m.suffix, 10), label: clean(m.label, 80) } : null;
    }
    case 'testimonial': {
      const quote = text(600);
      const rating = Math.round(Number(m.rating));
      return quote
        ? { type, text: quote, name: clean(m.name, 80), role: clean(m.role, 80), rating: rating >= 1 && rating <= 5 ? rating : 5 }
        : null;
    }
    case 'accordion':
    case 'tabs': {
      const entries = list(m.entries, LIMITS.entries)
        .map((e) => {
          const entry = (e ?? {}) as Record<string, unknown>;
          return { title: clean(entry.title, 150), text: clean(entry.text, 2000) };
        })
        .filter((e) => e.title);
      return entries.length ? { type, entries } : null;
    }
    case 'image': {
      const src = clean(m.src, 255);
      return { type, src: images.has(src) ? src : '', alt: clean(m.alt) };
    }
    case 'map': {
      const address = clean(m.address);
      return address ? { type, address } : null;
    }
    default:
      return { type };
  }
}

function sanitizeRow(raw: unknown, images: Set<string>): IAiRowSpec | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  let columns = list(r.columns, LIMITS.columns).map((c) => ({
    modules: list((c as Record<string, unknown>)?.modules, LIMITS.modules)
      .map((m) => sanitizeModule(m, images))
      .filter((m): m is IAiModuleSpec => !!m),
  }));
  if (!columns.some((c) => c.modules.length)) return null;

  // Si el diseño no coincide con las columnas que llegaron, manda la cantidad de columnas
  let layout = typeof r.layout === 'string' && LAYOUTS[r.layout] ? r.layout : '';
  if (!layout || LAYOUTS[layout].columns !== columns.length) {
    if (columns.length === 5) columns = columns.slice(0, 4);
    layout = LAYOUT_BY_COUNT[columns.length];
  }
  return {
    layout,
    align: pick(r.align, ['left', 'center'], 'left'),
    columnStyle: pick(r.columnStyle, ['plain', 'card'], 'plain'),
    mobile: pick(r.mobile, ['stack', 'slider'], 'stack'),
    columns,
  };
}

export function sanitizePage(raw: unknown, images: Set<string>, scope: 'page' | 'sections'): IAiPageSpec {
  const p = (raw ?? {}) as Record<string, unknown>;
  const sections: IAiSectionSpec[] = [];
  // Se descartan las inválidas antes de aplicar el máximo (con un tope para no recorrer respuestas enormes)
  for (const s of list(p.sections, LIMITS.sections * 3)) {
    if (sections.length === LIMITS.sections) break;
    const section = (s ?? {}) as Record<string, unknown>;
    const rows = list(section.rows, LIMITS.rows)
      .map((r) => sanitizeRow(r, images))
      .filter((r): r is IAiRowSpec => !!r);
    if (!rows.length) continue;
    const image = clean(section.image, 255);
    sections.push({
      background: pick(section.background, ['none', 'white', 'light', 'primary', 'secondary', 'dark'], 'none'),
      image: images.has(image) ? image : '',
      height: pick(section.height, ['auto', 'half', 'screen'], 'auto'),
      width: pick(section.width, ['narrow', 'normal', 'wide'], 'normal'),
      anchor: anchorOf(section.anchor),
      rows,
    });
  }

  // Un solo título de nivel 1 por página (y ninguno si solo se añaden secciones)
  let h1 = scope === 'page';
  for (const section of sections)
    for (const row of section.rows)
      for (const column of row.columns)
        for (const m of column.modules) {
          if (m.type !== 'heading' || m.level !== 1) continue;
          if (h1) h1 = false;
          else m.level = 2;
        }

  return { title: clean(p.title, 120), description: clean(p.description, 160), sections };
}
