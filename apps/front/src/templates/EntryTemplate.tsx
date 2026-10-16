import type { IEntry, IFieldDefinition } from '@raco/shared';
import { PageContent, RichText, richTextClass, type RichDoc } from '@raco/blocks';
import type { EntryContext } from '../lib/api';
import { formatDate } from './format';

// Plantilla por defecto para entradas sin constructor visual (hasta que exista el Theme Builder):
// título, fecha y los campos de sus grupos en orden, cada uno según su tipo
export default function EntryTemplate({ entry, fieldGroups }: EntryContext) {
  const fields = fieldGroups.flatMap((g) => g.fields);
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:py-20">
      <p className="text-sm text-tertiary">{formatDate(entry.createdAt)}</p>
      <h1 className="mt-2 font-heading text-3xl font-bold leading-tight md:text-5xl">{entry.title}</h1>
      <div className="mt-8 space-y-6">
        {fields.map((field) => (
          <FieldValue key={field.key} field={field} value={entry.data?.[field.key]} />
        ))}
      </div>
      {!!entry.blocks?.length && (
        <div className="mt-10">
          <PageContent blocks={entry.blocks} />
        </div>
      )}
    </article>
  );
}

function FieldValue({ field, value }: { field: IFieldDefinition; value: unknown }) {
  if (value === undefined || value === null || value === '') return null;

  switch (field.type) {
    case 'richtext':
      return (
        <div className={`${richTextClass} text-lg leading-relaxed`}>
          <RichText doc={value as RichDoc} />
        </div>
      );
    case 'image':
      return <img src={String(value)} alt={field.label} loading="lazy" className="w-full rounded-2xl object-cover" />;
    case 'textarea':
    case 'text':
      return <p className="whitespace-pre-line text-lg leading-relaxed">{String(value)}</p>;
    case 'url':
      return (
        <p>
          <a href={String(value)} className="font-medium text-secondary underline underline-offset-4" rel="noopener">
            {String(value)}
          </a>
        </p>
      );
    case 'toggle':
      return <Detail label={field.label} value={value ? 'Sí' : 'No'} />;
    case 'date':
      return <Detail label={field.label} value={formatDate(String(value))} />;
    default:
      return <Detail label={field.label} value={String(value)} />;
  }
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex gap-2 border-b border-tertiary/20 pb-3">
      <span className="font-medium">{label}:</span>
      <span>{value}</span>
    </p>
  );
}

export type { IEntry };
