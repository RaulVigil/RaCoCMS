import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { api } from '../lib/api';

interface Term {
  id: string;
  name: string;
  slug: string;
}

interface Taxonomy {
  id: string;
  name: string;
  collectionId: string;
  hierarchical: boolean;
  terms: Term[];
}

export default function Taxonomies() {
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
  const [editing, setEditing] = useState<Taxonomy | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [terms, setTerms] = useState<Term[]>([]);

  useEffect(() => {
    api.get<Taxonomy[]>('/taxonomies').then(setTaxonomies);
    api.get<{ id: string; name: string }[]>('/collections').then(setCollections);
  }, []);

  function openCreate() {
    setEditing(null);
    setName('');
    setId('');
    setCollectionId('');
    setTerms([]);
    setShowForm(true);
  }

  function openEdit(tax: Taxonomy) {
    setEditing(tax);
    setName(tax.name);
    setId(tax.id);
    setCollectionId(tax.collectionId);
    setTerms([...tax.terms]);
    setShowForm(true);
  }

  function addTerm() {
    const t: Term = { id: Date.now().toString(), name: '', slug: '' };
    setTerms([...terms, t]);
  }

  function updateTerm(index: number, data: Partial<Term>) {
    const updated = [...terms];
    updated[index] = { ...updated[index], ...data };
    if (!updated[index].slug && data.name) {
      updated[index].slug = (data.name as string).toLowerCase().replace(/\s+/g, '-');
    }
    setTerms(updated);
  }

  function removeTerm(index: number) {
    setTerms(terms.filter((_, i) => i !== index));
  }

  async function handleSave() {
    const payload = { id, name, collectionId, hierarchical: false, terms };
    if (editing) {
      await api.put(`/taxonomies/${editing.id}`, payload);
    } else {
      await api.post('/taxonomies', payload);
    }
    const updated = await api.get<Taxonomy[]>('/taxonomies');
    setTaxonomies(updated);
    setShowForm(false);
  }

  async function handleDelete(taxId: string) {
    if (!confirm('¿Eliminar esta taxonomía?')) return;
    await api.delete(`/taxonomies/${taxId}`);
    setTaxonomies(taxonomies.filter((t) => t.id !== taxId));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-primary">Taxonomías</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary/90"
        >
          <Plus size={16} />
          Nueva taxonomía
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-tertiary/20 p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-tertiary mb-1">ID</label>
              <input
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="ej: estados"
                disabled={!!editing}
                className="w-full px-3 py-2 rounded-md border border-tertiary/30 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm text-tertiary mb-1">Nombre</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej: Estados"
                className="w-full px-3 py-2 rounded-md border border-tertiary/30 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-tertiary mb-1">Colección</label>
              <select
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-tertiary/30 text-sm"
              >
                <option value="">Seleccionar...</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {terms.map((term, i) => (
              <div key={term.id} className="flex items-center gap-2 bg-background p-2 rounded-lg">
                <input
                  value={term.name}
                  onChange={(e) => updateTerm(i, { name: e.target.value })}
                  placeholder="Nombre del término"
                  className="flex-1 px-2 py-1.5 rounded border border-tertiary/20 text-sm"
                />
                <input
                  value={term.slug}
                  onChange={(e) => updateTerm(i, { slug: e.target.value })}
                  placeholder="slug"
                  className="w-36 px-2 py-1.5 rounded border border-tertiary/20 text-sm font-mono"
                />
                <button onClick={() => removeTerm(i)} className="p-1 text-tertiary hover:text-red-500">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={addTerm} className="flex items-center gap-2 text-sm text-secondary">
              <Plus size={14} />
              Añadir término
            </button>
            <button onClick={handleSave} className="bg-secondary text-white px-4 py-1.5 rounded-md text-sm">
              Guardar
            </button>
            <button onClick={() => setShowForm(false)} className="text-tertiary text-sm">Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-tertiary/20 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-tertiary/10">
              <th className="text-left px-6 py-3 text-sm font-medium text-tertiary">Taxonomía</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-tertiary">Colección</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-tertiary">Términos</th>
              <th className="w-24 px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {taxonomies.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-tertiary text-sm">
                  No hay taxonomías todavía
                </td>
              </tr>
            ) : (
              taxonomies.map((tax) => (
                <tr key={tax.id} className="border-b border-tertiary/5 hover:bg-background/50">
                  <td className="px-6 py-3 text-sm font-medium text-primary">{tax.name}</td>
                  <td className="px-6 py-3 text-sm text-tertiary">{tax.collectionId}</td>
                  <td className="px-6 py-3 text-sm text-tertiary">
                    {tax.terms.map((t) => t.name).join(', ') || '—'}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(tax)} className="p-1.5 text-tertiary hover:text-primary">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(tax.id)} className="p-1.5 text-tertiary hover:text-red-500">
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
