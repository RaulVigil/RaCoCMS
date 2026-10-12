import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../lib/api';

interface Collection {
  id: string;
  name: string;
  schema: Record<string, unknown>;
  createdAt: string;
}

export default function Collections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [name, setName] = useState('');
  const [id, setId] = useState('');

  async function load() {
    const data = await api.get<Collection[]>('/collections');
    setCollections(data);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setName('');
    setId('');
    setShowForm(true);
  }

  function openEdit(col: Collection) {
    setEditing(col);
    setName(col.name);
    setId(col.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      await api.put(`/collections/${editing.id}`, { name });
    } else {
      await api.post('/collections', { id, name, schema: {} });
    }
    setShowForm(false);
    load();
  }

  async function handleDelete(colId: string) {
    if (!confirm('¿Eliminar esta colección?')) return;
    await api.delete(`/collections/${colId}`);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-primary">Colecciones</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary/90 transition-colors"
        >
          <Plus size={16} />
          Nueva colección
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-tertiary/20 p-6 mb-6">
          <form onSubmit={handleSubmit} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-tertiary mb-1">ID</label>
              <input
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="ej: noticias"
                disabled={!!editing}
                className="w-full px-3 py-2 rounded-md border border-tertiary/30 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 disabled:opacity-50"
              />
            </div>
            <div className="flex-[2]">
              <label className="block text-sm text-tertiary mb-1">Nombre</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej: Noticias"
                className="w-full px-3 py-2 rounded-md border border-tertiary/30 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
              />
            </div>
            <button
              type="submit"
              className="bg-secondary text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-secondary/90 transition-colors"
            >
              {editing ? 'Guardar' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-tertiary hover:text-primary text-sm transition-colors"
            >
              Cancelar
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-tertiary/20 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-tertiary/10">
              <th className="text-left px-6 py-3 text-sm font-medium text-tertiary">ID</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-tertiary">Nombre</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-tertiary">Creado</th>
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
                  <td className="px-6 py-3 text-sm font-mono text-secondary">{col.id}</td>
                  <td className="px-6 py-3 text-sm text-primary">{col.name}</td>
                  <td className="px-6 py-3 text-sm text-tertiary">
                    {new Date(col.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(col)}
                        className="p-1.5 text-tertiary hover:text-primary transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(col.id)}
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
