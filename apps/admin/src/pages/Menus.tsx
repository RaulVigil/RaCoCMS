import { useEffect, useState } from 'react';
import {
  Check,
  CornerDownRight,
  ExternalLink,
  GripVertical,
  IndentDecrease,
  IndentIncrease,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import type { ICollection, IEntry, IMenu, IMenuItem } from '@raco/shared';
import { api } from '../lib/api';
import { inputClass } from '../components/fields/fieldTypes';

// El árbol se edita como lista plana con profundidad (0 = principal, 1 = submenú): es más fácil de
// arrastrar y de entender. Al guardar se vuelve a armar el árbol.
type FlatItem = Omit<IMenuItem, 'children'> & { depth: 0 | 1 };

const toFlat = (items: IMenuItem[]): FlatItem[] =>
  items.flatMap(({ children, ...it }) => [
    { ...it, depth: 0 as const },
    ...(children ?? []).map(({ children: _, ...c }) => ({ ...c, depth: 1 as const })),
  ]);

function toTree(flat: FlatItem[]): IMenuItem[] {
  const tree: IMenuItem[] = [];
  for (const { depth, ...it } of flat) {
    if (depth === 1 && tree.length) tree[tree.length - 1].children.push({ ...it, children: [] });
    else tree.push({ ...it, children: [] });
  }
  return tree;
}

// Un submenú siempre cuelga de un ítem principal: el primero nunca puede tener sangría
const normalize = (flat: FlatItem[]): FlatItem[] => flat.map((it, i) => (i === 0 && it.depth ? { ...it, depth: 0 } : it));

const newId = () => `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

const typeLabel: Record<string, string> = { page: 'Página', entry: 'Entrada', archive: 'Listado', custom: 'Enlace' };

type Tab = 'pages' | 'collections' | 'custom';

export default function Menus() {
  const [menus, setMenus] = useState<IMenu[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [items, setItems] = useState<FlatItem[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Arrastrar: grupo que se mueve (ítem + sus subítems) e índice donde caería
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  async function loadMenus(select?: string) {
    const list = await api.get<IMenu[]>('/menus');
    setMenus(list);
    const target = list.find((m) => m.id === (select ?? selectedId)) ?? list[0];
    if (target) open(target);
  }

  useEffect(() => {
    loadMenus().catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function open(menu: IMenu) {
    setSelectedId(menu.id);
    setName(menu.name);
    const flat = toFlat(menu.items);
    setItems(flat);
    setSavedSnapshot(JSON.stringify({ name: menu.name, flat }));
    setEditingId(null);
    setConfirmDelete(false);
    setJustSaved(false);
  }

  const dirty = JSON.stringify({ name, flat: items }) !== savedSnapshot;

  function change(next: FlatItem[]) {
    setItems(normalize(next));
    setJustSaved(false);
  }

  function addItems(added: Omit<FlatItem, 'id' | 'depth'>[]) {
    change([...items, ...added.map((a) => ({ ...a, id: newId(), depth: 0 as const }))]);
  }

  function update(id: string, patch: Partial<FlatItem>) {
    change(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  // Quitar un ítem principal se lleva sus subítems
  function remove(index: number) {
    const end = groupEnd(index);
    change([...items.slice(0, index), ...items.slice(end)]);
  }

  // Índice siguiente al último subítem del grupo que empieza en "index"
  function groupEnd(index: number) {
    let end = index + 1;
    if (items[index].depth === 0) while (end < items.length && items[end].depth === 1) end++;
    return end;
  }

  function drop() {
    if (dragIndex === null || dropIndex === null) return;
    const end = groupEnd(dragIndex);
    if (dropIndex >= dragIndex && dropIndex <= end) return reset();
    const group = items.slice(dragIndex, end);
    const rest = [...items.slice(0, dragIndex), ...items.slice(end)];
    const at = dropIndex > dragIndex ? dropIndex - group.length : dropIndex;
    change([...rest.slice(0, at), ...group, ...rest.slice(at)]);
    reset();
  }

  function reset() {
    setDragIndex(null);
    setDropIndex(null);
  }

  async function save() {
    if (!selectedId) return;
    setSaving(true);
    setError('');
    try {
      const saved = await api.put<IMenu>(`/menus/${selectedId}`, { name: name.trim() || 'Menú', items: toTree(items) });
      setMenus((prev) => prev.map((m) => (m.id === saved.id ? saved : m)));
      open(saved);
      setJustSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function createMenu(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError('');
    try {
      const created = await api.post<IMenu>('/menus', { name: newName.trim(), items: [] });
      setNewName('');
      await loadMenus(created.id);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function deleteMenu() {
    if (!selectedId) return;
    await api.delete(`/menus/${selectedId}`);
    setSelectedId(null);
    await loadMenus('');
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-primary">Menús</h1>
      <p className="text-sm text-tertiary mt-1 mb-6">
        Los enlaces de navegación del sitio. Para mostrar un menú, añade el módulo "Menú" en la cabecera o donde quieras.
      </p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* --- Lista de menús + añadir enlaces --- */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-tertiary/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-tertiary mb-2">Tus menús</p>
            <div className="space-y-1">
              {menus.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => open(m)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                    m.id === selectedId ? 'bg-secondary/15 font-medium text-primary' : 'text-primary hover:bg-background'
                  }`}
                >
                  {m.name}
                  <span className="text-xs text-tertiary">{m.items.length}</span>
                </button>
              ))}
            </div>
            <form onSubmit={createMenu} className="mt-3 flex gap-2 border-t border-tertiary/15 pt-3">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nuevo menú, ej: Pie de página"
                className={`${inputClass} py-1.5`}
              />
              <button type="submit" title="Crear menú" className="rounded-md bg-primary px-3 text-white hover:bg-primary/90">
                <Plus size={16} />
              </button>
            </form>
          </div>

          {selectedId && <AddLinks onAdd={addItems} />}
        </div>

        {/* --- Menú seleccionado --- */}
        <div className="lg:col-span-2">
          {!selectedId ? (
            <div className="bg-white rounded-xl border border-tertiary/20 p-10 text-center text-sm text-tertiary">
              Crea un menú para empezar.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-tertiary/20 overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 border-b border-tertiary/15 px-5 py-4">
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setJustSaved(false);
                  }}
                  className="flex-1 min-w-48 font-heading text-lg font-semibold text-primary focus:outline-none"
                />
                {dirty ? (
                  <span className="text-xs text-amber-600">Cambios sin guardar</span>
                ) : (
                  justSaved && (
                    <span className="flex items-center gap-1 text-xs text-secondary">
                      <Check size={14} /> Guardado
                    </span>
                  )
                )}
                <button
                  onClick={save}
                  disabled={saving || !dirty}
                  className="flex items-center gap-2 bg-secondary text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-secondary/90 disabled:opacity-50"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  Guardar
                </button>
              </div>

              {items.length === 0 ? (
                <p className="px-5 py-12 text-center text-sm text-tertiary">
                  El menú está vacío. Añade páginas o enlaces desde el panel de la izquierda.
                </p>
              ) : (
                <ul className="py-2" onDragLeave={(e) => e.currentTarget === e.target && setDropIndex(null)}>
                  {items.map((item, i) => (
                    <li
                      key={item.id}
                      onDragOver={(e) => {
                        if (dragIndex === null) return;
                        e.preventDefault();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setDropIndex(e.clientY > rect.top + rect.height / 2 ? i + 1 : i);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        drop();
                      }}
                      className={`relative ${dragIndex !== null && i >= dragIndex && i < groupEnd(dragIndex) ? 'opacity-40' : ''}`}
                    >
                      {dropIndex === i && <div className="absolute inset-x-4 -top-px z-10 h-0.5 rounded bg-secondary" />}
                      {dropIndex === i + 1 && i === items.length - 1 && (
                        <div className="absolute inset-x-4 -bottom-px z-10 h-0.5 rounded bg-secondary" />
                      )}

                      <div className={`group flex items-center gap-2 px-4 py-2 hover:bg-background/60 ${item.depth ? 'pl-12' : ''}`}>
                        <span
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', item.id);
                            setDragIndex(i);
                          }}
                          onDragEnd={reset}
                          title="Arrastrar para mover"
                          className="cursor-grab text-tertiary/60"
                        >
                          <GripVertical size={16} />
                        </span>
                        {item.depth === 1 && <CornerDownRight size={14} className="text-tertiary/60" />}
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 text-sm font-medium text-primary">
                            <span className="truncate">{item.label}</span>
                            {item.target === '_blank' && <ExternalLink size={12} className="shrink-0 text-tertiary" />}
                          </p>
                          <p className="truncate text-xs text-tertiary">
                            <span className="mr-1.5 rounded bg-background px-1.5 py-0.5">{typeLabel[item.type] ?? 'Enlace'}</span>
                            <span className="font-mono">{item.url}</span>
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-0.5 opacity-60 group-hover:opacity-100">
                          {item.depth === 0 ? (
                            <IconBtn
                              title="Convertir en submenú del anterior"
                              disabled={i === 0 || groupEnd(i) - i > 1}
                              onClick={() => update(item.id, { depth: 1 })}
                            >
                              <IndentIncrease size={15} />
                            </IconBtn>
                          ) : (
                            <IconBtn title="Volver a ítem principal" onClick={() => update(item.id, { depth: 0 })}>
                              <IndentDecrease size={15} />
                            </IconBtn>
                          )}
                          <IconBtn title="Editar" onClick={() => setEditingId(editingId === item.id ? null : item.id)}>
                            <Pencil size={15} />
                          </IconBtn>
                          <IconBtn title="Quitar" danger onClick={() => remove(i)}>
                            <Trash2 size={15} />
                          </IconBtn>
                        </div>
                      </div>

                      {editingId === item.id && (
                        <div className={`mx-4 mb-2 grid gap-3 rounded-lg bg-background p-3 sm:grid-cols-2 ${item.depth ? 'ml-12' : ''}`}>
                          <label className="text-xs text-primary">
                            Texto del enlace
                            <input
                              value={item.label}
                              onChange={(e) => update(item.id, { label: e.target.value })}
                              className={`${inputClass} mt-1 py-1.5`}
                            />
                          </label>
                          <label className="text-xs text-primary">
                            Dirección
                            <input
                              value={item.url}
                              disabled={item.type !== 'custom'}
                              onChange={(e) => update(item.id, { url: e.target.value })}
                              className={`${inputClass} mt-1 py-1.5 font-mono disabled:opacity-60`}
                            />
                            {item.type !== 'custom' && (
                              <span className="mt-1 block text-[11px] text-tertiary">Se actualiza sola si cambia el enlace de la página.</span>
                            )}
                          </label>
                          <label className="flex items-center gap-2 text-xs text-primary sm:col-span-2">
                            <input
                              type="checkbox"
                              checked={item.target === '_blank'}
                              onChange={(e) => update(item.id, { target: e.target.checked ? '_blank' : '_self' })}
                              className="accent-secondary"
                            />
                            Abrir en una pestaña nueva
                          </label>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex items-center justify-between border-t border-tertiary/15 px-5 py-3 text-xs text-tertiary">
                <span>Arrastra para ordenar. Los submenús se muestran como desplegables.</span>
                {confirmDelete ? (
                  <span className="flex items-center gap-2">
                    <span className="text-primary">¿Eliminar este menú?</span>
                    <button onClick={deleteMenu} className="rounded bg-red-500 px-2 py-1 font-medium text-white hover:bg-red-600">
                      Eliminar
                    </button>
                    <button onClick={() => setConfirmDelete(false)} className="hover:text-primary">
                      Cancelar
                    </button>
                  </span>
                ) : (
                  <button onClick={() => setConfirmDelete(true)} className="hover:text-red-500">
                    Eliminar menú
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Panel para añadir enlaces: páginas, colecciones o una dirección libre ---

function AddLinks({ onAdd }: { onAdd: (items: Omit<FlatItem, 'id' | 'depth'>[]) => void }) {
  const [tab, setTab] = useState<Tab>('pages');
  const [pages, setPages] = useState<IEntry[]>([]);
  const [collections, setCollections] = useState<ICollection[]>([]);
  const [collectionId, setCollectionId] = useState('');
  const [entries, setEntries] = useState<IEntry[]>([]);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [newTab, setNewTab] = useState(false);

  useEffect(() => {
    api.get<IEntry[]>('/entries/pages').then(setPages).catch(() => {});
    api
      .get<ICollection[]>('/collections')
      .then((cols) => {
        const list = cols.filter((c) => !c.isNative);
        setCollections(list);
        setCollectionId(list[0]?.id ?? '');
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setChecked(new Set());
    if (!collectionId) return setEntries([]);
    api.get<IEntry[]>(`/entries/${collectionId}`).then(setEntries).catch(() => setEntries([]));
  }, [collectionId]);

  function toggle(id: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const entryItem = (e: IEntry, colId: string) => ({
    label: e.title || e.slug,
    url: colId === 'pages' ? `/${e.slug}` : `/${colId}/${e.slug}`,
    type: (colId === 'pages' ? 'page' : 'entry') as FlatItem['type'],
    target: '_self' as const,
    ref: { collectionId: colId, entryId: e.id },
  });

  function addChecked(list: IEntry[], colId: string) {
    onAdd(list.filter((e) => checked.has(e.id)).map((e) => entryItem(e, colId)));
    setChecked(new Set());
  }

  const tabs: { value: Tab; label: string }[] = [
    { value: 'pages', label: 'Páginas' },
    { value: 'collections', label: 'Colecciones' },
    { value: 'custom', label: 'Enlace' },
  ];

  const EntryChecklist = ({ list, empty }: { list: IEntry[]; empty: string }) =>
    list.length === 0 ? (
      <p className="py-3 text-center text-xs text-tertiary">{empty}</p>
    ) : (
      <div className="max-h-56 space-y-1 overflow-y-auto">
        {list.map((e) => (
          <label key={e.id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm text-primary hover:bg-background">
            <input type="checkbox" checked={checked.has(e.id)} onChange={() => toggle(e.id)} className="accent-secondary" />
            <span className="flex-1 truncate">{e.title || e.slug}</span>
            {e.status !== 'published' && <span className="text-[10px] text-amber-600">borrador</span>}
          </label>
        ))}
      </div>
    );

  return (
    <div className="bg-white rounded-xl border border-tertiary/20 overflow-hidden">
      <p className="px-4 pt-4 text-xs font-semibold uppercase tracking-wide text-tertiary">Añadir enlaces</p>
      <div className="flex gap-1 px-4 pt-2">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => {
              setTab(t.value);
              setChecked(new Set());
            }}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs ${tab === t.value ? 'bg-primary text-white' : 'text-tertiary hover:bg-background hover:text-primary'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3 p-4">
        {tab === 'pages' && (
          <>
            <EntryChecklist list={pages} empty="Todavía no hay páginas." />
            <AddButton disabled={!checked.size} onClick={() => addChecked(pages, 'pages')} />
            <p className="text-[11px] text-tertiary">Las páginas en borrador no se muestran en la web hasta publicarlas.</p>
          </>
        )}

        {tab === 'collections' &&
          (collections.length === 0 ? (
            <p className="py-3 text-center text-xs text-tertiary">No hay colecciones.</p>
          ) : (
            <>
              <select value={collectionId} onChange={(e) => setCollectionId(e.target.value)} className={`${inputClass} py-1.5`}>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const col = collections.find((c) => c.id === collectionId);
                  if (col) onAdd([{ label: col.name, url: `/${col.id}`, type: 'archive', target: '_self' }]);
                }}
                className="w-full rounded-md border border-tertiary/30 py-1.5 text-xs text-primary hover:bg-background"
              >
                Añadir el listado completo
              </button>
              <p className="text-xs text-tertiary">O entradas sueltas:</p>
              <EntryChecklist list={entries} empty="Esta colección no tiene entradas." />
              <AddButton disabled={!checked.size} onClick={() => addChecked(entries, collectionId)} />
            </>
          ))}

        {tab === 'custom' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!label.trim() || !url.trim()) return;
              onAdd([{ label: label.trim(), url: url.trim(), type: 'custom', target: newTab ? '_blank' : '_self' }]);
              setLabel('');
              setUrl('');
              setNewTab(false);
            }}
            className="space-y-2"
          >
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Texto, ej: Instagram" className={`${inputClass} py-1.5`} />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://… o /contacto o #seccion"
              className={`${inputClass} py-1.5 font-mono`}
            />
            <label className="flex items-center gap-2 text-xs text-primary">
              <input type="checkbox" checked={newTab} onChange={(e) => setNewTab(e.target.checked)} className="accent-secondary" />
              Abrir en una pestaña nueva
            </label>
            <AddButton disabled={!label.trim() || !url.trim()} submit />
          </form>
        )}
      </div>
    </div>
  );
}

function AddButton({ disabled, onClick, submit }: { disabled?: boolean; onClick?: () => void; submit?: boolean }) {
  return (
    <button
      type={submit ? 'submit' : 'button'}
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary py-1.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-40"
    >
      <Plus size={14} /> Añadir al menú
    </button>
  );
}

function IconBtn({
  title,
  danger,
  disabled,
  onClick,
  children,
}: {
  title: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded p-1.5 text-tertiary disabled:opacity-30 ${danger ? 'hover:bg-red-50 hover:text-red-500' : 'hover:bg-background hover:text-primary'}`}
    >
      {children}
    </button>
  );
}
