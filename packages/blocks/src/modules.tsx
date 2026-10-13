import type { ComponentType } from 'react';
import { ChevronDown, Star } from 'lucide-react';
import { clamp, Placeholder, useIsEditor, type BlockComponentProps } from './base';
import { iconByName } from './icons';
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
        <a href={p.url} aria-label={p.name}>
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
          <a href={p.url || '#'} className="mt-4 inline-flex items-center gap-1 font-semibold text-secondary hover:underline">
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

export const moduleComponents: Record<string, ComponentType<BlockComponentProps>> = {
  icon: IconModule,
  card: Card,
  accordion: Accordion,
  tabs: Tabs,
  gallery: Gallery,
  counter: Counter,
  testimonial: Testimonial,
  map: MapModule,
};
