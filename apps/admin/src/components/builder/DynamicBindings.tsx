import { Zap } from 'lucide-react';
import type { IPageBlock } from '@raco/shared';
import { BINDABLE, dynamicSources } from '@raco/blocks';
import { useBuilder } from './context';
import { smallInput } from './controls';

// En plantillas: cada propiedad vinculable puede tomar un dato de la entrada (título, fecha, un campo...)
export default function DynamicBindings({
  block,
  update,
}: {
  block: IPageBlock;
  update: (change: (b: IPageBlock) => IPageBlock) => void;
}) {
  const { dynamicFields } = useBuilder();
  const bindable = BINDABLE[block.type];
  if (!dynamicFields || !bindable) return null;

  const sources = dynamicSources(dynamicFields);
  const current = (block.props.dynamic ?? {}) as Record<string, string>;

  function bind(prop: string, source: string) {
    update((b) => {
      const map = { ...((b.props.dynamic ?? {}) as Record<string, string>) };
      if (source) map[prop] = source;
      else delete map[prop];
      return { ...b, props: { ...b.props, dynamic: map } };
    });
  }

  return (
    <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
        <Zap size={13} /> Datos de la entrada
      </p>
      <p className="text-[11px] text-amber-900/70">
        Vincula una propiedad y cada entrada mostrará su propio dato. Lo vinculado reemplaza a lo que escribas abajo.
      </p>
      {bindable.map(({ prop, kind, label }) => {
        const options = sources.filter((s) => s.kinds.includes(kind));
        return (
          <label key={prop} className="flex items-center justify-between gap-2 text-xs text-primary">
            <span className="shrink-0">{label}</span>
            <select
              value={current[prop] ?? ''}
              onChange={(e) => bind(prop, e.target.value)}
              className={`${smallInput} max-w-48 py-1 text-xs ${current[prop] ? 'border-amber-400 bg-white font-medium' : ''}`}
            >
              <option value="">Fijo (no vinculado)</option>
              {options.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        );
      })}
    </div>
  );
}
