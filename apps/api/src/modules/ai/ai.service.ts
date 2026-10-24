import { BadGatewayException, BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// @google/genai solo se publica como ESM y la API compila a CommonJS: se carga con import() dinámico
const loadGenAI = () => import('@google/genai');
type GenAI = Awaited<ReturnType<typeof loadGenAI>>;
import { readFile, stat } from 'node:fs/promises';
import * as path from 'node:path';

export type RewriteTone = 'improve' | 'shorter' | 'longer' | 'formal' | 'friendly' | 'persuasive' | 'fix';

export type FieldAction =
  | { action: 'seo-title' | 'seo-description'; title?: string; context?: string }
  | { action: 'rewrite'; text: string; tone: RewriteTone }
  | { action: 'translate'; text: string; to: string }
  | { action: 'alt-text'; imageUrl: string; context?: string };

const MAX_INPUT = 8000;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

const tones: Record<RewriteTone, string> = {
  improve: 'Mejora la redacción: más claro y fluido, sin cambiar el sentido ni inventar datos.',
  shorter: 'Hazlo más corto y directo, conservando lo importante.',
  longer: 'Desarróllalo un poco más, con más detalle, sin inventar datos concretos (precios, fechas, nombres).',
  formal: 'Reescríbelo con un tono más formal y profesional.',
  friendly: 'Reescríbelo con un tono más cercano y amigable.',
  persuasive: 'Reescríbelo de forma más persuasiva, orientada a que el lector actúe.',
  fix: 'Corrige solo ortografía, gramática y puntuación. No cambies el estilo ni el contenido.',
};

const languages: Record<string, string> = {
  es: 'español',
  en: 'inglés',
  pt: 'portugués',
  fr: 'francés',
  it: 'italiano',
  de: 'alemán',
};

@Injectable()
export class AiService {
  private readonly logger = new Logger('IA');
  private readonly key: string;
  private readonly model: string;
  private readonly fallbackModel: string;
  // Modelos que respondieron "saturado": se saltan un rato para no esperar reintentos en cada petición
  private readonly cooldown = new Map<string, number>();
  private sdk?: Promise<{ genai: GenAI; client: InstanceType<GenAI['GoogleGenAI']> }>;

  constructor(config: ConfigService) {
    this.key = config.get<string>('GEMINI_API_KEY', '').trim();
    // Acciones por campo: un modelo Lite basta y en el nivel gratuito da 500 peticiones/día (el Flash grande, 20).
    // El alias "latest" sigue al vigente: no se rompe cuando Google retira un modelo
    this.model = config.get<string>('GEMINI_MODEL', 'gemini-flash-lite-latest');
    // Si el principal se queda sin cupo o está saturado: otro Lite con su propio cupo diario
    this.fallbackModel = config.get<string>('GEMINI_FALLBACK_MODEL', 'gemini-3.1-flash-lite');
  }

  private async client() {
    if (!this.key) throw new ServiceUnavailableException('La IA no está configurada: falta GEMINI_API_KEY en el .env');
    this.sdk ??= loadGenAI().then((genai) => ({ genai, client: new genai.GoogleGenAI({ apiKey: this.key }) }));
    return this.sdk;
  }

  // --- IA por campo (6.3) ---

  async fieldAction(input: FieldAction): Promise<{ text: string }> {
    switch (input.action) {
      case 'seo-title': {
        const text = await this.generate(
          `Escribe el título SEO (etiqueta <title>) de esta página web. Máximo 60 caracteres, atractivo y con la palabra clave principal al inicio. No incluyas el nombre del sitio. Responde en el idioma del contenido.\n\nTítulo actual: ${clip(input.title)}\n\nContenido:\n${clip(input.context)}`,
        );
        return { text: fit(text, 60) };
      }

      case 'seo-description': {
        const text = await this.generate(
          `Escribe la meta descripción de esta página web para Google. Entre 120 y 155 caracteres, que resuma el contenido e invite a hacer clic, sin comillas ni emojis. Responde en el idioma del contenido.\n\nTítulo: ${clip(input.title)}\n\nContenido:\n${clip(input.context)}`,
        );
        return { text: fit(text, 160) };
      }

      case 'rewrite': {
        if (!tones[input.tone]) throw new BadRequestException('Tono no válido');
        const text = await this.generate(
          `${tones[input.tone]} Responde en el mismo idioma del texto y conserva los saltos de línea.\n\nTexto:\n${clip(input.text)}`,
        );
        return { text };
      }

      case 'translate': {
        const language = languages[input.to];
        if (!language) throw new BadRequestException('Idioma no válido');
        const text = await this.generate(
          `Traduce el texto al ${language}, con naturalidad y conservando el tono y los saltos de línea.\n\nTexto:\n${clip(input.text)}`,
        );
        return { text };
      }

      case 'alt-text': {
        const image = await this.readUpload(input.imageUrl);
        const text = await this.generate(
          `Escribe el texto alternativo (atributo alt) de esta imagen para una página web: una frase breve y descriptiva, de máximo 125 caracteres, sin empezar con "Imagen de" ni "Foto de". Responde en español.${input.context ? `\n\nContexto de la página: ${clip(input.context, 500)}` : ''}`,
          image,
        );
        return { text: fit(text, 125) };
      }

      default:
        throw new BadRequestException('Acción de IA desconocida');
    }
  }

  // Pide solo el texto final: sin explicaciones, comillas ni formato Markdown
  private async generate(prompt: string, image?: { mimeType: string; data: string }) {
    const parts = [
      { text: `${prompt}\n\nDevuelve únicamente el texto final, sin comillas, sin Markdown y sin explicaciones.` },
      ...(image ? [{ inlineData: image }] : []),
    ];
    const { client, genai } = await this.client();
    const all = [...new Set([this.model, this.fallbackModel].filter(Boolean))];
    const ready = all.filter((m) => (this.cooldown.get(m) ?? 0) < Date.now());
    const models = ready.length ? ready : all; // si todos están en pausa, se prueba igual
    let saturated = false;

    // Cada modelo con un reintento: los picos de demanda de Gemini suelen durar segundos
    for (const model of models) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await client.models.generateContent({
            model,
            contents: [{ role: 'user', parts }],
            // Tareas cortas: sin "pensar" responde en 1-3 s. Los 2.x usan thinkingBudget; desde 3.5 solo thinkingLevel
            config: {
              temperature: 0.7,
              thinkingConfig: /gemini-2\./.test(model) ? { thinkingBudget: 0 } : { thinkingLevel: genai.ThinkingLevel.MINIMAL },
            },
          });
          const text = (res.text ?? '').trim().replace(/^["'«“]+|["'»”]+$/g, '').trim();
          if (!text) throw new Error('respuesta vacía');
          this.cooldown.delete(model);
          return text;
        } catch (err) {
          const message = (err as Error).message ?? '';
          const transient = /"code":\s*(429|500|503)|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand/i.test(message);
          // Modelo retirado o mal escrito: no tiene sentido reintentarlo, se pasa al siguiente
          const missing = /"code":\s*404|NOT_FOUND|is not found|not supported/i.test(message);
          if (missing) {
            this.cooldown.set(model, Date.now() + 60 * 60_000);
            break;
          }
          this.logger.warn(`Gemini (${model}, intento ${attempt + 1}): ${message.slice(0, 160)}`);
          if (!transient) throw new BadGatewayException('La IA no pudo responder. Revisa la clave y el modelo configurados.');
          saturated = true;
          if (attempt === 1) this.cooldown.set(model, Date.now() + 2 * 60_000);
          else await new Promise((r) => setTimeout(r, 800));
        }
      }
    }
    throw new ServiceUnavailableException(
      saturated ? 'Gemini está saturado en este momento. Inténtalo de nuevo en un minuto.' : 'La IA no pudo responder.',
    );
  }

  // Solo imágenes de la propia carpeta de subidas (nada de rutas arbitrarias ni URLs externas)
  private async readUpload(url: string) {
    const name = path.basename(String(url ?? '').split('?')[0]);
    if (!/^\/uploads\//.test(String(url)) || !name) throw new BadRequestException('Solo se pueden describir imágenes subidas al sitio');
    const file = path.join(path.resolve(process.cwd(), 'uploads'), name);
    const info = await stat(file).catch(() => null);
    if (!info?.isFile()) throw new BadRequestException('No se encontró la imagen');
    if (info.size > MAX_IMAGE_BYTES) throw new BadRequestException('La imagen es demasiado grande para analizarla');

    const ext = path.extname(name).toLowerCase();
    const mimeType = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif' }[ext];
    if (!mimeType) throw new BadRequestException('Formato de imagen no compatible');
    return { mimeType, data: (await readFile(file)).toString('base64') };
  }

  // --- Generación de sitio (3.15, pendiente de rehacer con los bloques actuales) ---

  async generateSite(prompt: string) {
    const { client, genai } = await this.client();
    const { Type } = genai;
    const res = await client.models.generateContent({
      model: this.model,
      contents: `Eres un constructor de sitios web. Propón entre 4 y 8 secciones para esta página, cada una con un tipo y su texto.\n\nPágina: "${clip(prompt, 2000)}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  title: { type: Type.STRING },
                  text: { type: Type.STRING },
                },
                required: ['type', 'title'],
              },
            },
          },
          required: ['sections'],
        },
      },
    });
    return JSON.parse(res.text ?? '{"sections":[]}');
  }

  async parseFigma(figmaUrl: string) {
    // Placeholder: extracción de nodos de Figma
    return {
      source: figmaUrl,
      message: 'La integración con Figma API se implementará en una fase posterior.',
      blocks: [],
    };
  }
}

const clip = (s: unknown, max = MAX_INPUT) => String(s ?? '').slice(0, max);

// Recorta a un largo máximo sin cortar palabras
function fit(text: string, max: number) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > max * 0.6 ? cut.lastIndexOf(' ') : cut.length).replace(/[,;:.\s]+$/, '')}…`;
}
