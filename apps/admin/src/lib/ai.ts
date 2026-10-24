import type { IFieldDefinition, IPageBlock } from '@raco/shared';
import { api } from './api';

export type RewriteTone = 'improve' | 'shorter' | 'longer' | 'formal' | 'friendly' | 'persuasive' | 'fix';

type FieldAction =
  | { action: 'seo-title' | 'seo-description'; title?: string; context?: string }
  | { action: 'rewrite'; text: string; tone: RewriteTone }
  | { action: 'translate'; text: string; to: string }
  | { action: 'alt-text'; imageUrl: string; context?: string };

export async function aiField(body: FieldAction): Promise<string> {
  const res = await api.post<{ text: string }>('/ai/field', body);
  return res.text;
}

export const tones: { value: RewriteTone; label: string }[] = [
  { value: 'improve', label: 'Mejorar redacción' },
  { value: 'shorter', label: 'Más corto' },
  { value: 'longer', label: 'Más largo' },
  { value: 'formal', label: 'Más formal' },
  { value: 'friendly', label: 'Más cercano' },
  { value: 'persuasive', label: 'Más persuasivo' },
  { value: 'fix', label: 'Corregir ortografía' },
];

export const translateTo = [
  { value: 'en', label: 'Inglés' },
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Portugués' },
  { value: 'fr', label: 'Francés' },
];

// --- Texto plano de una entrada: es lo que la IA lee para escribir el SEO ---

interface Doc {
  type?: string;
  text?: string;
  content?: Doc[];
}

export function docText(doc: unknown): string {
  const d = doc as Doc | null;
  if (!d) return '';
  if (d.text) return d.text;
  // Dentro de un párrafo los fragmentos (negrita, cursiva...) van pegados; entre bloques, en líneas aparte
  const inline = d.type === 'paragraph' || d.type === 'heading';
  return (d.content ?? []).map(docText).join(inline ? '' : '\n').trim();
}

// Textos visibles de los bloques del constructor (títulos, párrafos, tarjetas, FAQ...)
export function blocksText(blocks: IPageBlock[] | null | undefined): string {
  const out: string[] = [];
  const walk = (list: IPageBlock[]) =>
    list.forEach((b) => {
      const p = b.props as Record<string, unknown>;
      for (const key of ['text', 'title', 'quote', 'label', 'linkText']) {
        if (typeof p[key] === 'string' && p[key]) out.push(p[key] as string);
      }
      if (p.content) out.push(docText(p.content));
      if (Array.isArray(p.items)) {
        for (const it of p.items as unknown[]) {
          if (typeof it === 'string') out.push(it);
          else if (it && typeof it === 'object') {
            const item = it as { title?: string; content?: unknown };
            if (item.title) out.push(item.title);
            if (item.content) out.push(docText(item.content));
          }
        }
      }
      if (b.children) walk(b.children);
    });
  walk(blocks ?? []);
  return out.filter(Boolean).join('\n');
}

export function entryText(data: Record<string, unknown>, fields: IFieldDefinition[], blocks: IPageBlock[] | null) {
  const parts = fields.map((f) => {
    const v = data[f.key];
    if (f.type === 'richtext') return docText(v);
    if (f.type === 'text' || f.type === 'textarea') return typeof v === 'string' ? v : '';
    if (['number', 'select', 'date'].includes(f.type) && v !== undefined && v !== null && v !== '') return `${f.label}: ${v}`;
    return '';
  });
  return [...parts, blocksText(blocks)].filter(Boolean).join('\n').slice(0, 7000);
}
