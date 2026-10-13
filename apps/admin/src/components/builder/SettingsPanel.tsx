import { useRef, useState, type ReactNode } from 'react';
import { ChevronRight, ImagePlus, Loader2, Monitor, Plus, Smartphone, Tablet } from 'lucide-react';
import type { IPageBlock, ISiteDesign } from '@raco/shared';
import {
  colorValue,
  createBlock,
  cx,
  propsOf,
  visibilityOf,
  type Background,
  type BlockType,
  type ColumnProps,
  type Device,
  type RowLayout,
  type TextColor,
  SLIDES_VISIBLE,
} from '@raco/blocks';
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
  devices,
  smallInput,
} from './controls';
import { LayoutGrid, PanelHeader } from './AddPanel';
import { metaOf } from './meta';
import StyleEditor from './StyleEditor';
import { ModuleContent, ModuleDesign } from './ModulePanels';
import { useBuilder } from './context';

type Tab = 'content' | 'design' | 'advanced';

interface Props {
  block: IPageBlock;
  ancestors: IPageBlock[];
  device: Device;
  setDevice: (d: Device) => void;
  // key agrupa cambios seguidos del mismo ajuste en un solo paso de deshacer
  update: (id: string, change: (b: IPageBlock) => IPageBlock, key?: string) => void;
  select: (id: string) => void;
  onClose: () => void;
}

const widthOptions = [
  { value: 12, label: 'Toda' },
  { value: 9, label: '¾' },
  { value: 8, label: '⅔' },
  { value: 6, label: '½' },
  { value: 4, label: '⅓' },
  { value: 3, label: '¼' },
  { value: 2, label: '⅙' },
];

export default function SettingsPanel({ block, ancestors, device, setDevice, update, select, onClose }: Props) {
  const type = block.type as BlockType;
  const meta = metaOf(type);
  const isModule = !['section', 'row', 'column'].includes(type);
  const hasContent = isModule && type !== 'divider' && type !== 'spacer';
  const tabs: { value: Tab; label: string }[] = [
    ...(hasContent || type === 'row' ? [{ value: 'content' as Tab, label: type === 'row' ? 'Columnas' : 'Contenido' }] : []),
    { value: 'design', label: 'Diseño' },
    { value: 'advanced', label: 'Avanzado' },
  ];
  const [tab, setTab] = useState<Tab>(tabs[0].value);

  // Helpers para cambiar props del bloque seleccionado
  function set(patch: Record<string, unknown>, key?: string) {
    update(block.id, (b) => ({ ...b, props: { ...b.props, ...patch } }), key && `${block.id}:${key}`);
  }
  const p = propsOf(block) as never as Record<string, unknown>;

  return (
    <div>
      <PanelHeader title={meta.label} onClose={onClose}>
        {/* Ruta del bloque: permite subir a la columna, fila o sección que lo contiene */}
        {ancestors.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-0.5 text-[11px] text-tertiary">
            {ancestors.map((a) => (
              <span key={a.id} className="flex items-center gap-0.5">
                <button type="button" onClick={() => select(a.id)} className="hover:text-secondary hover:underline">
                  {metaOf(a.type).label}
                </button>
                <ChevronRight size={11} />
              </span>
            ))}
            <span className="text-primary">{meta.label}</span>
          </div>
        )}
        <div className="mt-3 flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={cx(
                'flex-1 rounded-md px-2 py-1.5 text-xs transition-colors',
                tab === t.value ? 'bg-primary text-white' : 'text-tertiary hover:bg-background hover:text-primary',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </PanelHeader>

      <div className="space-y-5 p-4">
        {tab === 'content' && (
          <ContentTab block={block} p={p} set={set} device={device} setDevice={setDevice} update={update} select={select} />
        )}
        {tab === 'design' && (
          <>
            <DesignTab block={block} p={p} set={set} device={device} setDevice={setDevice} ancestors={ancestors} />
            <StyleEditor
              block={block}
              device={device}
              setDevice={setDevice}
              onChange={(style, key) =>
                update(block.id, (b) => ({ ...b, settings: { ...b.settings, style } }), `${block.id}:style:${key}`)
              }
            />
          </>
        )}
        {tab === 'advanced' && (
          <>
            <Field label="Mostrar en" hint="Lo oculto se ve atenuado en el editor, pero no aparece en ese dispositivo.">
              <div className="space-y-2">
                {devices.map((d) => (
                  <Toggle
                    key={d.value}
                    label={d.label}
                    checked={visibilityOf(block)[d.value]}
                    onChange={(v) =>
                      update(block.id, (b) => ({
                        ...b,
                        settings: { ...b.settings, visibility: { ...visibilityOf(b), [d.value]: v } },
                      }))
                    }
                  />
                ))}
              </div>
            </Field>
            {type === 'section' && (
              <Field label="Ancla" hint="Para enlazar directo a esta sección. Ej: contacto → /pagina#contacto">
                <input
                  value={String(p.anchor ?? '')}
                  onChange={(e) => set({ anchor: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }, 'anchor')}
                  placeholder="contacto"
                  className={smallInput}
                />
              </Field>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface TabProps {
  block: IPageBlock;
  p: Record<string, unknown>;
  set: (patch: Record<string, unknown>, key?: string) => void;
  device: Device;
  setDevice: (d: Device) => void;
  ancestors?: IPageBlock[];
}

function ContentTab({
  block,
  p,
  set,
  device,
  setDevice,
  update,
  select,
}: TabProps & { update: Props['update']; select: (id: string) => void }) {
  switch (block.type) {
    case 'row':
      return <RowColumns block={block} device={device} setDevice={setDevice} update={update} select={select} />;

    case 'heading':
      return (
        <>
          <Field label="Texto">
            <textarea rows={2} value={String(p.text)} onChange={(e) => set({ text: e.target.value }, 'text')} className={smallInput} />
          </Field>
          <Field label="Nivel" hint="Usa H1 una sola vez por página (el título principal). Ayuda al SEO.">
            <Segmented
              value={Number(p.level)}
              options={[1, 2, 3, 4].map((n) => ({ value: n, label: `H${n}` }))}
              onChange={(level) => set({ level })}
            />
          </Field>
        </>
      );

    case 'text':
      return (
        <RichTextEditor
          key={block.id}
          value={(p.content as JSONContent | null) ?? null}
          onChange={(content) => set({ content }, 'content')}
        />
      );

    case 'image':
      return (
        <>
          <ImagePicker value={String(p.src ?? '')} onChange={(src) => set({ src })} />
          <Field label="Descripción de la imagen" hint="La leen los buscadores y los lectores de pantalla.">
            <input value={String(p.alt ?? '')} onChange={(e) => set({ alt: e.target.value }, 'alt')} className={smallInput} />
          </Field>
        </>
      );

    case 'button':
      return (
        <>
          <Field label="Texto del botón">
            <input value={String(p.text)} onChange={(e) => set({ text: e.target.value }, 'text')} className={smallInput} />
          </Field>
          <Field label="Enlace" hint="Una dirección web o una ruta del sitio, ej: /contacto">
            <input value={String(p.url)} onChange={(e) => set({ url: e.target.value }, 'url')} className={smallInput} />
          </Field>
          <Toggle label="Abrir en una pestaña nueva" checked={!!p.newTab} onChange={(newTab) => set({ newTab })} />
        </>
      );

    case 'video':
      return (
        <Field label="Enlace del video" hint="Copia la dirección del video en YouTube o Vimeo y pégala aquí.">
          <input
            value={String(p.url ?? '')}
            onChange={(e) => set({ url: e.target.value }, 'url')}
            placeholder="https://www.youtube.com/watch?v=..."
            className={smallInput}
          />
        </Field>
      );

    case 'list':
      return (
        <Field label="Elementos" hint="Uno por línea">
          <textarea
            rows={6}
            value={(p.items as string[]).join('\n')}
            onChange={(e) => set({ items: e.target.value.split('\n') }, 'items')}
            className={smallInput}
          />
        </Field>
      );

    default:
      return <ModuleContent block={block} p={p} set={set} device={device} setDevice={setDevice} />;
  }
}

function DesignTab({ block, p, set, device, setDevice, ancestors = [] }: TabProps) {
  const { design } = useBuilder();
  const bgOptions = bgOptionsFor(design);
  const colorOptions = colorOptionsFor(design);
  switch (block.type) {
    case 'section':
      return (
        <>
          <Field label="Fondo">
            <Swatches value={p.background as Background} options={bgOptions} onChange={(background) => set({ background })} />
          </Field>
          <Field label="Imagen de fondo">
            <ImagePicker value={String(p.backgroundImage ?? '')} onChange={(backgroundImage) => set({ backgroundImage })} />
          </Field>
          {!!p.backgroundImage && (
            <Toggle label="Oscurecer la imagen (mejora la lectura)" checked={!!p.overlay} onChange={(overlay) => set({ overlay })} />
          )}
          <Field label="Espacio arriba y abajo">
            <Segmented
              value={p.paddingY as string}
              options={[
                { value: 'none', label: '0' },
                { value: 'sm', label: 'S' },
                { value: 'md', label: 'M' },
                { value: 'lg', label: 'L' },
                { value: 'xl', label: 'XL' },
              ]}
              onChange={(paddingY) => set({ paddingY })}
            />
          </Field>
          <Field label="Ancho del contenido">
            <Segmented
              value={p.width as string}
              options={[
                { value: 'narrow', label: 'Estrecho' },
                { value: 'normal', label: 'Normal' },
                { value: 'wide', label: 'Ancho' },
                { value: 'full', label: 'Completo' },
              ]}
              onChange={(width) => set({ width })}
            />
          </Field>
          <Field label="Alto mínimo">
            <Segmented
              value={p.minHeight as string}
              options={[
                { value: 'auto', label: 'Automático' },
                { value: 'half', label: 'Media pantalla' },
                { value: 'screen', label: 'Pantalla' },
              ]}
              onChange={(minHeight) => set({ minHeight })}
            />
          </Field>
          {p.minHeight !== 'auto' && (
            <Field label="Contenido alineado">
              <Segmented
                value={p.verticalAlign as string}
                options={[
                  { value: 'start', label: 'Arriba' },
                  { value: 'center', label: 'Centro' },
                  { value: 'end', label: 'Abajo' },
                ]}
                onChange={(verticalAlign) => set({ verticalAlign })}
              />
            </Field>
          )}
        </>
      );

    case 'row':
      return (
        <>
          <Field label="Espacio entre columnas">
            <Segmented
              value={p.gap as string}
              options={[
                { value: 'none', label: '0' },
                { value: 'sm', label: 'S' },
                { value: 'md', label: 'M' },
                { value: 'lg', label: 'L' },
                { value: 'xl', label: 'XL' },
              ]}
              onChange={(gap) => set({ gap })}
            />
          </Field>
          <EqualHeight on={p.align === 'stretch'} onChange={(on) => set({ align: on ? 'stretch' : 'start' })} />
          {p.align !== 'stretch' && (
            <Field label="Alinear las columnas entre sí">
              <Segmented
                value={p.align as string}
                options={[
                  { value: 'start', label: 'Arriba' },
                  { value: 'center', label: 'Centro' },
                  { value: 'end', label: 'Abajo' },
                ]}
                onChange={(align) => set({ align })}
              />
            </Field>
          )}
        </>
      );

    case 'column': {
      const span = (p as unknown as ColumnProps).span;
      const parentRow = ancestors[ancestors.length - 1];
      const sliderHere = parentRow?.type === 'row' && propsOf(parentRow, 'row').layout[device] === 'slider';
      return (
        <>
          {sliderHere && (
            <p className="rounded-md bg-secondary/10 px-3 py-2 text-[11px] text-primary">
              En {devices.find((d) => d.value === device)?.label.toLowerCase()} esta fila es un slider: el ancho de cada
              tarjeta lo define la fila ("Tarjetas visibles"), no el ancho de la columna.
            </p>
          )}
          <ResponsiveField
            label="Ancho"
            device={device}
            setDevice={setDevice}
            hint="Cada dispositivo tiene su propio ancho: por ejemplo ⅓ en escritorio, ½ en tablet y toda la fila en móvil."
          >
            <Segmented
              value={span[device]}
              options={widthOptions}
              onChange={(v) => set({ span: { ...span, [device]: v } })}
            />
            <select
              value={span[device]}
              onChange={(e) => set({ span: { ...span, [device]: Number(e.target.value) } })}
              className={cx(smallInput, 'mt-1.5')}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} de 12 partes
                </option>
              ))}
            </select>
          </ResponsiveField>
          <Field label="Alto en la grilla" hint="Ocupar 2 o 3 filas permite diseños tipo mosaico (bento). Desde tablet.">
            <Segmented
              value={Number(p.rowSpan)}
              options={[
                { value: 1, label: '1 fila' },
                { value: 2, label: '2 filas' },
                { value: 3, label: '3 filas' },
              ]}
              onChange={(rowSpan) => set({ rowSpan })}
            />
          </Field>
          <Field label="Fondo">
            <Swatches value={p.background as Background} options={bgOptions} onChange={(background) => set({ background })} />
          </Field>
          <Field label="Espacio interior">
            <Segmented
              value={p.padding as string}
              options={[
                { value: 'none', label: '0' },
                { value: 'sm', label: 'S' },
                { value: 'md', label: 'M' },
                { value: 'lg', label: 'L' },
                { value: 'xl', label: 'XL' },
              ]}
              onChange={(padding) => set({ padding })}
            />
          </Field>
          <Toggle label="Esquinas redondeadas" checked={!!p.rounded} onChange={(rounded) => set({ rounded })} />
          <Toggle label="Sombra" checked={!!p.shadow} onChange={(shadow) => set({ shadow })} />
          <Field label="Contenido alineado">
            <Segmented
              value={p.verticalAlign as string}
              options={[
                { value: 'start', label: 'Arriba' },
                { value: 'center', label: 'Centro' },
                { value: 'end', label: 'Abajo' },
              ]}
              onChange={(verticalAlign) => set({ verticalAlign })}
            />
          </Field>
          <Field label="Texto alineado">
            <Segmented
              value={p.textAlign as string}
              options={[{ value: 'inherit', label: 'Normal' }, ...alignOptions]}
              onChange={(textAlign) => set({ textAlign })}
            />
          </Field>
        </>
      );
    }

    case 'heading':
    case 'text':
      return (
        <>
          <Field label="Tamaño">
            <Segmented
              value={p.size as string}
              options={
                block.type === 'heading'
                  ? [
                      { value: 'sm', label: 'S' },
                      { value: 'md', label: 'M' },
                      { value: 'lg', label: 'L' },
                      { value: 'xl', label: 'XL' },
                      { value: '2xl', label: 'XXL' },
                    ]
                  : [
                      { value: 'sm', label: 'Pequeño' },
                      { value: 'md', label: 'Normal' },
                      { value: 'lg', label: 'Grande' },
                    ]
              }
              onChange={(size) => set({ size })}
            />
          </Field>
          <Field label="Alineación">
            <Segmented value={p.align as string} options={alignOptions} onChange={(align) => set({ align })} />
          </Field>
          <Field label="Color">
            <Swatches value={p.color as TextColor} options={colorOptions} onChange={(color) => set({ color })} />
          </Field>
        </>
      );

    case 'image':
      return (
        <>
          <Field label="Proporción">
            <Segmented
              value={p.aspect as string}
              options={[
                { value: 'auto', label: 'Original' },
                { value: 'square', label: '1:1' },
                { value: 'video', label: '16:9' },
                { value: 'portrait', label: '3:4' },
              ]}
              onChange={(aspect) => set({ aspect })}
            />
          </Field>
          <Toggle label="Esquinas redondeadas" checked={!!p.rounded} onChange={(rounded) => set({ rounded })} />
          <Toggle label="Sombra" checked={!!p.shadow} onChange={(shadow) => set({ shadow })} />
        </>
      );

    case 'button':
      return (
        <>
          <Field label="Estilo">
            <Segmented
              value={p.variant as string}
              options={[
                { value: 'primary', label: 'Principal' },
                { value: 'secondary', label: 'Acento' },
                { value: 'outline', label: 'Borde' },
                { value: 'link', label: 'Enlace' },
              ]}
              onChange={(variant) => set({ variant })}
            />
          </Field>
          <Field label="Tamaño">
            <Segmented
              value={p.size as string}
              options={[
                { value: 'sm', label: 'S' },
                { value: 'md', label: 'M' },
                { value: 'lg', label: 'L' },
              ]}
              onChange={(size) => set({ size })}
            />
          </Field>
          <Field label="Alineación">
            <Segmented value={p.align as string} options={alignOptions} onChange={(align) => set({ align })} />
          </Field>
        </>
      );

    case 'list':
      return (
        <>
          <Field label="Viñeta">
            <Segmented
              value={p.marker as string}
              options={[
                { value: 'check', label: '✓' },
                { value: 'dot', label: '•' },
                { value: 'number', label: '1.' },
              ]}
              onChange={(marker) => set({ marker })}
            />
          </Field>
          <Field label="Color">
            <Swatches value={p.color as TextColor} options={colorOptions} onChange={(color) => set({ color })} />
          </Field>
        </>
      );

    case 'divider':
      return (
        <Field label="Espacio alrededor">
          <Segmented
            value={p.spacing as string}
            options={[
              { value: 'sm', label: 'S' },
              { value: 'md', label: 'M' },
              { value: 'lg', label: 'L' },
            ]}
            onChange={(spacing) => set({ spacing })}
          />
        </Field>
      );

    case 'spacer':
      return (
        <Field label="Altura">
          <Segmented
            value={p.size as string}
            options={[
              { value: 'sm', label: 'S' },
              { value: 'md', label: 'M' },
              { value: 'lg', label: 'L' },
              { value: 'xl', label: 'XL' },
            ]}
            onChange={(size) => set({ size })}
          />
        </Field>
      );

    default:
      return <ModuleDesign block={block} p={p} set={set} device={device} setDevice={setDevice} />;
  }
}

// Como "Igualar alto de columnas" de Divi: todas miden lo que la más alta
function EqualHeight({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <div>
      <Toggle label="Igualar el alto de las columnas" checked={on} onChange={onChange} />
      <p className="mt-1 text-[11px] text-tertiary">
        Todas miden lo que la más alta. Ideal si tienen fondo o borde, como tarjetas. Para ubicar el contenido dentro de
        cada una usa "Contenido alineado" en la columna.
      </p>
    </div>
  );
}

// Columnas de una fila: reparto rápido por dispositivo, lista, añadir y cambiar estructura
function RowColumns({
  block,
  device,
  setDevice,
  update,
  select,
}: {
  block: IPageBlock;
  device: Device;
  setDevice: (d: Device) => void;
  update: Props['update'];
  select: (id: string) => void;
}) {
  const [restructuring, setRestructuring] = useState(false);
  const columns = block.children ?? [];

  function perRow(n: number) {
    update(block.id, (row) => ({
      ...row,
      children: (row.children ?? []).map((col) => {
        const span = propsOf(col, 'column').span;
        return { ...col, props: { ...col.props, span: { ...span, [device]: 12 / n } } };
      }),
    }));
  }

  function addColumn() {
    update(block.id, (row) => ({
      ...row,
      children: [...(row.children ?? []), createBlock('column', { span: { desktop: 4, tablet: 6, mobile: 12 } })],
    }));
  }

  // Aplica una estructura: reutiliza las columnas existentes y pasa el contenido sobrante a la última
  function applyLayout(layout: RowLayout) {
    update(block.id, (row) => {
      const current = row.children ?? [];
      const next = layout.spans.map((span, i) => {
        const base = current[i] ?? createBlock('column');
        const tablet = layout.tabletSameAsDesktop ? span : span <= 2 ? 4 : span <= 4 ? 6 : 12;
        return {
          ...base,
          props: {
            ...base.props,
            span: { desktop: span, tablet, mobile: span <= 2 ? 6 : 12 },
            rowSpan: layout.rowSpans?.[i] ?? 1,
          },
        };
      });
      const leftovers = current.slice(layout.spans.length).flatMap((c) => c.children ?? []);
      if (leftovers.length) {
        const last = next[next.length - 1];
        next[next.length - 1] = { ...last, children: [...(last.children ?? []), ...leftovers] };
      }
      return { ...row, children: next };
    });
    setRestructuring(false);
  }

  const fraction = (n: number) => widthOptions.find((w) => w.value === n)?.label ?? `${n}/12`;

  const rowProps = propsOf(block, 'row');
  const mode = rowProps.layout[device];
  const setRowProp = (key: 'layout' | 'slidesVisible', value: unknown) =>
    update(block.id, (row) => ({ ...row, props: { ...row.props, [key]: value } }));

  // Si todas las columnas tienen el mismo ancho exacto, se marca cuántas van por fila
  const spansNow = columns.map((c) => propsOf(c, 'column').span[device]);
  const perRowNow = spansNow.length && spansNow.every((x) => x === spansNow[0]) && 12 % spansNow[0] === 0 ? 12 / spansNow[0] : 0;

  return (
    <>
      <ResponsiveField
        label="Cómo se muestran"
        device={device}
        setDevice={setDevice}
        hint={
          mode === 'slider'
            ? 'Las columnas pasan a ser tarjetas que se deslizan con el dedo, el trackpad o la rueda. Sin JavaScript.'
            : 'Reparte todas las columnas en partes iguales en este dispositivo.'
        }
      >
        <Segmented
          value={mode}
          options={[
            { value: 'grid', label: 'Cuadrícula' },
            { value: 'slider', label: 'Slider' },
          ]}
          onChange={(m) => setRowProp('layout', { ...rowProps.layout, [device]: m })}
        />
        <div className="mt-2.5">
          {mode === 'grid' ? (
            <>
              <p className="mb-1 text-[11px] text-tertiary">Columnas por fila</p>
              <Segmented value={perRowNow} options={[1, 2, 3, 4, 6].map((n) => ({ value: n, label: String(n) }))} onChange={perRow} />
            </>
          ) : (
            <>
              <p className="mb-1 text-[11px] text-tertiary">Tarjetas visibles a la vez</p>
              <Segmented
                value={rowProps.slidesVisible[device]}
                options={SLIDES_VISIBLE.map((n) => ({
                  value: n,
                  label: n === 1.2 ? '1+' : String(n),
                  title: n === 1.2 ? 'Una, con la siguiente asomando' : `${n} a la vez`,
                }))}
                onChange={(n) => setRowProp('slidesVisible', { ...rowProps.slidesVisible, [device]: n })}
              />
            </>
          )}
        </div>
      </ResponsiveField>

      {columns.length > 1 && (
        <EqualHeight
          on={propsOf(block, 'row').align === 'stretch'}
          onChange={(on) => update(block.id, (row) => ({ ...row, props: { ...row.props, align: on ? 'stretch' : 'start' } }))}
        />
      )}

      <Field label={`Columnas (${columns.length})`}>
        <div className="space-y-1">
          {columns.map((col, i) => {
            const span = propsOf(col, 'column').span;
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => select(col.id)}
                className="flex w-full items-center justify-between rounded-md border border-tertiary/20 px-2.5 py-1.5 text-xs hover:border-amber-400 hover:bg-amber-50"
              >
                <span className="text-primary">Columna {i + 1}</span>
                <span className="text-tertiary">
                  {fraction(span.desktop)} · {fraction(span.tablet)} · {fraction(span.mobile)}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-[11px] text-tertiary">Ancho en escritorio · tablet · móvil. Haz clic para ajustar una.</p>
      </Field>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={addColumn}
          className="flex flex-1 items-center justify-center gap-1 rounded-md border border-tertiary/30 py-1.5 text-xs text-primary hover:bg-background"
        >
          <Plus size={13} /> Columna
        </button>
        <button
          type="button"
          onClick={() => setRestructuring(!restructuring)}
          className="flex-1 rounded-md border border-tertiary/30 py-1.5 text-xs text-primary hover:bg-background"
        >
          Cambiar estructura
        </button>
      </div>
      {restructuring && <LayoutGrid onPick={applyLayout} />}
    </>
  );
}
