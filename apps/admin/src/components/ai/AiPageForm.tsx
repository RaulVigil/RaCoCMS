import { useEffect, useState, type ReactNode } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { aiPage, pageIdeas, sectionIdeas, type AiPageResult } from '../../lib/aiPage';

// Lo que se ve mientras la IA arma la página: tarda bastante más que una acción por campo
const steps = ['Pensando la estructura…', 'Escribiendo los textos…', 'Eligiendo columnas e íconos…', 'Armando los bloques…'];

export default function AiPageForm({
  scope,
  pageTitle,
  submitLabel,
  children,
  onDone,
}: {
  scope: 'page' | 'sections';
  pageTitle?: string;
  submitLabel: string;
  children?: ReactNode; // opciones extra entre el texto y el botón
  onDone: (result: AiPageResult) => void | Promise<void>;
}) {
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const ideas = scope === 'page' ? pageIdeas : sectionIdeas;

  useEffect(() => {
    if (!busy) return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 5000);
    return () => clearInterval(t);
  }, [busy]);

  async function submit() {
    if (busy || prompt.trim().length < 10) return;
    setBusy(true);
    setError('');
    try {
      await onDone(await aiPage({ prompt: prompt.trim(), scope, pageTitle }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-primary">
          {scope === 'page' ? '¿Qué página necesitas?' : '¿Qué quieres añadir?'}
        </label>
        <textarea
          rows={5}
          value={prompt}
          disabled={busy}
          maxLength={4000}
          placeholder={
            scope === 'page'
              ? 'Cuenta de qué es el negocio, a quién le habla y qué secciones te gustaría. Mientras más detalle, mejor.'
              : 'Describe la sección: qué debe contar y cómo te la imaginas.'
          }
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit();
          }}
          className="w-full rounded-lg border border-tertiary/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/50 disabled:bg-background"
        />
      </div>

      {!prompt && (
        <div>
          <p className="mb-1.5 text-xs text-tertiary">Ideas para empezar:</p>
          <div className="flex flex-wrap gap-1.5">
            {ideas.map((idea) => (
              <button
                key={idea}
                type="button"
                onClick={() => setPrompt(idea)}
                className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-left text-xs text-violet-700 hover:bg-violet-100"
              >
                {idea}
              </button>
            ))}
          </div>
        </div>
      )}

      {children}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={busy || prompt.trim().length < 10}
          className="flex items-center gap-2 rounded-md bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {busy ? steps[step] : submitLabel}
        </button>
        <p className="text-xs text-tertiary">
          {busy ? 'Suele tardar entre 10 y 40 segundos.' : 'Todo queda editable en el constructor.'}
        </p>
      </div>
    </div>
  );
}
