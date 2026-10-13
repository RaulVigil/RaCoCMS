import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Lock } from 'lucide-react';
import type { ICollection } from '@raco/shared';
import { api } from '../lib/api';
import { notifyStructureChanged } from '../lib/events';
import { slugify } from '../lib/slug';
import { inputClass } from '../components/fields/fieldTypes';

export default function Collections() {
  const [collections, setCollections] = useState<ICollection[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ICollection | null>(null);
  const [name, setName] = useState('');
  const [useBuilder, setUseBuilder] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setCollections(await api.get<ICollection[]>('/collections'));
  }

  useEffect(() => {
    load();
  }, []);

  function openForm(col: ICollection | null) {
    setEditing(col);
    setName(col?.name ?? '');
    setUseBuilder(col?.useBuilder ?? false);
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError('Escribe un nombre');

    setSaving(true);
    setError('');
    try {
      if (editing) {
        await api.put(`/collections/${editing.id}`, { name: name.trim(), useBuilder });
      } else {
        await api.post('/collections', { name: name.trim(), useBuilder });
      }
      setShowForm(false);
      load();
      notifyStructureChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(col: ICollection) {
    if (!confirm(`¿Eliminar "${col.name}"? Se borrarán también todas sus entradas.`)) return;
    try {
      await api.delete(`/collections/${col.id}`);
      load();
      notifyStructureChanged();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Colecciones</h1>
          <p className="text-sm text-tertiary mt-1">
            Cada colección es un tipo de contenido de tu sitio. Ej: Noticias, Viajes, Productos.
          </p>
        </div>
        <button
          onClick={() => openForm(null)}
          className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary/90 transition-colors shrink-0"
        >
          <Plus size={16} />
          Nueva colección
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-tertiary/20 p-6 mb-6">
          <h2 className="font-heading text-base font-semibold text-primary mb-4">
            {editing ? `Editar "${editing.name}"` : 'Nueva colección'}
          </h2>
          <div className="flex flex-col md:flex-row gap-4 md:items-start">
            <div className="flex-1">
              <label className="block text-sm font-medium text-primary">Nombre</label>
              <p className="text-xs text-tertiary mb-1.5">En plural, como aparecerá en el menú</p>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Viajes"
                className={inputClass}
              />
              <p className="text-xs text-tertiary mt-1.5">
                Enlace en la web:{' '}
                <span className="font-mono text-primary">/{editing ? editing.id : slugify(name) || '…'}</span>
                {editing && <span> (no cambia al renombrar)</span>}
              </p>
            </div>
            <div className="flex items-center gap-3 md:mt-11">
              <button
                type="submit"
                disabled={saving}
                className="bg-secondary text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-secondary/90 transition-colors disabled:opacity-60"
              >
                {editing ? 'Guardar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-tertiary hover:text-primary"
              >
                Cancelar
              </button>
            </div>
          </div>
          {!editing?.isNative && (
            <label className="mt-4 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useBuilder}
                onChange={(e) => setUseBuilder(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-secondary"
              />
              <span>
                <span className="block text-sm font-medium text-primary">Diseñar sus entradas con el constructor visual</span>
                <span className="block text-xs text-tertiary">
                  Cada entrada podrá armarse con secciones, columnas y módulos, como una página.
                </span>
              </span>
            </label>
          )}
          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        </form>
      )}

      <div className="bg-white rounded-xl border border-tertiary/20 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-tertiary/10">
              <th className="text-left px-6 py-3 text-sm font-medium text-tertiary">Nombre</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-tertiary">Enlace</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-tertiary">Creada</th>
              <th className="w-24 px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {collections.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-tertiary text-sm">
                  No hay colecciones todavía
                </td>
              </tr>
            ) : (
              collections.map((col) => (
                <tr key={col.id} className="border-b border-tertiary/5 hover:bg-background/50">
                  <td className="px-6 py-3 text-sm">
                    <Link to={`/collections/${col.id}`} className="font-medium text-primary hover:text-secondary">
                      {col.name}
                    </Link>
                    {col.isNative && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-xs text-primary">Del sistema</span>
                    )}
                    {col.useBuilder && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-secondary/15 text-xs text-secondary">
                        Constructor visual
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm font-mono text-tertiary">/{col.id}</td>
                  <td className="px-6 py-3 text-sm text-tertiary">
                    {col.createdAt && new Date(col.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => openForm(col)}
                        title="Renombrar"
                        className="p-1.5 text-tertiary hover:text-primary transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      {col.isNative ? (
                        <span title="Las colecciones del sistema no se pueden eliminar" className="p-1.5 text-tertiary/50">
                          <Lock size={15} />
                        </span>
                      ) : (
                        <button
                          onClick={() => handleDelete(col)}
                          title="Eliminar"
                          className="p-1.5 text-tertiary hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
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
