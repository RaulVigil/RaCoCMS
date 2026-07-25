import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;

  constructor(private config: ConfigService) {
    this.genAI = new GoogleGenerativeAI(config.get<string>('GEMINI_API_KEY', ''));
  }

  async generateSite(prompt: string) {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            blocks: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  type: { type: SchemaType.STRING },
                  props: { type: SchemaType.OBJECT, properties: {} },
                  order: { type: SchemaType.NUMBER },
                  settings: {
                    type: SchemaType.OBJECT,
                    properties: {
                      visibility: {
                        type: SchemaType.OBJECT,
                        properties: {
                          desktop: { type: SchemaType.BOOLEAN },
                          tablet: { type: SchemaType.BOOLEAN },
                          mobile: { type: SchemaType.BOOLEAN },
                        },
                      },
                      customClasses: { type: SchemaType.STRING, nullable: true },
                    },
                  },
                },
                required: ['type', 'props', 'order'],
              },
            },
          },
          required: ['blocks'],
        },
      },
    });

    const systemPrompt = `Eres un constructor de sitios web. Genera una estructura de página web usando bloques modulares.

Tipos de bloque disponibles: Hero, Features, Cards, CTA, FAQ, Testimonials, Gallery, RichText, ContactForm, Stats, Pricing.

Reglas:
- Usa Tailwind CSS para las clases (campo customClasses en settings).
- Las props deben ser limpias: strings, arrays o objetos simples.
- El campo visibility define si se muestra en desktop/tablet/mobile (todos true por defecto).
- Genera entre 4 y 8 bloques. El primer bloque debe ser Hero.

Prompt del usuario: "${prompt}"`;

    const result = await model.generateContent(systemPrompt);
    const json = JSON.parse(result.response.text());

    return {
      blocks: json.blocks.map((block: any, index: number) => ({
        ...block,
        id: `ai-block-${Date.now()}-${index}`,
        order: block.order ?? index,
        settings: block.settings ?? { visibility: { desktop: true, tablet: true, mobile: true } },
      })),
    };
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
