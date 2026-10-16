import type { EntryList } from '../lib/api';
import { entryUrl } from '../lib/urls';
import { excerptOf, formatDate, imageOf } from './format';

// Listado de una colección (ej. /noticias) con paginación
export default function ArchiveTemplate({ collection, items, page, totalPages }: EntryList) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:py-20">
      <h1 className="font-heading text-3xl font-bold md:text-5xl">{collection.name}</h1>
      {items.length === 0 ? (
        <p className="mt-8 text-tertiary">Todavía no hay publicaciones.</p>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const image = imageOf(item.data);
            const excerpt = excerptOf(item.data, item.seoData?.description);
            return (
              <a key={item.id} href={entryUrl(collection.id, item.slug)} className="group flex flex-col">
                {image && (
                  <img src={image} alt="" loading="lazy" className="mb-4 aspect-video w-full rounded-2xl object-cover transition-opacity group-hover:opacity-90" />
                )}
                <p className="text-sm text-tertiary">{formatDate(item.createdAt)}</p>
                <h2 className="mt-1 font-heading text-xl font-bold leading-snug group-hover:text-secondary">{item.title}</h2>
                {excerpt && <p className="mt-2 leading-relaxed opacity-80">{excerpt}</p>}
              </a>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Paginación">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <a
              key={n}
              href={n === 1 ? `/${collection.id}` : `/${collection.id}?page=${n}`}
              aria-current={n === page ? 'page' : undefined}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium ${
                n === page ? 'bg-primary text-white' : 'hover:bg-background'
              }`}
            >
              {n}
            </a>
          ))}
        </nav>
      )}
    </section>
  );
}
