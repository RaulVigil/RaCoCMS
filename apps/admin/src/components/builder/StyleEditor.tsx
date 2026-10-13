import { useEffect, useState, type ReactNode } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ChevronDown,
  Link2,
  Link2Off,
  Monitor,
  RotateCcw,
  Smartphone,
  Tablet,
} from 'lucide-react';
import type { IPageBlock } from '@raco/shared';
import {
  cx,
  inheritedValue,
  isLength,
  styleOf,
  type BlockStyle,
  type Device,
  type StyleProp,
} from '@raco/blocks';
import { smallInput } from './controls';
import { useBuilder } from './context';

interface Props {
  block: IPageBlock;
  device: Device;
  setDevice: (d: Device) => void;
  onChange: (style: BlockStyle, key: string) => void;
}

type Group = 'spacing' | 'size' | 'typography' | 'background' | 'border' | 'effects';

// Qué grupos tiene sentido mostrar en cada tipo de bloque
const groupsByType: Record<string, Group[]> = {
  section: ['spacing', 'size', 'typography', 'background', 'border', 'effects'],
  row: ['spacing', 'size', 'background', 'border', 'effects'],
  column: ['spacing', 'size', 'typography', 'background', 'border', 'effects'],
  heading: ['spacing', 'size', 'typography', 'background', 'border', 'effects'],
  text: ['spacing', 'size', 'typography', 'background', 'border', 'effects'],
  list: ['spacing', 'size', 'typography', 'background', 'border', 'effects'],
  button: ['spacing', 'size', 'typography', 'background', 'border', 'effects'],
  image: ['spacing', 'size', 'border', 'effects'],
  video: ['spacing', 'size', 'border', 'effects'],
  divider: ['spacing', 'border', 'effects'],
  spacer: ['size'],
  icon: ['spacing', 'typography', 'background', 'border', 'effects'],
  card: ['spacing', 'size', 'typography', 'background', 'border', 'effects'],
  accordion: ['spacing', 'size', 'typography', 'background', 'border', 'effects'],
  tabs: ['spacing', 'size', 'typography', 'background', 'border', 'effects'],
  gallery: ['spacing', 'size', 'border', 'effects'],
  counter: ['spacing', 'size', 'typography', 'background', 'border', 'effects'],
  testimonial: ['spacing', 'size', 'typography', 'background', 'border', 'effects'],
  map: ['spacing', 'size', 'border', 'effects'],
};

const groupProps: Record<Group, StyleProp[]> = {
  spacing: ['marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'],
  size: ['width', 'maxWidth', 'minHeight', 'contentWidth', 'gap'],
  typography: ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform', 'textAlign', 'color'],
  background: ['backgroundColor'],
  border: ['borderWidth', 'borderStyle', 'borderColor', 'borderRadius'],
  effects: ['boxShadow', 'opacity'],
};

const groupLabels: Record<Group, string> = {
  spacing: 'Espaciado',
  size: 'Tamaño',
  typography: 'Tipografía',
  background: 'Fondo',
  border: 'Borde',
  effects: 'Efectos',
};

const devices: { value: Device; label: string; icon: typeof Monitor }[] = [
  { value: 'desktop', label: 'Escritorio', icon: Monitor },
  { value: 'tablet', label: 'Tablet', icon: Tablet },
  { value: 'mobile', label: 'Móvil', icon: Smartphone },
];

export default function StyleEditor({ block, device, setDevice, onChange }: Props) {
  const style = styleOf(block);
  const groups = groupsByType[block.type] ?? [];
  const [open, setOpen] = useState<Set<Group>>(new Set(['spacing']));

  const own = (prop: StyleProp) => style[device]?.[prop];
  const inherited = (prop: StyleProp) => (device === 'desktop' ? undefined : inheritedValue(style, prop, device === 'mobile' ? 'tablet' : 'desktop'));

  function setValues(patch: Partial<Record<StyleProp, string | undefined>>) {
    const current = { ...style[device] };
    for (const [k, v] of Object.entries(patch) as [StyleProp, string | undefined][]) {
      if (v === undefined || v === '') delete current[k];
      else current[k] = v;
    }
    const next: BlockStyle = { ...style, [device]: current };
    if (!Object.keys(current).length) delete next[device];
    onChange(next, `${device}:${Object.keys(patch).join(',')}`);
  }
  const set = (prop: StyleProp) => (v: string | undefined) => setValues({ [prop]: v });

  const countOwn = (g: Group) => groupProps[g].filter((p) => own(p)).length;

  function toggle(g: Group) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  }

  const fieldProps = (prop: StyleProp) => ({ value: own(prop), inherited: inherited(prop), onChange: set(prop) });

  return (
    <div className="-mx-4 border-t border-tertiary/15">
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-tertiary">Estilo personalizado</p>
        <div className="flex gap-0.5 rounded-md bg-background p-0.5">
          {devices.map((d) => (
            <button
              key={d.value}
              type="button"
              title={`Editando: ${d.label}`}
              onClick={() => setDevice(d.value)}
              className={cx('rounded p-1', device === d.value ? 'bg-white text-secondary shadow-sm' : 'text-tertiary hover:text-primary')}
            >
              <d.icon size={13} />
            </button>
          ))}
        </div>
      </div>
      <p className="px-4 pb-2 text-[11px] text-tertiary">
        {device === 'desktop'
          ? 'Lo que pongas aquí se aplica también en tablet y móvil, salvo que lo cambies allí.'
          : `Solo para ${device === 'tablet' ? 'tablet' : 'móvil'}. En gris lo heredado del dispositivo más grande.`}
      </p>

      {groups.map((g) => (
        <div key={g} className="border-t border-tertiary/10">
          <button
            type="button"
            onClick={() => toggle(g)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-primary hover:bg-background"
          >
            <span className="flex items-center gap-2">
              {groupLabels[g]}
              {countOwn(g) > 0 && (
                <span className="rounded-full bg-secondary/15 px-1.5 text-[10px] text-secondary">{countOwn(g)}</span>
              )}
            </span>
            <ChevronDown size={14} className={cx('text-tertiary transition-transform', open.has(g) && 'rotate-180')} />
          </button>

          {open.has(g) && (
            <div className="space-y-3 px-4 pb-4">
              {g === 'spacing' && <BoxModel own={own} inherited={inherited} setValues={setValues} />}

              {g === 'size' && (
                <>
                  {!['section', 'spacer'].includes(block.type) && (
                    <Row label="Ancho">
                      <UnitInput {...fieldProps('width')} allowAuto placeholder="auto" />
                    </Row>
                  )}
                  {block.type !== 'spacer' && (
                    <Row label="Ancho máximo">
                      <UnitInput {...fieldProps('maxWidth')} placeholder="ninguno" />
                    </Row>
                  )}
                  <Row label={block.type === 'spacer' ? 'Altura' : 'Alto mínimo'}>
                    <UnitInput {...fieldProps('minHeight')} placeholder="auto" />
                  </Row>
                  {block.type === 'section' && (
                    <Row label="Ancho del contenido">
                      <UnitInput {...fieldProps('contentWidth')} placeholder="1152px" />
                    </Row>
                  )}
                  {['section', 'row', 'column', 'list'].includes(block.type) && (
                    <Row
                      label={
                        { section: 'Espacio entre filas', row: 'Espacio entre columnas', column: 'Espacio entre módulos', list: 'Espacio entre elementos' }[
                          block.type
                        ]!
                      }
                    >
                      <UnitInput {...fieldProps('gap')} placeholder="auto" />
                    </Row>
                  )}
                </>
              )}

              {g === 'typography' && (
                <>
                  <Row label="Fuente">
                    <SelectInput
                      {...fieldProps('fontFamily')}
                      options={[
                        { value: 'heading', label: 'Títulos (Montserrat)' },
                        { value: 'body', label: 'Texto (Inter)' },
                      ]}
                    />
                  </Row>
                  <Row label="Tamaño">
                    <UnitInput {...fieldProps('fontSize')} placeholder="auto" />
                  </Row>
                  <Row label="Peso">
                    <SelectInput
                      {...fieldProps('fontWeight')}
                      options={[
                        ['100', 'Fino'],
                        ['200', 'Extra ligero'],
                        ['300', 'Ligero'],
                        ['400', 'Normal'],
                        ['500', 'Medio'],
                        ['600', 'Seminegrita'],
                        ['700', 'Negrita'],
                        ['800', 'Extra negrita'],
                        ['900', 'Negro'],
                      ].map(([value, label]) => ({ value, label: `${value} · ${label}` }))}
                    />
                  </Row>
                  <Row label="Interlineado">
                    <UnitInput {...fieldProps('lineHeight')} unitless placeholder="1.5" />
                  </Row>
                  <Row label="Espacio entre letras">
                    <UnitInput {...fieldProps('letterSpacing')} placeholder="0" defaultUnit="em" step={0.01} />
                  </Row>
                  <Row label="Mayúsculas">
                    <ChoiceInput
                      {...fieldProps('textTransform')}
                      options={[
                        { value: 'none', label: 'Aa', title: 'Normal' },
                        { value: 'uppercase', label: 'AA', title: 'MAYÚSCULAS' },
                        { value: 'lowercase', label: 'aa', title: 'minúsculas' },
                        { value: 'capitalize', label: 'Ab', title: 'Cada Palabra' },
                      ]}
                    />
                  </Row>
                  <Row label="Alineación">
                    <ChoiceInput
                      {...fieldProps('textAlign')}
                      options={[
                        { value: 'left', label: <AlignLeft size={13} />, title: 'Izquierda' },
                        { value: 'center', label: <AlignCenter size={13} />, title: 'Centro' },
                        { value: 'right', label: <AlignRight size={13} />, title: 'Derecha' },
                        { value: 'justify', label: <AlignJustify size={13} />, title: 'Justificado' },
                      ]}
                    />
                  </Row>
                  <ColorInput label="Color del texto" {...fieldProps('color')} />
                </>
              )}

              {g === 'background' && <ColorInput label="Color de fondo" {...fieldProps('backgroundColor')} />}

              {g === 'border' && (
                <>
                  <Row label="Grosor">
                    <UnitInput {...fieldProps('borderWidth')} placeholder="0" />
                  </Row>
                  <Row label="Estilo">
                    <SelectInput
                      {...fieldProps('borderStyle')}
                      options={[
                        { value: 'solid', label: 'Continuo' },
                        { value: 'dashed', label: 'Guiones' },
                        { value: 'dotted', label: 'Puntos' },
                        { value: 'none', label: 'Sin borde' },
                      ]}
                    />
                  </Row>
                  <ColorInput label="Color del borde" {...fieldProps('borderColor')} />
                  <Row label="Esquinas redondeadas">
                    <UnitInput {...fieldProps('borderRadius')} placeholder="0" />
                  </Row>
                </>
              )}

              {g === 'effects' && (
                <>
                  <Row label="Sombra">
                    <ChoiceInput
                      {...fieldProps('boxShadow')}
                      options={['none', 'sm', 'md', 'lg', 'xl', '2xl'].map((v) => ({
                        value: v,
                        label: v === 'none' ? '0' : v.toUpperCase(),
                        title: v === 'none' ? 'Sin sombra' : `Sombra ${v}`,
                      }))}
                    />
                  </Row>
                  <OpacityInput {...fieldProps('opacity')} />
                </>
              )}
            </div>
          )}
        </div>
      ))}

      {style[device] && (
        <div className="border-t border-tertiary/10 px-4 py-3">
          <button
            type="button"
            onClick={() => {
              const next = { ...style };
              delete next[device];
              onChange(next, `${device}:reset`);
            }}
            className="flex items-center gap-1.5 text-xs text-tertiary hover:text-red-500"
          >
            <RotateCcw size={12} /> Quitar los estilos de {devices.find((d) => d.value === device)?.label.toLowerCase()}
          </button>
        </div>
      )}
    </div>
  );
}

// --- Controles ---

interface FieldProps {
  value?: string;
  inherited?: string;
  onChange: (v: string | undefined) => void;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="shrink-0 text-xs text-primary">{label}</span>
      <div className="w-36">{children}</div>
    </div>
  );
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" title="Quitar este valor" onClick={onClick} className="shrink-0 rounded p-0.5 text-tertiary hover:text-red-500">
      <RotateCcw size={11} />
    </button>
  );
}

// Acepta "24", "24px", "2rem", "50%", "auto"... y se ajusta con las flechas (Shift = 10, Alt = 0.1)
function UnitInput({
  value,
  inherited,
  onChange,
  allowAuto,
  unitless,
  defaultUnit = 'px',
  step = 1,
  placeholder,
  compact,
}: FieldProps & {
  allowAuto?: boolean;
  unitless?: boolean;
  defaultUnit?: string;
  step?: number;
  placeholder?: string;
  compact?: boolean;
}) {
  const [draft, setDraft] = useState(value ?? '');
  const [invalid, setInvalid] = useState(false);
  useEffect(() => setDraft(value ?? ''), [value]);

  function normalize(raw: string): string | null {
    const v = raw.trim().toLowerCase().replace(',', '.');
    if (!v) return '';
    if (allowAuto && v === 'auto') return 'auto';
    if (/^-?(\d+(\.\d+)?|\.\d+)$/.test(v)) return unitless ? v : v === '0' ? '0' : `${v}${defaultUnit}`;
    if (isLength(v)) return v;
    return null;
  }

  function commit(raw: string) {
    const n = normalize(raw);
    if (n === null) {
      setInvalid(true);
      setDraft(value ?? '');
      setTimeout(() => setInvalid(false), 800);
      return;
    }
    setDraft(n);
    if (n !== (value ?? '')) onChange(n || undefined);
  }

  function nudge(dir: 1 | -1, e: React.KeyboardEvent) {
    const base = draft || inherited || '0';
    const m = base.match(/^(-?\d*\.?\d+)([a-z%]*)$/);
    if (!m) return;
    const inc = (e.shiftKey ? 10 : e.altKey ? 0.1 : step) * dir;
    const num = Math.round((parseFloat(m[1]) + inc) * 100) / 100;
    const unit = m[2] || (unitless ? '' : defaultUnit);
    commit(`${num}${unit}`);
  }

  return (
    <div className="flex items-center gap-1">
      <input
        value={draft}
        placeholder={inherited ?? placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit(draft)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit(draft);
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            nudge(e.key === 'ArrowUp' ? 1 : -1, e);
          }
        }}
        className={cx(
          compact
            ? 'w-full min-w-0 rounded border px-1 py-1 text-center text-[11px] focus:outline-none focus:ring-1 focus:ring-secondary'
            : smallInput,
          'placeholder:text-tertiary/70',
          invalid ? 'border-red-400 bg-red-50' : value ? 'border-secondary/60' : 'border-tertiary/30',
        )}
      />
      {!compact && value && <ResetButton onClick={() => onChange(undefined)} />}
    </div>
  );
}

function SelectInput({ value, inherited, onChange, options }: FieldProps & { options: { value: string; label: string }[] }) {
  return (
    <div className="flex items-center gap-1">
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className={cx(smallInput, value ? 'border-secondary/60' : '', !value && 'text-tertiary')}
      >
        <option value="">{inherited ? `Heredado (${options.find((o) => o.value === inherited)?.label ?? inherited})` : 'Por defecto'}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {value && <ResetButton onClick={() => onChange(undefined)} />}
    </div>
  );
}

function ChoiceInput({
  value,
  inherited,
  onChange,
  options,
}: FieldProps & { options: { value: string; label: ReactNode; title: string }[] }) {
  const current = value ?? inherited;
  return (
    <div className="flex gap-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          onClick={() => onChange(value === o.value ? undefined : o.value)}
          className={cx(
            'flex h-7 flex-1 items-center justify-center rounded border text-[11px] transition-colors',
            value === o.value
              ? 'border-secondary bg-secondary/10 font-medium text-primary'
              : current === o.value
                ? 'border-tertiary/40 bg-background text-primary'
                : 'border-tertiary/25 text-tertiary hover:text-primary',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Colores fijos que no dependen de la paleta del sitio
const fixedSwatches = [
  { id: 'white', name: 'Blanco', className: 'bg-white' },
  { id: 'black', name: 'Negro', className: 'bg-black' },
  { id: 'transparent', name: 'Transparente', className: 'bg-[repeating-linear-gradient(45deg,#e2e8f0_0_3px,#fff_3px_6px)]' },
];

function ColorInput({ label, value, inherited, onChange }: FieldProps & { label: string }) {
  const { design } = useBuilder();
  const current = value ?? inherited;
  // Paleta del sitio (con sus colores reales) y después los fijos; elegir un token mantiene el vínculo con la paleta
  const palette = [
    ...design.colors.map((c) => ({ id: c.id, name: c.name, className: `bg-[${c.value}]` })),
    ...fixedSwatches,
  ];
  const [hex, setHex] = useState(value?.startsWith('#') ? value : '');
  useEffect(() => setHex(value?.startsWith('#') ? value : ''), [value]);

  function commitHex(raw: string) {
    const v = raw.trim().startsWith('#') ? raw.trim() : `#${raw.trim()}`;
    if (/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) onChange(v.toLowerCase());
    else setHex(value?.startsWith('#') ? value : '');
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs text-primary">{label}</span>
        {value && <ResetButton onClick={() => onChange(undefined)} />}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {palette.map((t) => (
          <button
            key={t.id}
            type="button"
            title={t.name}
            onClick={() => onChange(value === t.id ? undefined : t.id)}
            className={cx(
              'h-6 w-6 rounded-full border border-tertiary/30',
              t.className,
              current === t.id && (value ? 'ring-2 ring-secondary ring-offset-1' : 'ring-1 ring-tertiary ring-offset-1'),
            )}
          />
        ))}
        {/* Selector nativo para cualquier color (sin transparencia) */}
        <label
          title="Elegir cualquier color"
          className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-full border border-tertiary/30 bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)]"
        >
          <input
            type="color"
            value={current?.startsWith('#') && current.length === 7 ? current : '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>
      <input
        value={hex}
        placeholder={inherited?.startsWith('#') ? inherited : '#rrggbb o #rrggbbaa'}
        onChange={(e) => setHex(e.target.value)}
        onBlur={() => hex && commitHex(hex)}
        onKeyDown={(e) => e.key === 'Enter' && hex && commitHex(hex)}
        className={cx(smallInput, 'mt-1.5 font-mono text-xs', value?.startsWith('#') && 'border-secondary/60')}
      />
    </div>
  );
}

function OpacityInput({ value, inherited, onChange }: FieldProps) {
  const current = Number(value ?? inherited ?? 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-primary">Opacidad</span>
        <span className="flex items-center gap-1 text-xs text-tertiary">
          {current}%{value && <ResetButton onClick={() => onChange(undefined)} />}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={current}
        onChange={(e) => onChange(e.target.value === '100' ? undefined : e.target.value)}
        className="w-full accent-secondary"
      />
    </div>
  );
}

// Margen (fuera) y relleno (dentro) con sus cuatro lados, como el inspector del navegador
function BoxModel({
  own,
  inherited,
  setValues,
}: {
  own: (p: StyleProp) => string | undefined;
  inherited: (p: StyleProp) => string | undefined;
  setValues: (patch: Partial<Record<StyleProp, string | undefined>>) => void;
}) {
  const [linked, setLinked] = useState<{ margin: boolean; padding: boolean }>({ margin: false, padding: false });

  const side = (kind: 'margin' | 'padding', s: 'Top' | 'Right' | 'Bottom' | 'Left') => {
    const prop = `${kind}${s}` as StyleProp;
    return (
      <UnitInput
        compact
        value={own(prop)}
        inherited={inherited(prop)}
        allowAuto={kind === 'margin'}
        placeholder="0"
        onChange={(v) =>
          linked[kind]
            ? setValues({ [`${kind}Top`]: v, [`${kind}Right`]: v, [`${kind}Bottom`]: v, [`${kind}Left`]: v })
            : setValues({ [prop]: v })
        }
      />
    );
  };

  const LinkToggle = ({ kind }: { kind: 'margin' | 'padding' }) => (
    <button
      type="button"
      title={linked[kind] ? 'Lados enlazados: un valor para los cuatro' : 'Enlazar los cuatro lados'}
      onClick={() => setLinked({ ...linked, [kind]: !linked[kind] })}
      className={cx('rounded p-0.5', linked[kind] ? 'text-secondary' : 'text-tertiary hover:text-primary')}
    >
      {linked[kind] ? <Link2 size={12} /> : <Link2Off size={12} />}
    </button>
  );

  return (
    <div className="rounded-lg border border-dashed border-orange-300 bg-orange-50/60 p-1.5">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-medium uppercase tracking-wide text-orange-600">Margen</span>
        <LinkToggle kind="margin" />
      </div>
      <div className="mx-auto w-14">{side('margin', 'Top')}</div>
      <div className="mt-1 grid grid-cols-[3.25rem_1fr_3.25rem] items-center gap-1">
        {side('margin', 'Left')}
        <div className="rounded-md border border-dashed border-emerald-300 bg-emerald-50/70 p-1.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-600">Relleno</span>
            <LinkToggle kind="padding" />
          </div>
          <div className="mx-auto w-12">{side('padding', 'Top')}</div>
          <div className="mt-1 grid grid-cols-[3rem_1fr_3rem] items-center gap-1">
            {side('padding', 'Left')}
            <div className="h-6 rounded bg-white/80 ring-1 ring-tertiary/20" />
            {side('padding', 'Right')}
          </div>
          <div className="mx-auto mt-1 w-12">{side('padding', 'Bottom')}</div>
        </div>
        {side('margin', 'Right')}
      </div>
      <div className="mx-auto mt-1 w-14">{side('margin', 'Bottom')}</div>
      <p className="mt-1.5 px-1 text-[10px] text-tertiary">Ej: 24, 2rem, 5%, auto. Flechas ↑↓ para ajustar.</p>
    </div>
  );
}
