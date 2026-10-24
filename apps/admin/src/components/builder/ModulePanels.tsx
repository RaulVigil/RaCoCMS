import { useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronDown, ImagePlus, Images, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import MediaPicker from '../media/MediaPicker';
import type { IPageBlock } from '@raco/shared';
import { ICONS, clamp, cx, iconByName, type ContentItem, type Device, type RichDoc } from '@raco/blocks';
import type { JSONContent } from '@tiptap/react';
import { uploadFile } from '../../lib/api';
import RichTextEditor from '../fields/RichTextEditor';
import {
  Field,
  ImagePicker,
  ResponsiveField,
  Segmented,
  Swatches,
  Toggle,
  alignOptions,
  bgOptionsFor,
  colorOptionsFor,
  smallInput,
} from './controls';
import { useBuilder } from './context';
import { AiAction, AiMenu } from '../AiMenu';
import { aiField } from '../../lib/ai';

// Paneles de Contenido y Diseño de los módulos de contenido (icono, tarjeta, acordeón...)

interface PanelProps {
  block: IPageBlock;
  p: Record<string, unknown>;
  set: (patch: Record<string, unknown>, key?: string) => void;
  device: Device;
  setDevice: (d: Device) => void;
}

const sizeOptions = [
  { value: 'sm', label: 'S' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'L' },
  { value: 'xl', label: 'XL' },
];

export function ModuleContent({ block, p, set }: PanelProps) {
  const { menus, collections } = useBuilder();
  switch (block.type) {
    case 'posts':
      return (
        <>
          <Field
            label="Qué entradas mostrar"
            hint={
              p.source === 'current'
                ? 'Para la plantilla de listado: muestra las entradas de la página actual, con paginación.'
                : 'Las más recientes publicadas de esa colección.'
            }
          >
            <select value={String(p.source)} onChange={(e) => set({ source: e.target.value })} className={smallInput}>
              <option value="current">Las del listado actual (plantilla de listado)</option>
              {collections
                .filter((c) => !c.isNative)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    Últimas de {c.name}
                  </option>
                ))}
            </select>
          </Field>
          {p.source !== 'current' && (
            <Field label="Cantidad">
              <input
                type="number"
                min={1}
                max={48}
                value={Number(p.limit)}
                onChange={(e) => set({ limit: clamp(Number(e.target.value), 1, 48) }, 'limit')}
                className={`${smallInput} w-24`}
              />
            </Field>
          )}
          <Toggle label="Mostrar imagen" checked={!!p.showImage} onChange={(showImage) => set({ showImage })} />
          <Toggle label="Mostrar fecha" checked={!!p.showDate} onChange={(showDate) => set({ showDate })} />
          <Toggle label="Mostrar extracto" checked={!!p.showExcerpt} onChange={(showExcerpt) => set({ showExcerpt })} />
          {p.source === 'current' && (
            <Toggle label="Paginación" checked={!!p.pagination} onChange={(pagination) => set({ pagination })} />
          )}
        </>
      );

    case 'menu':
      return (
        <Field label="Menú a mostrar" hint="Los enlaces se editan en la sección Menús del panel; los cambios se ven al volver aquí.">
          <select value={String(p.menuId)} onChange={(e) => set({ menuId: e.target.value })} className={smallInput}>
            {!menus.some((m) => m.id === p.menuId) && <option value={String(p.menuId)}>(menú no encontrado)</option>}
            {menus.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <a href="/menus" target="_blank" rel="noopener" className="mt-1.5 inline-block text-xs text-secondary hover:underline">
            Editar menús →
          </a>
        </Field>
      );

    case 'icon':
      return (
        <>
          <IconPicker value={String(p.name)} onChange={(name) => set({ name })} />
          <Field label="Enlace (opcional)" hint="Si lo pones, el icono lleva a esa dirección.">
            <input value={String(p.url ?? '')} onChange={(e) => set({ url: e.target.value }, 'url')} placeholder="/contacto" className={smallInput} />
          </Field>
        </>
      );

    case 'card':
      return (
        <>
          <Field label="Arriba de la tarjeta">
            <Segmented
              value={String(p.media)}
              options={[
                { value: 'icon', label: 'Icono' },
                { value: 'image', label: 'Imagen' },
                { value: 'none', label: 'Nada' },
              ]}
              onChange={(media) => set({ media })}
            />
          </Field>
          {p.media === 'icon' && <IconPicker value={String(p.icon)} onChange={(icon) => set({ icon })} />}
          {p.media === 'image' && <ImagePicker value={String(p.image ?? '')} onChange={(image) => set({ image })} />}
          <Field label="Título" action={<AiMenu text={String(p.title ?? '')} onResult={(title) => set({ title })} />}>
            <input value={String(p.title)} onChange={(e) => set({ title: e.target.value }, 'title')} className={smallInput} />
          </Field>
          <Field label="Texto" action={<AiMenu text={String(p.text ?? '')} onResult={(text) => set({ text })} />}>
            <textarea rows={3} value={String(p.text)} onChange={(e) => set({ text: e.target.value }, 'text')} className={smallInput} />
          </Field>
          <Field label="Enlace (opcional)" hint="Deja el texto vacío si la tarjeta no lleva enlace.">
            <div className="space-y-1.5">
              <input
                value={String(p.linkText ?? '')}
                onChange={(e) => set({ linkText: e.target.value }, 'linkText')}
                placeholder="Texto, ej: Ver más"
                className={smallInput}
              />
              <input value={String(p.url ?? '')} onChange={(e) => set({ url: e.target.value }, 'url')} placeholder="/servicios" className={smallInput} />
            </div>
          </Field>
        </>
      );

    case 'accordion':
      return (
        <ItemsEditor
          items={p.items as ContentItem[]}
          onChange={(items, key) => set({ items }, key)}
          titleLabel="Pregunta"
          contentLabel="Respuesta"
          addLabel="Añadir pregunta"
          blockId={block.id}
        />
      );

    case 'tabs':
      return (
        <ItemsEditor
          items={p.items as ContentItem[]}
          onChange={(items, key) => set({ items }, key)}
          titleLabel="Nombre de la pestaña"
          contentLabel="Contenido"
          addLabel="Añadir pestaña"
          blockId={block.id}
        />
      );

    case 'gallery':
      return <GalleryEditor images={p.images as { src: string; alt: string }[]} onChange={(images, key) => set({ images }, key)} />;

    case 'counter':
      return (
        <>
          <Field label="Número">
            <input value={String(p.number)} onChange={(e) => set({ number: e.target.value }, 'number')} className={smallInput} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Antes" hint="Ej: $">
              <input value={String(p.prefix ?? '')} onChange={(e) => set({ prefix: e.target.value }, 'prefix')} className={smallInput} />
            </Field>
            <Field label="Después" hint="Ej: +, %, k">
              <input value={String(p.suffix ?? '')} onChange={(e) => set({ suffix: e.target.value }, 'suffix')} className={smallInput} />
            </Field>
          </div>
          <Field label="Etiqueta">
            <input value={String(p.label ?? '')} onChange={(e) => set({ label: e.target.value }, 'label')} className={smallInput} />
          </Field>
        </>
      );

    case 'testimonial':
      return (
        <>
          <Field label="Testimonio" action={<AiMenu text={String(p.quote ?? '')} onResult={(quote) => set({ quote })} />}>
            <textarea rows={4} value={String(p.quote)} onChange={(e) => set({ quote: e.target.value }, 'quote')} className={smallInput} />
          </Field>
          <Field label="Nombre">
            <input value={String(p.name)} onChange={(e) => set({ name: e.target.value }, 'name')} className={smallInput} />
          </Field>
          <Field label="Cargo, empresa o ciudad">
            <input value={String(p.role ?? '')} onChange={(e) => set({ role: e.target.value }, 'role')} className={smallInput} />
          </Field>
          <Field label="Foto">
            <ImagePicker value={String(p.photo ?? '')} onChange={(photo) => set({ photo })} />
          </Field>
          <Field label="Estrellas">
            <Segmented
              value={Number(p.rating)}
              options={[0, 1, 2, 3, 4, 5].map((n) => ({ value: n, label: n === 0 ? 'Sin' : `${n}★` }))}
              onChange={(rating) => set({ rating })}
            />
          </Field>
        </>
      );

    case 'map':
      return (
        <>
          <Field label="Dirección" hint="Como la buscarías en Google Maps: calle, número, ciudad.">
            <input value={String(p.address)} onChange={(e) => set({ address: e.target.value }, 'address')} className={smallInput} />
          </Field>
          <Field label={`Zoom: ${p.zoom}`} hint="Más alto = más cerca.">
            <input
              type="range"
              min={3}
              max={20}
              value={Number(p.zoom)}
              onChange={(e) => set({ zoom: Number(e.target.value) }, 'zoom')}
              className="w-full accent-secondary"
            />
          </Field>
        </>
      );

    default:
      return null;
  }
}

export function ModuleDesign({ block, p, set, device, setDevice }: PanelProps) {
  const { design } = useBuilder();
  const colorOptions = colorOptionsFor(design);
  const bgOptions = bgOptionsFor(design);

  switch (block.type) {
    case 'posts': {
      const columns = p.columns as Record<Device, number>;
      return (
        <>
          <ResponsiveField label="Columnas" device={device} setDevice={setDevice}>
            <Segmented
              value={columns[device]}
              options={[1, 2, 3, 4].map((n) => ({ value: n, label: String(n) }))}
              onChange={(n) => set({ columns: { ...columns, [device]: n } })}
            />
          </ResponsiveField>
          <Field label="Estilo">
            <Segmented
              value={String(p.variant)}
              options={[
                { value: 'plain', label: 'Simple' },
                { value: 'card', label: 'Tarjeta' },
              ]}
              onChange={(variant) => set({ variant })}
            />
          </Field>
          <Field label="Proporción de la imagen">
            <Segmented
              value={String(p.imageAspect)}
              options={[
                { value: 'video', label: '16:9' },
                { value: 'square', label: '1:1' },
                { value: 'portrait', label: '3:4' },
              ]}
              onChange={(imageAspect) => set({ imageAspect })}
            />
          </Field>
        </>
      );
    }
    case 'menu':
      return (
        <>
          <Field label="Disposición">
            <Segmented
              value={String(p.layout)}
              options={[
                { value: 'horizontal', label: 'Horizontal' },
                { value: 'vertical', label: 'Vertical' },
              ]}
              onChange={(layout) => set({ layout })}
            />
          </Field>
          <Field label="Alineación">
            <Segmented value={String(p.align)} options={alignOptions} onChange={(align) => set({ align })} />
          </Field>
          <Field label="Espacio entre enlaces">
            <Segmented
              value={String(p.gap)}
              options={[
                { value: 'sm', label: 'S' },
                { value: 'md', label: 'M' },
                { value: 'lg', label: 'L' },
              ]}
              onChange={(gap) => set({ gap })}
            />
          </Field>
          <Field label="En móvil" hint="El botón ☰ abre el menú en un panel desplegable, sin JavaScript.">
            <Segmented
              value={String(p.mobile)}
              options={[
                { value: 'hamburger', label: 'Botón ☰' },
                { value: 'list', label: 'Lista visible' },
              ]}
              onChange={(mobile) => set({ mobile })}
            />
          </Field>
        </>
      );

    case 'icon':
      return (
        <>
          <Field label="Tamaño">
            <Segmented value={String(p.size)} options={sizeOptions} onChange={(size) => set({ size })} />
          </Field>
          <Field label="Color">
            <Swatches value={p.color as never} options={colorOptions} onChange={(color) => set({ color })} />
          </Field>
          <Field label="Forma de fondo">
            <Segmented
              value={String(p.shape)}
              options={[
                { value: 'none', label: 'Ninguna' },
                { value: 'circle', label: 'Círculo' },
                { value: 'square', label: 'Cuadrado' },
              ]}
              onChange={(shape) => set({ shape })}
            />
          </Field>
          {p.shape !== 'none' && (
            <Field label="Color de la forma">
              <Swatches value={p.shapeColor as never} options={bgOptions} onChange={(shapeColor) => set({ shapeColor })} />
            </Field>
          )}
          <Field label="Alineación">
            <Segmented value={String(p.align)} options={alignOptions} onChange={(align) => set({ align })} />
          </Field>
        </>
      );

    case 'card':
      return (
        <>
          <Field label="Estilo">
            <Segmented
              value={String(p.variant)}
              options={[
                { value: 'plain', label: 'Simple' },
                { value: 'filled', label: 'Fondo' },
                { value: 'bordered', label: 'Borde' },
                { value: 'elevated', label: 'Sombra' },
              ]}
              onChange={(variant) => set({ variant })}
            />
          </Field>
          <Field label="Disposición">
            <Segmented
              value={String(p.layout)}
              options={[
                { value: 'vertical', label: 'Vertical' },
                { value: 'horizontal', label: 'Horizontal' },
              ]}
              onChange={(layout) => set({ layout })}
            />
          </Field>
          {p.layout === 'vertical' && (
            <Field label="Alineación">
              <Segmented value={String(p.align)} options={alignOptions} onChange={(align) => set({ align })} />
            </Field>
          )}
          {p.media === 'icon' && (
            <Field label="Color del icono">
              <Swatches value={p.iconColor as never} options={colorOptions} onChange={(iconColor) => set({ iconColor })} />
            </Field>
          )}
        </>
      );

    case 'accordion':
      return (
        <>
          <Field label="Estilo">
            <Segmented
              value={String(p.variant)}
              options={[
                { value: 'minimal', label: 'Líneas' },
                { value: 'boxed', label: 'Cajas' },
              ]}
              onChange={(variant) => set({ variant })}
            />
          </Field>
          <Toggle label="Primera abierta al cargar" checked={!!p.firstOpen} onChange={(firstOpen) => set({ firstOpen })} />
          <Toggle label="Solo una abierta a la vez" checked={!!p.exclusive} onChange={(exclusive) => set({ exclusive })} />
        </>
      );

    case 'tabs':
      return (
        <Field label="Estilo">
          <Segmented
            value={String(p.variant)}
            options={[
              { value: 'underline', label: 'Subrayado' },
              { value: 'pills', label: 'Píldoras' },
            ]}
            onChange={(variant) => set({ variant })}
          />
        </Field>
      );

    case 'gallery': {
      const columns = p.columns as Record<Device, number>;
      return (
        <>
          <Field label="Disposición">
            <Segmented
              value={String(p.layout)}
              options={[
                { value: 'grid', label: 'Cuadrícula' },
                { value: 'masonry', label: 'Mosaico' },
              ]}
              onChange={(layout) => set({ layout })}
            />
          </Field>
          <ResponsiveField label="Columnas" device={device} setDevice={setDevice}>
            <Segmented
              value={columns[device]}
              options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n) }))}
              onChange={(n) => set({ columns: { ...columns, [device]: clamp(n, 1, 6) } })}
            />
          </ResponsiveField>
          {p.layout === 'grid' && (
            <Field label="Proporción">
              <Segmented
                value={String(p.aspect)}
                options={[
                  { value: 'square', label: '1:1' },
                  { value: 'video', label: '16:9' },
                  { value: 'portrait', label: '3:4' },
                  { value: 'auto', label: 'Original' },
                ]}
                onChange={(aspect) => set({ aspect })}
              />
            </Field>
          )}
          <Field label="Espacio entre imágenes">
            <Segmented
              value={String(p.gap)}
              options={[{ value: 'none', label: '0' }, ...sizeOptions]}
              onChange={(gap) => set({ gap })}
            />
          </Field>
          <Toggle label="Esquinas redondeadas" checked={!!p.rounded} onChange={(rounded) => set({ rounded })} />
        </>
      );
    }

    case 'counter':
      return (
        <>
          <Field label="Tamaño">
            <Segmented
              value={String(p.size)}
              options={[
                { value: 'md', label: 'M' },
                { value: 'lg', label: 'L' },
                { value: 'xl', label: 'XL' },
              ]}
              onChange={(size) => set({ size })}
            />
          </Field>
          <Field label="Alineación">
            <Segmented value={String(p.align)} options={alignOptions} onChange={(align) => set({ align })} />
          </Field>
          <Field label="Color del número">
            <Swatches value={p.color as never} options={colorOptions} onChange={(color) => set({ color })} />
          </Field>
        </>
      );

    case 'testimonial':
      return (
        <Field label="Alineación">
          <Segmented value={String(p.align)} options={alignOptions} onChange={(align) => set({ align })} />
        </Field>
      );

    case 'map':
      return (
        <Field label="Altura">
          <Segmented
            value={String(p.height)}
            options={[
              { value: 'sm', label: 'Baja' },
              { value: 'md', label: 'Media' },
              { value: 'lg', label: 'Alta' },
            ]}
            onChange={(height) => set({ height })}
          />
        </Field>
      );

    default:
      return null;
  }
}

// --- Selector de iconos con buscador ---

function IconPicker({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const Current = iconByName(value);
  const label = ICONS.find((i) => i.name === value)?.label ?? value;
  const q = query.trim().toLowerCase();
  const results = q ? ICONS.filter((i) => i.label.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)) : ICONS;

  return (
    <Field label="Icono">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 rounded-md border border-tertiary/30 px-2.5 py-2 text-left hover:border-secondary"
      >
        <Current size={20} className="text-primary" />
        <span className="flex-1 text-sm text-primary">{label}</span>
        <ChevronDown size={14} className={cx('text-tertiary transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-tertiary/20 p-2">
          <div className="relative mb-2">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar: teléfono, envío, estrella…"
              className={cx(smallInput, 'pl-8')}
            />
          </div>
          <div className="grid max-h-56 grid-cols-6 gap-1 overflow-y-auto">
            {results.map(({ name, label: l, icon: Icon }) => (
              <button
                key={name}
                type="button"
                title={l}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                  setQuery('');
                }}
                className={cx(
                  'flex aspect-square items-center justify-center rounded-md transition-colors',
                  name === value ? 'bg-secondary/15 text-secondary' : 'text-primary hover:bg-background',
                )}
              >
                <Icon size={18} />
              </button>
            ))}
            {!results.length && <p className="col-span-6 py-4 text-center text-xs text-tertiary">Sin resultados</p>}
          </div>
        </div>
      )}
    </Field>
  );
}

// --- Elementos de acordeón y pestañas (título + texto con formato) ---

function ItemsEditor({
  items,
  onChange,
  titleLabel,
  contentLabel,
  addLabel,
  blockId,
}: {
  items: ContentItem[];
  onChange: (items: ContentItem[], key?: string) => void;
  titleLabel: string;
  contentLabel: string;
  addLabel: string;
  blockId: string;
}) {
  // Solo uno desplegado a la vez: el editor de texto se monta con el contenido de ese elemento
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const update = (i: number, patch: Partial<ContentItem>, key?: string) =>
    onChange(
      items.map((it, j) => (j === i ? { ...it, ...patch } : it)),
      key && `${key}:${i}`,
    );

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setOpenIndex(null);
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-tertiary/20">
          <div className="flex items-center gap-1 px-2 py-1.5">
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-xs font-medium text-primary"
            >
              <ChevronDown size={13} className={cx('shrink-0 text-tertiary transition-transform', openIndex === i && 'rotate-180')} />
              <span className="truncate">{item.title || `(sin ${titleLabel.toLowerCase()})`}</span>
            </button>
            <IconBtn title="Subir" onClick={() => move(i, -1)}>
              <ArrowUp size={12} />
            </IconBtn>
            <IconBtn title="Bajar" onClick={() => move(i, 1)}>
              <ArrowDown size={12} />
            </IconBtn>
            <IconBtn
              title="Quitar"
              danger
              onClick={() => {
                onChange(items.filter((_, j) => j !== i));
                setOpenIndex(null);
              }}
            >
              <Trash2 size={12} />
            </IconBtn>
          </div>
          {openIndex === i && (
            <div className="space-y-2 border-t border-tertiary/15 p-2.5">
              <Field label={titleLabel}>
                <input value={item.title} onChange={(e) => update(i, { title: e.target.value }, 'title')} className={smallInput} />
              </Field>
              <Field label={contentLabel}>
                <RichTextEditor
                  key={`${blockId}-${i}`}
                  value={(item.content as JSONContent | null) ?? null}
                  onChange={(content) => update(i, { content: content as RichDoc | null }, 'content')}
                />
              </Field>
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          onChange([...items, { title: '', content: null }]);
          setOpenIndex(items.length);
        }}
        className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-tertiary/40 py-2 text-xs text-primary hover:border-secondary hover:text-secondary"
      >
        <Plus size={13} /> {addLabel}
      </button>
    </div>
  );
}

// --- Galería: subida múltiple, orden y texto alternativo ---

function GalleryEditor({
  images,
  onChange,
}: {
  images: { src: string; alt: string }[];
  onChange: (images: { src: string; alt: string }[], key?: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const [library, setLibrary] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError('');
    setUploading(files.length);
    const added: { src: string; alt: string }[] = [];
    // De a una para no saturar el procesamiento a WebP
    for (const file of Array.from(files)) {
      try {
        const res = await uploadFile(file);
        added.push({ src: res.url, alt: res.alt ?? '' });
      } catch (err) {
        setError((err as Error).message);
      }
      setUploading((n) => n - 1);
    }
    onChange([...images, ...added]);
    if (inputRef.current) inputRef.current.value = '';
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setEditing(j);
  }

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, i) => (
            <button
              key={`${img.src}-${i}`}
              type="button"
              onClick={() => setEditing(editing === i ? null : i)}
              className={cx(
                'relative aspect-square overflow-hidden rounded-md border-2',
                editing === i ? 'border-secondary' : 'border-transparent',
              )}
            >
              <img src={img.src} alt={img.alt} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {editing !== null && images[editing] && (
        <div className="space-y-2 rounded-lg border border-tertiary/20 p-2.5">
          <Field
            label="Descripción de la imagen"
            hint="La leen los buscadores y los lectores de pantalla."
            action={
              <AiAction
                label="Describir"
                run={() => aiField({ action: 'alt-text', imageUrl: images[editing].src })}
                onResult={(alt) => onChange(images.map((img, j) => (j === editing ? { ...img, alt } : img)))}
              />
            }
          >
            <input
              value={images[editing].alt}
              onChange={(e) =>
                onChange(
                  images.map((img, j) => (j === editing ? { ...img, alt: e.target.value } : img)),
                  `alt:${editing}`,
                )
              }
              className={smallInput}
            />
          </Field>
          <div className="flex items-center gap-1">
            <IconBtn title="Mover antes" onClick={() => move(editing, -1)}>
              <ArrowLeft size={13} />
            </IconBtn>
            <IconBtn title="Mover después" onClick={() => move(editing, 1)}>
              <ArrowRight size={13} />
            </IconBtn>
            <button
              type="button"
              onClick={() => {
                onChange(images.filter((_, j) => j !== editing));
                setEditing(null);
              }}
              className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:underline"
            >
              <X size={12} /> Quitar
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading > 0}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-tertiary/30 py-5 text-xs text-tertiary hover:border-secondary hover:text-secondary disabled:opacity-60"
      >
        {uploading > 0 ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
        {uploading > 0 ? `Subiendo ${uploading}…` : 'Subir imágenes (puedes elegir varias)'}
      </button>
      <button
        type="button"
        onClick={() => setLibrary(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-tertiary/30 py-1.5 text-xs text-primary hover:bg-background"
      >
        <Images size={14} /> Elegir de la biblioteca (varias)
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {library && (
        <MediaPicker
          multiple
          onClose={() => setLibrary(false)}
          onSelect={(picked) => {
            setLibrary(false);
            onChange([...images, ...picked.map((m) => ({ src: m.url, alt: m.alt }))]);
          }}
        />
      )}
    </div>
  );
}

function IconBtn({
  title,
  danger,
  onClick,
  children,
}: {
  title: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cx('rounded p-1 text-tertiary', danger ? 'hover:bg-red-50 hover:text-red-500' : 'hover:bg-background hover:text-primary')}
    >
      {children}
    </button>
  );
}
