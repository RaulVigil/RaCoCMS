import {
  PanelsTopLeft,
  Columns3,
  RectangleVertical,
  Heading,
  Pilcrow,
  Image,
  MousePointerClick,
  CirclePlay,
  ListChecks,
  Minus,
  MoveVertical,
  Smile,
  CreditCard,
  ChevronsUpDown,
  AppWindow,
  Images,
  TrendingUp,
  Quote,
  MapPin,
  Menu,
  Newspaper,
  type LucideIcon,
} from 'lucide-react';
import type { ModuleType } from '@raco/blocks';

interface BlockMeta {
  label: string;
  icon: LucideIcon;
  description?: string;
  // Colores por nivel, como Divi: sección azul, fila verde, columna ámbar, módulo violeta
  outline: string;
  chip: string;
}

const levels = {
  section: { outline: 'outline-sky-500', chip: 'bg-sky-500' },
  row: { outline: 'outline-emerald-500', chip: 'bg-emerald-500' },
  column: { outline: 'outline-amber-500', chip: 'bg-amber-500' },
  module: { outline: 'outline-violet-500', chip: 'bg-violet-500' },
};

export const blockMeta: Record<string, BlockMeta> = {
  section: { label: 'Sección', icon: PanelsTopLeft, ...levels.section },
  row: { label: 'Fila', icon: Columns3, ...levels.row },
  column: { label: 'Columna', icon: RectangleVertical, ...levels.column },
  heading: { label: 'Título', icon: Heading, description: 'Encabezado de una sección', ...levels.module },
  text: { label: 'Texto', icon: Pilcrow, description: 'Párrafos con formato', ...levels.module },
  image: { label: 'Imagen', icon: Image, description: 'Una foto o gráfico', ...levels.module },
  button: { label: 'Botón', icon: MousePointerClick, description: 'Enlace destacado', ...levels.module },
  video: { label: 'Video', icon: CirclePlay, description: 'YouTube o Vimeo', ...levels.module },
  list: { label: 'Lista', icon: ListChecks, description: 'Puntos con viñetas o ✓', ...levels.module },
  divider: { label: 'Separador', icon: Minus, description: 'Una línea divisoria', ...levels.module },
  spacer: { label: 'Espacio', icon: MoveVertical, description: 'Aire entre elementos', ...levels.module },
  icon: { label: 'Icono', icon: Smile, description: 'Un icono de la biblioteca', ...levels.module },
  card: { label: 'Tarjeta', icon: CreditCard, description: 'Icono o imagen, título y texto', ...levels.module },
  accordion: { label: 'Acordeón', icon: ChevronsUpDown, description: 'Preguntas frecuentes (FAQ)', ...levels.module },
  tabs: { label: 'Pestañas', icon: AppWindow, description: 'Contenido en pestañas', ...levels.module },
  gallery: { label: 'Galería', icon: Images, description: 'Varias imágenes', ...levels.module },
  counter: { label: 'Contador', icon: TrendingUp, description: 'Una cifra destacada', ...levels.module },
  testimonial: { label: 'Testimonio', icon: Quote, description: 'Opinión de un cliente', ...levels.module },
  map: { label: 'Mapa', icon: MapPin, description: 'Google Maps por dirección', ...levels.module },
  menu: { label: 'Menú', icon: Menu, description: 'Navegación del sitio', ...levels.module },
  posts: { label: 'Listado de entradas', icon: Newspaper, description: 'Últimas noticias, viajes…', ...levels.module },
};

// Agrupados para el selector de módulos
export const moduleGroups: { label: string; types: ModuleType[] }[] = [
  { label: 'Básicos', types: ['heading', 'text', 'image', 'button', 'icon', 'list', 'divider', 'spacer'] },
  { label: 'Contenido', types: ['card', 'testimonial', 'counter', 'gallery', 'video', 'map'] },
  { label: 'Interactivos', types: ['accordion', 'tabs'] },
  { label: 'Sitio', types: ['menu', 'posts'] },
];

export const moduleTypes: ModuleType[] = moduleGroups.flatMap((g) => g.types);

export const metaOf = (type: string) => blockMeta[type] ?? blockMeta.text;
