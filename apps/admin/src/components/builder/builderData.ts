import { useEffect, useMemo, useState } from 'react';
import type { ICollection, IEntry, IFieldDefinition, IFieldGroup, IPageBlock, TemplateType } from '@raco/shared';
import { placeholderEntry, toEntryData, toPostItem, type ArchiveData, type EntryData, type PostItem } from '@raco/blocks';
import { api } from '../../lib/api';

export interface TemplateTarget {
  collectionId: string;
  type: TemplateType;
}

// Colecciones usadas como fuente fija en los módulos "Listado de entradas" del diseño
function postSources(blocks: IPageBlock[]) {
  const set = new Set<string>();
  const walk = (list: IPageBlock[]) =>
    list.forEach((b) => {
      const source = b.props?.source;
      if (b.type === 'posts' && typeof source === 'string' && source !== 'current') set.add(source);
      if (b.children) walk(b.children);
    });
  walk(blocks);
  return [...set].sort();
}

// Datos que el lienzo necesita para mostrar plantillas y listados con contenido real
export function useBuilderData(blocks: IPageBlock[], template?: TemplateTarget) {
  const [collections, setCollections] = useState<ICollection[]>([]);
  const [fields, setFields] = useState<IFieldDefinition[]>([]);
  const [entries, setEntries] = useState<IEntry[]>([]);
  const [sampleId, setSampleId] = useState<number | null>(null);
  const [posts, setPosts] = useState<Record<string, PostItem[]>>({});

  useEffect(() => {
    api.get<ICollection[]>('/collections').then(setCollections).catch(() => {});
  }, []);

  // Plantilla: campos de la colección y sus entradas (para elegir una de muestra)
  useEffect(() => {
    if (!template) return;
    api
      .get<IFieldGroup[]>(`/field-groups?collectionId=${template.collectionId}`)
      .then((groups) => setFields(groups.flatMap((g) => g.fields)))
      .catch(() => setFields([]));
    api
      .get<IEntry[]>(`/entries/${template.collectionId}`)
      .then((list) => {
        setEntries(list);
        setSampleId(list[0]?.id ?? null);
      })
      .catch(() => setEntries([]));
  }, [template?.collectionId]);

  // Entradas de los listados con colección fija (solo las publicadas, como en la web)
  const sourcesKey = postSources(blocks).join('|');
  useEffect(() => {
    for (const id of sourcesKey ? sourcesKey.split('|') : []) {
      if (posts[id]) continue;
      api
        .get<IEntry[]>(`/entries/${id}?status=published`)
        .then((list) => setPosts((p) => ({ ...p, [id]: list.map((e) => toPostItem(e)) })))
        .catch(() => setPosts((p) => ({ ...p, [id]: [] })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourcesKey]);

  const entryData: EntryData | null = useMemo(() => {
    if (template?.type !== 'single') return null;
    const entry = entries.find((e) => e.id === sampleId);
    return entry ? toEntryData(entry, fields) : placeholderEntry(fields);
  }, [template?.type, entries, sampleId, fields]);

  const archiveData: ArchiveData | null = useMemo(() => {
    if (template?.type !== 'archive') return null;
    const published = entries.filter((e) => e.status === 'published');
    return {
      items: published.slice(0, 12).map((e) => toPostItem(e, fields)),
      page: 1,
      totalPages: 1,
      baseUrl: `/${template.collectionId}`,
    };
  }, [template, entries, fields]);

  return {
    collections,
    fields: template ? fields : null,
    entries,
    sampleId,
    setSampleId,
    entryData,
    archiveData,
    posts,
  };
}
