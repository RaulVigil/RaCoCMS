import { useEffect, useState } from 'react';
import { Plus, Trash2, GripVertical, Pencil } from 'lucide-react';
import { api } from '../lib/api';

type FieldType = 'text' | 'textarea' | 'richtext' | 'image' | 'select' | 'toggle' | 'number' | 'date' | 'url';

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
}

interface FieldGroup {
  id: number;
  name: string;
  collectionId: string;
  fields: FieldDef[];
}

const fieldTypes: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Texto' },
  { value: 'textarea', label: 'Área de texto' },
  { value: 'richtext', label: 'Editor rico' },
  { value: 'image', label: 'Imagen' },
  { value: 'select', label: 'Select' },
  { value: 'toggle', label: 'Toggle' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Fecha' },
  { value: 'url', label: 'URL' },
];

export default function FieldGroups() {
  const [groups, setGroups] = useState<FieldGroup[]>([]);
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<FieldGroup | null>(null);
  const [name, setName] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [fields, setFields] = useState<FieldDef[]>([]);

  useEffect(() => {
    api.get<FieldGroup[]>('/field-groups').then(setGroups);
    api.get<{ id: string; name: string }[]>('/collections').then(setCollections);
  }, []);

  function openCreate() {
    setSelectedGroup(null);
    setName('');
    setCollectionId('');
    setFields([]);
  }

  function openEdit(group: FieldGroup) {
    setSelectedGroup(group);
    setName(group.name);
    setCollectionId(group.collectionId);
    setFields([...group.fields]);
  }

  function addField() {
    setFields([...fields, { key: '', label: '', type: 'text' }]);
  }

  function updateField(index: number, data: Partial<FieldDef>) {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...data };
    if (!updated[index].key && data.label) {
      updated[index].key = data.label.toLowerCase().replace(/\s+/g, '_');
    }
    setFields(updated);
  }

  function removeField(index: number) {
    setFields(fields.filter((_, i) => i !== index));
  }

  async function handleSave() {
    const payload = { name, collectionId, fields };
    if (selectedGroup) {
      await api.put(`/field-groups/${selectedGroup.id}`, payload);
    } else {
      await api.post('/field-groups', payload);
    }
    const updated = await api.get<FieldGroup[]>('/field-groups');
    setGroups(updated);
    setSelectedGroup(null);
    setFields([]);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-primary">Grupos de Campos</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary/90"
        >
          <Plus size={16} />
          Nuevo grupo
        </button>
      </div>

      {/* Builder */}
      {(selectedGroup !== null || (!selectedGroup && name === '' && fields.length === 0 && !groups.length)) && !selectedGroup && name === '' && fields.length === 0 && groups.length > 0 ? null : (
        <div className="bg-white rounded-xl border border-tertiary/20 p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-tertiary mb-1">Nombre del grupo</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej: Campos de Noticia"
                className="w-full px-3 py-2 rounded-md border border-tertiary/30 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
              />
            </div>
            <div>
              <label className="block text-sm text-tertiary mb-1">Colección</label>
              <select
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-tertiary/30 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
              >
                <option value="">Seleccionar...</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {fields.map((field, i) => (
              <div key={i} className="flex items-center gap-2 bg-background p-2 rounded-lg">
                <GripVertical size={16} className="text-tertiary" />
                <input
                  value={field.label}
                  onChange={(e) => updateField(i, { label: e.target.value })}
                  placeholder="Etiqueta"
                  className="flex-1 px-2 py-1.5 rounded border border-tertiary/20 text-sm"
                />
                <input
                  value={field.key}
                  onChange={(e) => updateField(i, { key: e.target.value })}
                  placeholder="key"
                  className="w-28 px-2 py-1.5 rounded border border-tertiary/20 text-sm font-mono"
                />
                <select
                  value={field.type}
                  onChange={(e) => updateField(i, { type: e.target.value as FieldType })}
                  className="px-2 py-1.5 rounded border border-tertiary/20 text-sm"
                >
                  {fieldTypes.map((ft) => (
                    <option key={ft.value} value={ft.value}>{ft.label}</option>
                  ))}
                </select>
                <button onClick={() => removeField(i)} className="p-1 text-tertiary hover:text-red-500">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={addField}
              className="flex items-center gap-2 text-sm text-secondary hover:text-secondary/80"
            >
              <Plus size={14} />
              Añadir campo
            </button>
            {fields.length > 0 && (
              <button onClick={handleSave} className="bg-secondary text-white px-4 py-1.5 rounded-md text-sm">
                Guardar grupo
              </button>
            )}
          </div>
        </div>
      )}

      {(!selectedGroup && name === '' && fields.length === 0) && (
        <div className="bg-white rounded-xl border border-tertiary/20 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-tertiary/10">
                <th className="text-left px-6 py-3 text-sm font-medium text-tertiary">Grupo</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-tertiary">Colección</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-tertiary">Campos</th>
                <th className="w-24 px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-tertiary text-sm">
                    No hay grupos de campos. Creá uno para empezar.
                  </td>
                </tr>
              ) : (
                groups.map((g) => (
                  <tr key={g.id} className="border-b border-tertiary/5 hover:bg-background/50">
                    <td className="px-6 py-3 text-sm font-medium text-primary">{g.name}</td>
                    <td className="px-6 py-3 text-sm text-tertiary">{g.collectionId}</td>
                    <td className="px-6 py-3 text-sm text-tertiary">{g.fields.length} campos</td>
                    <td className="px-6 py-3">
                      <button onClick={() => openEdit(g)} className="p-1.5 text-tertiary hover:text-primary">
                        <Pencil size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
