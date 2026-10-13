import { useRef, useState, type ReactNode } from 'react';
import { ImagePlus, Loader2, Monitor, Smartphone, Tablet } from 'lucide-react';
import type { ISiteDesign } from '@raco/shared';
import { colorValue, cx, type Background, type Device, type TextColor } from '@raco/blocks';
import { uploadFile } from '../../lib/api';

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-primary mb-1">{label}</p>
      {children}
      {hint && <p className="text-[11px] text-tertiary mt-1">{hint}</p>}
    </div>
  );
}

interface Option<T> {
  value: T;
  label: ReactNode;
  title?: string;
}

// Grupo de botones excluyentes (tamaños, alineaciones...)
export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          title={o.title}
          onClick={() => onChange(o.value)}
          className={`flex-1 min-w-9 flex items-center justify-center px-2 py-1.5 rounded-md border text-xs transition-colors ${
            value === o.value
              ? 'border-secondary bg-secondary/10 text-primary font-medium'
              : 'border-tertiary/25 text-tertiary hover:text-primary hover:border-tertiary/50'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Muestras de color de la paleta (cada opción trae su clase de fondo)
export function Swatches<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; className: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.label}
          onClick={() => onChange(o.value)}
          className={`h-8 w-8 rounded-full border transition-shadow ${o.className} ${
            value === o.value ? 'ring-2 ring-secondary ring-offset-2' : 'border-tertiary/30'
          }`}
        />
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="text-xs font-medium text-primary">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-secondary' : 'bg-tertiary/40'}`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </button>
    </label>
  );
}

export const smallInput =
  'w-full px-2.5 py-1.5 rounded-md border border-tertiary/30 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary/50';

export const transparent = 'bg-[repeating-linear-gradient(45deg,#e2e8f0_0_4px,#fff_4px_8px)]';

// Las muestras usan el color real de la paleta del sitio (el panel está fuera del lienzo)
export const swatch = (design: ISiteDesign, id: string) => `bg-[${colorValue(design, id) ?? '#000000'}]`;

export const bgOptionsFor = (design: ISiteDesign): { value: Background; label: string; className: string }[] => [
  { value: 'none', label: 'Sin fondo', className: transparent },
  { value: 'white', label: 'Blanco', className: 'bg-white' },
  { value: 'light', label: 'Fondo claro', className: swatch(design, 'background') },
  { value: 'primary', label: 'Principal', className: swatch(design, 'primary') },
  { value: 'secondary', label: 'Acento', className: swatch(design, 'secondary') },
  { value: 'dark', label: 'Oscuro', className: 'bg-slate-900' },
];

export const colorOptionsFor = (design: ISiteDesign): { value: TextColor; label: string; className: string }[] => [
  { value: 'auto', label: 'Automático (según el fondo)', className: transparent },
  { value: 'primary', label: 'Principal', className: swatch(design, 'primary') },
  { value: 'secondary', label: 'Acento', className: swatch(design, 'secondary') },
  { value: 'muted', label: 'Suave', className: swatch(design, 'tertiary') },
  { value: 'white', label: 'Blanco', className: 'bg-white' },
  { value: 'dark', label: 'Oscuro', className: 'bg-slate-900' },
];

export const alignOptions = [
  { value: 'left' as const, label: 'Izq.' },
  { value: 'center' as const, label: 'Centro' },
  { value: 'right' as const, label: 'Der.' },
];

export function ImagePicker({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file?: File) {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      onChange((await uploadFile(file)).url);
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
        <div className="space-y-2">
          <img src={value} alt="" className="h-32 w-full rounded-lg border border-tertiary/20 object-cover" />
          <div className="flex gap-2 text-xs">
            <button type="button" onClick={() => inputRef.current?.click()} className="text-secondary hover:underline">
              Cambiar
            </button>
            <button type="button" onClick={() => onChange('')} className="text-red-500 hover:underline">
              Quitar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-tertiary/30 py-6 text-xs text-tertiary hover:border-secondary hover:text-secondary disabled:opacity-60"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
          {uploading ? 'Subiendo...' : 'Subir imagen'}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export const devices: { value: Device; label: string; icon: typeof Monitor }[] = [
  { value: 'desktop', label: 'Escritorio', icon: Monitor },
  { value: 'tablet', label: 'Tablet', icon: Tablet },
  { value: 'mobile', label: 'Móvil', icon: Smartphone },
];

// Selector de dispositivo dentro de un ajuste: cambia también la vista previa
export function DeviceTabs({ device, setDevice }: { device: Device; setDevice: (d: Device) => void }) {
  return (
    <div className="flex gap-0.5 rounded-md bg-background p-0.5">
      {devices.map((d) => (
        <button
          key={d.value}
          type="button"
          title={d.label}
          onClick={() => setDevice(d.value)}
          className={cx('rounded p-1', device === d.value ? 'bg-white text-secondary shadow-sm' : 'text-tertiary hover:text-primary')}
        >
          <d.icon size={13} />
        </button>
      ))}
    </div>
  );
}

export function ResponsiveField({ label, hint, device, setDevice, children }: { label: string; hint?: string; device: Device; setDevice: (d: Device) => void; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-medium text-primary">
          {label} <span className="font-normal text-tertiary">· {devices.find((d) => d.value === device)?.label}</span>
        </p>
        <DeviceTabs device={device} setDevice={setDevice} />
      </div>
      {children}
      {hint && <p className="mt-1 text-[11px] text-tertiary">{hint}</p>}
    </div>
  );
}
