import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import type { IEntry, ISiteGeneral } from '@raco/shared';
import { api } from '../lib/api';
import { inputClass } from './fields/fieldTypes';

const empty: ISiteGeneral = { siteName: '', tagline: '', homePageId: null, language: 'es' };

// Nombre del sitio, descripción, página de inicio e idioma (lo usa el front para títulos, SEO y "/")
export default function GeneralSettings() {
  const [saved, setSaved] = useState<ISiteGeneral>(empty);
  const [draft, setDraft] = useState<ISiteGeneral>(empty);
  const [pages, setPages] = useState<IEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ value: ISiteGeneral | null }>('/settings/general').then((res) => {
      const value = { ...empty, ...res.value };
      setSaved(value);
      setDraft(value);
    });
    api.get<IEntry[]>('/entries/pages').then(setPages).catch(() => setPages([]));
  }, []);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const home = pages.find((p) => p.id === draft.homePageId);

  function change(patch: Partial<ISiteGeneral>) {
    setDraft((d) => ({ ...d, ...patch }));
    setJustSaved(false);
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      const res = await api.put<{ value: ISiteGeneral }>('/settings/general', { value: draft });
      setSaved(res.value);
      setDraft(res.value);
      setJustSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-tertiary/20 p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="font-heading text-base font-semibold text-primary">General</h2>
          <p className="text-sm text-tertiary">Cómo se presenta tu sitio en el navegador y en los buscadores.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {dirty ? (
            <span className="text-xs text-amber-600">Sin guardar</span>
          ) : (
            justSaved && (
              <span className="flex items-center gap-1 text-xs text-secondary">
                <Check size={14} /> Guardado
              </span>
            )
          )}
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="flex items-center gap-2 bg-secondary text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-secondary/90 disabled:opacity-50"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Guardar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-primary mb-1.5">Nombre del sitio</label>
          <input
            value={draft.siteName}
            onChange={(e) => change({ siteName: e.target.value })}
            placeholder="Ej: Viajes Andinos"
            className={inputClass}
          />
          <p className="text-xs text-tertiary mt-1">Aparece en la pestaña del navegador: "Mi página | Viajes Andinos".</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-primary mb-1.5">Idioma</label>
          <select value={draft.language} onChange={(e) => change({ language: e.target.value })} className={inputClass}>
            <option value="es">Español</option>
            <option value="en">Inglés</option>
            <option value="pt">Portugués</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-primary mb-1.5">Descripción corta</label>
          <input
            value={draft.tagline}
            onChange={(e) => change({ tagline: e.target.value })}
            placeholder="Ej: Tours y paquetes a medida por todo el Perú"
            className={inputClass}
          />
          <p className="text-xs text-tertiary mt-1">Se usa en Google cuando una página no tiene su propia descripción SEO.</p>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-primary mb-1.5">Página de inicio</label>
          <select
            value={draft.homePageId ?? ''}
            onChange={(e) => change({ homePageId: e.target.value ? Number(e.target.value) : null })}
            className={inputClass}
          >
            <option value="">Ninguna (se muestra un aviso)</option>
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title || p.slug}
                {p.status !== 'published' ? ' (borrador)' : ''}
              </option>
            ))}
          </select>
          {home && home.status !== 'published' && (
            <p className="text-xs text-amber-600 mt-1">Esta página está en borrador: publícala para que se vea en la web.</p>
          )}
        </div>
      </div>
      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
    </div>
  );
}
