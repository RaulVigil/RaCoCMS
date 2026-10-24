import { BadGatewayException, BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import type { IAiPageRequest, IAiPageSpec, ISiteGeneral } from '@raco/shared';
import { Setting } from '../settings/setting.entity';
import { Media } from '../media/media.entity';
import { pagePrompt, pageSchema, sanitizePage } from './page-spec';

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
  private readonly pageModel: string;
  // Modelos que respondieron "saturado": se saltan un rato para no esperar reintentos en cada petición
  private readonly cooldown = new Map<string, number>();
  // Modelos que rechazan thinkingLevel MINIMAL (los alias "latest" cambian de modelo sin aviso)
  private readonly noMinimal = new Set<string>();
  private sdk?: Promise<{ genai: GenAI; client: InstanceType<GenAI['GoogleGenAI']> }>;

  constructor(
    config: ConfigService,
    @InjectRepository(Setting) private settings: Repository<Setting>,
    @InjectRepository(Media) private media: Repository<Media>,
  ) {
    this.key = config.get<string>('GEMINI_API_KEY', '').trim();
    // Acciones por campo: un modelo Lite basta y en el nivel gratuito da 500 peticiones/día (el Flash grande, 20).
    // El alias "latest" sigue al vigente: no se rompe cuando Google retira un modelo
    this.model = config.get<string>('GEMINI_MODEL', 'gemini-flash-lite-latest');
    // Si el principal se queda sin cupo o está saturado: otro Lite con su propio cupo diario
    this.fallbackModel = config.get<string>('GEMINI_FALLBACK_MODEL', 'gemini-3.1-flash-lite');
    // Opcional: otro modelo para armar páginas (ej. gemini-flash-latest con un plan de pago). Por defecto los
    // mismos Lite: en el nivel gratuito el Flash grande da 20 páginas al día y con demanda alta pasa de 35 s
    this.pageModel = config.get<string>('GEMINI_PAGE_MODEL', '');
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
    const text = await this.call(
      [
        { text: `${prompt}\n\nDevuelve únicamente el texto final, sin comillas, sin Markdown y sin explicaciones.` },
        ...(image ? [{ inlineData: image }] : []),
      ],
      { models: [this.model, this.fallbackModel], temperature: 0.7, timeout: 20_000 },
    );
    return text.trim().replace(/^["'«“]+|["'»”]+$/g, '').trim();
  }

  // Prueba los modelos en orden, saltando los que están en pausa
  private async call(
    parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[],
    opts: { models: string[]; temperature: number; schema?: object; timeout: number },
  ) {
    const { client, genai } = await this.client();
    const all = [...new Set(opts.models.filter(Boolean))];
    const ready = all.filter((m) => (this.cooldown.get(m) ?? 0) < Date.now());
    const models = ready.length ? ready : all; // si todos están en pausa, se prueba igual
    let saturated = false;
    let slow = false;
    let broken = false;
    // Tope para toda la cadena de modelos y reintentos: más que eso, el usuario ya se fue
    const deadline = Date.now() + opts.timeout * 2.5;

    // Cada modelo con un reintento: los picos de demanda de Gemini suelen durar segundos
    models: for (const model of models) {
      for (let attempt = 0; attempt < 2; attempt++) {
        const left = deadline - Date.now();
        if (left < 3_000) {
          slow = true;
          break models;
        }
        try {
          const res = await client.models.generateContent({
            model,
            contents: [{ role: 'user', parts }],
            // Lo mínimo de "pensar" que acepte el modelo: responde en segundos.
            // Los 2.x usan thinkingBudget; desde 3.5 solo thinkingLevel
            config: {
              temperature: opts.temperature,
              thinkingConfig: /gemini-2\./.test(model)
                ? { thinkingBudget: 0 }
                : { thinkingLevel: this.noMinimal.has(model) ? genai.ThinkingLevel.LOW : genai.ThinkingLevel.MINIMAL },
              // Una página completa ocupa unos 4.000 tokens: el tope corta a tiempo si el modelo entra en bucle
              ...(opts.schema ? { responseMimeType: 'application/json', responseJsonSchema: opts.schema, maxOutputTokens: 8_000 } : {}),
              // Gemini a veces se queda minutos sin responder: mejor pasar al siguiente modelo
              abortSignal: AbortSignal.timeout(Math.min(opts.timeout, left)),
            },
          });
          const text = (res.text ?? '').trim();
          if (!text) throw new Error('respuesta vacía');
          // JSON cortado (llegó al tope) o mal formado: se prueba con el siguiente modelo
          if (opts.schema && !isJson(text)) {
            this.logger.warn(`Gemini (${model}) devolvió JSON incompleto (${res.candidates?.[0]?.finishReason}, ${text.length} caracteres)`);
            broken = true;
            break;
          }
          this.cooldown.delete(model);
          return text;
        } catch (err) {
          const message = (err as Error).message ?? '';
          if ((err as Error).name === 'TimeoutError' || /aborted/i.test(message)) {
            this.logger.warn(`Gemini (${model}) no respondió en ${opts.timeout / 1000} s, se prueba el siguiente`);
            slow = true;
            this.cooldown.set(model, Date.now() + 5 * 60_000);
            break;
          }
          // No acepta "pensar" mínimo: se repite el mismo intento con LOW y se recuerda para las siguientes
          if (/thinking level/i.test(message) && !this.noMinimal.has(model)) {
            this.noMinimal.add(model);
            attempt--;
            continue;
          }
          const transient = /"code":\s*(429|500|503)|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand/i.test(message);
          // Modelo retirado o mal escrito: no tiene sentido reintentarlo, se pasa al siguiente
          const missing = /"code":\s*404|NOT_FOUND|is not found|not supported/i.test(message);
          if (missing) {
            this.logger.warn(`Gemini (${model}) no está disponible, se salta por una hora: ${message.slice(0, 160)}`);
            this.cooldown.set(model, Date.now() + 60 * 60_000);
            break;
          }
          this.logger.warn(`Gemini (${model}, intento ${attempt + 1}): ${message.slice(0, 160)}`);
          if (!transient) throw new BadGatewayException('La IA no pudo responder. Revisa la clave y el modelo configurados.');
          saturated = true;
          // Sin cupo: reintentar el mismo modelo no sirve. El cupo diario se renueva recién al otro día
          if (/"code":\s*429|RESOURCE_EXHAUSTED/i.test(message)) {
            this.cooldown.set(model, Date.now() + (/PerDay/i.test(message) ? 60 : 2) * 60_000);
            break;
          }
          if (attempt === 1) this.cooldown.set(model, Date.now() + 2 * 60_000);
          else await new Promise((r) => setTimeout(r, 800));
        }
      }
    }
    if (broken) throw new BadGatewayException('La IA devolvió una respuesta incompleta. Inténtalo de nuevo.');
    throw new ServiceUnavailableException(
      saturated || slow ? 'Gemini está saturado en este momento. Inténtalo de nuevo en un minuto.' : 'La IA no pudo responder.',
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

  // --- Páginas con IA (3.15) ---

  async generatePage(input: IAiPageRequest): Promise<IAiPageSpec> {
    const prompt = clip(input?.prompt, 4000).trim();
    if (prompt.length < 10) throw new BadRequestException('Describe la página con un poco más de detalle');
    const scope = input.scope === 'sections' ? 'sections' : 'page';

    const [general, media] = await Promise.all([
      this.settings.findOne({ where: { key: 'general' } }),
      // Las más recientes, para que la IA pueda usar imágenes reales del sitio
      this.media.find({ where: { mimeType: Like('image/%') }, order: { createdAt: 'DESC' }, take: 40 }),
    ]);
    const site = (general?.value ?? {}) as Partial<ISiteGeneral>;
    const images = media.map((m) => ({ url: m.url, alt: m.alt || m.originalName.replace(/\.[a-z0-9]+$/i, '') }));

    const text = await this.call(
      [
        {
          text: pagePrompt({
            prompt,
            scope,
            pageTitle: clip(input.pageTitle, 200),
            siteName: site.siteName,
            tagline: site.tagline,
            language: site.language || 'es',
            images,
          }),
        },
      ],
      // Una página normal tarda 5-10 s; si pasa de 35 s el modelo está trabado
      { models: [this.pageModel, this.model, this.fallbackModel], temperature: 0.8, schema: pageSchema(scope), timeout: 35_000 },
    );

    const spec = sanitizePage(JSON.parse(text), new Set(images.map((i) => i.url)), scope);
    if (!spec.sections.length) throw new BadGatewayException('La IA no armó ninguna sección. Prueba describiendo mejor la página.');
    return spec;
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

function isJson(text: string) {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

// Recorta a un largo máximo sin cortar palabras
function fit(text: string, max: number) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > max * 0.6 ? cut.lastIndexOf(' ') : cut.length).replace(/[,;:.\s]+$/, '')}…`;
}
