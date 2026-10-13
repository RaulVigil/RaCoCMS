import type { IPageBlock } from '@raco/shared';
import { blockComponents } from './components';
import { visibilityOf } from './types';
import { sortByOrder } from './tree';

// Render para la web pública (Astro): sin controles de edición y con visibilidad por dispositivo
export function BlockView({ block }: { block: IPageBlock }) {
  const Component = blockComponents[block.type];
  if (!Component) return null;
  return (
    <Component block={block} visible={visibilityOf(block)}>
      {block.children?.map((child) => <BlockView key={child.id} block={child} />)}
    </Component>
  );
}

// El @container es el que hace funcionar los breakpoints @3xl/@5xl de los bloques
export function PageContent({ blocks }: { blocks: IPageBlock[] }) {
  return (
    <div className="@container">
      {sortByOrder(blocks).map((block) => (
        <BlockView key={block.id} block={block} />
      ))}
    </div>
  );
}
