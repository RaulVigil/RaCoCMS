import type { IAiPageRequest, IAiPageSpec, IPageBlock } from '@raco/shared';
import { specToBlocks } from '@raco/blocks';
import { api } from './api';

// Aparte de lib/ai.ts: arrastra @raco/blocks y solo lo usan pantallas que se cargan bajo demanda

export interface AiPageResult {
  spec: IAiPageSpec;
  blocks: IPageBlock[];
}

// La API devuelve la receta validada; aquí se convierte en bloques normales del constructor
export async function aiPage(req: IAiPageRequest): Promise<AiPageResult> {
  const spec = await api.post<IAiPageSpec>('/ai/generate-page', req);
  return { spec, blocks: specToBlocks(spec) };
}

export const pageIdeas = [
  'Página de inicio para una cafetería de especialidad en el centro de la ciudad, con menú destacado, horarios y ubicación',
  'Landing de un estudio de abogados laborales: servicios, por qué elegirnos, testimonios, preguntas frecuentes y contacto',
  'Página de una clínica veterinaria con servicios, equipo, cifras, opiniones de clientes y un botón para agendar cita',
  'Página de precios de un software de facturación con tres planes, comparación de beneficios y preguntas frecuentes',
];

export const sectionIdeas = [
  'Una sección de preguntas frecuentes sobre envíos y devoluciones',
  'Tres testimonios de clientes en tarjetas',
  'Una llamada a la acción final con fondo oscuro y botón de contacto',
  'Cuatro cifras destacadas de la empresa',
];
