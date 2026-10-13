import { useState } from 'react';
import type { IFieldDefinition } from '@raco/shared';
import FieldInput from './FieldInput';
import { widthClass } from './fieldTypes';

type PreviewField = IFieldDefinition & { uid: string };

// Muestra el formulario tal como lo verá quien carga entradas; lo que se escribe aquí no se guarda
export default function FormPreview({ fields }: { fields: PreviewField[] }) {
  const [values, setValues] = useState<Record<string, unknown>>({});

  if (fields.length === 0) {
    return <p className="text-sm text-tertiary text-center py-8">Los campos que añadas aparecerán aquí.</p>;
  }

  return (
    <div className="grid grid-cols-12 gap-x-4 gap-y-5">
      {fields.map((field) => {
        // Si cambia el tipo, el valor de prueba anterior ya no sirve
        const id = `${field.uid}-${field.type}`;
        return (
          <div key={id} className={widthClass[field.width ?? 100]}>
            <FieldInput
              field={{ ...field, label: field.label || 'Campo sin nombre' }}
              value={values[id] ?? field.defaultValue}
              onChange={(v) => setValues((prev) => ({ ...prev, [id]: v }))}
            />
          </div>
        );
      })}
    </div>
  );
}
