import type { DragEvent, MouseEvent } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Copy, EyeOff, GripVertical, Plus, Trash2 } from 'lucide-react';
import type { IPageBlock } from '@raco/shared';
import { blockComponents, canDropInto, cx, designVarClasses, EditorContext, isContainer, locate, visibilityOf } from '@raco/blocks';
import { useBuilder, type AddKind } from './context';
import { metaOf } from './meta';

const canvasWidth = {
  desktop: 'w-full min-w-[1024px]',
  tablet: 'w-[768px]',
  mobile: 'w-[390px]',
};

export default function Canvas() {
  const b = useBuilder();

  // Una sección arrastrada por debajo de todo va al final de la página
  function onRootDragOver(e: DragEvent) {
    if (b.drag?.type !== 'section') return;
    e.preventDefault();
    b.setDropTarget({ parentId: null, index: b.blocks.length, anchorId: null, position: 'inside' });
  }

  return (
    <div
      className="flex-1 overflow-auto bg-slate-200/70 p-6"
      onClick={() => b.select(null)}
      onMouseLeave={() => b.hover(null)}
      onDragOver={onRootDragOver}
      onDrop={(e) => {
        e.preventDefault();
        b.drop();
      }}
    >
      <EditorContext.Provider value={true}>
        {/* La paleta y fuentes del sitio se aplican solo aquí dentro (variables con alcance) */}
        <div
          className={cx(
            '@container mx-auto min-h-full bg-white font-body text-primary shadow-sm transition-[width] duration-300',
            canvasWidth[b.device],
            designVarClasses(b.design),
          )}
        >
          {b.blocks.map((block) => (
            <EditableBlock key={block.id} block={block} />
          ))}

          <div className={cx('flex justify-center', b.blocks.length === 0 ? 'py-24' : 'py-10')}>
            <AddButton
              kind="section"
              label={b.blocks.length === 0 ? 'Empieza añadiendo una sección' : 'Añadir sección'}
              big={b.blocks.length === 0}
              onClick={() => b.startAdd({ kind: 'section', parentId: null, index: b.blocks.length })}
            />
          </div>
        </div>
      </EditorContext.Provider>
    </div>
  );
}

function EditableBlock({ block }: { block: IPageBlock }) {
  const b = useBuilder();
  const Component = blockComponents[block.type];
  if (!Component) return null;

  const meta = metaOf(block.type);
  const selected = b.selectedId === block.id;
  const hovered = b.hoveredId === block.id;
  const active = b.activeIds.has(block.id);
  const hiddenHere = !visibilityOf(block)[b.device];
  const container = isContainer(block.type);
  const dt = b.dropTarget;

  const outline = cx(
    '-outline-offset-2',
    selected ? cx('outline-2', meta.outline) : hovered && cx('outline-1 outline-dashed', meta.outline),
    hiddenHere && 'opacity-40',
    dt?.position === 'inside' && dt.parentId === block.id && 'bg-secondary/10',
  );

  const handlers = {
    onClick: (e: MouseEvent) => {
      e.stopPropagation();
      // Los enlaces no navegan dentro del editor, pero acordeones y pestañas sí se pueden abrir para verlos
      if (!(e.target as HTMLElement).closest('summary, label')) e.preventDefault();
      b.select(block.id);
    },
    onMouseOver: (e: MouseEvent) => {
      e.stopPropagation();
      if (!b.drag) b.hover(block.id);
    },
    onDragOver: (e: DragEvent) => handleDragOver(e, block),
  };

  function handleDragOver(e: DragEvent, target: IPageBlock) {
    const drag = b.drag;
    if (!drag) return;
    const loc = locate(b.blocks, target.id);
    if (!loc) return;

    // Sobre sí mismo o algo que lleva dentro: no hay destino válido
    if (drag.id === target.id || loc.ancestors.some((a) => a.id === drag.id)) {
      e.stopPropagation();
      return;
    }

    const accept = (t: Parameters<typeof b.setDropTarget>[0]) => {
      e.preventDefault();
      e.stopPropagation();
      b.setDropTarget(t);
    };

    // Junto a este bloque (antes o después), si su contenedor admite lo arrastrado
    const parentId = loc.parent?.id ?? null;
    if (canDropInto(b.blocks, parentId, drag.type)) {
      const el = e.currentTarget as HTMLElement;
      const rect = el.getBoundingClientRect();
      const parentRect = el.parentElement?.getBoundingClientRect();
      const horizontal = !!parentRect && rect.width < parentRect.width * 0.9 && target.type === 'column';
      const after = horizontal
        ? e.clientX > rect.left + rect.width / 2
        : e.clientY > rect.top + rect.height / 2;
      return accept({ parentId, index: loc.index + (after ? 1 : 0), anchorId: target.id, position: after ? 'after' : 'before', horizontal });
    }

    // Dentro de este contenedor, al final
    if (isContainer(target.type) && canDropInto(b.blocks, target.id, drag.type)) {
      return accept({ parentId: target.id, index: target.children?.length ?? 0, anchorId: null, position: 'inside' });
    }
    // Si no, que lo resuelva el contenedor de arriba
  }

  const indicator =
    dt?.anchorId === block.id ? (
      <div
        className={cx(
          'pointer-events-none absolute z-30 bg-secondary',
          dt.horizontal
            ? cx('inset-y-0 w-1', dt.position === 'before' ? '-left-0.5' : '-right-0.5')
            : cx('inset-x-0 h-1', dt.position === 'before' ? '-top-0.5' : '-bottom-0.5'),
        )}
      />
    ) : null;

  const overlay = (
    <>
      {(selected || hovered) && <Toolbar block={block} selected={selected} />}
      {hiddenHere && (
        <span className="absolute right-1 top-1 z-20 flex items-center gap-1 rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-white">
          <EyeOff size={11} /> Oculto aquí
        </span>
      )}
      {indicator}
      {active && !b.drag && (block.type === 'section' || block.type === 'row') && (
        <div className="absolute -bottom-3.5 left-1/2 z-20 -translate-x-1/2">
          <AddButton
            kind={block.type === 'section' ? 'section' : 'row'}
            label={block.type === 'section' ? 'Sección' : 'Fila'}
            onClick={() => {
              const loc = locate(b.blocks, block.id);
              if (loc) b.startAdd({ kind: block.type as AddKind, parentId: loc.parent?.id ?? null, index: loc.index + 1 });
            }}
          />
        </div>
      )}
    </>
  );

  if (!container) {
    return (
      <div {...handlers} className={cx('relative', outline)}>
        {overlay}
        <Component block={block} />
      </div>
    );
  }

  const children = block.children ?? [];
  return (
    <Component block={block} attrs={{ ...handlers, className: outline }} overlay={overlay}>
      {children.map((child) => (
        <EditableBlock key={child.id} block={child} />
      ))}

      {block.type === 'section' && children.length === 0 && (
        <EmptyAdd kind="row" label="Añadir fila" onClick={() => b.startAdd({ kind: 'row', parentId: block.id, index: 0 })} />
      )}
      {block.type === 'column' &&
        (children.length === 0 ? (
          <EmptyAdd kind="module" label="Añadir módulo" onClick={() => b.startAdd({ kind: 'module', parentId: block.id, index: 0 })} />
        ) : (
          active &&
          !b.drag && (
            <div className="flex justify-center">
              <AddButton
                kind="module"
                label="Módulo"
                onClick={() => b.startAdd({ kind: 'module', parentId: block.id, index: children.length })}
              />
            </div>
          )
        ))}
    </Component>
  );
}

function Toolbar({ block, selected }: { block: IPageBlock; selected: boolean }) {
  const b = useBuilder();
  const meta = metaOf(block.type);
  const sideways = block.type === 'column';
  const stop = (fn: () => void) => (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    fn();
  };

  // Cada nivel en una esquina distinta para que no se tapen entre sí
  const corner = {
    section: 'left-0 top-0 rounded-br-md',
    row: 'right-0 top-0 rounded-bl-md',
    column: 'left-0 bottom-0 rounded-tr-md',
  }[block.type] ?? 'right-0 top-0 rounded-bl-md';

  return (
    <div
      className={cx('absolute z-20 flex items-center gap-0.5 px-1 py-0.5 text-[11px] font-medium text-white shadow', meta.chip, corner)}
      onClick={(e) => e.stopPropagation()}
    >
      <span
        draggable
        title="Arrastrar para mover"
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', block.id);
          b.startDrag(block);
        }}
        onDragEnd={() => b.endDrag()}
        className="cursor-grab p-0.5"
      >
        <GripVertical size={13} />
      </span>
      <span className="pr-1">{meta.label}</span>
      {selected && (
        <>
          <ToolButton title={sideways ? 'Mover a la izquierda' : 'Subir'} onClick={stop(() => b.move(block.id, -1))}>
            {sideways ? <ArrowLeft size={13} /> : <ArrowUp size={13} />}
          </ToolButton>
          <ToolButton title={sideways ? 'Mover a la derecha' : 'Bajar'} onClick={stop(() => b.move(block.id, 1))}>
            {sideways ? <ArrowRight size={13} /> : <ArrowDown size={13} />}
          </ToolButton>
          <ToolButton title="Duplicar" onClick={stop(() => b.duplicate(block.id))}>
            <Copy size={13} />
          </ToolButton>
          <ToolButton title="Eliminar" onClick={stop(() => b.remove(block.id))}>
            <Trash2 size={13} />
          </ToolButton>
        </>
      )}
    </div>
  );
}

function ToolButton({ title, onClick, children }: { title: string; onClick: (e: MouseEvent) => void; children: React.ReactNode }) {
  return (
    <button type="button" title={title} onClick={onClick} className="rounded p-0.5 hover:bg-white/25">
      {children}
    </button>
  );
}

const addColors: Record<AddKind, string> = {
  section: 'bg-sky-500 hover:bg-sky-600',
  row: 'bg-emerald-500 hover:bg-emerald-600',
  module: 'bg-violet-500 hover:bg-violet-600',
};

function AddButton({ kind, label, big, onClick }: { kind: AddKind; label: string; big?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cx(
        'flex items-center gap-1 rounded-full font-medium text-white shadow-md transition-colors',
        addColors[kind],
        big ? 'px-6 py-3 text-sm' : 'px-2.5 py-1 text-[11px]',
      )}
    >
      <Plus size={big ? 18 : 13} />
      {label}
    </button>
  );
}

const emptyColors: Record<AddKind, string> = {
  section: 'border-sky-300 text-sky-600 hover:bg-sky-50',
  row: 'border-emerald-300 text-emerald-600 hover:bg-emerald-50',
  module: 'border-violet-300 text-violet-600 hover:bg-violet-50',
};

function EmptyAdd({ kind, label, onClick }: { kind: AddKind; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cx(
        'flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed bg-white/60 py-6 text-sm font-medium transition-colors',
        emptyColors[kind],
      )}
    >
      <Plus size={16} />
      {label}
    </button>
  );
}
