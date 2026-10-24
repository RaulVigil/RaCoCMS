import { useEffect, useRef, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import type { IPageBlock } from '@raco/shared';
import { cx } from '@raco/blocks';
import AiPageForm from '../ai/AiPageForm';

export type AiMode = 'replace' | 'append';

// Generar con IA desde el constructor: la página entera o secciones que se suman al final
export default function AiDialog({
  title,
  hasContent,
  onClose,
  onResult,
}: {
  title: string;
  hasContent: boolean;
  onClose: () => void;
  onResult: (blocks: IPageBlock[], mode: AiMode) => void;
}) {
  const [mode, setMode] = useState<AiMode>(hasContent ? 'append' : 'replace');
  // Si se cierra mientras genera, la respuesta que llegue después se descarta
  const open = useRef(true);
  useEffect(() => {
    open.current = true; // StrictMode monta, desmonta y vuelve a montar
    return () => {
      open.current = false;
    };
  }, []);

  const modes: { value: AiMode; label: string; hint: string }[] = [
    { value: 'append', label: 'Añadir secciones', hint: 'Se suman al final de la página' },
    { value: 'replace', label: 'Página completa', hint: 'Reemplaza lo que hay ahora' },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <Sparkles size={20} />
          </span>
          <div className="flex-1">
            <h2 className="font-heading text-lg font-semibold text-primary">Generar con IA</h2>
            <p className="text-sm text-tertiary">
              Describe lo que necesitas y la IA lo arma con secciones, columnas y módulos de verdad.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-tertiary hover:bg-background hover:text-primary">
            <X size={18} />
          </button>
        </div>

        <AiPageForm
          scope={mode === 'replace' ? 'page' : 'sections'}
          pageTitle={title}
          submitLabel={mode === 'replace' ? 'Generar página' : 'Generar secciones'}
          onDone={({ blocks }) => {
            if (open.current) onResult(blocks, mode);
          }}
        >
          {hasContent && (
            <div className="grid grid-cols-2 gap-2">
              {modes.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMode(m.value)}
                  className={cx(
                    'rounded-lg border px-3 py-2 text-left transition-colors',
                    mode === m.value ? 'border-violet-500 bg-violet-50' : 'border-tertiary/25 hover:border-tertiary/50',
                  )}
                >
                  <p className="text-sm font-medium text-primary">{m.label}</p>
                  <p className="text-xs text-tertiary">{m.hint}</p>
                </button>
              ))}
            </div>
          )}
        </AiPageForm>
        {hasContent && <p className="mt-3 text-xs text-tertiary">Si no te convence, Ctrl+Z lo deshace.</p>}
      </div>
    </div>
  );
}
