import type { ReactNode } from 'react';
import type { RichDoc } from './types';

// Convierte el JSON de Tiptap en elementos React (nunca pasa por HTML crudo)
export function RichText({ doc }: { doc: RichDoc | null }) {
  if (!doc?.content) return null;
  return <>{doc.content.map((node, i) => renderNode(node, i))}</>;
}

function renderChildren(node: RichDoc) {
  return node.content?.map((child, i) => renderNode(child, i));
}

function renderNode(node: RichDoc, key: number): ReactNode {
  switch (node.type) {
    case 'paragraph':
      return <p key={key}>{renderChildren(node)}</p>;
    case 'heading':
      return node.attrs?.level === 3 ? (
        <h3 key={key}>{renderChildren(node)}</h3>
      ) : (
        <h2 key={key}>{renderChildren(node)}</h2>
      );
    case 'bulletList':
      return <ul key={key}>{renderChildren(node)}</ul>;
    case 'orderedList':
      return <ol key={key}>{renderChildren(node)}</ol>;
    case 'listItem':
      return <li key={key}>{renderChildren(node)}</li>;
    case 'blockquote':
      return <blockquote key={key}>{renderChildren(node)}</blockquote>;
    case 'hardBreak':
      return <br key={key} />;
    case 'horizontalRule':
      return <hr key={key} />;
    case 'text':
      return renderText(node, key);
    default:
      // Nodo desconocido: se muestra su contenido sin envoltorio
      return <span key={key}>{renderChildren(node)}</span>;
  }
}

function renderText(node: RichDoc, key: number): ReactNode {
  let el: ReactNode = node.text ?? '';
  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case 'bold':
        el = <strong>{el}</strong>;
        break;
      case 'italic':
        el = <em>{el}</em>;
        break;
      case 'strike':
        el = <s>{el}</s>;
        break;
      case 'underline':
        el = <u>{el}</u>;
        break;
      case 'code':
        el = <code>{el}</code>;
        break;
      case 'link':
        el = <a href={String(mark.attrs?.href ?? '#')}>{el}</a>;
        break;
    }
  }
  return <span key={key}>{el}</span>;
}
