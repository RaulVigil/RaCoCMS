import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Check, Loader2, PanelBottom, PanelTop, PencilRuler } from 'lucide-react';
import type { IGlobalPart, IPageBlock } from '@raco/shared';
import { PageContent, SiteContext, cx, designThemeCss, designVarClasses, normalizeOrder, sortByOrder } from '@raco/blocks';
import { api } from '../lib/api';
import { useMenus } from '../lib/menus';
import { useGoogleFonts, useSiteDesign } from '../lib/siteDesign';
import { useRuntimeTailwind } from '../lib/tailwindRuntime';

const PageBuilder = lazy(() => import('../components/builder/PageBuilder'));

const info: Record<string, { title: string; text: string; icon: typeof PanelTop }> = {
  header: {
    title: 'Cabecera',
    text: 'Arriba de todas las páginas: logo o nombre del sitio, menú, botón de contacto…',
    icon: PanelTop,
  },
  footer: {
    title: 'Pie de página',
    text: 'Abajo de todas las páginas: datos de contacto, redes sociales, enlaces legales…',
    icon: PanelBottom,
  },
};

// Header y footer del sitio: se diseñan con el mismo constructor que las páginas
export default function GlobalParts() {
  const [parts, setParts] = useState<IGlobalPart[]>([]);
  const [drafts, setDrafts] = useState<Record<string, IPageBlock[]>>({}); // cambios cerrados sin guardar
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const design = useSiteDesign();
  const menus = useMenus();
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<IGlobalPart[]>('/global-parts').then(setParts).catch((err) => setError(err.message));
  }, []);

  useGoogleFonts(design);
  useRuntimeTailwind(pageRef, [parts, drafts, menus], design ? designThemeCss(design) : undefined);

  const blocksOf = (part: IGlobalPart) => drafts[part.id] ?? part.blocks;

  async function save(id: string, patch: Partial<IGlobalPart>): Promise<boolean> {
    setSaving(id);
    setError('');
    try {
      const updated = await api.put<IGlobalPart>(`/global-parts/${id}`, patch);
      setParts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setDrafts(({ [id]: _, ...rest }) => rest);
      setSavedId(id);
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setSaving(null);
    }
  }

  const ordered = ['header', 'footer'].map((id) => parts.find((p) => p.id === id)).filter((p): p is IGlobalPart => !!p);
  const current = parts.find((p) => p.id === editing);

  return (
    <div ref={pageRef}>
      <h1 className="font-heading text-2xl font-bold text-primary">Partes Globales</h1>
      <p className="text-sm text-tertiary mt-1 mb-6">
        Se muestran en todas las páginas del sitio. Diséñalas con el constructor visual, igual que una página.
      </p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
      )}

      <div className="space-y-6">
        {ordered.map((part) => {
          const meta = info[part.id];
          const blocks = blocksOf(part);
          const dirty = !!drafts[part.id];
          return (
            <div key={part.id} className="bg-white rounded-xl border border-tertiary/20 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                  <meta.icon size={22} />
                </span>
                <div className="flex-1">
                  <h2 className="font-heading text-base font-semibold text-primary">{meta.title}</h2>
                  <p className="text-sm text-tertiary">{meta.text}</p>
                </div>
                <div className="flex items-center gap-3">
                  {dirty ? (
                    <>
                      <span className="text-xs text-amber-600">Cambios sin guardar</span>
                      <button
                        onClick={() => save(part.id, { blocks })}
                        disabled={saving === part.id}
                        className="flex items-center gap-1.5 bg-secondary text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-secondary/90 disabled:opacity-60"
                      >
                        {saving === part.id && <Loader2 size={14} className="animate-spin" />}
                        Guardar
                      </button>
                    </>
                  ) : (
                    savedId === part.id && (
                      <span className="flex items-center gap-1 text-xs text-secondary">
                        <Check size={14} /> Guardado
                      </span>
                    )
                  )}
                  <button
                    onClick={() => setEditing(part.id)}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
                  >
                    <PencilRuler size={15} />
                    Editar con el constructor
                  </button>
                </div>
              </div>

              {part.id === 'header' && (
                <label className="flex items-center gap-3 border-t border-tertiary/10 px-5 py-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!part.sticky}
                    onChange={(e) => save(part.id, { sticky: e.target.checked })}
                    className="h-4 w-4 accent-secondary"
                  />
                  <span className="text-sm text-primary">
                    Fija arriba al hacer scroll
                    <span className="block text-xs text-tertiary">La cabecera queda siempre visible mientras se recorre la página.</span>
                  </span>
                </label>
              )}

              {/* Vista previa real (sin interacción), con la paleta y los menús del sitio */}
              <div className="border-t border-tertiary/10 bg-slate-100 p-4">
                {design && blocks.length ? (
                  <div
                    className={cx(
                      'pointer-events-none overflow-hidden rounded-lg bg-white font-body text-primary shadow-sm',
                      designVarClasses(design),
                    )}
                  >
                    <SiteContext.Provider value={{ menus }}>
                      <PageContent blocks={blocks} />
                    </SiteContext.Provider>
                  </div>
                ) : (
                  <p className="py-6 text-center text-sm text-tertiary">Vacía: no se mostrará nada en el sitio.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {current && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100 text-sm text-tertiary">
              Cargando constructor...
            </div>
          }
        >
          <PageBuilder
            title={info[current.id]?.title ?? current.name}
            initialBlocks={blocksOf(current)}
            onSave={(blocks) => save(current.id, { blocks })}
            onClose={(blocks) => {
              // Se comparan con el orden normalizado: abrir y cerrar sin tocar nada no es un cambio
              if (JSON.stringify(blocks) !== JSON.stringify(normalizeOrder(sortByOrder(current.blocks)))) {
                setDrafts((d) => ({ ...d, [current.id]: blocks }));
              }
              setEditing(null);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
