import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Eye, EyeOff, Monitor, Smartphone, Tablet, X } from 'lucide-react';
import type { IEntry } from '@raco/shared';
import { PageContent, cx, designThemeCss, designVarClasses, type Device } from '@raco/blocks';
import { api } from '../lib/api';
import { useLivePreview } from '../lib/previewChannel';
import { useGoogleFonts, useSiteDesign } from '../lib/siteDesign';
import { useRuntimeTailwind } from '../lib/tailwindRuntime';

const widths: Record<Device, string> = {
  desktop: 'w-full',
  tablet: 'w-[768px] my-6 shadow-xl',
  mobile: 'w-[390px] my-6 shadow-xl',
};

const devices: { value: Device; label: string; icon: typeof Monitor }[] = [
  { value: 'desktop', label: 'Escritorio', icon: Monitor },
  { value: 'tablet', label: 'Tablet', icon: Tablet },
  { value: 'mobile', label: 'Móvil', icon: Smartphone },
];

// Vista previa a pantalla completa: la página tal como la verá el visitante, sin controles de edición.
// Si el editor está abierto en otra pestaña, se actualiza en vivo aunque no se haya guardado.
export default function Preview() {
  const { collectionId = '', entryId = '' } = useParams();
  const live = useLivePreview(`${collectionId}:${entryId}`);
  const [saved, setSaved] = useState<IEntry | null>(null);
  const [device, setDevice] = useState<Device>('desktop');
  const [barVisible, setBarVisible] = useState(true);
  const design = useSiteDesign();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (entryId === 'new') return;
    api.get<IEntry>(`/entries/${collectionId}/id/${entryId}`).then(setSaved).catch(() => setSaved(null));
  }, [collectionId, entryId]);

  // Lo del editor solo manda si es más reciente que lo guardado (pueden quedar datos viejos en el navegador)
  const savedAt = saved?.updatedAt ? Date.parse(saved.updatedAt) : 0;
  const useLive = !!live && live.at > savedAt;
  const title = (useLive ? live.title : saved?.title) ?? '';
  const blocks = (useLive ? live.blocks : saved?.blocks) ?? [];

  useEffect(() => {
    document.title = `${title || 'Sin título'} · Vista previa`;
  }, [title]);

  useGoogleFonts(design);
  useRuntimeTailwind(rootRef, [blocks, device, barVisible], design ? designThemeCss(design) : undefined);

  // Los enlaces internos llevarían al panel: se anulan; los externos y las anclas funcionan
  function onClick(e: MouseEvent) {
    const a = (e.target as HTMLElement).closest('a');
    const href = a?.getAttribute('href') ?? '';
    if (a && href.startsWith('/')) e.preventDefault();
  }

  if (!design) return <div className="flex min-h-screen items-center justify-center text-sm text-tertiary">Cargando...</div>;

  return (
    <div ref={rootRef} onClick={onClick} className={cx('min-h-screen', device === 'desktop' ? 'bg-white' : 'bg-slate-200')}>
      <div
        className={cx(
          'mx-auto min-h-screen bg-white font-body text-primary transition-[width] duration-300',
          widths[device],
          designVarClasses(design),
        )}
      >
        {blocks.length ? (
          <PageContent blocks={blocks} />
        ) : (
          <div className="flex min-h-screen items-center justify-center p-8 text-center text-sm text-tertiary">
            Esta página todavía no tiene contenido. Ábrela en el constructor visual para diseñarla.
          </div>
        )}
      </div>

      {/* Barra flotante: dispositivo, estado y cerrar */}
      {barVisible ? (
        <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-primary/95 px-3 py-2 text-white shadow-2xl backdrop-blur">
          <span className="flex items-center gap-1.5 pl-1 text-xs">
            <span className={cx('h-2 w-2 rounded-full', useLive ? 'bg-amber-400' : 'bg-emerald-400')} />
            {useLive ? 'En vivo, sin guardar' : 'Versión guardada'}
          </span>
          <div className="flex gap-0.5 rounded-full bg-white/10 p-0.5">
            {devices.map((d) => (
              <button
                key={d.value}
                type="button"
                title={d.label}
                onClick={() => setDevice(d.value)}
                className={cx('rounded-full p-1.5', device === d.value ? 'bg-white text-primary' : 'text-white/70 hover:text-white')}
              >
                <d.icon size={15} />
              </button>
            ))}
          </div>
          <button type="button" title="Ocultar esta barra" onClick={() => setBarVisible(false)} className="rounded-full p-1.5 text-white/70 hover:text-white">
            <EyeOff size={15} />
          </button>
          <button type="button" title="Cerrar vista previa" onClick={() => window.close()} className="rounded-full p-1.5 text-white/70 hover:text-white">
            <X size={15} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          title="Mostrar la barra de vista previa"
          onClick={() => setBarVisible(true)}
          className="fixed bottom-4 right-4 z-50 rounded-full bg-primary/80 p-2 text-white shadow-lg hover:bg-primary"
        >
          <Eye size={16} />
        </button>
      )}
    </div>
  );
}
