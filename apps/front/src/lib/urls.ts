// Las páginas viven en la raíz (/contacto); el resto de colecciones bajo su id (/noticias/mi-nota)
export function entryUrl(collectionId: string, slug: string) {
  return collectionId === 'pages' ? `/${slug}` : `/${collectionId}/${slug}`;
}
