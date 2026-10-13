import { useEffect, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import type { FieldType, FieldWidth, IFieldDefinition } from '@raco/shared';
import { fieldTypeInfo, inputClass, toFieldKey } from './fieldTypes';
import FieldTypePicker from './FieldTypePicker';

interface Props {
  field: IFieldDefinition;
  autoFocus?: boolean;
  keyError?: string;
  onChange: (patch: Partial<IFieldDefinition>) => void;
  onDone: () => void;
}

const widths: { value: FieldWidth; label: string }[] = [
  { value: 100, label: 'Toda la fila' },
  { value: 50, label: 'Media fila' },
  { value: 33, label: 'Un tercio' },
  { value: 25, label: 'Un cuarto' },
];

const withExampleText: FieldType[] = ['text', 'textarea', 'number', 'url'];
const withInitialValue: FieldType[] = ['text', 'textarea', 'number', 'url', 'select', 'toggle'];

const num = (v: string) => (v === '' ? undefined : Number(v));

export default function FieldSettings({ field, autoFocus, keyError, onChange, onDone }: Props) {
  const [changingType, setChangingType] = useState(false);
  const [showMore, setShowMore] = useState(!!keyError);
  const info = fieldTypeInfo(field.type);

  // Si el error está en el nombre interno, hay que mostrarlo
  useEffect(() => {
    if (keyError) setShowMore(true);
  }, [keyError]);

  // Al cambiar de tipo solo se conservan los ajustes comunes
  function changeType(type: FieldType) {
    setChangingType(false);
    if (type === field.type) return;
    onChange({
      type,
      defaultValue: undefined,
      placeholder: undefined,
      options: type === 'select' ? field.options ?? [] : undefined,
      min: undefined,
      max: undefined,
      step: undefined,
      maxLength: undefined,
      rows: undefined,
    });
  }

  // El nombre interno sigue al nombre visible mientras no se haya editado a mano
  function changeLabel(label: string) {
    const autoKey = !field.key || field.key === toFieldKey(field.label);
    onChange(autoKey ? { label, key: toFieldKey(label) } : { label });
  }

  return (
    <div className="border-t border-tertiary/15 bg-background/60 p-5 space-y-5">
      <Setting label="Nombre del campo" help="Así lo verá quien cargue el contenido">
        <input
          autoFocus={autoFocus}
          value={field.label}
          onChange={(e) => changeLabel(e.target.value)}
          placeholder={`Ej: ${info.example.split(',')[0]}`}
          className={inputClass}
        />
        {['titulo', 'title', 'slug'].includes(toFieldKey(field.label)) && (
          <p className="text-xs text-amber-600 mt-1">
            Todas las entradas ya tienen su propio título y enlace; no hace falta crear este campo.
          </p>
        )}
      </Setting>

      <Setting label="Tipo de dato">
        {changingType ? (
          <div className="space-y-2">
            <FieldTypePicker selected={field.type} onSelect={changeType} />
            <button type="button" onClick={() => setChangingType(false)} className="text-sm text-tertiary hover:text-primary">
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 px-3 py-2 rounded-md bg-white border border-tertiary/25 text-sm text-primary">
              <info.icon size={16} className="text-tertiary" />
              {info.label}
            </span>
            <button type="button" onClick={() => setChangingType(true)} className="text-sm text-secondary hover:underline">
              Cambiar
            </button>
          </div>
        )}
      </Setting>

      {field.type === 'select' && (
        <Setting label="Opciones" help="Escribe una opción por línea">
          <textarea
            rows={4}
            value={(field.options ?? []).join('\n')}
            onChange={(e) => onChange({ options: e.target.value.split('\n') })}
            placeholder={'Disponible\nAgotado\nPróximamente'}
            className={inputClass}
          />
        </Setting>
      )}

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={!!field.required}
          onChange={() => onChange({ required: !field.required })}
          className="mt-0.5 h-4 w-4 accent-secondary"
        />
        <span>
          <span className="block text-sm font-medium text-primary">Es obligatorio</span>
          <span className="block text-xs text-tertiary">No se podrá guardar una entrada si este campo está vacío</span>
        </span>
      </label>

      {/* --- Opciones avanzadas, plegadas por defecto --- */}
      <div className="border-t border-tertiary/15 pt-4">
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="flex items-center gap-1.5 text-sm text-tertiary hover:text-primary"
        >
          <ChevronDown size={15} className={`transition-transform ${showMore ? 'rotate-180' : ''}`} />
          Más opciones
        </button>

        {showMore && (
          <div className="mt-4 space-y-5">
            <Setting label="Texto de ayuda" help="Una indicación que aparece debajo del nombre del campo">
              <input
                value={field.instructions ?? ''}
                onChange={(e) => onChange({ instructions: e.target.value || undefined })}
                placeholder="Ej: El precio en dólares, sin impuestos"
                className={inputClass}
              />
            </Setting>

            {withExampleText.includes(field.type) && (
              <Setting label="Texto de ejemplo" help="Se ve en gris dentro del campo mientras está vacío">
                <input
                  value={field.placeholder ?? ''}
                  onChange={(e) => onChange({ placeholder: e.target.value || undefined })}
                  className={inputClass}
                />
              </Setting>
            )}

            {withInitialValue.includes(field.type) && (
              <Setting label="Valor inicial" help="Viene completado al crear una entrada nueva">
                <InitialValue field={field} onChange={(defaultValue) => onChange({ defaultValue })} />
              </Setting>
            )}

            {field.type === 'number' && (
              <div className="grid grid-cols-2 gap-4">
                <Setting label="Valor mínimo">
                  <input
                    type="number"
                    value={field.min ?? ''}
                    onChange={(e) => onChange({ min: num(e.target.value) })}
                    className={inputClass}
                  />
                </Setting>
                <Setting label="Valor máximo">
                  <input
                    type="number"
                    value={field.max ?? ''}
                    onChange={(e) => onChange({ max: num(e.target.value) })}
                    className={inputClass}
                  />
                </Setting>
              </div>
            )}

            {(field.type === 'text' || field.type === 'textarea') && (
              <Setting label="Máximo de caracteres" help="Déjalo vacío si no hay límite">
                <input
                  type="number"
                  min={1}
                  value={field.maxLength ?? ''}
                  onChange={(e) => onChange({ maxLength: num(e.target.value) })}
                  className={`${inputClass} sm:w-40`}
                />
              </Setting>
            )}

            <Setting label="Tamaño en el formulario">
              <div className="flex flex-wrap gap-1">
                {widths.map((w) => (
                  <button
                    key={w.value}
                    type="button"
                    onClick={() => onChange({ width: w.value === 100 ? undefined : w.value })}
                    className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                      (field.width ?? 100) === w.value
                        ? 'border-secondary bg-secondary/10 text-primary font-medium'
                        : 'border-tertiary/25 bg-white text-tertiary hover:text-primary'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </Setting>

            <Setting
              label="Nombre interno"
              help="Se genera solo. Lo usan los desarrolladores para mostrar este dato en la web; mejor no cambiarlo si ya hay contenido cargado"
            >
              <input
                value={field.key}
                onChange={(e) => onChange({ key: e.target.value })}
                className={`${inputClass} font-mono sm:w-72`}
              />
              {keyError && <p className="text-xs text-red-500 mt-1">{keyError}</p>}
            </Setting>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onDone}
          className="px-4 py-1.5 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Listo
        </button>
      </div>
    </div>
  );
}

function Setting({ label, help, children }: { label: string; help?: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium text-primary">{label}</p>
      {help && <p className="text-xs text-tertiary mb-1.5">{help}</p>}
      <div className={help ? '' : 'mt-1.5'}>{children}</div>
    </div>
  );
}

function InitialValue({ field, onChange }: { field: IFieldDefinition; onChange: (v: unknown) => void }) {
  const value = field.defaultValue;

  if (field.type === 'toggle') {
    return (
      <select
        value={value === true ? 'si' : 'no'}
        onChange={(e) => onChange(e.target.value === 'si' ? true : undefined)}
        className={`${inputClass} sm:w-40`}
      >
        <option value="no">No</option>
        <option value="si">Sí</option>
      </select>
    );
  }

  if (field.type === 'number') {
    return (
      <input
        type="number"
        value={typeof value === 'number' ? value : ''}
        onChange={(e) => onChange(num(e.target.value))}
        className={`${inputClass} sm:w-40`}
      />
    );
  }

  if (field.type === 'select') {
    return (
      <select
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className={inputClass}
      >
        <option value="">Ninguna</option>
        {(field.options ?? [])
          .map((o) => o.trim())
          .filter(Boolean)
          .map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
      </select>
    );
  }

  return (
    <input
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      className={inputClass}
    />
  );
}
