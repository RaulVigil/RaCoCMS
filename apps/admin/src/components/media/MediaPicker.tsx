import { useEffect, useRef, useState } from 'react';
import { Loader2, Search, Upload, X } from 'lucide-react';
import type { IMedia } from '@raco/shared';
import { listMedia, useUploader } from '../../lib/media';
import MediaGrid from './MediaGrid';

interface Props {
  multiple?: boolean;
  onClose: () => void;
  onSelect: (items: IMedia[]) => void;
}

// Ventana para elegir imágenes ya subidas (o subir nuevas) desde cualquier parte del panel
export default function MediaPicker({ multiple, onClose, onSelect }: Props) {
  const [items, setItems] = useState<IMedia[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<IMedia[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lo recién subido aparece primero y ya seleccionado
  const { upload, pending, errors } = useUploader((uploaded) => {
    setItems((prev) => [...uploaded, ...prev]);
    setSelected((prev) => (multiple ? [...uploaded, ...prev] : uploaded.slice(0, 1)));
  });

  async function load(q: string, p: number) {
    setLoading(true);
    try {
      const res = await listMedia(q, p, 48);
      setItems((prev) => (p === 1 ? res.items : [...prev, ...res.items]));
      setPage(res.page);
      setTotalPages(res.totalPages);
    } finally {
      setLoading(false);
    }
  }

  // Busca mientras se escribe, con una pequeña espera
  useEffect(() => {
    const t = setTimeout(() => load(search, 1), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function toggle(item: IMedia) {
    if (!multiple) return setSelected([item]);
    setSelected((prev) => (prev.some((m) => m.id === item.id) ? prev.filter((m) => m.id !== item.id) : [...prev, item]));
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div
        className="relative flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
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
      >
        <div className="flex flex-wrap items-center gap-3 border-b border-tertiary/15 px-5 py-4">
          <h2 className="font-heading text-base font-semibold text-primary">Biblioteca multimedia</h2>
          <div className="relative ml-auto w-full max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o descripción"
              className="w-full rounded-md border border-tertiary/30 py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
            />
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending > 0}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {pending > 0 ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {pending > 0 ? `Subiendo ${pending}…` : 'Subir'}
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
          <button type="button" onClick={onClose} className="rounded p-1.5 text-tertiary hover:bg-background hover:text-primary">
            <X size={18} />
          </button>
        </div>

        {errors.length > 0 && (
          <div className="border-b border-red-200 bg-red-50 px-5 py-2 text-xs text-red-600">{errors.join(' · ')}</div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 && !loading ? (
            <p className="py-16 text-center text-sm text-tertiary">
              {search ? 'Ninguna imagen coincide con la búsqueda.' : 'Todavía no hay imágenes. Súbelas o arrástralas aquí.'}
            </p>
          ) : (
            <MediaGrid items={items} selected={new Set(selected.map((m) => m.id))} onClick={toggle} />
          )}
          {page < totalPages && (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => load(search, page + 1)}
                disabled={loading}
                className="rounded-md border border-tertiary/30 px-4 py-1.5 text-sm text-primary hover:bg-background disabled:opacity-60"
              >
                {loading ? 'Cargando…' : 'Cargar más'}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-tertiary/15 bg-background/50 px-5 py-3">
          <span className="text-sm text-tertiary">
            {selected.length
              ? multiple
                ? `${selected.length} seleccionada${selected.length === 1 ? '' : 's'}`
                : selected[0].originalName
              : 'Elige una imagen o arrastra archivos para subirlos'}
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-tertiary hover:text-primary">
              Cancelar
            </button>
            <button
              type="button"
              disabled={!selected.length}
              onClick={() => onSelect(selected)}
              className="rounded-md bg-secondary px-4 py-1.5 text-sm font-medium text-white hover:bg-secondary/90 disabled:opacity-40"
            >
              Insertar
            </button>
          </div>
        </div>

        {dragging && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center border-4 border-dashed border-secondary bg-secondary/10 text-lg font-medium text-secondary">
            Suelta las imágenes para subirlas
          </div>
        )}
      </div>
    </div>
  );
}
