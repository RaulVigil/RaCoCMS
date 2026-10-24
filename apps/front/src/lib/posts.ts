import type { IPageBlock } from '@raco/shared';
import { toPostItem, type PostItem } from '@raco/blocks';
import { getEntries } from './api';

// Los módulos "Listado de entradas" con una colección fija necesitan sus entradas antes de renderizar
export async function loadPosts(blocks: IPageBlock[]): Promise<Record<string, PostItem[]>> {
  const wanted = new Map<string, number>();
  const walk = (list: IPageBlock[]) =>
    list.forEach((b) => {
      const source = b.props?.source;
      if (b.type === 'posts' && typeof source === 'string' && source !== 'current') {
        const limit = Math.min(Math.max(Number(b.props.limit) || 6, 1), 48);
        wanted.set(source, Math.max(wanted.get(source) ?? 0, limit));
      }
      if (b.children) walk(b.children);
    });
  walk(blocks);

  const entries = await Promise.all(
    [...wanted].map(async ([collectionId, limit]) => {
      const list = await getEntries(collectionId, 1, limit).catch(() => null);
      return [collectionId, (list?.items ?? []).map((e) => toPostItem(e))] as const;
    }),
  );
  return Object.fromEntries(entries);
}
