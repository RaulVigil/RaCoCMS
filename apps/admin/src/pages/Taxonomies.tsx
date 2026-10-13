import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, FolderTree, Tags, ListTree } from 'lucide-react';
import type { ICollection, ITaxonomy } from '@raco/shared';
import { api } from '../lib/api';
import { notifyStructureChanged } from '../lib/events';
import { inputClass } from '../components/fields/fieldTypes';

const kinds = [
  {
    hierarchical: true,
    label: 'Categorías',
    description: 'Pueden tener subcategorías. Ej: Destinos › Europa › España',
    icon: FolderTree,
  },
  {
    hierarchical: false,
    label: 'Etiquetas',
    description: 'Una lista simple, sin niveles. Ej: Oferta, Familiar, Aventura',
    icon: Tags,
  },
];

export default function Taxonomies() {
  const navigate = useNavigate();
  const [taxonomies, setTaxonomies] = useState<ITaxonomy[]>([]);
  const [collections, setCollections] = useState<ICollection[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ITaxonomy | null>(null);
  const [name, setName] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [hierarchical, setHierarchical] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setTaxonomies(await api.get<ITaxonomy[]>('/taxonomies'));
  }

  useEffect(() => {
    load();
    api.get<ICollection[]>('/collections').then(setCollections);
  }, []);

  function openForm(tax: ITaxonomy | null) {
    setEditing(tax);
    setName(tax?.name ?? '');
    setCollectionId(tax?.collectionId ?? '');
    setHierarchical(tax?.hierarchical ?? true);
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError('Escribe un nombre');
    if (!collectionId) return setError('Elige en qué colección se usa');

    setSaving(true);
    setError('');
    const payload = { name: name.trim(), collectionId, hierarchical };
    try {
      if (editing) {
        // Al pasar a etiquetas, los términos dejan de tener niveles
        const terms = hierarchical ? editing.terms : editing.terms.map(({ parentId, ...t }) => t);
        await api.put(`/taxonomies/${editing.id}`, { ...payload, terms });
        setShowForm(false);
        load();
      } else {
        // Recién creada no tiene términos: se va directo a cargarlos
        const created = await api.post<ITaxonomy>('/taxonomies', payload);
        navigate(`/taxonomies/${created.id}`);
      }
      notifyStructureChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(tax: ITaxonomy) {
    if (!confirm(`¿Eliminar "${tax.name}" y todos sus términos? Las entradas quedarán sin esta clasificación.`)) return;
    await api.delete(`/taxonomies/${tax.id}`);
    notifyStructureChanged();
    load();
  }

  const collectionName = (id: string) => collections.find((c) => c.id === id)?.name ?? id;

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Taxonomías</h1>
          <p className="text-sm text-tertiary mt-1">
            Sirven para clasificar las entradas, como las categorías y etiquetas de un blog.
          </p>
        </div>
        <button
          onClick={() => openForm(null)}
          className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary/90 transition-colors shrink-0"
        >
          <Plus size={16} />
          Nueva taxonomía
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-tertiary/20 p-6 mb-6 space-y-5">
          <h2 className="font-heading text-base font-semibold text-primary">
            {editing ? `Editar "${editing.name}"` : 'Nueva taxonomía'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-primary">Nombre</label>
              <p className="text-xs text-tertiary mb-1.5">Cómo se llama esta clasificación</p>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Destinos, Estados, Temas"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary">¿Dónde se usa?</label>
              <p className="text-xs text-tertiary mb-1.5">Aparecerá al crear entradas de esta colección</p>
              <select value={collectionId} onChange={(e) => setCollectionId(e.target.value)} className={inputClass}>
                <option value="">Elegir colección...</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-primary mb-1.5">¿Cómo se organiza?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {kinds.map(({ hierarchical: h, label, description, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setHierarchical(h)}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                    hierarchical === h
                      ? 'border-secondary bg-secondary/10'
                      : 'border-tertiary/25 hover:border-secondary hover:bg-secondary/5'
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/5 text-primary">
                    <Icon size={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-primary">{label}</span>
                    <span className="block text-xs text-tertiary">{description}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-secondary text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-secondary/90 transition-colors disabled:opacity-60"
            >
              {editing ? 'Guardar' : 'Crear y añadir términos'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-tertiary hover:text-primary"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-tertiary/20 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-tertiary/10">
              <th className="text-left px-6 py-3 text-sm font-medium text-tertiary">Nombre</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-tertiary">Se usa en</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-tertiary">Términos</th>
              <th className="w-32 px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {taxonomies.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-tertiary text-sm">
                  Todavía no hay taxonomías. Crea una para empezar a clasificar tus entradas.
                </td>
              </tr>
            ) : (
              taxonomies.map((tax) => (
                <tr key={tax.id} className="border-b border-tertiary/5 hover:bg-background/50">
                  <td className="px-6 py-3">
                    <Link to={`/taxonomies/${tax.id}`} className="text-sm font-medium text-primary hover:text-secondary">
                      {tax.name}
                    </Link>
                    <p className="text-xs text-tertiary">{tax.hierarchical ? 'Categorías' : 'Etiquetas'}</p>
                  </td>
                  <td className="px-6 py-3 text-sm text-tertiary">{collectionName(tax.collectionId)}</td>
                  <td className="px-6 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {tax.terms.slice(0, 5).map((t) => (
                        <span key={t.id} className="px-2 py-0.5 rounded-full bg-background text-xs text-primary">
                          {t.name}
                        </span>
                      ))}
                      {tax.terms.length > 5 && <span className="text-xs text-tertiary">+{tax.terms.length - 5}</span>}
                      {tax.terms.length === 0 && <span className="text-sm text-tertiary">Sin términos</span>}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-1 justify-end">
                      <Link
                        to={`/taxonomies/${tax.id}`}
                        title="Gestionar términos"
                        className="p-1.5 text-tertiary hover:text-primary transition-colors"
                      >
                        <ListTree size={15} />
                      </Link>
                      <button
                        onClick={() => openForm(tax)}
                        title="Editar"
                        className="p-1.5 text-tertiary hover:text-primary transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(tax)}
                        title="Eliminar"
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
