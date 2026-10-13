import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { ICollection, IFieldGroup } from '@raco/shared';
import { api } from '../lib/api';
import { fieldTypeInfo } from '../components/fields/fieldTypes';

export default function FieldGroups() {
  const [groups, setGroups] = useState<IFieldGroup[]>([]);
  const [collections, setCollections] = useState<ICollection[]>([]);

  async function load() {
    setGroups(await api.get<IFieldGroup[]>('/field-groups'));
  }

  useEffect(() => {
    load();
    api.get<ICollection[]>('/collections').then(setCollections);
  }, []);

  async function handleDelete(group: IFieldGroup) {
    if (!confirm(`¿Eliminar el grupo "${group.name}"? Las entradas conservan sus datos, pero dejarán de mostrarse estos campos.`))
      return;
    await api.delete(`/field-groups/${group.id}`);
    load();
  }

  const collectionName = (id: string) => collections.find((c) => c.id === id)?.name ?? id;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Grupos de Campos</h1>
          <p className="text-sm text-tertiary mt-1">
            Definen qué datos se piden en cada colección. Ej: un viaje tiene precio, fecha de salida y foto.
          </p>
        </div>
        <Link
          to="/field-groups/new"
          className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary/90 transition-colors"
        >
          <Plus size={16} />
          Nuevo grupo
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-tertiary/20 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-tertiary/10">
              <th className="text-left px-6 py-3 text-sm font-medium text-tertiary">Grupo</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-tertiary">Se usa en</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-tertiary">Campos</th>
              <th className="w-24 px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-tertiary text-sm">
                  No hay grupos de campos. Crea uno para empezar.
                </td>
              </tr>
            ) : (
              groups.map((g) => (
                <tr key={g.id} className="border-b border-tertiary/5 hover:bg-background/50">
                  <td className="px-6 py-3 text-sm">
                    <Link to={`/field-groups/${g.id}`} className="font-medium text-primary hover:text-secondary">
                      {g.name}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-sm text-tertiary">{collectionName(g.collectionId)}</td>
                  <td className="px-6 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {g.fields.slice(0, 5).map((f) => {
                        const Icon = fieldTypeInfo(f.type).icon;
                        return (
                          <span
                            key={f.key}
                            title={fieldTypeInfo(f.type).label}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-background text-xs text-primary"
                          >
                            <Icon size={12} className="text-tertiary" />
                            {f.label}
                          </span>
                        );
                      })}
                      {g.fields.length > 5 && <span className="text-xs text-tertiary">+{g.fields.length - 5}</span>}
                      {g.fields.length === 0 && <span className="text-sm text-tertiary">Sin campos</span>}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-1">
                      <Link to={`/field-groups/${g.id}`} className="p-1.5 text-tertiary hover:text-primary transition-colors">
                        <Pencil size={15} />
                      </Link>
                      <button
                        onClick={() => handleDelete(g)}
                        className="p-1.5 text-tertiary hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
