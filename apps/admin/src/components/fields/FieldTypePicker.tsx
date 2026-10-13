import type { FieldType } from '@raco/shared';
import { fieldTypes } from './fieldTypes';

interface Props {
  selected?: FieldType;
  onSelect: (type: FieldType) => void;
}

export default function FieldTypePicker({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
      {fieldTypes.map(({ value, label, description, example, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onSelect(value)}
          className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
            selected === value
              ? 'border-secondary bg-secondary/10'
              : 'border-tertiary/25 bg-white hover:border-secondary hover:bg-secondary/5'
          }`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/5 text-primary">
            <Icon size={18} />
          </span>
          <span>
            <span className="block text-sm font-medium text-primary">{label}</span>
            <span className="block text-xs text-tertiary">{description}</span>
            <span className="block text-xs text-tertiary/80 italic mt-0.5">Ej: {example}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
