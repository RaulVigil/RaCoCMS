import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CornerDownRight, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import type { ICollection, ITaxonomy, ITaxonomyTerm } from '@raco/shared';
import { api } from '../lib/api';
import { depthClass, descendantsOf, flattenTerms, newTermId, slugify } from '../lib/terms';
import { inputClass } from '../components/fields/fieldTypes';

export default function TaxonomyTerms() {
  const { taxonomyId } = useParams();
  const [tax, setTax] = useState<ITaxonomy | null>(null);
  const [collection, setCollection] = useState<ICollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [newName, setNewName] = useState('');
  const [newParent, setNewParent] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editParent, setEditParent] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get<ITaxonomy>(`/taxonomies/${taxonomyId}`)
      .then(async (t) => {
        setTax(t);
        setCollection(await api.get<ICollection>(`/collections/${t.collectionId}`).catch(() => null));
      })
      .catch(() => setTax(null))
      .finally(() => setLoading(false));
  }, [taxonomyId]);

  if (loading) return <p className="text-sm text-tertiary">Cargando...</p>;
  if (!tax) {
    return (
      <div className="bg-white rounded-xl border border-tertiary/20 p-8 text-center text-tertiary text-sm">
        Esta taxonomía no existe.{' '}
        <Link to="/taxonomies" className="text-secondary hover:underline">
          Ver todas
        </Link>
      </div>
    );
  }

  const singular = tax.hierarchical ? 'categoría' : 'etiqueta';
  const terms = tax.terms;
  const tree = flattenTerms(terms);

  // Los cambios se guardan al momento, como en WordPress
  async function persist(next: ITaxonomyTerm[]) {
    setSaving(true);
    setError('');
    try {
      setTax(await api.put<ITaxonomy>(`/taxonomies/${tax!.id}`, { terms: next }));
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  function uniqueSlug(name: string, list: ITaxonomyTerm[]) {
    const root = slugify(name) || singular;
    let slug = root;
    for (let n = 2; list.some((t) => t.slug === slug); n++) slug = `${root}-${n}`;
    return slug;
  }

  const sameNameExists = (name: string, parentId: string, exceptId?: string) =>
    terms.some(
      (t) => t.id !== exceptId && (t.parentId ?? '') === parentId && t.name.toLowerCase() === name.toLowerCase(),
    );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    // En etiquetas se pueden añadir varias separadas por comas
    const names = (tax!.hierarchical ? [newName] : newName.split(','))
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return;

    const repeated = names.find((n) => sameNameExists(n, newParent));
    if (repeated) return setError(`Ya existe "${repeated}"`);

    const next = [...terms];
    for (const name of names) {
      next.push({
        id: newTermId(),
        name,
        slug: uniqueSlug(name, next),
        ...(newParent ? { parentId: newParent } : {}),
      });
    }

    if (await persist(next)) {
      setNewName('');
      nameRef.current?.focus();
    }
  }

  function startEdit(term: ITaxonomyTerm) {
    setEditingId(term.id);
    setEditName(term.name);
    setEditParent(term.parentId ?? '');
    setError('');
  }

  async function saveEdit(term: ITaxonomyTerm) {
    const name = editName.trim();
    if (!name) return setError('El nombre no puede quedar vacío');
    if (sameNameExists(name, editParent, term.id)) return setError(`Ya existe "${name}"`);

    // El slug se mantiene al renombrar para no romper enlaces existentes
    const next = terms.map((t) => {
      if (t.id !== term.id) return t;
      const { parentId, ...rest } = t;
      return { ...rest, name, ...(editParent ? { parentId: editParent } : {}) };
    });
    if (await persist(next)) setEditingId(null);
  }

  async function handleDelete(term: ITaxonomyTerm) {
    const hasChildren = terms.some((t) => t.parentId === term.id);
    const msg = hasChildren
      ? `¿Eliminar "${term.name}"? Sus subcategorías subirán un nivel.`
      : `¿Eliminar "${term.name}"?`;
    if (!confirm(msg)) return;

    const next = terms
      .filter((t) => t.id !== term.id)
      .map((t) => {
        if (t.parentId !== term.id) return t;
        const { parentId, ...rest } = t;
        return term.parentId ? { ...rest, parentId: term.parentId } : rest;
      });
    persist(next);
  }

  // Opciones de "Dentro de", con sangría para que se entienda el árbol
  const parentOptions = (exclude?: Set<string>) =>
    tree
      .filter((t) => !exclude?.has(t.id))
      .map((t) => (
        <option key={t.id} value={t.id}>
          {'— '.repeat(t.depth)}
          {t.name}
        </option>
      ));

  return (
    <div>
      <Link to="/taxonomies" className="inline-flex items-center gap-1.5 text-sm text-tertiary hover:text-primary mb-3">
        <ArrowLeft size={15} />
        Taxonomías
      </Link>

      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-primary">{tax.name}</h1>
        <p className="text-sm text-tertiary mt-1">
          {tax.hierarchical ? 'Categorías' : 'Etiquetas'} para clasificar las entradas de{' '}
          <span className="text-primary">{collection?.name ?? tax.collectionId}</span>
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* --- Añadir --- */}
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-tertiary/20 p-6 space-y-4">
          <h2 className="font-heading text-base font-semibold text-primary">Añadir {singular}</h2>
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Nombre</label>
            <input
              ref={nameRef}
              autoFocus
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setError('');
              }}
              placeholder={tax.hierarchical ? 'Ej: Europa' : 'Ej: Oferta, Familiar'}
              className={inputClass}
            />
            {!tax.hierarchical && <p className="text-xs text-tertiary mt-1">Separa con comas para añadir varias</p>}
          </div>

          {tax.hierarchical && terms.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-primary">Dentro de</label>
              <p className="text-xs text-tertiary mb-1.5">Opcional, para crear una subcategoría</p>
              <select value={newParent} onChange={(e) => setNewParent(e.target.value)} className={inputClass}>
                <option value="">Ninguna (categoría principal)</option>
                {parentOptions()}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !newName.trim()}
            className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            Añadir
          </button>
        </form>

        {/* --- Listado --- */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-tertiary/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-tertiary/15 flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold text-primary">
              {tax.hierarchical ? 'Categorías' : 'Etiquetas'}
            </h2>
            <span className="text-sm text-tertiary">{terms.length}</span>
          </div>

          {tree.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-tertiary">
              Todavía no hay ninguna. Añade la primera con el formulario.
            </p>
          ) : (
            tree.map((term) =>
              editingId === term.id ? (
                <div key={term.id} className="px-6 py-3 border-b border-tertiary/10 bg-secondary/5 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(term);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className={inputClass}
                    />
                    {tax.hierarchical && (
                      <select value={editParent} onChange={(e) => setEditParent(e.target.value)} className={inputClass}>
                        <option value="">Ninguna (categoría principal)</option>
                        {parentOptions(descendantsOf(terms, term.id))}
                      </select>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => saveEdit(term)}
                      disabled={saving}
                      className="bg-secondary text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-secondary/90 disabled:opacity-60"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-sm text-tertiary hover:text-primary"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={term.id}
                  className="group flex items-center gap-2 px-6 py-3 border-b border-tertiary/10 last:border-b-0 hover:bg-background/50"
                >
                  <div className={`flex-1 flex items-center gap-2 ${depthClass[term.depth]}`}>
                    {term.depth > 0 && <CornerDownRight size={14} className="text-tertiary/60" />}
                    <span className="text-sm text-primary">{term.name}</span>
                  </div>
                  <div className="flex gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(term)}
                      title="Editar"
                      className="p-1.5 rounded-md text-tertiary hover:text-primary hover:bg-background"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(term)}
                      title="Eliminar"
                      className="p-1.5 rounded-md text-tertiary hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ),
            )
          )}
        </div>
      </div>
    </div>
  );
}
