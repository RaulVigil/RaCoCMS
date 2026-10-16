export function formatDate(value?: string, locale = 'es') {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

// Primer valor de imagen y de texto de una entrada, para las tarjetas de los listados
export function excerptOf(data: Record<string, unknown> | undefined, seoDescription?: string) {
  if (seoDescription) return seoDescription;
  for (const v of Object.values(data ?? {})) {
    if (typeof v === 'string' && v.length > 40 && !v.startsWith('/uploads/') && !v.startsWith('http')) {
      return v.length > 160 ? `${v.slice(0, 157)}…` : v;
    }
  }
  return '';
}

export function imageOf(data: Record<string, unknown> | undefined) {
  for (const v of Object.values(data ?? {})) {
    if (typeof v === 'string' && /^\/uploads\/.+\.(webp|png|jpe?g|gif|avif)$/i.test(v)) return v;
  }
  return null;
}
