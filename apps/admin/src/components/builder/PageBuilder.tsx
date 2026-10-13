import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ISiteDesign } from '@raco/shared';
import { Check, Loader2, Monitor, Redo2, Smartphone, Tablet, Undo2, X } from 'lucide-react';
import type { IPageBlock } from '@raco/shared';
import {
  createBlock,
  createRow,
  createSection,
  cx,
  designThemeCss,
  duplicateBlock,
  insertBlock,
  locate,
  moveBlock,
  normalizeOrder,
  removeBlock,
  sortByOrder,
  updateBlock,
  type Device,
  type ModuleType,
  type RowLayout,
} from '@raco/blocks';
import { BuilderContext, type AddRequest, type BuilderApi, type DropTarget } from './context';
import Canvas from './Canvas';
import AddPanel, { PanelHeader } from './AddPanel';
import SettingsPanel from './SettingsPanel';
import { metaOf } from './meta';
import { useGoogleFonts, useSiteDesign } from '../../lib/siteDesign';
import { useRuntimeTailwind } from '../../lib/tailwindRuntime';

interface Props {
  title: string;
  initialBlocks: IPageBlock[];
  onSave: (blocks: IPageBlock[]) => Promise<boolean>;
  onClose: (blocks: IPageBlock[]) => void;
}

interface History {
  past: IPageBlock[][];
  present: IPageBlock[];
  future: IPageBlock[][];
}

const devices: { value: Device; label: string; icon: typeof Monitor }[] = [
  { value: 'desktop', label: 'Escritorio', icon: Monitor },
  { value: 'tablet', label: 'Tablet', icon: Tablet },
  { value: 'mobile', label: 'Móvil', icon: Smartphone },
];

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

// Espera el diseño del sitio antes de montar el editor (lo necesitan el lienzo y los selectores de color)
export default function PageBuilder(props: Props) {
  const design = useSiteDesign();
  if (!design) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100 text-sm text-tertiary">
        Cargando constructor...
      </div>
    );
  }
  return <Builder {...props} design={design} />;
}

function Builder({ title, initialBlocks, onSave, onClose, design }: Props & { design: ISiteDesign }) {
  const [history, setHistory] = useState<History>(() => ({ past: [], present: sortByOrder(initialBlocks), future: [] }));
  const blocks = history.present;
  const [savedBlocks, setSavedBlocks] = useState(blocks);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const [device, setDevice] = useState<Device>('desktop');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [adding, setAdding] = useState<AddRequest | null>(null);
  const [drag, setDrag] = useState<BuilderApi['drag']>(null);
  const [dropTarget, setDropTargetState] = useState<DropTarget | null>(null);
  const lastChange = useRef<{ key: string; at: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // CSS al vuelo para todo el constructor: estilos libres del lienzo y muestras de color del panel
  useGoogleFonts(design);
  useRuntimeTailwind(rootRef, [history.present, selectedId, hoveredId, device, adding], designThemeCss(design));

  const dirty = blocks !== savedBlocks;

  // Cada cambio entra al historial; los cambios seguidos del mismo ajuste (ej. escribir) se agrupan
  const change = useCallback((fn: (b: IPageBlock[]) => IPageBlock[], key?: string) => {
    // La agrupación se decide fuera del updater para que este sea puro (StrictMode lo ejecuta dos veces)
    const now = Date.now();
    const group = !!key && lastChange.current?.key === key && now - lastChange.current.at < 1000;
    lastChange.current = key ? { key, at: now } : null;
    setHistory((h) => {
      const next = fn(h.present);
      if (next === h.present) return h;
      return { past: group ? h.past : [...h.past.slice(-60), h.present], present: next, future: [] };
    });
    setJustSaved(false);
  }, []);

  const undo = useCallback(() => {
    lastChange.current = null;
    setHistory((h) => (h.past.length ? { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] } : h));
  }, []);

  const redo = useCallback(() => {
    lastChange.current = null;
    setHistory((h) => (h.future.length ? { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) } : h));
  }, []);

  // Bloques "activos": el seleccionado, el que está bajo el mouse y sus contenedores
  const activeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const id of [selectedId, hoveredId]) {
      if (!id) continue;
      const loc = locate(blocks, id);
      if (!loc) continue;
      ids.add(id);
      loc.ancestors.forEach((a) => ids.add(a.id));
    }
    return ids;
  }, [blocks, selectedId, hoveredId]);

  const remove = useCallback(
    (id: string) => {
      change((b) => removeBlock(b, id));
      setSelectedId((s) => (s === id ? null : s));
    },
    [change],
  );

  function duplicate(id: string) {
    const res = duplicateBlock(blocks, id);
    if (!res.copyId) return;
    change(() => res.blocks);
    setSelectedId(res.copyId);
  }

  function move(id: string, delta: -1 | 1) {
    change((b) => {
      const loc = locate(b, id);
      if (!loc) return b;
      const target = loc.index + delta;
      if (target < 0 || target >= loc.list.length) return b;
      // moveBlock descuenta el hueco cuando se mueve hacia abajo en la misma lista
      return moveBlock(b, id, loc.parent?.id ?? null, delta === 1 ? target + 1 : target);
    });
  }

  function setDropTarget(t: DropTarget | null) {
    setDropTargetState((prev) => (JSON.stringify(prev) === JSON.stringify(t) ? prev : t));
  }

  function drop() {
    if (drag && dropTarget) {
      change((b) => moveBlock(b, drag.id, dropTarget.parentId, dropTarget.index));
      setSelectedId(drag.id);
    }
    setDrag(null);
    setDropTargetState(null);
  }

  // --- Añadir ---

  function firstColumnId(block: IPageBlock): string | null {
    if (block.type === 'column') return block.id;
    for (const child of block.children ?? []) {
      const id = firstColumnId(child);
      if (id) return id;
    }
    return null;
  }

  // Tras crear una sección o fila se pasa directo a elegir el primer módulo (como en Divi)
  function addLayout(layout: RowLayout) {
    if (!adding) return;
    const block = adding.kind === 'section' ? createSection(layout) : createRow(layout);
    change((b) => insertBlock(b, adding.parentId, adding.index, block));
    const col = firstColumnId(block);
    setSelectedId(block.id);
    setAdding(col ? { kind: 'module', parentId: col, index: 0 } : null);
  }

  function addModule(type: ModuleType) {
    if (!adding) return;
    const block = createBlock(type);
    change((b) => insertBlock(b, adding.parentId, adding.index, block));
    setAdding(null);
    setSelectedId(block.id);
  }

  // --- Guardar / cerrar ---

  async function save() {
    setSaving(true);
    const ok = await onSave(normalizeOrder(blocks));
    setSaving(false);
    if (ok) {
      setSavedBlocks(blocks);
      setJustSaved(true);
    }
  }

  // Atajos: Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y, Ctrl+D duplicar, Supr borrar, Esc deseleccionar, Ctrl+S guardar
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
        return;
      }
      if (isTyping(e.target)) return;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (mod && e.key.toLowerCase() === 'd' && selectedId) {
        e.preventDefault();
        duplicate(selectedId);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        remove(selectedId);
      } else if (e.key === 'Escape') {
        setSelectedId(null);
        setAdding(null);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Avisar si se cierra la pestaña con cambios sin guardar
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const api: BuilderApi = {
    blocks,
    design,
    device,
    selectedId,
    hoveredId,
    activeIds,
    drag,
    dropTarget,
    select: (id) => {
      setSelectedId(id);
      if (id) setAdding(null);
    },
    hover: setHoveredId,
    startAdd: (req) => {
      setAdding(req);
      setSelectedId(null);
    },
    remove,
    duplicate,
    move,
    startDrag: (block) => {
      setDrag({ id: block.id, type: block.type });
      setHoveredId(null);
    },
    endDrag: () => {
      setDrag(null);
      setDropTargetState(null);
    },
    setDropTarget,
    drop,
  };

  const selectedLoc = selectedId ? locate(blocks, selectedId) : null;
  const selected = selectedLoc ? selectedLoc.list[selectedLoc.index] : null;

  return (
    <BuilderContext.Provider value={api}>
      <div ref={rootRef} className="fixed inset-0 z-50 flex flex-col bg-slate-100">
        {/* --- Barra superior --- */}
        <div className="flex h-14 shrink-0 items-center gap-4 bg-primary px-4 text-white">
          <button
            type="button"
            onClick={() => onClose(normalizeOrder(blocks))}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-white/80 hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
            Cerrar
          </button>
          <p className="min-w-0 truncate font-heading text-sm font-semibold">{title || 'Sin título'}</p>

          <div className="mx-auto flex gap-1 rounded-lg bg-white/10 p-1">
            {devices.map((d) => (
              <button
                key={d.value}
                type="button"
                title={d.label}
                onClick={() => setDevice(d.value)}
                className={cx(
                  'flex items-center gap-1.5 rounded-md px-3 py-1 text-xs transition-colors',
                  device === d.value ? 'bg-white text-primary' : 'text-white/70 hover:text-white',
                )}
              >
                <d.icon size={14} />
                <span className="hidden lg:inline">{d.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Deshacer (Ctrl+Z)"
              onClick={undo}
              disabled={!history.past.length}
              className="rounded-md p-2 text-white/80 hover:bg-white/10 disabled:opacity-30"
            >
              <Undo2 size={16} />
            </button>
            <button
              type="button"
              title="Rehacer (Ctrl+Shift+Z)"
              onClick={redo}
              disabled={!history.future.length}
              className="rounded-md p-2 text-white/80 hover:bg-white/10 disabled:opacity-30"
            >
              <Redo2 size={16} />
            </button>
          </div>

          {dirty ? (
            <span className="hidden text-xs text-amber-300 md:inline">Cambios sin guardar</span>
          ) : (
            justSaved && (
              <span className="hidden items-center gap-1 text-xs text-secondary md:flex">
                <Check size={14} /> Guardado
              </span>
            )
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 rounded-md bg-secondary px-4 py-1.5 text-sm font-medium text-slate-900 hover:bg-secondary/90 disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Guardar
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          <Canvas />

          {/* --- Panel lateral --- */}
          <aside className="w-[22rem] shrink-0 overflow-y-auto border-l border-tertiary/20 bg-white">
            {adding ? (
              <AddPanel request={adding} onPickLayout={addLayout} onPickModule={addModule} onCancel={() => setAdding(null)} />
            ) : selected ? (
              <SettingsPanel
                key={selected.id}
                block={selected}
                ancestors={selectedLoc!.ancestors}
                device={device}
                setDevice={setDevice}
                update={(id, fn, key) => change((b) => updateBlock(b, id, fn), key)}
                select={(id) => setSelectedId(id)}
                onClose={() => setSelectedId(null)}
              />
            ) : (
              <Layers blocks={blocks} onSelect={setSelectedId} onHover={setHoveredId} hoveredId={hoveredId} />
            )}
          </aside>
        </div>
      </div>
    </BuilderContext.Provider>
  );
}

// --- Capas: el árbol de la página, útil para llegar a contenedores tapados por su contenido ---

const indent = ['pl-3', 'pl-6', 'pl-9', 'pl-12', 'pl-15', 'pl-18', 'pl-21'];

function summary(block: IPageBlock) {
  const p = block.props as Record<string, unknown>;
  if (block.type === 'heading' || block.type === 'button') return String(p.text ?? '');
  if (block.type === 'card') return String(p.title ?? '');
  if (block.type === 'testimonial') return String(p.name ?? '');
  if (block.type === 'counter') return `${p.prefix ?? ''}${p.number ?? ''}${p.suffix ?? ''}`;
  if (block.type === 'map') return String(p.address ?? '');
  if (block.type === 'accordion' || block.type === 'tabs' || block.type === 'gallery') {
    const n = ((p.items ?? p.images) as unknown[] | undefined)?.length ?? 0;
    return `${n} elemento${n === 1 ? '' : 's'}`;
  }
  if (block.type === 'text') {
    const first = JSON.stringify(p.content ?? '').match(/"text":"([^"]{1,40})/);
    return first?.[1] ?? '';
  }
  return '';
}

function Layers({
  blocks,
  onSelect,
  onHover,
  hoveredId,
}: {
  blocks: IPageBlock[];
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  hoveredId: string | null;
}) {
  const rows: { block: IPageBlock; depth: number }[] = [];
  const walk = (list: IPageBlock[], depth: number) =>
    list.forEach((b) => {
      rows.push({ block: b, depth });
      if (b.children) walk(b.children, depth + 1);
    });
  walk(blocks, 0);

  return (
    <div>
      <PanelHeader title="Estructura de la página" />
      {rows.length === 0 ? (
        <div className="space-y-2 p-4 text-xs text-tertiary">
          <p>La página está vacía.</p>
          <p>
            Empieza con <span className="font-medium text-sky-600">Añadir sección</span>, elige cómo repartir las columnas
            y después añade módulos: títulos, textos, imágenes, botones…
          </p>
        </div>
      ) : (
        <>
          <p className="px-4 pt-3 text-[11px] text-tertiary">Haz clic en un elemento del lienzo o de esta lista para editarlo.</p>
          <div className="py-2" onMouseLeave={() => onHover(null)}>
            {rows.map(({ block, depth }) => {
              const meta = metaOf(block.type);
              const text = summary(block);
              return (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => onSelect(block.id)}
                  onMouseEnter={() => onHover(block.id)}
                  className={cx(
                    'flex w-full items-center gap-2 py-1.5 pr-3 text-left text-xs',
                    indent[Math.min(depth, indent.length - 1)],
                    hoveredId === block.id ? 'bg-background' : 'hover:bg-background',
                  )}
                >
                  <span className={cx('flex h-5 w-5 shrink-0 items-center justify-center rounded text-white', meta.chip)}>
                    <meta.icon size={12} />
                  </span>
                  <span className="text-primary">{meta.label}</span>
                  {text && <span className="truncate text-tertiary">{text}</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
