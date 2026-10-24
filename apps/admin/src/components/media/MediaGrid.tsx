import { Check } from 'lucide-react';
import type { IMedia } from '@raco/shared';

// Cuadrícula de miniaturas: la usan la pantalla Multimedia y el selector de imágenes
export default function MediaGrid({
  items,
  selected,
  onClick,
  columns = 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6',
}: {
  items: IMedia[];
  selected: Set<number>;
  onClick: (item: IMedia) => void;
  columns?: string;
}) {
  return (
    <div className={`grid gap-3 ${columns}`}>
      {items.map((item) => {
        const on = selected.has(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onClick(item)}
            title={item.alt || item.originalName}
            className={`group relative aspect-square overflow-hidden rounded-lg border-2 bg-background transition-colors ${
              on ? 'border-secondary' : 'border-transparent hover:border-tertiary/40'
            }`}
          >
            <img src={item.url} alt={item.alt} loading="lazy" className="h-full w-full object-cover" />
            {on && (
              <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-white shadow">
                <Check size={14} />
              </span>
            )}
            <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/60 to-transparent px-2 pb-1.5 pt-4 text-left text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
              {item.originalName}
            </span>
          </button>
        );
      })}
    </div>
  );
}
