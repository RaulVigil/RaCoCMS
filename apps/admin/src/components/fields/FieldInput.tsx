import { useRef, useState } from 'react';
import { ImagePlus, Images, Loader2, X } from 'lucide-react';
import type { JSONContent } from '@tiptap/react';
import type { IFieldDefinition } from '@raco/shared';
import { uploadFile } from '../../lib/api';
import RichTextEditor from './RichTextEditor';
import { inputClass } from './fieldTypes';
import { AiMenu } from '../AiMenu';
import MediaPicker from '../media/MediaPicker';

interface Props {
  field: IFieldDefinition;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
}

export default function FieldInput({ field, value, error, onChange }: Props) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="block text-sm text-primary font-medium">
          {field.label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {(field.type === 'text' || field.type === 'textarea') && (
          <AiMenu text={typeof value === 'string' ? value : ''} onResult={onChange} />
        )}
      </div>
      {field.instructions && <p className="text-xs text-tertiary mb-1.5">{field.instructions}</p>}
      <Control field={field} value={value} onChange={onChange} />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function Control({ field, value, onChange }: Omit<Props, 'error'>) {
  const text = typeof value === 'string' ? value : '';

  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          rows={field.rows ?? 4}
          value={text}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );

    case 'richtext':
      return (
        <RichTextEditor value={(value as JSONContent | null) ?? null} onChange={onChange} />
      );

    case 'number':
      return (
        <input
          type="number"
          value={typeof value === 'number' ? value : ''}
          min={field.min}
          max={field.max}
          step={field.step}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          className={inputClass}
        />
      );

    case 'date':
      return <input type="date" value={text} onChange={(e) => onChange(e.target.value)} className={inputClass} />;

    case 'url':
      return (
        <input
          type="url"
          value={text}
          placeholder={field.placeholder ?? 'https://'}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );

    case 'select':
      return (
        <select value={text} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          <option value="">Seleccionar...</option>
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

    case 'toggle': {
      const on = value === true;
      return (
        <button
          type="button"
          role="switch"
          aria-checked={on}
          onClick={() => onChange(!on)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? 'bg-secondary' : 'bg-tertiary/40'}`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`}
          />
        </button>
      );
    }

    case 'image':
      return <ImageField value={text} onChange={onChange} />;

    default:
      return (
        <input
          type="text"
          value={text}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );
  }
}

// Sube la imagen al endpoint de media (se convierte a WebP) y guarda solo la URL
function ImageField({ value, onChange }: { value: string; onChange: (v: string | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [library, setLibrary] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const res = await uploadFile(file);
      onChange(res.url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="" className="h-36 rounded-lg border border-tertiary/20 object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-2 -right-2 p-1 rounded-full bg-white border border-tertiary/30 text-tertiary hover:text-red-500"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-6 flex-1 justify-center rounded-lg border-2 border-dashed border-tertiary/30 text-sm text-tertiary hover:border-secondary hover:text-secondary disabled:opacity-60"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
            {uploading ? 'Subiendo...' : 'Subir imagen'}
          </button>
          <button
            type="button"
            onClick={() => setLibrary(true)}
            className="flex items-center gap-2 px-4 rounded-lg border border-tertiary/30 text-sm text-primary hover:bg-background"
          >
            <Images size={18} /> Biblioteca
          </button>
        </div>
      )}
      {library && (
        <MediaPicker
          onClose={() => setLibrary(false)}
          onSelect={([media]) => {
            setLibrary(false);
            if (media) onChange(media.url);
          }}
        />
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
