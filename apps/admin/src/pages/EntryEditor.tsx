import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ExternalLink, Eye, Loader2, PencilRuler } from 'lucide-react';
import type {
  EntryStatus,
  ICollection,
  IEntry,
  IFieldDefinition,
  IFieldGroup,
  IPageBlock,
  ISeoMetadata,
  ITaxonomy,
} from '@raco/shared';
import { api } from '../lib/api';
import FieldInput from '../components/fields/FieldInput';
import { inputClass, widthClass } from '../components/fields/fieldTypes';
import { statusLabels } from './Entries';
import { depthClass, flattenTerms } from '../lib/terms';
import { slugify } from '../lib/slug';
import { previewUrl, publishPreview } from '../lib/previewChannel';
import RevisionHistory from '../components/RevisionHistory';
import MediaPicker from '../components/media/MediaPicker';
import { fromLocalInput, longDate, toLocalInput } from '../lib/dates';
import { AiAction } from '../components/AiMenu';
import { aiField, entryText } from '../lib/ai';

// El constructor visual es pesado: se carga solo al abrirlo
const PageBuilder = lazy(() => import('../components/builder/PageBuilder'));

const emptySeo: ISeoMetadata = { title: '', description: '', noIndex: false };

function isEmpty(value: unknown) {
  return value === undefined || value === null || value === '';
}

// Valores iniciales de una entrada nueva según los defaultValue de los campos
function defaultsFor(groups: IFieldGroup[]) {
  const data: Record<string, unknown> = {};
  for (const field of groups.flatMap((g) => g.fields)) {
    if (field.defaultValue !== undefined) data[field.key] = field.defaultValue;
  }
  return data;
}

export default function EntryEditor() {
  const { collectionId = 'pages', entryId = 'new' } = useParams();
  const isNew = entryId === 'new';
  const navigate = useNavigate();

  const [collection, setCollection] = useState<ICollection | null>(null);
  const [groups, setGroups] = useState<IFieldGroup[]>([]);
  const [taxonomies, setTaxonomies] = useState<ITaxonomy[]>([]);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState(''); // vacío = se genera a partir del título
  const [editingSlug, setEditingSlug] = useState(false);
  const [status, setStatus] = useState<EntryStatus>('draft');
  // Programación en hora local (lo que muestra el input); se convierte a ISO al guardar
  const [publishAt, setPublishAt] = useState('');
  const [unpublishAt, setUnpublishAt] = useState('');
  const [data, setData] = useState<Record<string, unknown>>({});
  const [terms, setTerms] = useState<Record<string, string[]>>({});
  const [seo, setSeo] = useState<ISeoMetadata>(emptySeo);
  const [ogPicker, setOgPicker] = useState(false);
  const [blocks, setBlocks] = useState<IPageBlock[]>([]);
  const [builderOpen, setBuilderOpen] = useState(false);
  // Al crear una entrada se navega a su id: no hay que recargarla (y cerraría el constructor)
  const skipReload = useRef<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (skipReload.current === entryId) {
      skipReload.current = null;
      return;
    }
    setLoading(true);
    setError('');
    setFieldErrors({});

    Promise.all([
      api.get<ICollection>(`/collections/${collectionId}`),
      api.get<IFieldGroup[]>(`/field-groups?collectionId=${collectionId}`),
      api.get<ITaxonomy[]>(`/taxonomies?collectionId=${collectionId}`),
      isNew ? Promise.resolve(null) : api.get<IEntry>(`/entries/${collectionId}/id/${entryId}`),
    ])
      .then(([col, fieldGroups, taxs, entry]) => {
        setCollection(col);
        setGroups(fieldGroups);
        setTaxonomies(taxs);

        setTitle(entry?.title ?? '');
        setSlug(entry?.slug ?? '');
        setEditingSlug(false);
        setStatus(entry?.status ?? 'draft');
        setPublishAt(toLocalInput(entry?.publishAt));
        setUnpublishAt(toLocalInput(entry?.unpublishAt));
        setData(entry ? entry.data : defaultsFor(fieldGroups));
        setTerms(entry?.terms ?? {});
        setSeo({ ...emptySeo, ...entry?.seoData });
        setBlocks(entry?.blocks ?? []);
        setBuilderOpen(false);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [collectionId, entryId]);

  function setFieldValue(key: string, value: unknown) {
    setData((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    if (fieldErrors[key]) setFieldErrors(({ [key]: _, ...rest }) => rest);
  }

  function toggleTerm(taxonomyId: string, termId: string) {
    setTerms((prev) => {
      const current = prev[taxonomyId] ?? [];
      const next = current.includes(termId)
        ? current.filter((t) => t !== termId)
        : [...current, termId];
      return { ...prev, [taxonomyId]: next };
    });
    setSaved(false);
  }

  function validate() {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.__title = 'El título es obligatorio';
    groups
      .flatMap((g) => g.fields)
      .filter((f: IFieldDefinition) => f.required && isEmpty(data[f.key]))
      .forEach((f) => (errors[f.key] = 'Este campo es obligatorio'));
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // Lo que la IA lee para escribir el SEO: campos y textos del diseño
  const seoContext = () => entryText(data, groups.flatMap((g) => g.fields), blocks);

  // Devuelve si se guardó, para que el constructor sepa si marcar sus cambios como guardados
  async function handleSave(nextBlocks: IPageBlock[] = blocks): Promise<boolean> {
    if (!validate()) {
      if (builderOpen) setBuilderOpen(false); // el error está en el formulario: hay que verlo
      return false;
    }
    setSaving(true);
    setError('');

    const payload = {
      title: title.trim(),
      slug,
      status,
      data,
      terms,
      seoData: seo,
      blocks: nextBlocks,
      publishAt: status === 'published' ? null : fromLocalInput(publishAt),
      unpublishAt: fromLocalInput(unpublishAt),
    };
    try {
      if (isNew) {
        const created = await api.post<IEntry>(`/entries/${collectionId}`, payload);
        setSlug(created.slug);
        setPublishAt(toLocalInput(created.publishAt));
        skipReload.current = String(created.id);
        navigate(`/collections/${collectionId}/${created.id}`, { replace: true });
      } else {
        const updated = await api.put<IEntry>(`/entries/${collectionId}/${entryId}`, payload);
        setSlug(updated.slug); // el backend puede haberlo normalizado o desduplicado
        setPublishAt(toLocalInput(updated.publishAt));
        setUnpublishAt(toLocalInput(updated.unpublishAt));
      }
      setBlocks(nextBlocks);
      setSaved(true);
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-tertiary">Cargando...</p>;

  const noun = collectionId === 'pages' ? 'página' : 'entrada';

  if (!collection) {
    return (
      <div className="bg-white rounded-xl border border-tertiary/20 p-8 text-center text-tertiary text-sm">
        {error || 'No se pudo cargar la entrada.'}
      </div>
    );
  }

  return (
    <div>
      <Link
        to={`/collections/${collectionId}`}
        className="inline-flex items-center gap-1.5 text-sm text-tertiary hover:text-primary mb-3"
      >
        <ArrowLeft size={15} />
        {collection.name}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-primary">
          {isNew ? `Nueva ${noun}` : `Editar ${noun}`}
        </h1>
        <div className="flex items-center gap-3">
          {!isNew && status === 'published' && slug && (
            <a
              href={`${__SITE_URL__}${collectionId === 'pages' ? '' : `/${collectionId}`}/${slug}`}
              target="_blank"
              rel="noopener"
              title="Abrir la versión publicada en la web"
              className="flex items-center gap-1.5 text-sm text-tertiary hover:text-primary"
            >
              <ExternalLink size={15} />
              Ver en la web
            </a>
          )}
          {saved && (
            <span className="flex items-center gap-1 text-sm text-secondary">
              <Check size={15} />
              Guardado
            </span>
          )}
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 bg-secondary text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-secondary/90 transition-colors disabled:opacity-60"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            {status !== 'published' && publishAt ? 'Programar' : isNew ? 'Crear' : 'Guardar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* --- Columna principal: título + field groups --- */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-tertiary/20 p-6">
            <label className="block text-sm font-medium text-primary mb-1.5">
              Título<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              autoFocus={isNew}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSaved(false);
                if (fieldErrors.__title) setFieldErrors(({ __title: _, ...rest }) => rest);
              }}
              placeholder={`Escribe el título de la ${noun}`}
              className={`w-full px-4 py-3 rounded-md border bg-white font-heading text-lg font-semibold text-primary placeholder:font-body placeholder:font-normal placeholder:text-base placeholder:text-tertiary/70 focus:outline-none focus:ring-2 focus:ring-secondary/50 ${
                fieldErrors.__title ? 'border-red-400' : 'border-tertiary/30'
              }`}
            />
            {fieldErrors.__title && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.__title}</p>
            )}

            {/* Enlace (slug): se genera solo; editarlo es opcional */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-3 text-sm">
              <span className="text-tertiary">Enlace:</span>
              {editingSlug ? (
                <>
                  <span className="font-mono text-tertiary">/{collectionId}/</span>
                  <input
                    autoFocus
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    onBlur={() => {
                      setSlug(slugify(slug));
                      setEditingSlug(false);
                      setSaved(false);
                    }}
                    className="flex-1 min-w-40 px-2 py-1 rounded border border-tertiary/30 font-mono text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50"
                  />
                </>
              ) : (
                <>
                  <span className="font-mono text-primary break-all">
                    /{collectionId}/
                    {slug || slugify(title) || <span className="text-tertiary">…</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSlug(slug || slugify(title));
                      setEditingSlug(true);
                    }}
                    className="text-secondary hover:underline"
                  >
                    Editar
                  </button>
                </>
              )}
            </div>
          </div>

          {collection.useBuilder && (
            <div className="bg-white rounded-xl border border-tertiary/20 p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                <PencilRuler size={22} />
              </span>
              <div className="flex-1">
                <h2 className="font-heading text-base font-semibold text-primary">
                  Diseño de la {noun}
                </h2>
                <p className="text-sm text-tertiary">
                  {blocks.length === 0
                    ? 'Todavía está vacía. Ármala con secciones, columnas y módulos.'
                    : `${blocks.length} ${blocks.length === 1 ? 'sección' : 'secciones'}. Ábrelo para seguir editando.`}
                </p>
              </div>
              <div className="flex gap-2">
                {blocks.length > 0 && (
                  <button
                    type="button"
                    title="Ver la página como la verá el visitante"
                    onClick={() => {
                      publishPreview(`${collectionId}:${entryId}`, title, blocks);
                      window.open(previewUrl(collectionId, entryId), 'raco-preview');
                    }}
                    className="flex items-center gap-1.5 border border-tertiary/30 text-primary px-4 py-2.5 rounded-md text-sm font-medium hover:bg-background transition-colors"
                  >
                    <Eye size={15} />
                    Vista previa
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setBuilderOpen(true)}
                  className="bg-primary text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Abrir constructor visual
                </button>
              </div>
            </div>
          )}

          {groups.length === 0
            ? !collection.useBuilder && (
                <div className="bg-white rounded-xl border border-dashed border-tertiary/30 p-6 text-center text-sm text-tertiary">
                  Esta colección no tiene grupos de campos.{' '}
                  <Link to="/field-groups" className="text-secondary hover:underline">
                    Crear uno
                  </Link>
                </div>
              )
            : groups.map((group) => (
                <div key={group.id} className="bg-white rounded-xl border border-tertiary/20 p-6">
                  <h2 className="font-heading text-base font-semibold text-primary mb-4">
                    {group.name}
                  </h2>
                  <div className="grid grid-cols-12 gap-x-4 gap-y-5">
                    {group.fields.map((field) => (
                      <div key={field.key} className={widthClass[field.width ?? 100]}>
                        <FieldInput
                          field={field}
                          value={data[field.key]}
                          error={fieldErrors[field.key]}
                          onChange={(v) => setFieldValue(field.key, v)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
        </div>

        {/* --- Columna lateral: estado, taxonomías, SEO --- */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-tertiary/20 p-5">
            <h2 className="font-heading text-sm font-semibold text-primary mb-3">Estado</h2>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as EntryStatus);
                setSaved(false);
              }}
              className={inputClass}
            >
              {(Object.keys(statusLabels) as EntryStatus[]).map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s]}
                </option>
              ))}
            </select>

            {/* Programación: publicar y/o despublicar solo a una fecha y hora */}
            <div className="mt-4 space-y-3 border-t border-tertiary/15 pt-4">
              {status !== 'published' && (
                <ScheduleField
                  label="Publicar automáticamente"
                  value={publishAt}
                  onChange={(v) => {
                    setPublishAt(v);
                    setSaved(false);
                  }}
                  verb="Se publicará"
                />
              )}
              <ScheduleField
                label="Despublicar automáticamente"
                value={unpublishAt}
                onChange={(v) => {
                  setUnpublishAt(v);
                  setSaved(false);
                }}
                verb="Dejará de verse"
              />
            </div>
          </div>

          {!isNew && (
            <RevisionHistory
              collectionId={collectionId}
              entryId={entryId}
              current={{ title, slug, status, data, terms, seoData: seo, blocks }}
              fieldLabels={Object.fromEntries(groups.flatMap((g) => g.fields).map((f) => [f.key, f.label]))}
              onRestored={(entry) => {
                // El editor pasa a mostrar la versión restaurada (ya guardada)
                setTitle(entry.title);
                setSlug(entry.slug);
                setStatus(entry.status);
                setData(entry.data ?? {});
                setTerms(entry.terms ?? {});
                setSeo({ ...emptySeo, ...entry.seoData });
                setBlocks(entry.blocks ?? []);
                setSaved(true);
              }}
            />
          )}

          {taxonomies.map((tax) => (
            <div key={tax.id} className="bg-white rounded-xl border border-tertiary/20 p-5">
              <h2 className="font-heading text-sm font-semibold text-primary mb-3">{tax.name}</h2>
              {tax.terms.length === 0 ? (
                <p className="text-sm text-tertiary">
                  Sin opciones todavía.{' '}
                  <Link to={`/taxonomies/${tax.id}`} className="text-secondary hover:underline">
                    Añadir
                  </Link>
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {flattenTerms(tax.terms).map((term) => (
                    <label
                      key={term.id}
                      className={`flex items-center gap-2 text-sm text-primary cursor-pointer ${depthClass[term.depth]}`}
                    >
                      <input
                        type="checkbox"
                        checked={(terms[tax.id] ?? []).includes(term.id)}
                        onChange={() => toggleTerm(tax.id, term.id)}
                        className="accent-secondary"
                      />
                      {term.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="bg-white rounded-xl border border-tertiary/20 p-5 space-y-3">
            <h2 className="font-heading text-sm font-semibold text-primary">SEO</h2>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs text-tertiary">Meta título</label>
                <AiAction
                  label="Generar"
                  disabled={!title.trim()}
                  disabledHint="Escribe el título primero"
                  run={() => aiField({ action: 'seo-title', title, context: seoContext() })}
                  onResult={(text) => {
                    setSeo((s) => ({ ...s, title: text }));
                    setSaved(false);
                  }}
                />
              </div>
              <input
                value={seo.title}
                onChange={(e) => {
                  setSeo({ ...seo, title: e.target.value });
                  setSaved(false);
                }}
                placeholder={title}
                className={inputClass}
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs text-tertiary">Meta descripción</label>
                <AiAction
                  label="Generar"
                  disabled={!title.trim()}
                  disabledHint="Escribe el título primero"
                  run={() => aiField({ action: 'seo-description', title, context: seoContext() })}
                  onResult={(text) => {
                    setSeo((s) => ({ ...s, description: text }));
                    setSaved(false);
                  }}
                />
              </div>
              <textarea
                rows={3}
                value={seo.description}
                onChange={(e) => {
                  setSeo({ ...seo, description: e.target.value });
                  setSaved(false);
                }}
                className={inputClass}
              />
              <p className="text-xs text-tertiary mt-1 text-right">{seo.description.length}/160</p>
            </div>
            <div>
              <label className="block text-xs text-tertiary mb-1">Imagen al compartir en redes (Open Graph)</label>
              {seo.openGraphImage && (
                <img src={seo.openGraphImage} alt="" className="mb-2 aspect-[1.91/1] w-full rounded-md border border-tertiary/20 object-cover" />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOgPicker(true)}
                  className="flex-1 rounded-md border border-tertiary/30 py-1.5 text-xs text-primary hover:bg-background"
                >
                  {seo.openGraphImage ? 'Cambiar' : 'Elegir de la biblioteca'}
                </button>
                {seo.openGraphImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setSeo({ ...seo, openGraphImage: undefined });
                      setSaved(false);
                    }}
                    className="px-2 text-xs text-red-500 hover:underline"
                  >
                    Quitar
                  </button>
                )}
              </div>
              <p className="mt-1 text-[11px] text-tertiary">Ideal 1200 × 630 px. Es la que aparece al compartir el enlace.</p>
              {ogPicker && (
                <MediaPicker
                  onClose={() => setOgPicker(false)}
                  onSelect={([media]) => {
                    setOgPicker(false);
                    if (media) {
                      setSeo((s) => ({ ...s, openGraphImage: media.url }));
                      setSaved(false);
                    }
                  }}
                />
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-primary cursor-pointer">
              <input
                type="checkbox"
                checked={seo.noIndex}
                onChange={(e) => {
                  setSeo({ ...seo, noIndex: e.target.checked });
                  setSaved(false);
                }}
                className="accent-secondary"
              />
              No indexar (noindex)
            </label>
          </div>
        </div>
      </div>

      {builderOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100 text-sm text-tertiary">
              Cargando constructor...
            </div>
          }
        >
          <PageBuilder
            title={title}
            preview={{ key: `${collectionId}:${entryId}`, url: previewUrl(collectionId, entryId) }}
            initialBlocks={blocks}
            onSave={(next) => handleSave(next)}
            onClose={(next) => {
              if (next !== blocks) {
                setBlocks(next);
                setSaved(false);
              }
              setBuilderOpen(false);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}

function ScheduleField({
  label,
  value,
  onChange,
  verb,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  verb: string;
}) {
  const iso = fromLocalInput(value);
  const past = !!iso && Date.parse(iso) <= Date.now();
  return (
    <div>
      <label className="block text-xs text-tertiary mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} py-1.5`}
        />
        {value && (
          <button type="button" onClick={() => onChange('')} title="Quitar" className="text-xs text-tertiary hover:text-red-500">
            Quitar
          </button>
        )}
      </div>
      {iso && (
        <p className={`mt-1 text-xs ${past ? 'text-amber-600' : 'text-secondary'}`}>
          {past ? 'Esa hora ya pasó: se aplicará en cuanto guardes.' : `${verb} el ${longDate(iso)}.`}
        </p>
      )}
    </div>
  );
}
