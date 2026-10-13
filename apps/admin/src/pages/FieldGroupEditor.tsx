import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Copy, Eye, GripVertical, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import type { FieldType, ICollection, IFieldDefinition, IFieldGroup } from '@raco/shared';
import { api } from '../lib/api';
import FieldSettings from '../components/fields/FieldSettings';
import FieldTypePicker from '../components/fields/FieldTypePicker';
import { fieldTypeInfo, inputClass, toFieldKey } from '../components/fields/fieldTypes';

// La vista previa usa el editor de texto con formato (Tiptap), que pesa bastante
const FormPreview = lazy(() => import('../components/fields/FormPreview'));

// uid solo vive en el builder (keys de React, drag y campo abierto); no se guarda
type DraftField = IFieldDefinition & { uid: string };

let seq = 0;
const newUid = () => `f${++seq}`;

const KEY_PATTERN = /^[a-z0-9_]+$/;

// Datos que toda entrada ya trae; crearlos como campo los duplicaría
const BUILT_IN: Record<string, string> = {
  titulo: 'Todas las entradas ya tienen su propio Título, no hace falta crearlo',
  title: 'Todas las entradas ya tienen su propio Título, no hace falta crearlo',
  slug: 'El enlace (slug) de cada entrada ya se genera solo',
};

export default function FieldGroupEditor() {
  const { groupId = 'new' } = useParams();
  const isNew = groupId === 'new';
  const navigate = useNavigate();

  const [collections, setCollections] = useState<ICollection[]>([]);
  const [name, setName] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [fields, setFields] = useState<DraftField[]>([]);
  const [openUid, setOpenUid] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [dragUid, setDragUid] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<ICollection[]>('/collections'),
      isNew ? Promise.resolve(null) : api.get<IFieldGroup>(`/field-groups/${groupId}`),
    ])
      .then(([cols, group]) => {
        setCollections(cols);
        setName(group?.name ?? '');
        setCollectionId(group?.collectionId ?? '');
        setFields((group?.fields ?? []).map((f) => ({ ...f, uid: newUid() })));
        setOpenUid(null);
        setDirty(false);
      })
      .catch(() => setError('No se encontró el grupo de campos'))
      .finally(() => setLoading(false));
  }, [groupId]);

  // Avisa antes de cerrar o recargar la pestaña con cambios sin guardar
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function touch() {
    setSaved(false);
    setDirty(true);
  }

  function clearError(key: string) {
    if (errors[key]) setErrors(({ [key]: _, ...rest }) => rest);
  }

  function addField(type: FieldType) {
    const field: DraftField = { uid: newUid(), key: '', label: '', type, ...(type === 'select' ? { options: [] } : {}) };
    setFields([...fields, field]);
    setOpenUid(field.uid);
    setJustAdded(field.uid);
    setPicking(false);
    touch();
  }

  function updateField(uid: string, patch: Partial<IFieldDefinition>) {
    setFields((prev) => prev.map((f) => (f.uid === uid ? { ...f, ...patch } : f)));
    clearError(uid);
    clearError(`key:${uid}`);
    touch();
  }

  function duplicateField(index: number) {
    const source = fields[index];
    const label = `${source.label} (copia)`;
    const copy: DraftField = { ...source, uid: newUid(), label, key: toFieldKey(label) };
    setFields([...fields.slice(0, index + 1), copy, ...fields.slice(index + 1)]);
    setOpenUid(copy.uid);
    touch();
  }

  function removeField(field: DraftField) {
    setFields(fields.filter((f) => f.uid !== field.uid));
    setConfirmRemove(null);
    if (openUid === field.uid) setOpenUid(null);
    clearError(field.uid);
    clearError(`key:${field.uid}`);
    touch();
  }

  // Reordenamiento en vivo: el campo arrastrado ocupa la posición sobre la que pasa
  function handleDragOver(e: React.DragEvent, overUid: string) {
    e.preventDefault();
    if (!dragUid || dragUid === overUid) return;
    setFields((prev) => {
      const from = prev.findIndex((f) => f.uid === dragUid);
      const to = prev.findIndex((f) => f.uid === overUid);
      const next = [...prev];
      next.splice(to, 0, next.splice(from, 1)[0]);
      return next;
    });
    touch();
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.__name = 'Escribe un nombre para el grupo';
    if (!collectionId) errs.__location = 'Elige en qué colección se usa';

    const labels = new Set<string>();
    const keys = new Set<string>();
    for (const f of fields) {
      const label = f.label.trim().toLowerCase();

      if (!label) errs[f.uid] = 'Escribe el nombre del campo';
      else if (BUILT_IN[f.key]) errs[f.uid] = BUILT_IN[f.key];
      else if (labels.has(label)) errs[f.uid] = `Ya hay otro campo llamado "${f.label.trim()}"`;
      else if (!f.key) errs[f.uid] = 'El nombre necesita al menos una letra o número';
      else if (!KEY_PATTERN.test(f.key)) {
        errs[f.uid] = 'Revisa el nombre interno en "Más opciones"';
        errs[`key:${f.uid}`] = 'Solo minúsculas, números y guiones bajos (_)';
      } else if (keys.has(f.key)) {
        errs[f.uid] = 'Revisa el nombre interno en "Más opciones"';
        errs[`key:${f.uid}`] = `"${f.key}" ya lo usa otro campo de este grupo`;
      } else if (f.type === 'select' && !(f.options ?? []).some((o) => o.trim()))
        errs[f.uid] = 'Agrega al menos una opción a la lista';

      labels.add(label);
      keys.add(f.key);
    }

    setErrors(errs);
    const firstWithError = fields.find((f) => errs[f.uid]);
    if (firstWithError) setOpenUid(firstWithError.uid);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    setError('');

    const payload = {
      name: name.trim(),
      collectionId,
      fields: fields.map(({ uid, ...f }) => ({
        ...f,
        label: f.label.trim(),
        ...(f.options ? { options: f.options.map((o) => o.trim()).filter(Boolean) } : {}),
      })),
    };

    try {
      if (isNew) {
        const created = await api.post<IFieldGroup>('/field-groups', payload);
        navigate(`/field-groups/${created.id}`, { replace: true });
      } else {
        await api.put(`/field-groups/${groupId}`, payload);
      }
      setSaved(true);
      setDirty(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-tertiary">Cargando...</p>;

  return (
    <div>
      <Link to="/field-groups" className="inline-flex items-center gap-1.5 text-sm text-tertiary hover:text-primary mb-3">
        <ArrowLeft size={15} />
        Grupos de Campos
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">
            {isNew ? 'Nuevo grupo de campos' : 'Editar grupo de campos'}
          </h1>
          <p className="text-sm text-tertiary mt-1">Define qué datos se piden al crear una entrada.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {saved && !dirty && (
            <span className="flex items-center gap-1 text-sm text-secondary">
              <Check size={15} />
              Guardado
            </span>
          )}
          {dirty && <span className="text-sm text-amber-600">Tienes cambios sin guardar</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-secondary text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-secondary/90 transition-colors disabled:opacity-60"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            Guardar
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
      )}

      {/* --- Datos del grupo --- */}
      <div className="bg-white rounded-xl border border-tertiary/20 p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-primary">Nombre del grupo</label>
          <p className="text-xs text-tertiary mb-1.5">Solo para identificarlo en el panel</p>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearError('__name');
              touch();
            }}
            placeholder="Ej: Datos del viaje"
            className={inputClass}
          />
          {errors.__name && <p className="text-xs text-red-500 mt-1">{errors.__name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-primary">¿Dónde se usa?</label>
          <p className="text-xs text-tertiary mb-1.5">Estos campos aparecerán al crear entradas de esta colección</p>
          <select
            value={collectionId}
            onChange={(e) => {
              setCollectionId(e.target.value);
              clearError('__location');
              touch();
            }}
            className={inputClass}
          >
            <option value="">Elegir colección...</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.__location && <p className="text-xs text-red-500 mt-1">{errors.__location}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* --- Campos --- */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-tertiary/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-tertiary/15">
            <h2 className="font-heading text-base font-semibold text-primary">Campos</h2>
            <p className="text-xs text-tertiary">
              El <span className="text-primary">título</span> y el enlace ya vienen incluidos en todas las entradas.
              Aquí añade solo los datos extra. Arrastra un campo para cambiar su orden.
            </p>
          </div>

          {fields.map((field, i) => {
            const info = fieldTypeInfo(field.type);
            const isOpen = openUid === field.uid;
            return (
              <div
                key={field.uid}
                className={`border-b border-tertiary/10 ${dragUid === field.uid ? 'opacity-50' : ''} ${
                  errors[field.uid] ? 'bg-red-50/50' : ''
                }`}
              >
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', field.uid);
                    setDragUid(field.uid);
                  }}
                  onDragOver={(e) => handleDragOver(e, field.uid)}
                  onDragEnd={() => setDragUid(null)}
                  onClick={() => setOpenUid(isOpen ? null : field.uid)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    isOpen ? 'bg-secondary/5' : 'hover:bg-background/60'
                  }`}
                >
                  <GripVertical size={16} className="text-tertiary/60 cursor-grab shrink-0" />
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/5 text-primary">
                    <info.icon size={17} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">
                      {field.label || <span className="text-tertiary italic">Campo sin nombre</span>}
                    </p>
                    <p className="text-xs text-tertiary">
                      {info.label}
                      {field.required && <span className="ml-2 text-secondary">· Obligatorio</span>}
                    </p>
                    {errors[field.uid] && <p className="text-xs text-red-500 mt-0.5">{errors[field.uid]}</p>}
                  </div>
                  {confirmRemove === field.uid ? (
                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span className="text-sm text-primary">¿Quitar este campo?</span>
                      <button
                        type="button"
                        onClick={() => removeField(field)}
                        className="px-3 py-1 rounded-md bg-red-500 text-white text-sm font-medium hover:bg-red-600"
                      >
                        Quitar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmRemove(null)}
                        className="text-sm text-tertiary hover:text-primary"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <IconButton title="Editar" onClick={() => setOpenUid(isOpen ? null : field.uid)}>
                        <Pencil size={15} />
                      </IconButton>
                      <IconButton title="Duplicar" onClick={() => duplicateField(i)}>
                        <Copy size={15} />
                      </IconButton>
                      <IconButton
                        title="Quitar"
                        danger
                        onClick={() => (field.label ? setConfirmRemove(field.uid) : removeField(field))}
                      >
                        <Trash2 size={15} />
                      </IconButton>
                    </div>
                  )}
                </div>

                {isOpen && (
                  <FieldSettings
                    field={field}
                    autoFocus={justAdded === field.uid}
                    keyError={errors[`key:${field.uid}`]}
                    onChange={(patch) => updateField(field.uid, patch)}
                    onDone={() => setOpenUid(null)}
                  />
                )}
              </div>
            );
          })}

          {/* --- Añadir campo --- */}
          {picking || fields.length === 0 ? (
            <div className="p-5 bg-background/40">
              <p className="text-sm font-medium text-primary mb-0.5">
                {fields.length === 0 ? 'Empieza eligiendo el primer dato que quieres pedir' : '¿Qué tipo de dato quieres pedir?'}
              </p>
              <p className="text-xs text-tertiary mb-3">Podrás cambiarlo después</p>
              <FieldTypePicker onSelect={addField} />
              {fields.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPicking(false)}
                  className="mt-3 text-sm text-tertiary hover:text-primary"
                >
                  Cancelar
                </button>
              )}
            </div>
          ) : (
            <div className="p-4">
              <button
                type="button"
                onClick={() => {
                  setPicking(true);
                  setOpenUid(null);
                }}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border-2 border-dashed border-tertiary/30 text-sm font-medium text-tertiary hover:border-secondary hover:text-secondary transition-colors"
              >
                <Plus size={16} />
                Añadir campo
              </button>
            </div>
          )}
        </div>

        {/* --- Vista previa --- */}
        <div className="lg:col-span-2 lg:sticky lg:top-8 bg-white rounded-xl border border-tertiary/20 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-tertiary/15">
            <Eye size={16} className="text-tertiary" />
            <div>
              <h2 className="font-heading text-base font-semibold text-primary">Vista previa</h2>
              <p className="text-xs text-tertiary">Así se verá al crear una entrada</p>
            </div>
          </div>
          <div className="p-6">
            <Suspense fallback={<p className="text-sm text-tertiary">Cargando...</p>}>
              <FormPreview fields={fields} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconButton({
  title,
  danger,
  onClick,
  children,
}: {
  title: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded-md text-tertiary transition-colors ${
        danger ? 'hover:text-red-500 hover:bg-red-50' : 'hover:text-primary hover:bg-background'
      }`}
    >
      {children}
    </button>
  );
}
