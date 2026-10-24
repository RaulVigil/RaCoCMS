import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { aiField, tones, translateTo } from '../lib/ai';

// Menú ✨ para reescribir o traducir un texto con IA. El resultado reemplaza el texto (se puede deshacer
// volviendo a escribir o con el historial de versiones).
export function AiMenu({
  text,
  onResult,
  compact,
}: {
  text: string;
  onResult: (text: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const empty = !text.trim();

  async function run(body: Parameters<typeof aiField>[0]) {
    setOpen(false);
    setBusy(true);
    setError('');
    try {
      onResult(await aiField(body));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="relative inline-flex flex-col items-end">
      <button
        type="button"
        disabled={busy || empty}
        title={empty ? 'Escribe algo primero' : 'Reescribir o traducir con IA'}
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1 rounded-md text-xs font-medium text-violet-600 hover:bg-violet-50 disabled:opacity-40 ${
          compact ? 'p-1' : 'px-2 py-1'
        }`}
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
        {!compact && (busy ? 'Pensando…' : 'IA')}
      </button>

      {open && (
        <>
          {/* Capa invisible: un clic fuera cierra el menú */}
          <span className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <span className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-tertiary/20 bg-white py-1 text-left shadow-xl">
            {tones.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => run({ action: 'rewrite', text, tone: t.value })}
                className="block w-full px-3 py-1.5 text-left text-sm text-primary hover:bg-violet-50"
              >
                {t.label}
              </button>
            ))}
            <span className="my-1 block border-t border-tertiary/15" />
            <span className="block px-3 pb-1 pt-0.5 text-[11px] uppercase tracking-wide text-tertiary">Traducir al</span>
            {translateTo.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => run({ action: 'translate', text, to: l.value })}
                className="block w-full px-3 py-1.5 text-left text-sm text-primary hover:bg-violet-50"
              >
                {l.label}
              </button>
            ))}
          </span>
        </>
      )}
      {error && <span className="mt-1 max-w-56 text-right text-[11px] text-red-500">{error}</span>}
    </span>
  );
}

// Botón de una sola acción (generar el SEO, describir una imagen...)
export function AiAction({
  label,
  run,
  onResult,
  disabled,
  disabledHint,
}: {
  label: string;
  run: () => Promise<string>;
  onResult: (text: string) => void;
  disabled?: boolean;
  disabledHint?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function go() {
    setBusy(true);
    setError('');
    try {
      onResult(await run());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={go}
        disabled={busy || disabled}
        title={disabled ? disabledHint : undefined}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-violet-600 hover:bg-violet-50 disabled:opacity-40"
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
        {busy ? 'Pensando…' : label}
      </button>
      {error && <span className="mt-1 max-w-56 text-right text-[11px] text-red-500">{error}</span>}
    </span>
  );
}
