import type { IBlockSettings, IPageBlock } from '@raco/shared';

export type Device = 'mobile' | 'tablet' | 'desktop';
export const DEVICES: Device[] = ['desktop', 'tablet', 'mobile'];

export type Responsive<T> = Record<Device, T>;
export type Visibility = IBlockSettings['visibility'];

export type Size = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type Align = 'left' | 'center' | 'right';
export type Background = 'none' | 'white' | 'light' | 'primary' | 'secondary' | 'dark';
export type TextColor = 'auto' | 'primary' | 'secondary' | 'muted' | 'white' | 'dark';

// Documento de texto enriquecido (JSON de Tiptap/ProseMirror)
export interface RichDoc {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: RichDoc[];
}

// --- Contenedores ---

export interface SectionProps {
  background: Background;
  backgroundImage: string;
  overlay: boolean;
  paddingY: Size;
  width: 'narrow' | 'normal' | 'wide' | 'full';
  minHeight: 'auto' | 'half' | 'screen';
  verticalAlign: 'start' | 'center' | 'end';
  anchor: string;
}

export type RowLayoutMode = 'grid' | 'slider';

export interface RowProps {
  gap: Size;
  align: 'start' | 'center' | 'end' | 'stretch';
  // Cada dispositivo puede ser cuadrícula o slider (carrusel deslizable con CSS, sin JS)
  layout: Responsive<RowLayoutMode>;
  slidesVisible: Responsive<number>; // tarjetas visibles a la vez en modo slider (1.2 = asoma la siguiente)
}

// Las filas son una grilla de 12: cada columna dice cuántas ocupa en cada dispositivo
export interface ColumnProps {
  span: Responsive<number>;
  rowSpan: number; // 1-3, para grillas tipo bento (desde tablet)
  background: Background;
  padding: Size;
  rounded: boolean;
  shadow: boolean;
  verticalAlign: 'start' | 'center' | 'end';
  textAlign: Align | 'inherit';
}

// --- Módulos ---

export interface HeadingProps {
  text: string;
  url: string; // opcional: el título entero es un enlace (ej. nombre del sitio en el header)
  level: 1 | 2 | 3 | 4;
  size: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  align: Align;
  color: TextColor;
}

export interface TextProps {
  content: RichDoc | null;
  size: 'sm' | 'md' | 'lg';
  align: Align;
  color: TextColor;
}

export interface ImageProps {
  src: string;
  alt: string;
  url: string; // opcional: la imagen es un enlace (ej. el logo lleva a la portada)
  aspect: 'auto' | 'square' | 'video' | 'portrait';
  rounded: boolean;
  shadow: boolean;
}

export interface ButtonProps {
  text: string;
  url: string;
  variant: 'primary' | 'secondary' | 'outline' | 'link';
  size: 'sm' | 'md' | 'lg';
  align: Align;
  newTab: boolean;
}

export interface VideoProps {
  url: string;
}

export interface ListProps {
  items: string[];
  marker: 'check' | 'dot' | 'number';
  color: TextColor;
}

export interface DividerProps {
  spacing: 'sm' | 'md' | 'lg';
}

export interface SpacerProps {
  size: 'sm' | 'md' | 'lg' | 'xl';
}

export type IconSize = 'sm' | 'md' | 'lg' | 'xl';

export interface IconProps {
  name: string;
  size: IconSize;
  color: TextColor;
  shape: 'none' | 'circle' | 'square';
  shapeColor: Background;
  align: Align;
  url: string;
}

export interface CardProps {
  media: 'none' | 'icon' | 'image';
  icon: string;
  iconColor: TextColor;
  image: string;
  title: string;
  text: string;
  linkText: string;
  url: string;
  layout: 'vertical' | 'horizontal';
  align: Align;
  variant: 'plain' | 'filled' | 'bordered' | 'elevated';
}

export interface ContentItem {
  title: string;
  content: RichDoc | null;
}

export interface AccordionProps {
  items: ContentItem[];
  firstOpen: boolean;
  exclusive: boolean; // solo uno abierto a la vez
  variant: 'minimal' | 'boxed';
}

export interface TabsProps {
  items: ContentItem[];
  variant: 'underline' | 'pills';
}

export interface GalleryProps {
  images: { src: string; alt: string }[];
  columns: Responsive<number>;
  layout: 'grid' | 'masonry';
  aspect: 'auto' | 'square' | 'video' | 'portrait';
  gap: Size;
  rounded: boolean;
}

export interface CounterProps {
  number: string;
  prefix: string;
  suffix: string;
  label: string;
  size: 'md' | 'lg' | 'xl';
  align: Align;
  color: TextColor;
}

export interface TestimonialProps {
  quote: string;
  name: string;
  role: string;
  photo: string;
  rating: number;
  align: Align;
}

export interface MenuProps {
  menuId: string;
  layout: 'horizontal' | 'vertical';
  align: Align;
  mobile: 'hamburger' | 'list'; // en móvil: botón ☰ o la lista tal cual
  gap: 'sm' | 'md' | 'lg';
}

// Listado de entradas: las de la página actual (plantilla de listado) o las últimas de una colección
export interface PostsProps {
  source: string; // 'current' o el id de una colección
  limit: number;
  columns: Responsive<number>;
  showImage: boolean;
  showDate: boolean;
  showExcerpt: boolean;
  variant: 'plain' | 'card';
  imageAspect: 'video' | 'square' | 'portrait';
  pagination: boolean;
}

export interface MapProps {
  address: string;
  zoom: number;
  height: 'sm' | 'md' | 'lg';
}

export interface BlockPropsMap {
  section: SectionProps;
  row: RowProps;
  column: ColumnProps;
  heading: HeadingProps;
  text: TextProps;
  image: ImageProps;
  button: ButtonProps;
  video: VideoProps;
  list: ListProps;
  divider: DividerProps;
  spacer: SpacerProps;
  icon: IconProps;
  card: CardProps;
  accordion: AccordionProps;
  tabs: TabsProps;
  gallery: GalleryProps;
  counter: CounterProps;
  testimonial: TestimonialProps;
  map: MapProps;
  menu: MenuProps;
  posts: PostsProps;
}

export type BlockType = keyof BlockPropsMap;
export type ModuleType = Exclude<BlockType, 'section' | 'row' | 'column'>;

export const blockDefaults: { [K in BlockType]: BlockPropsMap[K] } = {
  section: {
    background: 'none',
    backgroundImage: '',
    overlay: true,
    paddingY: 'lg',
    width: 'normal',
    minHeight: 'auto',
    verticalAlign: 'center',
    anchor: '',
  },
  row: {
    gap: 'md',
    align: 'start',
    layout: { desktop: 'grid', tablet: 'grid', mobile: 'grid' },
    slidesVisible: { desktop: 3, tablet: 2, mobile: 1.2 },
  },
  column: {
    span: { desktop: 12, tablet: 12, mobile: 12 },
    rowSpan: 1,
    background: 'none',
    padding: 'none',
    rounded: false,
    shadow: false,
    verticalAlign: 'start',
    textAlign: 'inherit',
  },
  heading: { text: 'Escribe tu título', url: '', level: 2, size: 'lg', align: 'left', color: 'auto' },
  text: { content: null, size: 'md', align: 'left', color: 'auto' },
  image: { src: '', alt: '', url: '', aspect: 'auto', rounded: false, shadow: false },
  button: { text: 'Botón', url: '#', variant: 'primary', size: 'md', align: 'left', newTab: false },
  video: { url: '' },
  list: { items: ['Primer punto', 'Segundo punto', 'Tercer punto'], marker: 'check', color: 'auto' },
  divider: { spacing: 'md' },
  spacer: { size: 'md' },
  icon: { name: 'Star', size: 'lg', color: 'secondary', shape: 'none', shapeColor: 'light', align: 'left', url: '' },
  card: {
    media: 'icon',
    icon: 'Rocket',
    iconColor: 'secondary',
    image: '',
    title: 'Título de la tarjeta',
    text: 'Una descripción breve de lo que ofreces.',
    linkText: '',
    url: '',
    layout: 'vertical',
    align: 'left',
    variant: 'plain',
  },
  accordion: {
    items: [
      { title: '¿Primera pregunta?', content: null },
      { title: '¿Segunda pregunta?', content: null },
    ],
    firstOpen: true,
    exclusive: true,
    variant: 'minimal',
  },
  tabs: {
    items: [
      { title: 'Pestaña 1', content: null },
      { title: 'Pestaña 2', content: null },
    ],
    variant: 'underline',
  },
  gallery: { images: [], columns: { desktop: 3, tablet: 2, mobile: 2 }, layout: 'grid', aspect: 'square', gap: 'sm', rounded: true },
  counter: { number: '100', prefix: '', suffix: '+', label: 'Clientes felices', size: 'lg', align: 'center', color: 'auto' },
  testimonial: {
    quote: 'Excelente servicio, lo recomiendo totalmente.',
    name: 'Nombre del cliente',
    role: 'Cargo o ciudad',
    photo: '',
    rating: 5,
    align: 'left',
  },
  map: { address: 'Plaza de Armas, Lima', zoom: 15, height: 'md' },
  menu: { menuId: 'main', layout: 'horizontal', align: 'right', mobile: 'hamburger', gap: 'md' },
  posts: {
    source: 'current',
    limit: 6,
    columns: { desktop: 3, tablet: 2, mobile: 1 },
    showImage: true,
    showDate: true,
    showExcerpt: true,
    variant: 'plain',
    imageAspect: 'video',
    pagination: true,
  },
};

export const defaultVisibility: Visibility = { desktop: true, tablet: true, mobile: true };

// Props completas: lo guardado sobre los valores por defecto (tolera JSON incompleto, ej. el que genera la IA)
export function propsOf<K extends BlockType>(block: IPageBlock, type: K = block.type as K): BlockPropsMap[K] {
  const defaults = blockDefaults[type] as unknown as Record<string, unknown>;
  const props: Record<string, unknown> = { ...defaults, ...block.props };
  // Los valores por dispositivo ({ desktop, tablet, mobile }) se fusionan, por si llegan incompletos
  for (const [key, def] of Object.entries(defaults)) {
    const saved = block.props[key];
    if (def && typeof def === 'object' && !Array.isArray(def) && saved && typeof saved === 'object') {
      props[key] = { ...def, ...saved };
    }
  }
  return props as unknown as BlockPropsMap[K];
}

export function visibilityOf(block: IPageBlock): Visibility {
  return { ...defaultVisibility, ...block.settings?.visibility };
}
