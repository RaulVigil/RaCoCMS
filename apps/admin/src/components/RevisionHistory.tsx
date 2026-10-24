import { useEffect, useState } from 'react';
import { ChevronDown, Eye, History, Loader2, RotateCcw, X } from 'lucide-react';
import type { IEntry, IEntryRevision, IEntrySnapshot, IPageBlock } from '@raco/shared';
import { api } from '../lib/api';
import { previewUrl } from '../lib/previewChannel';

interface Props {
  collectionId: string;
  entryId: string;
  current: IEntrySnapshot; // lo que hay ahora en el editor, para comparar
  fieldLabels: Record<string, string>;
  onRestored: (entry: IEntry) => void;
}

const statusLabel: Record<string, string> = { draft: 'Borrador', published: 'Publicado', archived: 'Archivado' };

const noteStyle = (note: string) =>
  note.startsWith('Publicada')
    ? 'bg-emerald-100 text-emerald-700'
    : note.startsWith('Despublicada')
      ? 'bg-amber-100 text-amber-700'
      : note.startsWith('Restaurada')
        ? 'bg-violet-100 text-violet-700'
        : 'bg-background text-primary';

// Las columnas JSON vuelven con las claves en otro orden: se comparan ordenadas
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj)
      .filter((k) => obj[k] !== undefined && obj[k] !== null && obj[k] !== '')
      .sort()
      .map((k) => `${k}:${stable(obj[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

function countBlocks(blocks: IPageBlock[] | null | undefined) {
  let sections = 0;
  let modules = 0;
  const walk = (list: IPageBlock[]) =>
    list.forEach((b) => {
      if (b.type === 'section') sections++;
      else if (!['row', 'column'].includes(b.type)) modules++;
      if (b.children) walk(b.children);
    });
  walk(blocks ?? []);
  return { sections, modules };
}

// Qué tendría de distinto la entrada si se restaura esta versión
export function differences(rev: IEntrySnapshot, now: IEntrySnapshot, labels: Record<string, string>) {
  const out: { label: string; from?: string; to?: string }[] = [];
  const short = (v: unknown) => {
    const s = String(v ?? '') || '(vacío)';
    return s.length > 60 ? `${s.slice(0, 57)}…` : s;
  };

  if (rev.title !== now.title) out.push({ label: 'Título', from: short(now.title), to: short(rev.title) });
  if (rev.slug !== now.slug) out.push({ label: 'Enlace', from: `/${now.slug}`, to: `/${rev.slug}` });
  if (rev.status !== now.status) out.push({ label: 'Estado', from: statusLabel[now.status], to: statusLabel[rev.status] });

  const seoA = rev.seoData ?? ({} as IEntrySnapshot['seoData']);
  const seoB = now.seoData ?? ({} as IEntrySnapshot['seoData']);
  if ((seoA.title ?? '') !== (seoB.title ?? '')) out.push({ label: 'Meta título', from: short(seoB.title), to: short(seoA.title) });
  if ((seoA.description ?? '') !== (seoB.description ?? '')) out.push({ label: 'Meta descripción' });
  if (!!seoA.noIndex !== !!seoB.noIndex) out.push({ label: 'No indexar', from: seoB.noIndex ? 'Sí' : 'No', to: seoA.noIndex ? 'Sí' : 'No' });

  const keys = new Set([...Object.keys(rev.data ?? {}), ...Object.keys(now.data ?? {})]);
  for (const k of keys) {
    if (stable(rev.data?.[k]) !== stable(now.data?.[k])) out.push({ label: `Campo "${labels[k] ?? k}"` });
  }
  if (stable(rev.terms ?? {}) !== stable(now.terms ?? {})) out.push({ label: 'Categorías y etiquetas' });

  if (stable(rev.blocks ?? []) !== stable(now.blocks ?? [])) {
    const a = countBlocks(rev.blocks);
    const b = countBlocks(now.blocks);
    const sum = (c: typeof a) => `${c.sections} secc. · ${c.modules} módulos`;
    out.push(a.sections === b.sections && a.modules === b.modules ? { label: 'Diseño (contenido o estilos)' } : { label: 'Diseño', from: sum(b), to: sum(a) });
  }
  return out;
}

function relative(date: string) {
  const diff = (Date.parse(date) - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [30, 'day'],
    [12, 'month'],
  ];
  let value = diff;
  for (const [size, unit] of steps) {
    if (Math.abs(value) < size) return rtf.format(Math.round(value), unit);
    value /= size;
  }
  return rtf.format(Math.round(value), 'year');
}

// Tarjeta del lateral + panel con todas las versiones guardadas de la entrada
export default function RevisionHistory({ collectionId, entryId, current, fieldLabels, onRestored }: Props) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<IEntryRevision[] | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, IEntrySnapshot>>({});
  const [confirm, setConfirm] = useState<number | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      setList(await api.get<IEntryRevision[]>(`/entries/${collectionId}/${entryId}/revisions`));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entryId]);

  async function expand(rev: IEntryRevision) {
    setConfirm(null);
    if (expanded === rev.id) return setExpanded(null);
    setExpanded(rev.id);
    if (!details[rev.id]) {
      const full = await api.get<IEntryRevision>(`/entries/${collectionId}/${entryId}/revisions/${rev.id}`);
      if (full.snapshot) setDetails((d) => ({ ...d, [rev.id]: full.snapshot! }));
    }
  }

  async function restore(id: number) {
    setRestoring(true);
    setError('');
    try {
      const entry = await api.post<IEntry>(`/entries/${collectionId}/${entryId}/revisions/${id}/restore`);
      onRestored(entry);
      setConfirm(null);
      setExpanded(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRestoring(false);
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-tertiary/20 p-5">
        <h2 className="font-heading text-sm font-semibold text-primary mb-1">Historial</h2>
        <p className="text-xs text-tertiary mb-3">Cada guardado queda como una versión que puedes ver o restaurar.</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-tertiary/30 py-2 text-sm text-primary hover:bg-background"
        >
          <History size={15} /> Ver versiones
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/30" onClick={() => setOpen(false)}>
          <aside className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-tertiary/15 px-5 py-4">
              <div>
                <h2 className="font-heading text-base font-semibold text-primary">Historial de versiones</h2>
                <p className="text-xs text-tertiary">Se guardan las últimas 50. Restaurar también crea una versión, así que se puede deshacer.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded p-1.5 text-tertiary hover:bg-background hover:text-primary">
                <X size={18} />
              </button>
            </div>

            {error && <p className="mx-5 mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <div className="flex-1 overflow-y-auto">
              {!list ? (
                <p className="flex items-center justify-center gap-2 py-10 text-sm text-tertiary">
                  <Loader2 size={16} className="animate-spin" /> Cargando…
                </p>
              ) : (
                list.map((rev, i) => {
                  const snap = details[rev.id];
                  const diff = snap ? differences(snap, current, fieldLabels) : null;
                  return (
                    <div key={rev.id} className="border-b border-tertiary/10">
                      <button
                        type="button"
                        onClick={() => expand(rev)}
                        className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-background/60"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 text-sm text-primary">
                            <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${noteStyle(rev.note)}`}>{rev.note}</span>
                            {i === 0 && <span className="text-xs text-secondary">Actual</span>}
                          </p>
                          <p className="mt-0.5 text-xs text-tertiary" title={new Date(rev.createdAt).toLocaleString()}>
                            {relative(rev.createdAt)}
                            {rev.authorEmail && ` · ${rev.authorEmail}`}
                          </p>
                        </div>
                        <ChevronDown size={15} className={`text-tertiary transition-transform ${expanded === rev.id ? 'rotate-180' : ''}`} />
                      </button>

                      {expanded === rev.id && (
                        <div className="space-y-3 bg-background/50 px-5 py-4">
                          {!diff ? (
                            <p className="text-xs text-tertiary">Cargando…</p>
                          ) : diff.length === 0 ? (
                            <p className="text-sm text-primary">Igual a lo que tienes ahora en el editor.</p>
                          ) : (
                            <div>
                              <p className="mb-1.5 text-xs font-medium text-primary">Si la restauras, cambia:</p>
                              <ul className="space-y-1 text-sm">
                                {diff.map((d, j) => (
                                  <li key={j} className="text-primary">
                                    • {d.label}
                                    {d.from !== undefined && (
                                      <span className="text-tertiary">
                                        : <s>{d.from}</s> → <span className="text-primary">{d.to}</span>
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2">
                            {!!snap?.blocks?.length && (
                              <a
                                href={`${previewUrl(collectionId, entryId)}?rev=${rev.id}`}
                                target="raco-preview"
                                className="flex items-center gap-1.5 rounded-md border border-tertiary/30 bg-white px-3 py-1.5 text-xs text-primary hover:bg-background"
                              >
                                <Eye size={13} /> Vista previa
                              </a>
                            )}
                            {i > 0 &&
                              diff &&
                              diff.length > 0 &&
                              (confirm === rev.id ? (
                                <span className="flex flex-wrap items-center gap-2 text-xs">
                                  <span className="text-primary">Lo que no hayas guardado en el editor se perderá.</span>
                                  <button
                                    type="button"
                                    onClick={() => restore(rev.id)}
                                    disabled={restoring}
                                    className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 font-medium text-white hover:bg-primary/90 disabled:opacity-60"
                                  >
                                    {restoring && <Loader2 size={12} className="animate-spin" />}
                                    Restaurar
                                  </button>
                                  <button type="button" onClick={() => setConfirm(null)} className="text-tertiary hover:text-primary">
                                    Cancelar
                                  </button>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirm(rev.id)}
                                  className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90"
                                >
                                  <RotateCcw size={13} /> Restaurar esta versión
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
