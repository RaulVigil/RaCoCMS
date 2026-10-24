import { lazy, Suspense, useEffect, useState } from 'react';
import { Check, FileText, LayoutList, Loader2, PencilRuler, Plus } from 'lucide-react';
import type { ICollection, IFieldDefinition, IFieldGroup, IPageBlock, ITemplate, TemplateType } from '@raco/shared';
import { createBlock, normalizeOrder, sortByOrder } from '@raco/blocks';
import { api } from '../lib/api';

const PageBuilder = lazy(() => import('../components/builder/PageBuilder'));

const slots: { type: TemplateType; title: string; text: (c: ICollection) => string; icon: typeof FileText }[] = [
  {
    type: 'single',
    title: 'Cada entrada',
    text: (c) => `Cómo se ve cada ${c.name.toLowerCase()} por dentro (ej. /${c.id}/mi-entrada).`,
    icon: FileText,
  },
  {
    type: 'archive',
    title: 'Listado',
    text: (c) => `Cómo se ve la página que lista todas (/${c.id}).`,
    icon: LayoutList,
  },
];

// Diseño inicial de una plantilla nueva: ya viene vinculado a los datos de la entrada
function starterBlocks(type: TemplateType, collection: ICollection, fields: IFieldDefinition[]): IPageBlock[] {
  const bound = (block: IPageBlock, dynamic: Record<string, string>) => ({ ...block, props: { ...block.props, dynamic } });

  if (type === 'archive') {
    return [
      createBlock('section', { width: 'wide' }, [
        createBlock('row', {}, [
          createBlock('column', {}, [
            createBlock('heading', { text: collection.name, level: 1, size: 'xl' }),
            createBlock('posts', { source: 'current' }),
          ]),
        ]),
      ]),
    ];
  }

  const modules: IPageBlock[] = [
    bound(createBlock('text', { size: 'sm', color: 'muted' }), { content: 'date' }),
    bound(createBlock('heading', { text: 'Título', level: 1, size: 'xl' }), { text: 'title' }),
  ];
  const image = fields.find((f) => f.type === 'image');
  if (image) modules.push(bound(createBlock('image', { rounded: true }), { src: `field:${image.key}` }));
  for (const f of fields) {
    if (f.type === 'richtext' || f.type === 'textarea') {
      modules.push(bound(createBlock('text', { size: 'lg' }), { content: `field:${f.key}` }));
    }
  }
  return [createBlock('section', { width: 'narrow' }, [createBlock('row', {}, [createBlock('column', {}, modules)])])];
}

// Theme Builder: plantillas para mostrar cada entrada y el listado de cada colección
export default function Templates() {
  const [collections, setCollections] = useState<ICollection[]>([]);
  const [templates, setTemplates] = useState<ITemplate[]>([]);
  const [editing, setEditing] = useState<ITemplate | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, IPageBlock[]>>({}); // cerradas sin guardar
  const [error, setError] = useState('');

  async function load() {
    const [cols, tpls] = await Promise.all([api.get<ICollection[]>('/collections'), api.get<ITemplate[]>('/templates')]);
    setCollections(cols.filter((c) => !c.isNative));
    setTemplates(tpls);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const find = (collectionId: string, type: TemplateType) =>
    templates.find((t) => t.collectionId === collectionId && t.type === type);

  async function create(collection: ICollection, type: TemplateType) {
    const key = `${collection.id}:${type}`;
    setBusy(key);
    setError('');
    try {
      const groups = await api.get<IFieldGroup[]>(`/field-groups?collectionId=${collection.id}`);
      const created = await api.post<ITemplate>('/templates', {
        name: `${collection.name} · ${type === 'single' ? 'Entrada' : 'Listado'}`,
        collectionId: collection.id,
        type,
        blocks: starterBlocks(type, collection, groups.flatMap((g) => g.fields)),
      });
      setTemplates((t) => [...t, created]);
      setEditing(created);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function remove(template: ITemplate) {
    await api.delete(`/templates/${template.id}`);
    setTemplates((t) => t.filter((x) => x.id !== template.id));
    setConfirm(null);
  }

  async function save(template: ITemplate, blocks: IPageBlock[]) {
    try {
      const updated = await api.put<ITemplate>(`/templates/${template.id}`, { blocks });
      setTemplates((t) => t.map((x) => (x.id === updated.id ? updated : x)));
      setDrafts(({ [updated.id]: _, ...rest }) => rest);
      if (editing?.id === updated.id) setEditing(updated);
      setSavedId(updated.id);
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-primary">Theme Builder</h1>
      <p className="text-sm text-tertiary mt-1 mb-6">
        Diseña una vez cómo se ven todas las entradas de una colección. Cada módulo puede tomar un dato de la entrada (título,
        fecha, foto, precio…) y cada una se rellena con lo suyo.
      </p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
      )}

      {collections.length === 0 ? (
        <div className="bg-white rounded-xl border border-tertiary/20 p-10 text-center text-sm text-tertiary">
          Crea una colección (ej. Noticias o Viajes) para diseñar sus plantillas.
        </div>
      ) : (
        <div className="space-y-6">
          {collections.map((col) => (
            <div key={col.id} className="bg-white rounded-xl border border-tertiary/20 overflow-hidden">
              <div className="flex items-center justify-between border-b border-tertiary/15 px-5 py-4">
                <h2 className="font-heading text-base font-semibold text-primary">{col.name}</h2>
                {col.useBuilder && (
                  <span className="text-xs text-tertiary">
                    Las entradas con diseño propio lo mantienen; la plantilla se usa en las que no tienen.
                  </span>
                )}
              </div>
              <div className="grid divide-y divide-tertiary/10 md:grid-cols-2 md:divide-x md:divide-y-0">
                {slots.map((slot) => {
                  const template = find(col.id, slot.type);
                  const key = `${col.id}:${slot.type}`;
                  return (
                    <div key={slot.type} className="flex flex-col gap-3 p-5">
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
                          <slot.icon size={19} />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-primary">{slot.title}</p>
                          <p className="text-xs text-tertiary">{slot.text(col)}</p>
                          <p className={`mt-1 text-xs ${template ? 'text-emerald-600' : 'text-tertiary'}`}>
                            {template ? '● Usando tu plantilla' : '○ Sin plantilla: se usa el diseño por defecto'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {template ? (
                          <>
                            <button
                              onClick={() => setEditing(template)}
                              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90"
                            >
                              <PencilRuler size={14} /> Editar
                            </button>
                            {drafts[template.id] ? (
                              <>
                                <span className="text-xs text-amber-600">Cambios sin guardar</span>
                                <button
                                  onClick={() => save(template, drafts[template.id])}
                                  className="rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-white hover:bg-secondary/90"
                                >
                                  Guardar
                                </button>
                              </>
                            ) : (
                              savedId === template.id && (
                                <span className="flex items-center gap-1 text-xs text-secondary">
                                  <Check size={13} /> Guardada
                                </span>
                              )
                            )}
                            {confirm === template.id ? (
                              <span className="flex items-center gap-2 text-xs">
                                <span className="text-primary">Se volverá al diseño por defecto.</span>
                                <button
                                  onClick={() => remove(template)}
                                  className="rounded bg-red-500 px-2 py-1 font-medium text-white hover:bg-red-600"
                                >
                                  Quitar
                                </button>
                                <button onClick={() => setConfirm(null)} className="text-tertiary hover:text-primary">
                                  Cancelar
                                </button>
                              </span>
                            ) : (
                              <button onClick={() => setConfirm(template.id)} className="text-xs text-tertiary hover:text-red-500">
                                Quitar plantilla
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => create(col, slot.type)}
                            disabled={busy === key}
                            className="flex items-center gap-1.5 rounded-md border border-tertiary/30 px-3 py-1.5 text-sm text-primary hover:bg-background disabled:opacity-60"
                          >
                            {busy === key ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                            Crear plantilla
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100 text-sm text-tertiary">
              Cargando constructor...
            </div>
          }
        >
          <PageBuilder
            title={editing.name}
            template={{ collectionId: editing.collectionId, type: editing.type }}
            initialBlocks={drafts[editing.id] ?? editing.blocks}
            onSave={(blocks) => save(editing, blocks)}
            onClose={(blocks) => {
              // Abrir y cerrar sin tocar nada no es un cambio (se compara con el orden normalizado)
              if (JSON.stringify(blocks) !== JSON.stringify(normalizeOrder(sortByOrder(editing.blocks)))) {
                setDrafts((d) => ({ ...d, [editing.id]: blocks }));
              }
              setEditing(null);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
