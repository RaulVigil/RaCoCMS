import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Plus, RotateCcw, Trash2 } from 'lucide-react';
import type { ISiteColor, ISiteDesign } from '@raco/shared';
import {
  BASE_COLORS,
  FONT_LIBRARY,
  colorValue,
  cx,
  defaultDesign,
  designThemeCss,
  designVarClasses,
  newColorId,
  type FontInfo,
} from '@raco/blocks';
import { loadSiteDesign, saveSiteDesign, useGoogleFonts } from '../lib/siteDesign';
import { useRuntimeTailwind } from '../lib/tailwindRuntime';
import { inputClass } from '../components/fields/fieldTypes';

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const categoryLabels: Record<FontInfo['category'], string> = {
  'sans-serif': 'Sin serifa (modernas)',
  serif: 'Con serifa (clásicas)',
  display: 'Display (impacto)',
  handwriting: 'Manuscritas',
  monospace: 'Monoespaciadas',
};

export default function SiteSettings() {
  const [saved, setSaved] = useState<ISiteDesign | null>(null);
  const [draft, setDraft] = useState<ISiteDesign | null>(null);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState('');
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSiteDesign().then((d) => {
      setSaved(d);
      setDraft(d);
    });
  }, []);

  // La vista previa usa las fuentes y colores del borrador, al vuelo
  useGoogleFonts(draft);
  useRuntimeTailwind(pageRef, [draft], draft ? designThemeCss(draft) : undefined);

  if (!draft || !saved) return <p className="text-sm text-tertiary">Cargando...</p>;

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  function updateColor(id: string, patch: Partial<ISiteColor>) {
    setDraft((d) => d && { ...d, colors: d.colors.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
    setJustSaved(false);
  }

  async function handleSave() {
    if (draft!.colors.some((c) => !HEX.test(c.value))) return setError('Hay un color con un valor inválido');
    setSaving(true);
    setError('');
    try {
      const res = await saveSiteDesign(draft!);
      setSaved(res);
      setDraft(res);
      setJustSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const custom = draft.colors.filter((c) => !BASE_COLORS.some((b) => b.id === c.id));
  const fontsByCategory = FONT_LIBRARY.reduce<Record<string, FontInfo[]>>((acc, f) => {
    (acc[f.category] ??= []).push(f);
    return acc;
  }, {});

  return (
    <div ref={pageRef}>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Diseño del sitio</h1>
          <p className="text-sm text-tertiary mt-1">
            Colores y fuentes globales. Todo lo que diseñes con el constructor los usa: si cambias el color principal aquí,
            cambia en todas las páginas.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {dirty ? (
            <span className="text-sm text-amber-600">Cambios sin guardar</span>
          ) : (
            justSaved && (
              <span className="flex items-center gap-1 text-sm text-secondary">
                <Check size={15} /> Guardado
              </span>
            )
          )}
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="flex items-center gap-2 bg-secondary text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-secondary/90 transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            Guardar
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        <div className="xl:col-span-3 space-y-6">
          {/* --- Colores --- */}
          <div className="bg-white rounded-xl border border-tertiary/20 p-6">
            <h2 className="font-heading text-base font-semibold text-primary">Paleta de colores</h2>
            <p className="text-sm text-tertiary mb-4">Los cuatro colores base del sitio y los que quieras añadir.</p>

            <div className="space-y-3">
              {BASE_COLORS.map((base) => (
                <ColorRow
                  key={base.id}
                  name={base.name}
                  hint={base.hint}
                  value={colorValue(draft, base.id) ?? '#000000'}
                  onChange={(value) => updateColor(base.id, { value })}
                />
              ))}
            </div>

            <div className="mt-6 border-t border-tertiary/15 pt-5">
              <p className="text-sm font-medium text-primary mb-3">Colores adicionales</p>
              <div className="space-y-3">
                {custom.map((c) => (
                  <ColorRow
                    key={c.id}
                    name={c.name}
                    editableName
                    value={c.value}
                    onRename={(name) => updateColor(c.id, { name })}
                    onChange={(value) => updateColor(c.id, { value })}
                    onRemove={() => setDraft((d) => d && { ...d, colors: d.colors.filter((x) => x.id !== c.id) })}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  setDraft(
                    (d) => d && { ...d, colors: [...d.colors, { id: newColorId(), name: `Color ${custom.length + 1}`, value: '#f97316' }] },
                  )
                }
                className="mt-3 flex items-center gap-1.5 text-sm text-secondary hover:underline"
              >
                <Plus size={15} /> Añadir color
              </button>
            </div>
          </div>

          {/* --- Tipografía --- */}
          <div className="bg-white rounded-xl border border-tertiary/20 p-6">
            <h2 className="font-heading text-base font-semibold text-primary">Tipografía</h2>
            <p className="text-sm text-tertiary mb-4">Fuentes de Google Fonts para títulos y para el texto.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {(['heading', 'body'] as const).map((slot) => (
                <div key={slot}>
                  <label className="block text-sm font-medium text-primary mb-1.5">
                    {slot === 'heading' ? 'Títulos' : 'Texto'}
                  </label>
                  <select
                    value={draft.fonts[slot]}
                    onChange={(e) => setDraft((d) => d && { ...d, fonts: { ...d.fonts, [slot]: e.target.value } })}
                    className={inputClass}
                  >
                    {Object.entries(fontsByCategory).map(([cat, fonts]) => (
                      <optgroup key={cat} label={categoryLabels[cat as FontInfo['category']]}>
                        {fonts.map((f) => (
                          <option key={f.family} value={f.family}>
                            {f.family}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDraft(defaultDesign)}
            className="flex items-center gap-1.5 text-sm text-tertiary hover:text-primary"
          >
            <RotateCcw size={14} /> Volver a los valores de RaCo CMS
          </button>
        </div>

        {/* --- Vista previa con la paleta del borrador (variables con alcance solo aquí) --- */}
        <div className="xl:col-span-2 xl:sticky xl:top-8">
          <p className="text-xs uppercase tracking-wide text-tertiary mb-2">Vista previa</p>
          <div className={cx('@container overflow-hidden rounded-xl border border-tertiary/20 bg-white font-body text-primary', designVarClasses(draft))}>
            <div className="bg-primary px-6 py-10 text-white">
              <p className="text-xs uppercase tracking-widest text-secondary font-semibold">Nueva temporada</p>
              <h3 className="font-heading text-3xl font-bold leading-tight mt-2">Viaja a donde siempre soñaste</h3>
              <p className="mt-3 text-sm opacity-80">Paquetes con todo incluido y atención personalizada.</p>
              <span className="mt-5 inline-flex rounded-md bg-secondary px-5 py-2.5 text-sm font-medium text-slate-900">
                Ver destinos
              </span>
            </div>
            <div className="bg-background px-6 py-8">
              <h4 className="font-heading text-xl font-bold">Por qué elegirnos</h4>
              <p className="mt-2 text-sm leading-relaxed">
                Texto normal del sitio con un <span className="text-secondary underline">enlace destacado</span> y una nota{' '}
                <span className="text-tertiary">en color suave</span>.
              </p>
              <div className="mt-4 flex gap-2">
                <span className="rounded-md bg-primary px-4 py-2 text-sm text-white">Principal</span>
                <span className="rounded-md border-2 border-primary px-4 py-2 text-sm">Contorno</span>
              </div>
            </div>
            {custom.length > 0 && (
              <div className="flex flex-wrap gap-2 px-6 py-5">
                {custom.map((c) => (
                  <span key={c.id} className={cx('rounded-full px-3 py-1 text-xs font-medium text-white', `bg-${c.id}`)}>
                    {c.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorRow({
  name,
  hint,
  value,
  editableName,
  onChange,
  onRename,
  onRemove,
}: {
  name: string;
  hint?: string;
  value: string;
  editableName?: boolean;
  onChange: (v: string) => void;
  onRename?: (v: string) => void;
  onRemove?: () => void;
}) {
  const [hex, setHex] = useState(value);
  useEffect(() => setHex(value), [value]);

  return (
    <div className="flex items-center gap-3">
      {/* El círculo muestra el color y abre el selector nativo */}
      <label className={cx('relative h-10 w-10 shrink-0 cursor-pointer rounded-full border border-tertiary/30 shadow-sm', `bg-[${value}]`)}>
        <input
          type="color"
          value={value.length === 7 ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <div className="flex-1 min-w-0">
        {editableName ? (
          <input
            value={name}
            onChange={(e) => onRename?.(e.target.value)}
            className="w-full text-sm font-medium text-primary bg-transparent border-b border-transparent hover:border-tertiary/30 focus:border-secondary focus:outline-none"
          />
        ) : (
          <p className="text-sm font-medium text-primary">{name}</p>
        )}
        {hint && <p className="text-xs text-tertiary">{hint}</p>}
      </div>
      <input
        value={hex}
        onChange={(e) => setHex(e.target.value)}
        onBlur={() => {
          const v = hex.startsWith('#') ? hex.trim() : `#${hex.trim()}`;
          if (HEX.test(v)) onChange(v.toLowerCase());
          else setHex(value);
        }}
        className="w-28 px-2 py-1.5 rounded-md border border-tertiary/30 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
      />
      {onRemove && (
        <button type="button" onClick={onRemove} title="Quitar color" className="p-1.5 text-tertiary hover:text-red-500">
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}
