import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { EntryStatus, ICollection, IEntry } from '@raco/shared';
import { api } from '../lib/api';
import { shortDate } from '../lib/dates';

export const statusLabels: Record<EntryStatus, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  archived: 'Archivado',
};

export const statusStyles: Record<EntryStatus, string> = {
  draft: 'bg-tertiary/15 text-tertiary',
  published: 'bg-secondary/15 text-secondary',
  archived: 'bg-primary/10 text-primary',
};

type Filter = 'all' | EntryStatus;

export default function Entries() {
  // /pages no trae parámetro: usa la colección nativa "pages" (3.9)
  const { collectionId = 'pages' } = useParams();
  const [collection, setCollection] = useState<ICollection | null>(null);
  const [entries, setEntries] = useState<IEntry[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  async function loadEntries() {
    setEntries(await api.get<IEntry[]>(`/entries/${collectionId}`));
  }

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setFilter('all');

    Promise.all([api.get<ICollection>(`/collections/${collectionId}`), loadEntries()])
      .then(([col]) => setCollection(col))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [collectionId]);

  async function handleDelete(entry: IEntry) {
    if (!confirm(`¿Eliminar "${entry.title || entry.slug}"?`)) return;
    await api.delete(`/entries/${collectionId}/${entry.id}`);
    loadEntries();
  }

  if (loading) return <p className="text-sm text-tertiary">Cargando...</p>;

  const noun = collectionId === 'pages' ? 'página' : 'entrada';

  if (notFound || !collection) {
    return (
      <div className="bg-white rounded-xl border border-tertiary/20 p-8 text-center text-tertiary text-sm">
        La colección <span className="font-mono text-primary">{collectionId}</span> no existe.
      </div>
    );
  }

  const counts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});
  const visible = filter === 'all' ? entries : entries.filter((e) => e.status === filter);
  const tabs: { value: Filter; label: string; count: number }[] = [
    { value: 'all', label: 'Todas', count: entries.length },
    ...(Object.keys(statusLabels) as EntryStatus[]).map((s) => ({
      value: s,
      label: statusLabels[s],
      count: counts[s] ?? 0,
    })),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-primary">{collection.name}</h1>
        <Link
          to={`/collections/${collectionId}/new`}
          className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary/90 transition-colors"
        >
          <Plus size={16} />
          Nueva {noun}
        </Link>
      </div>

      <div className="flex gap-1 mb-4">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              filter === t.value ? 'bg-primary text-white' : 'text-tertiary hover:text-primary hover:bg-white'
            }`}
          >
            {t.label} <span className="opacity-60">({t.count})</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-tertiary/20 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-tertiary/10">
              <th className="text-left px-6 py-3 text-sm font-medium text-tertiary">Título</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-tertiary">Slug</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-tertiary">Estado</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-tertiary">Actualizado</th>
              <th className="w-24 px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-tertiary text-sm">
                  No hay {noun}s {filter !== 'all' && `en estado "${statusLabels[filter]}"`}
                </td>
              </tr>
            ) : (
              visible.map((entry) => (
                <tr key={entry.id} className="border-b border-tertiary/5 hover:bg-background/50">
                  <td className="px-6 py-3 text-sm">
                    <Link
                      to={`/collections/${collectionId}/${entry.id}`}
                      className="font-medium text-primary hover:text-secondary"
                    >
                      {entry.title || '(sin título)'}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-sm font-mono text-tertiary">{entry.slug}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[entry.status]}`}>
                      {statusLabels[entry.status]}
                    </span>
                    {entry.status !== 'published' && entry.publishAt && (
                      <span className="ml-1.5 px-2 py-0.5 rounded-full bg-violet-100 text-xs font-medium text-violet-700">
                        Programada · {shortDate(entry.publishAt)}
                      </span>
                    )}
                    {entry.status === 'published' && entry.unpublishAt && (
                      <span className="ml-1.5 text-xs text-tertiary">hasta {shortDate(entry.unpublishAt)}</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm text-tertiary">
                    {entry.updatedAt && new Date(entry.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-1">
                      <Link
                        to={`/collections/${collectionId}/${entry.id}`}
                        className="p-1.5 text-tertiary hover:text-primary transition-colors"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        onClick={() => handleDelete(entry)}
                        className="p-1.5 text-tertiary hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
