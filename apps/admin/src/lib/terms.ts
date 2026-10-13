import type { ITaxonomyTerm } from '@raco/shared';

export { slugify } from './slug';

export interface TermNode extends ITaxonomyTerm {
  depth: number;
}

// Sangría por nivel (hasta 4 niveles visibles)
export const depthClass = ['', 'pl-6', 'pl-12', 'pl-18'];

// Ordena los términos como árbol: cada padre seguido de sus hijos
export function flattenTerms(terms: ITaxonomyTerm[]): TermNode[] {
  const ids = new Set(terms.map((t) => t.id));
  const result: TermNode[] = [];

  const walk = (parentId: string | undefined, depth: number) => {
    terms
      .filter((t) => (parentId ? t.parentId === parentId : !t.parentId || !ids.has(t.parentId)))
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((t) => {
        result.push({ ...t, depth: Math.min(depth, depthClass.length - 1) });
        walk(t.id, depth + 1);
      });
  };

  walk(undefined, 0);
  return result;
}

// El término y todos los que cuelgan de él (no puede ser su propio padre)
export function descendantsOf(terms: ITaxonomyTerm[], id: string): Set<string> {
  const found = new Set([id]);
  let added = true;
  while (added) {
    added = false;
    for (const t of terms) {
      if (t.parentId && found.has(t.parentId) && !found.has(t.id)) {
        found.add(t.id);
        added = true;
      }
    }
  }
  return found;
}

export function newTermId() {
  return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
