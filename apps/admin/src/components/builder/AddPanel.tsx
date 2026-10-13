import { X } from 'lucide-react';
import { canDropInto, colSpan, cx, rowLayouts, type ModuleType, type RowLayout } from '@raco/blocks';
import { useBuilder, type AddRequest } from './context';
import { metaOf, moduleGroups } from './meta';

interface Props {
  request: AddRequest;
  onPickLayout: (layout: RowLayout) => void;
  onPickModule: (type: ModuleType) => void;
  onCancel: () => void;
}

export default function AddPanel({ request, onPickLayout, onPickModule, onCancel }: Props) {
  const b = useBuilder();
  const title = { section: 'Nueva sección', row: 'Nueva fila', module: 'Añadir módulo' }[request.kind];
  // En una columna también se puede meter una fila (columnas dentro de columnas)
  const canNestRow = request.kind === 'module' && canDropInto(b.blocks, request.parentId, 'row');

  return (
    <div>
      <PanelHeader title={title} onClose={onCancel} />
      <div className="p-4 space-y-5">
        {request.kind === 'module' &&
          moduleGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-tertiary">{group.label}</p>
              <div className="grid grid-cols-3 gap-2">
                {group.types.map((type) => {
                  const meta = metaOf(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => onPickModule(type)}
                      title={meta.description}
                      className="flex flex-col items-center gap-1.5 rounded-lg border border-tertiary/25 px-1.5 py-3 text-center transition-colors hover:border-violet-400 hover:bg-violet-50"
                    >
                      <meta.icon size={20} className="text-violet-500" />
                      <span className="text-[11px] font-medium leading-tight text-primary">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

        {(request.kind !== 'module' || canNestRow) && (
          <div>
            <p className="text-xs font-medium text-primary mb-0.5">
              {request.kind === 'module' ? 'O una fila interior' : 'Elige cómo se reparten las columnas'}
            </p>
            <p className="text-[11px] text-tertiary mb-2">
              Después puedes cambiar el ancho de cada columna en escritorio, tablet y móvil.
            </p>
            <LayoutGrid onPick={onPickLayout} />
          </div>
        )}
      </div>
    </div>
  );
}

export function LayoutGrid({ onPick }: { onPick: (layout: RowLayout) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {rowLayouts.map((layout) => (
        <button
          key={layout.id}
          type="button"
          onClick={() => onPick(layout)}
          title={layout.label}
          className="group rounded-lg border border-tertiary/25 p-2 text-left transition-colors hover:border-emerald-400 hover:bg-emerald-50"
        >
          {/* Miniatura con la misma grilla de 12 que usan las filas */}
          <div className={cx('grid grid-cols-12 gap-1', layout.rowSpans && 'grid-rows-2')}>
            {layout.spans.map((span, i) => (
              <div
                key={i}
                className={cx(
                  'h-5 rounded-sm bg-tertiary/30 group-hover:bg-emerald-400/60',
                  colSpan.mobile[span],
                  layout.rowSpans?.[i] === 2 && 'row-span-2 h-auto',
                )}
              />
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-tertiary group-hover:text-primary">{layout.label}</p>
        </button>
      ))}
    </div>
  );
}

export function PanelHeader({ title, onClose, children }: { title: string; onClose?: () => void; children?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-10 border-b border-tertiary/15 bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-heading text-sm font-semibold text-primary">{title}</h3>
        {onClose && (
          <button type="button" onClick={onClose} className="rounded p-1 text-tertiary hover:bg-background hover:text-primary">
            <X size={16} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
