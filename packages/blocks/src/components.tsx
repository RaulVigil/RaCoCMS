import { createContext, useContext, type ComponentType, type HTMLAttributes, type ReactNode } from 'react';
import { clamp, EditorContext, Placeholder, safeUrl, useIsEditor, type BlockComponentProps } from './base';
import { moduleComponents } from './modules';
import type { IPageBlock } from '@raco/shared';
import { blockDefaults, propsOf, type RowProps, type Visibility } from './types';
import { RichText } from './RichText';
import { styleClasses } from './style';
import {
  backgrounds,
  backgroundTone,
  bodySize,
  buttonSize,
  buttonVariant,
  colSpan,
  columnPadding,
  cx,
  displayClass,
  dividerSpacing,
  flexAlign,
  headingSize,
  imageAspect,
  justify,
  richTextClass,
  rowAlign,
  rowGap,
  rowLayoutClasses,
  rowSpan,
  sectionGutter,
  sectionMinHeight,
  sectionPaddingBottom,
  sectionPaddingTop,
  sectionWidth,
  slideClasses,
  spacerSize,
  textAlign,
  textColor,
} from './styles';


// La fila avisa a sus columnas en qué dispositivos es slider (para que tomen el ancho de tarjeta)
const RowContext = createContext<Pick<RowProps, 'layout' | 'slidesVisible'>>(blockDefaults.row);



// --- Contenedores ---

export function Section({ block, visible, attrs, overlay, children }: BlockComponentProps) {
  const p = propsOf(block, 'section');
  const s = styleClasses(block, ['contentWidth', 'gap']);
  const imageWithOverlay = !!p.backgroundImage && p.overlay;
  return (
    <section
      id={p.anchor || undefined}
      {...attrs}
      className={cx(
        'relative flex-col',
        displayClass('flex', visible),
        justify[p.verticalAlign],
        !s.has('minHeight') && sectionMinHeight[p.minHeight],
        !s.has('paddingTop') && sectionPaddingTop[p.paddingY],
        !s.has('paddingBottom') && sectionPaddingBottom[p.paddingY],
        !s.has('backgroundColor') && backgrounds[p.background],
        !s.has('color') && backgroundTone[p.background],
        imageWithOverlay && p.background === 'none' && !s.has('color') && 'text-white',
        p.backgroundImage && 'overflow-hidden',
        s.outer,
        s.inner,
        attrs?.className,
      )}
    >
      {p.backgroundImage && (
        <>
          <img src={p.backgroundImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
          {p.overlay && <div className="absolute inset-0 bg-black/50" />}
        </>
      )}
      {overlay}
      <div
        className={cx(
          'relative mx-auto flex w-full flex-col',
          !s.has('gap') && 'gap-8 @3xl:gap-12',
          !s.has('contentWidth') && sectionWidth[p.width],
          (p.width !== 'full' || s.has('contentWidth')) && sectionGutter,
          s.content,
        )}
      >
        {children}
      </div>
    </section>
  );
}

export function Row({ block, visible, attrs, overlay, children }: BlockComponentProps) {
  const p = propsOf(block, 'row');
  const s = styleClasses(block);
  return (
    <div
      {...attrs}
      className={cx(
        'relative grid-cols-12',
        rowLayoutClasses(p.layout, visible),
        !s.has('gap') && rowGap[p.gap],
        rowAlign[p.align],
        s.outer,
        s.inner,
        attrs?.className,
      )}
    >
      {overlay}
      <RowContext.Provider value={{ layout: p.layout, slidesVisible: p.slidesVisible }}>{children}</RowContext.Provider>
    </div>
  );
}

export function Column({ block, visible, attrs, overlay, children }: BlockComponentProps) {
  const p = propsOf(block, 'column');
  const s = styleClasses(block);
  const row = useContext(RowContext);
  return (
    <div
      {...attrs}
      className={cx(
        'relative min-w-0 flex-col',
        displayClass('flex', visible),
        !s.has('gap') && 'gap-4',
        colSpan.mobile[clamp(p.span.mobile, 1, 12)],
        colSpan.tablet[clamp(p.span.tablet, 1, 12)],
        colSpan.desktop[clamp(p.span.desktop, 1, 12)],
        rowSpan[clamp(p.rowSpan, 1, 3)],
        slideClasses(row.layout, row.slidesVisible),
        justify[p.verticalAlign],
        !s.has('textAlign') && textAlign[p.textAlign],
        !s.has('backgroundColor') && backgrounds[p.background],
        !s.has('color') && backgroundTone[p.background],
        !s.has('paddingTop') && columnPadding.top[p.padding],
        !s.has('paddingRight') && columnPadding.right[p.padding],
        !s.has('paddingBottom') && columnPadding.bottom[p.padding],
        !s.has('paddingLeft') && columnPadding.left[p.padding],
        p.rounded && !s.has('borderRadius') && 'rounded-2xl',
        p.shadow && !s.has('boxShadow') && 'shadow-xl',
        s.outer,
        s.inner,
        attrs?.className,
      )}
    >
      {overlay}
      {children}
    </div>
  );
}

// --- Módulos ---

export function Heading({ block, visible, attrs }: BlockComponentProps) {
  const p = propsOf(block, 'heading');
  const s = styleClasses(block);
  const Tag = `h${clamp(p.level, 1, 4)}` as 'h1' | 'h2' | 'h3' | 'h4';
  return (
    <Tag
      {...attrs}
      className={cx(
        displayClass('block', visible),
        'leading-tight',
        !s.has('fontFamily') && 'font-heading',
        !s.has('fontWeight') && 'font-bold',
        !s.has('fontSize') && headingSize[p.size],
        !s.has('textAlign') && textAlign[p.align],
        !s.has('color') && textColor[p.color],
        s.outer,
        s.inner,
        attrs?.className,
      )}
    >
      {p.url ? (
        <a href={safeUrl(p.url)} className="hover:opacity-80">
          {p.text}
        </a>
      ) : (
        p.text
      )}
    </Tag>
  );
}

export function Text({ block, visible, attrs }: BlockComponentProps) {
  const p = propsOf(block, 'text');
  const s = styleClasses(block);
  const editor = useIsEditor();
  if (!p.content?.content?.length) return editor ? <Placeholder label="Texto vacío" /> : null;
  return (
    <div
      {...attrs}
      className={cx(
        displayClass('block', visible),
        !s.has('lineHeight') && 'leading-relaxed',
        richTextClass,
        !s.has('fontSize') && bodySize[p.size],
        !s.has('textAlign') && textAlign[p.align],
        !s.has('color') && textColor[p.color],
        s.outer,
        s.inner,
        attrs?.className,
      )}
    >
      <RichText doc={p.content} />
    </div>
  );
}

export function Image({ block, visible, attrs }: BlockComponentProps) {
  const p = propsOf(block, 'image');
  const s = styleClasses(block);
  const editor = useIsEditor();
  // Si la armó la IA, el texto alternativo dice qué imagen conviene poner
  if (!p.src) return editor ? <Placeholder label={p.alt ? `Imagen sugerida: ${p.alt}` : 'Imagen: súbela en el panel de ajustes'} /> : null;
  const visual = cx(
    'h-auto',
    !s.has('width') && 'w-full',
    imageAspect[p.aspect],
    p.rounded && !s.has('borderRadius') && 'rounded-2xl',
    p.shadow && !s.has('boxShadow') && 'shadow-xl',
    s.inner,
  );

  // Con enlace: el <a> lleva la visibilidad y los márgenes; la imagen, todo lo visual
  if (p.url) {
    return (
      <a
        href={safeUrl(p.url)}
        {...(attrs as HTMLAttributes<HTMLAnchorElement>)}
        className={cx(displayClass('block', visible), s.outer, attrs?.className)}
      >
        <img src={p.src} alt={p.alt} loading="lazy" className={cx('block', visual)} />
      </a>
    );
  }
  return (
    <img
      src={p.src}
      alt={p.alt}
      loading="lazy"
      {...(attrs as HTMLAttributes<HTMLImageElement>)}
      className={cx(displayClass('block', visible), visual, s.outer, attrs?.className)}
    />
  );
}

export function Button({ block, visible, attrs }: BlockComponentProps) {
  const p = propsOf(block, 'button');
  const s = styleClasses(block);
  const v = buttonVariant[p.variant];
  const size = buttonSize[p.size];
  const padded = p.variant !== 'link';
  // El margen va en el contenedor; todo lo visual (fondo, borde, relleno, texto) en el enlace
  return (
    <div {...attrs} className={cx(displayClass('flex', visible), flexAlign[p.align], s.outer, attrs?.className)}>
      <a
        href={safeUrl(p.url)}
        target={p.newTab ? '_blank' : undefined}
        rel={p.newTab ? 'noopener noreferrer' : undefined}
        className={cx(
          'inline-flex items-center justify-center font-medium transition-colors',
          !s.has('backgroundColor') && v.bg,
          !s.has('color') && v.text,
          !s.has('borderWidth', 'borderColor', 'borderStyle') && v.border,
          !s.has('borderRadius') && v.radius,
          padded && !s.has('paddingLeft') && size.x.replace('px-', 'pl-'),
          padded && !s.has('paddingRight') && size.x.replace('px-', 'pr-'),
          padded && !s.has('paddingTop') && size.y.replace('py-', 'pt-'),
          padded && !s.has('paddingBottom') && size.y.replace('py-', 'pb-'),
          !s.has('fontSize') && size.text,
          s.inner,
        )}
      >
        {p.text}
      </a>
    </div>
  );
}

// YouTube y Vimeo: se guarda solo la URL normal, el embed se arma al renderizar
export function embedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

export function Video({ block, visible, attrs }: BlockComponentProps) {
  const p = propsOf(block, 'video');
  const s = styleClasses(block);
  const editor = useIsEditor();
  const src = embedUrl(p.url);
  if (!src) return editor ? <Placeholder label="Video: pega un enlace de YouTube o Vimeo" /> : null;
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
        src={src}
        title="Video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="block aspect-video w-full"
      />
      {/* En el editor el iframe se tragaría los clics */}
      {editor && <div className="absolute inset-0" />}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-secondary">
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function List({ block, visible, attrs }: BlockComponentProps) {
  const p = propsOf(block, 'list');
  const s = styleClasses(block);
  const items = p.items.filter((i) => i.trim());
  const base = cx(
    displayClass('block', visible),
    !s.has('gap') && 'space-y-2',
    !s.has('color') && textColor[p.color],
    s.outer,
    s.inner,
    attrs?.className,
  );

  if (p.marker === 'number') {
    return (
      <ol {...(attrs as HTMLAttributes<HTMLOListElement>)} className={cx(base, 'list-decimal pl-6')}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ol>
    );
  }
  return (
    <ul {...(attrs as HTMLAttributes<HTMLUListElement>)} className={cx(base, p.marker === 'dot' && 'list-disc pl-6')}>
      {items.map((item, i) =>
        p.marker === 'check' ? (
          <li key={i} className="flex items-start gap-2 text-left">
            <CheckIcon />
            <span>{item}</span>
          </li>
        ) : (
          <li key={i}>{item}</li>
        ),
      )}
    </ul>
  );
}

export function Divider({ block, visible, attrs }: BlockComponentProps) {
  const p = propsOf(block, 'divider');
  const s = styleClasses(block);
  return (
    <hr
      {...(attrs as HTMLAttributes<HTMLHRElement>)}
      className={cx(
        displayClass('block', visible),
        'border-0 border-t',
        !s.has('borderColor') && 'border-current opacity-20',
        !s.has('marginTop', 'marginBottom') && dividerSpacing[p.spacing],
        s.outer,
        s.inner,
        attrs?.className,
      )}
    />
  );
}

export function Spacer({ block, visible, attrs }: BlockComponentProps) {
  const p = propsOf(block, 'spacer');
  const s = styleClasses(block);
  return (
    <div
      aria-hidden="true"
      {...attrs}
      className={cx(displayClass('block', visible), !s.has('minHeight') && spacerSize[p.size], s.outer, s.inner, attrs?.className)}
    />
  );
}

export const blockComponents: Record<string, ComponentType<BlockComponentProps>> = {
  section: Section,
  row: Row,
  column: Column,
  heading: Heading,
  text: Text,
  image: Image,
  button: Button,
  video: Video,
  list: List,
  divider: Divider,
  spacer: Spacer,
  ...moduleComponents,
};
