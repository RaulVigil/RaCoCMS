import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Figma, LayoutTemplate, PencilRuler, Sparkles } from 'lucide-react';
import type { IEntry } from '@raco/shared';
import { api } from '../lib/api';
import AiPageForm from '../components/ai/AiPageForm';
import type { AiPageResult } from '../lib/aiPage';

// Crear una página nueva a partir de una descripción: queda como borrador y se abre en el constructor
export default function Ai() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  async function create({ spec, blocks }: AiPageResult) {
    setError('');
    try {
      const entry = await api.post<IEntry>('/entries/pages', {
        title: spec.title || 'Página generada con IA',
        status: 'draft',
        data: {},
        terms: {},
        seoData: { title: '', description: spec.description, noIndex: false },
        blocks,
      });
      navigate(`/collections/pages/${entry.id}`, { state: { openBuilder: true } });
    } catch (err) {
      setError(`La página se generó pero no se pudo guardar: ${(err as Error).message}`);
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="font-heading text-2xl font-bold text-primary mb-1">IA</h1>
      <p className="text-sm text-tertiary mb-6">Describe una página y la IA la arma con bloques reales del constructor.</p>

      <div className="bg-white rounded-xl border border-tertiary/20 p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <Sparkles size={20} />
          </span>
          <div>
            <h2 className="font-heading text-base font-semibold text-primary">Crear una página con IA</h2>
            <p className="text-sm text-tertiary">Se guarda como borrador en Páginas; nada se publica hasta que tú lo decidas.</p>
          </div>
        </div>
        <AiPageForm scope="page" submitLabel="Generar página" onDone={create} />
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: LayoutTemplate,
            title: 'Usa tu diseño',
            text: 'Toma la paleta, las fuentes y las imágenes de tu biblioteca.',
          },
          {
            icon: PencilRuler,
            title: 'Todo editable',
            text: 'Cada sección, columna y texto se ajusta después en el constructor.',
          },
          {
            icon: Figma,
            title: 'Desde Figma',
            text: 'Importar un diseño de Figma llegará más adelante.',
            soon: true,
          },
        ].map((c) => (
          <div key={c.title} className="rounded-xl border border-tertiary/20 bg-white p-4">
            <c.icon size={18} className="mb-2 text-violet-600" />
            <p className="text-sm font-medium text-primary">
              {c.title}
              {c.soon && <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-[10px] text-tertiary">Próximamente</span>}
            </p>
            <p className="mt-1 text-xs text-tertiary">{c.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
