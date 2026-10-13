import { Type, AlignLeft, Hash, Link, Image, PenLine, List, ToggleRight, Calendar, type LucideIcon } from 'lucide-react';
import type { FieldType, FieldWidth } from '@raco/shared';

export const inputClass =
  'w-full px-3 py-2 rounded-md border border-tertiary/30 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary/50';

export interface FieldTypeInfo {
  value: FieldType;
  label: string;
  description: string;
  example: string;
  icon: LucideIcon;
}

// Nombres pensados para quien no es desarrollador
export const fieldTypes: FieldTypeInfo[] = [
  { value: 'text', label: 'Texto corto', description: 'Una sola línea de texto', example: 'Nombre, título, código', icon: Type },
  { value: 'textarea', label: 'Texto largo', description: 'Varias líneas, sin formato', example: 'Resumen, notas', icon: AlignLeft },
  { value: 'richtext', label: 'Texto con formato', description: 'Negritas, títulos y listas', example: 'Descripción, artículo', icon: PenLine },
  { value: 'number', label: 'Número', description: 'Solo acepta números', example: 'Precio, cantidad, días', icon: Hash },
  { value: 'image', label: 'Imagen', description: 'Subir una foto', example: 'Portada, foto del producto', icon: Image },
  { value: 'select', label: 'Lista de opciones', description: 'Elegir una opción de una lista', example: 'Talla, modalidad', icon: List },
  { value: 'toggle', label: 'Sí / No', description: 'Un interruptor de encendido', example: 'Destacado, incluye envío', icon: ToggleRight },
  { value: 'date', label: 'Fecha', description: 'Elegir un día en el calendario', example: 'Fecha de salida, evento', icon: Calendar },
  { value: 'url', label: 'Enlace', description: 'Una dirección web', example: 'Sitio oficial, video', icon: Link },
];

export const fieldTypeInfo = (type: FieldType) => fieldTypes.find((t) => t.value === type) ?? fieldTypes[0];

// Ancho del campo en la grilla de 12 columnas del formulario de entradas
export const widthClass: Record<FieldWidth, string> = {
  25: 'col-span-12 md:col-span-3',
  33: 'col-span-12 md:col-span-4',
  50: 'col-span-12 md:col-span-6',
  100: 'col-span-12',
};

// "Precio Final" -> "precio_final" (nombre interno con el que se guarda el dato)
export function toFieldKey(label: string) {
  return label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
