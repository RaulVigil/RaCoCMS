import { useContext, type ComponentType } from 'react';
import { ChevronDown, Menu as MenuIcon, Star, X } from 'lucide-react';
import type { IMenuItem } from '@raco/shared';
import { clamp, Placeholder, safeUrl, useIsEditor, useSite, type BlockComponentProps } from './base';
import { iconByName } from './icons';
import { ArchiveContext, PostsContext, type PostItem } from './dynamic';
import { RichText } from './RichText';
import { styleClasses } from './style';
import { propsOf, type Background, type IconSize, type RichDoc, type TextColor } from './types';
import { backgrounds, backgroundTone, cx, displayClass, flexAlign, richTextClass, textAlign, textColor } from './styles';

// Módulos de contenido. Todo lo interactivo (acordeón, pestañas) funciona con HTML y CSS, sin JavaScript.

const iconSize: Record<IconSize, string> = { sm: 'h-5 w-5', md: 'h-7 w-7', lg: 'h-10 w-10', xl: 'h-14 w-14' };
const shapePad: Record<IconSize, string> = { sm: 'p-2', md: 'p-3', lg: 'p-4', xl: 'p-5' };
const itemsAlign = { left: 'items-start', center: 'items-center', right: 'items-end' };

export function IconBadge({
  name,
  size,
  color,
  shape = 'none',
  shapeColor = 'none',
  className,
}: {
  name: string;
  size: IconSize;
  color: TextColor;
  shape?: 'none' | 'circle' | 'square';
  shapeColor?: Background;
  className?: string;
}) {
  const Icon = iconByName(name);
  const shaped = shape !== 'none';
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center justify-center',
        shaped && (shape === 'circle' ? 'rounded-full' : 'rounded-xl'),
        shaped && shapePad[size],
        shaped && backgrounds[shapeColor],
        shaped && color === 'auto' && backgroundTone[shapeColor],
        textColor[color],
        className,
      )}
    >
      <Icon aria-hidden="true" strokeWidth={1.75} className={iconSize[size]} />
    </span>
  );
}

export function IconModule({ block, visible, attrs }: BlockComponentProps) {
  const p = propsOf(block, 'icon');
  const s = styleClasses(block);
  const badge = (
    <IconBadge
      name={p.name}
      size={p.size}
      color={s.has('color') ? 'auto' : p.color}
      shape={p.shape}
      shapeColor={s.has('backgroundColor') ? 'none' : p.shapeColor}
      className={s.inner}
    />
  );
  return (
    <div {...attrs} className={cx(displayClass('flex', visible), flexAlign[p.align], s.outer, attrs?.className)}>
      {p.url ? (
        <a href={safeUrl(p.url)} aria-label={p.name}>
          {badge}
        </a>
      ) : (
        badge
      )}
    </div>
  );
}

// Partes del estilo de la tarjeta, reemplazables una a una con estilos propios
const cardVariant = {
  plain: { bg: '', border: '', pad: '', radius: '', shadow: '' },
  filled: { bg: 'bg-background text-primary', border: '', pad: 'p-6', radius: 'rounded-2xl', shadow: '' },
  bordered: { bg: '', border: 'border border-current/15', pad: 'p-6', radius: 'rounded-2xl', shadow: '' },
  elevated: { bg: 'bg-white text-primary', border: '', pad: 'p-6', radius: 'rounded-2xl', shadow: 'shadow-xl' },
};

export function Card({ block, visible, attrs }: BlockComponentProps) {
  const p = propsOf(block, 'card');
  const s = styleClasses(block);
  const v = cardVariant[p.variant];
  const horizontal = p.layout === 'horizontal';
  const customPad = s.has('paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft');

  const media =
    p.media === 'image' && p.image ? (
      <img
        src={p.image}
        alt=""
        loading="lazy"
        className={cx('object-cover', horizontal ? 'h-20 w-20 shrink-0 rounded-xl' : 'aspect-video w-full rounded-xl')}
      />
    ) : p.media === 'icon' ? (
      <IconBadge name={p.icon} size={horizontal ? 'md' : 'lg'} color={p.iconColor} />
    ) : null;

  return (
    <div
      {...attrs}
      className={cx(
        displayClass('flex', visible),
        horizontal ? 'flex-row items-start gap-4' : cx('flex-col gap-4', itemsAlign[p.align]),
        !s.has('textAlign') && textAlign[p.align],
        !s.has('backgroundColor') && v.bg,
        !s.has('borderWidth', 'borderColor', 'borderStyle') && v.border,
        !customPad && v.pad,
        !s.has('borderRadius') && v.radius,
        !s.has('boxShadow') && v.shadow,
        s.outer,
        s.inner,
        attrs?.className,
      )}
    >
      {media}
      <div className="min-w-0">
        {p.title && <h3 className="font-heading text-xl font-bold leading-snug">{p.title}</h3>}
        {p.text && <p className="mt-2 whitespace-pre-line leading-relaxed opacity-80">{p.text}</p>}
        {p.linkText && (
          <a href={safeUrl(p.url)} className="mt-4 inline-flex items-center gap-1 font-semibold text-secondary hover:underline">
            {p.linkText} <span aria-hidden="true">→</span>
          </a>
        )}
      </div>
    </div>
  );
}

function ItemContent({ doc, editor }: { doc: RichDoc | null; editor: boolean }) {
  if (doc?.content?.length) return <RichText doc={doc} />;
  return editor ? <p className="italic opacity-60">Escribe el contenido en el panel de ajustes</p> : null;
}

// <details> nativo: se abre y cierra sin JavaScript; con "name" compartido solo queda uno abierto
export function Accordion({ block, visible, attrs }: BlockComponentProps) {
  const p = propsOf(block, 'accordion');
  const s = styleClasses(block);
  const editor = useIsEditor();
  const items = p.items.filter((i) => i.title?.trim());
  if (!items.length) return editor ? <Placeholder label="Acordeón vacío: añade preguntas en el panel" /> : null;

  const boxed = p.variant === 'boxed';
  return (
    <div
      {...attrs}
      className={cx(
        displayClass('block', visible),
        boxed ? 'space-y-3' : 'divide-y divide-current/15 border-y border-current/15',
        s.outer,
        s.inner,
        attrs?.className,
      )}
    >
      {items.map((item, i) => (
        <details
          key={i}
          open={p.firstOpen && i === 0}
          {...(p.exclusive ? ({ name: `acc-${block.id}` } as object) : {})}
          className={cx('group', boxed && 'rounded-xl border border-current/15 px-5')}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-heading font-semibold [&::-webkit-details-marker]:hidden">
            {item.title}
            <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className={cx('pb-4 leading-relaxed opacity-90', richTextClass)}>
            <ItemContent doc={item.content} editor={editor} />
          </div>
        </details>
      ))}
    </div>
  );
}

// Pestañas sin JavaScript: radios ocultos + :has() muestra el panel de la pestaña marcada
export function Tabs({ block, visible, attrs }: BlockComponentProps) {
  const p = propsOf(block, 'tabs');
  const s = styleClasses(block);
  const editor = useIsEditor();
  const items = p.items.filter((i) => i.title?.trim());
  if (!items.length) return editor ? <Placeholder label="Pestañas vacías: añádelas en el panel" /> : null;

  const underline = p.variant === 'underline';
  return (
    <div {...attrs} className={cx(displayClass('block', visible), 'group/tabs', s.outer, s.inner, attrs?.className)}>
      <div role="tablist" className={cx('flex flex-wrap', underline ? 'gap-1 border-b border-current/15' : 'gap-2')}>
        {items.map((item, i) => (
          <label
            key={i}
            className={cx(
              'cursor-pointer select-none font-medium transition-colors',
              underline
                ? '-mb-px border-b-2 border-transparent px-4 py-2.5 opacity-70 hover:opacity-100 has-[:checked]:border-secondary has-[:checked]:opacity-100'
                : 'rounded-full px-4 py-2 opacity-80 hover:bg-current/5 has-[:checked]:bg-secondary has-[:checked]:text-slate-900 has-[:checked]:opacity-100',
            )}
          >
            <input type="radio" name={`tabs-${block.id}`} defaultChecked={i === 0} data-tab={`t${i}`} className="sr-only" />
            {item.title}
          </label>
        ))}
      </div>
      {items.map((item, i) => (
        <div
          key={i}
          role="tabpanel"
          className={cx('hidden pt-5 leading-relaxed', richTextClass, `group-has-[[data-tab=t${i}]:checked]/tabs:block`)}
        >
          <ItemContent doc={item.content} editor={editor} />
        </div>
      ))}
    </div>
  );
}

const galleryGap = { none: 'gap-0', sm: 'gap-2', md: 'gap-4', lg: 'gap-6', xl: 'gap-8' };
const masonryItemGap = { none: 'mb-0', sm: 'mb-2', md: 'mb-4', lg: 'mb-6', xl: 'mb-8' };
const galleryAspect = { auto: '', square: 'aspect-square', video: 'aspect-video', portrait: 'aspect-[3/4]' };

export function Gallery({ block, visible, attrs }: BlockComponentProps) {
  const p = propsOf(block, 'gallery');
  const s = styleClasses(block);
  const editor = useIsEditor();
  const images = p.images.filter((i) => i.src);
  if (!images.length) return editor ? <Placeholder label="Galería vacía: sube imágenes en el panel" /> : null;

  const n = (d: 'mobile' | 'tablet' | 'desktop') => clamp(p.columns[d], 1, 6);
  const masonry = p.layout === 'masonry';
  const cols = masonry
    ? `columns-${n('mobile')} @3xl:columns-${n('tablet')} @5xl:columns-${n('desktop')}`
    : `grid grid-cols-${n('mobile')} @3xl:grid-cols-${n('tablet')} @5xl:grid-cols-${n('desktop')}`;

  return (
    <div
      {...attrs}
      className={cx(displayClass('block', visible), cols, galleryGap[p.gap], s.outer, s.inner, attrs?.className)}
    >
      {images.map((img, i) => (
        <img
          key={i}
          src={img.src}
          alt={img.alt}
          loading="lazy"
          className={cx(
            'w-full object-cover',
            masonry ? cx('break-inside-avoid', masonryItemGap[p.gap]) : cx('h-full', galleryAspect[p.aspect]),
            p.rounded && 'rounded-xl',
          )}
        />
      ))}
    </div>
  );
}

const counterSize = { md: 'text-4xl', lg: 'text-5xl @3xl:text-6xl', xl: 'text-6xl @3xl:text-7xl' };

export function Counter({ block, visible, attrs }: BlockComponentProps) {
  const p = propsOf(block, 'counter');
  const s = styleClasses(block);
  return (
    <div
      {...attrs}
      className={cx(displayClass('block', visible), !s.has('textAlign') && textAlign[p.align], s.outer, s.inner, attrs?.className)}
    >
      <div
        className={cx(
          'font-heading font-bold leading-none tabular-nums',
          !s.has('fontSize') && counterSize[p.size],
          !s.has('color') && textColor[p.color],
        )}
      >
        {p.prefix}
        {p.number}
        {p.suffix}
      </div>
      {p.label && <div className="mt-2 opacity-75">{p.label}</div>}
    </div>
  );
}

export function Testimonial({ block, visible, attrs }: BlockComponentProps) {
  const p = propsOf(block, 'testimonial');
  const s = styleClasses(block);
  const rating = clamp(p.rating, 0, 5);
  return (
    <figure
      {...attrs}
      className={cx(displayClass('block', visible), !s.has('textAlign') && textAlign[p.align], s.outer, s.inner, attrs?.className)}
    >
      {rating > 0 && (
        <div className={cx('mb-3 flex gap-0.5 text-amber-400', flexAlign[p.align])} aria-label={`${rating} de 5 estrellas`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} aria-hidden="true" className={cx('h-5 w-5', n <= rating ? 'fill-current' : 'opacity-30')} />
          ))}
        </div>
      )}
      <blockquote className="whitespace-pre-line text-lg leading-relaxed">“{p.quote}”</blockquote>
      <figcaption className={cx('mt-5 flex items-center gap-3', flexAlign[p.align])}>
        {p.photo && <img src={p.photo} alt={p.name} loading="lazy" className="h-12 w-12 shrink-0 rounded-full object-cover" />}
        <div className="text-left">
          <div className="font-semibold">{p.name}</div>
          {p.role && <div className="text-sm opacity-70">{p.role}</div>}
        </div>
      </figcaption>
    </figure>
  );
}

const mapHeight = { sm: 'h-64', md: 'h-96', lg: 'h-[32rem]' };

// Google Maps a partir de una dirección, sin clave de API
export function MapModule({ block, visible, attrs }: BlockComponentProps) {
  const p = propsOf(block, 'map');
  const s = styleClasses(block);
  const editor = useIsEditor();
  if (!p.address.trim()) return editor ? <Placeholder label="Mapa: escribe una dirección en el panel" /> : null;
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(p.address)}&z=${clamp(p.zoom, 1, 20)}&output=embed`;
  return (
    <div
      {...attrs}
      className={cx(
        'relative overflow-hidden',
        displayClass('block', visible),
        !s.has('borderRadius') && 'rounded-xl',
        s.outer,
        s.inner,
        attrs?.className,
      )}
    >
      <iframe
        title={p.address}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className={cx('block w-full border-0', mapHeight[p.height])}
      />
      {/* En el editor el iframe se tragaría los clics */}
      {editor && <div className="absolute inset-0" />}
    </div>
  );
}

const menuGap = { sm: 'gap-x-3 gap-y-1', md: 'gap-x-6 gap-y-2', lg: 'gap-x-10 gap-y-3' };
const menuJustify = { left: 'justify-start', center: 'justify-center', right: 'justify-end' };

// Menú del sitio: horizontal con desplegables en escritorio y botón ☰ en móvil (<details>, sin JavaScript)
export function MenuModule({ block, visible, attrs }: BlockComponentProps) {
  const p = propsOf(block, 'menu');
  const s = styleClasses(block);
  const editor = useIsEditor();
  const { menus, currentPath } = useSite();
  const menu = menus.find((m) => m.id === p.menuId);

  if (!menu?.items.length) {
    return editor ? <Placeholder label={menu ? 'Menú vacío: añade enlaces en la sección Menús' : 'Elige un menú en el panel'} /> : null;
  }

  const isCurrent = (url: string) =>
    !!currentPath && (url === currentPath || (url !== '/' && currentPath.startsWith(`${url}/`)));

  const link = (item: IMenuItem, className?: string) => (
    <a
      href={safeUrl(item.url)}
      target={item.target === '_blank' ? '_blank' : undefined}
      rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
      aria-current={isCurrent(item.url) ? 'page' : undefined}
      className={cx('transition-opacity hover:opacity-70 aria-[current=page]:font-semibold', className)}
    >
      {item.label}
    </a>
  );

  const horizontal = p.layout === 'horizontal';
  const hamburger = p.mobile === 'hamburger';

  const desktop = (
    <ul
      className={cx(
        horizontal ? cx('flex-wrap items-center', menuGap[p.gap], menuJustify[p.align]) : 'flex-col gap-2',
        hamburger ? 'hidden @3xl:flex' : 'flex',
      )}
    >
      {menu.items.map((item) => (
        <li key={item.id} className={cx('relative', !!item.children?.length && 'group/item')}>
          <span className="inline-flex items-center gap-1">
            {link(item)}
            {horizontal && !!item.children?.length && <ChevronDown aria-hidden="true" className="h-4 w-4 opacity-60" />}
          </span>
          {!!item.children?.length &&
            (horizontal ? (
              // pt-2 en vez de margen: el hueco sigue siendo parte del hover y el menú no se cierra al bajar
              <div
                className={cx(
                  'invisible absolute top-full z-50 pt-2 opacity-0 transition group-hover/item:visible group-hover/item:opacity-100 group-focus-within/item:visible group-focus-within/item:opacity-100',
                  p.align === 'right' ? 'right-0' : 'left-0',
                )}
              >
                <ul className="min-w-48 rounded-lg bg-white py-2 text-left text-slate-900 shadow-xl">
                  {item.children.map((child) => (
                    <li key={child.id}>{link(child, 'block whitespace-nowrap px-4 py-2 hover:bg-slate-100 hover:opacity-100')}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <ul className="ml-4 mt-2 flex flex-col gap-2 text-sm">
                {item.children.map((child) => (
                  <li key={child.id}>{link(child)}</li>
                ))}
              </ul>
            ))}
        </li>
      ))}
    </ul>
  );

  return (
    <nav
      aria-label={menu.name}
      {...attrs}
      className={cx(displayClass('block', visible), s.outer, s.inner, attrs?.className)}
    >
      {desktop}
      {hamburger && (
        <div className={cx('flex @3xl:hidden', menuJustify[p.align])}>
          <details className="group/menu relative">
            <summary
              aria-label="Abrir menú"
              className="flex cursor-pointer list-none items-center p-1 [&::-webkit-details-marker]:hidden"
            >
              <MenuIcon aria-hidden="true" className="h-7 w-7 group-open/menu:hidden" />
              <X aria-hidden="true" className="hidden h-7 w-7 group-open/menu:block" />
            </summary>
            <div
              className={cx(
                'absolute top-full z-50 mt-2 w-64 rounded-xl bg-white p-2 text-left text-slate-900 shadow-2xl',
                p.align === 'left' ? 'left-0' : 'right-0',
              )}
            >
              <ul className="flex flex-col">
                {menu.items.map((item) => (
                  <li key={item.id}>
                    {link(item, 'block rounded-lg px-3 py-2.5 hover:bg-slate-100 hover:opacity-100')}
                    {!!item.children?.length && (
                      <ul className="ml-3 border-l border-slate-200 pl-2">
                        {item.children.map((child) => (
                          <li key={child.id}>{link(child, 'block rounded-lg px-3 py-2 text-sm hover:bg-slate-100 hover:opacity-100')}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </div>
      )}
    </nav>
  );
}

const postAspect = { video: 'aspect-video', square: 'aspect-square', portrait: 'aspect-[3/4]' };

const samplePosts: PostItem[] = [1, 2, 3].map((n) => ({
  id: -n,
  title: `Título de ejemplo ${n}`,
  url: '#',
  date: 'Fecha',
  excerpt: 'Aquí aparecerá el extracto de cada entrada, tomado de su descripción o de su primer texto.',
  image: null,
}));

// Listado de entradas: en la plantilla de listado muestra la página actual con paginación;
// en cualquier otra página, las últimas de la colección elegida
export function Posts({ block, visible, attrs }: BlockComponentProps) {
  const p = propsOf(block, 'posts');
  const s = styleClasses(block);
  const editor = useIsEditor();
  const archive = useContext(ArchiveContext);
  const lists = useContext(PostsContext);

  const current = p.source === 'current';
  let items = current ? (archive?.items ?? []) : (lists[p.source] ?? []).slice(0, clamp(p.limit, 1, 48));
  if (!items.length && editor) items = samplePosts;
  if (!items.length) return null;

  const n = (d: 'mobile' | 'tablet' | 'desktop') => clamp(p.columns[d], 1, 6);
  const card = p.variant === 'card';

  return (
    <div {...attrs} className={cx(displayClass('block', visible), s.outer, s.inner, attrs?.className)}>
      <div className={`grid gap-8 grid-cols-${n('mobile')} @3xl:grid-cols-${n('tablet')} @5xl:grid-cols-${n('desktop')}`}>
        {items.map((item) => (
          <a
            key={item.id}
            href={safeUrl(item.url)}
            className={cx('group flex flex-col gap-3', card && 'rounded-2xl bg-white p-4 text-primary shadow-lg')}
          >
            {p.showImage &&
              (item.image ? (
                <img
                  src={item.image}
                  alt=""
                  loading="lazy"
                  className={cx('w-full rounded-xl object-cover transition-opacity group-hover:opacity-90', postAspect[p.imageAspect])}
                />
              ) : (
                editor && <div className={cx('w-full rounded-xl bg-current/10', postAspect[p.imageAspect])} />
              ))}
            {p.showDate && item.date && <p className="text-sm opacity-60">{item.date}</p>}
            <h3 className="font-heading text-xl font-bold leading-snug group-hover:text-secondary">{item.title}</h3>
            {p.showExcerpt && item.excerpt && <p className="leading-relaxed opacity-80">{item.excerpt}</p>}
          </a>
        ))}
      </div>

      {current && p.pagination && archive && archive.totalPages > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Paginación">
          {Array.from({ length: archive.totalPages }, (_, i) => i + 1).map((page) => (
            <a
              key={page}
              href={page === 1 ? archive.baseUrl : `${archive.baseUrl}?page=${page}`}
              aria-current={page === archive.page ? 'page' : undefined}
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium hover:bg-current/10 aria-[current=page]:bg-primary aria-[current=page]:text-white"
            >
              {page}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}

export const moduleComponents: Record<string, ComponentType<BlockComponentProps>> = {
  icon: IconModule,
  card: Card,
  accordion: Accordion,
  tabs: Tabs,
  gallery: Gallery,
  counter: Counter,
  testimonial: Testimonial,
  map: MapModule,
  menu: MenuModule,
  posts: Posts,
};
