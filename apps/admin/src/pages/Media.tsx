import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, ExternalLink, Loader2, Search, Trash2, Upload } from 'lucide-react';
import type { IMedia, IMediaUsage } from '@raco/shared';
import { deleteMedia, formatBytes, listMedia, mediaUsage, updateMedia, useUploader } from '../lib/media';
import { aiField } from '../lib/ai';
import MediaGrid from '../components/media/MediaGrid';
import { AiAction } from '../components/AiMenu';
import { inputClass } from '../components/fields/fieldTypes';

const usageLink = (u: IMediaUsage) =>
  u.kind === 'entry'
    ? `/collections/${u.collectionId}/${u.id}`
    : u.kind === 'global-part'
      ? '/global-parts'
      : u.kind === 'template'
        ? '/templates'
        : '/settings';

const usageKind: Record<IMediaUsage['kind'], string> = {
  entry: 'Entrada',
  'global-part': 'Parte global',
  template: 'Plantilla',
  settings: 'Ajustes',
};

export default function Media() {
  const [items, setItems] = useState<IMedia[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<IMedia | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { upload, pending, errors } = useUploader((uploaded) => {
    setItems((prev) => [...uploaded, ...prev]);
    setTotal((t) => t + uploaded.length);
    setSelected(uploaded[0]);
  });

  async function load(q: string, p: number) {
    setLoading(true);
    try {
      const res = await listMedia(q, p, 60);
      setItems((prev) => (p === 1 ? res.items : [...prev, ...res.items]));
      setTotal(res.total);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => load(search, 1), 250);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => e.currentTarget === e.target && setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        upload(e.dataTransfer.files);
      }}
      className="relative"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Multimedia</h1>
          <p className="text-sm text-tertiary mt-1">
            {total} imagen{total === 1 ? '' : 'es'}. Se convierten a WebP y se reducen a 2400 px de ancho como máximo.
            Arrastra archivos aquí para subirlos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar…"
              className="w-56 rounded-md border border-tertiary/30 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
            />
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={pending > 0}
            className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary/90 disabled:opacity-60"
          >
            {pending > 0 ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {pending > 0 ? `Subiendo ${pending}…` : 'Subir imágenes'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              upload(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{errors.join(' · ')}</div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 rounded-xl border border-tertiary/20 bg-white p-5">
          {items.length === 0 && !loading ? (
            <p className="py-20 text-center text-sm text-tertiary">
              {search ? 'Ninguna imagen coincide con la búsqueda.' : 'Todavía no hay imágenes. Súbelas o arrástralas aquí.'}
            </p>
          ) : (
            <MediaGrid
              items={items}
              selected={new Set(selected ? [selected.id] : [])}
              onClick={setSelected}
              columns="grid-cols-3 sm:grid-cols-4 xl:grid-cols-5"
            />
          )}
          {page < totalPages && (
            <div className="mt-5 flex justify-center">
              <button
                onClick={() => load(search, page + 1)}
                disabled={loading}
                className="rounded-md border border-tertiary/30 px-4 py-1.5 text-sm text-primary hover:bg-background disabled:opacity-60"
              >
                {loading ? 'Cargando…' : 'Cargar más'}
              </button>
            </div>
          )}
        </div>

        {selected && (
          <Details
            key={selected.id}
            media={selected}
            onUpdated={(m) => {
              setItems((prev) => prev.map((x) => (x.id === m.id ? m : x)));
              setSelected(m);
            }}
            onDeleted={(id) => {
              setItems((prev) => prev.filter((x) => x.id !== id));
              setTotal((t) => t - 1);
              setSelected(null);
            }}
          />
        )}
      </div>

      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center border-4 border-dashed border-secondary bg-secondary/10 text-lg font-medium text-secondary">
          Suelta las imágenes para subirlas
        </div>
      )}
    </div>
  );
}

function Details({
  media,
  onUpdated,
  onDeleted,
}: {
  media: IMedia;
  onUpdated: (m: IMedia) => void;
  onDeleted: (id: number) => void;
}) {
  const [alt, setAlt] = useState(media.alt);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [usage, setUsage] = useState<IMediaUsage[] | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    mediaUsage(media.id).then(setUsage).catch(() => setUsage([]));
  }, [media.id]);

  async function saveAlt(value = alt) {
    setSaving(true);
    try {
      onUpdated(await updateMedia(media.id, { alt: value }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await deleteMedia(media.id);
      onDeleted(media.id);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <aside className="w-full shrink-0 space-y-4 rounded-xl border border-tertiary/20 bg-white p-5 lg:sticky lg:top-8 lg:w-80">
      <img src={media.url} alt={media.alt} className="w-full rounded-lg border border-tertiary/20 bg-background object-contain" />
      <div>
        <p className="break-all text-sm font-medium text-primary">{media.originalName}</p>
        <p className="mt-0.5 text-xs text-tertiary">
          {media.width && media.height ? `${media.width} × ${media.height} px · ` : ''}
          {formatBytes(media.size)} · {new Date(media.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            navigator.clipboard.writeText(media.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-tertiary/30 py-1.5 text-xs text-primary hover:bg-background"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copiada' : 'Copiar URL'}
        </button>
        <a
          href={media.url}
          target="_blank"
          rel="noopener"
          className="flex items-center justify-center gap-1.5 rounded-md border border-tertiary/30 px-3 py-1.5 text-xs text-primary hover:bg-background"
        >
          <ExternalLink size={13} /> Abrir
        </a>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-medium text-primary">Texto alternativo</label>
          <AiAction
            label="Describir"
            run={() => aiField({ action: 'alt-text', imageUrl: media.url })}
            onResult={(text) => {
              setAlt(text);
              saveAlt(text);
            }}
          />
        </div>
        <textarea
          rows={2}
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="Describe la imagen para buscadores y lectores de pantalla"
          className={inputClass}
        />
        <p className="mt-1 text-[11px] text-tertiary">Se usa por defecto al insertar la imagen en una página.</p>
        {alt !== media.alt && (
          <button
            onClick={() => saveAlt()}
            disabled={saving}
            className="mt-2 flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-white hover:bg-secondary/90 disabled:opacity-60"
          >
            {saving && <Loader2 size={12} className="animate-spin" />} Guardar
          </button>
        )}
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-primary">Dónde se usa</p>
        {!usage ? (
          <p className="text-xs text-tertiary">Buscando…</p>
        ) : usage.length === 0 ? (
          <p className="text-xs text-tertiary">En ningún sitio por ahora.</p>
        ) : (
          <ul className="space-y-1">
            {usage.map((u) => (
              <li key={`${u.kind}-${u.id}`}>
                <Link to={usageLink(u)} className="text-xs text-secondary hover:underline">
                  {usageKind[u.kind]}: {u.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="border-t border-tertiary/15 pt-3">
        {confirm ? (
          <div className="space-y-2 text-xs">
            <p className="text-primary">
              {usage?.length
                ? `Se usa en ${usage.length} lugar${usage.length === 1 ? '' : 'es'}: ahí quedará un hueco. ¿Eliminarla igualmente?`
                : '¿Eliminar esta imagen? No se puede deshacer.'}
            </p>
            <div className="flex gap-2">
              <button onClick={remove} className="rounded bg-red-500 px-3 py-1.5 font-medium text-white hover:bg-red-600">
                Eliminar
              </button>
              <button onClick={() => setConfirm(false)} className="text-tertiary hover:text-primary">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirm(true)} className="flex items-center gap-1.5 text-xs text-tertiary hover:text-red-500">
            <Trash2 size={13} /> Eliminar imagen
          </button>
        )}
      </div>
    </aside>
  );
}
