import Anthropic from '@anthropic-ai/sdk';
import { env } from './env';

export type AiFood = {
  name: string;
  quantity: number;
  unit: string;
  calories?: number;
};

export type AiMealAnalysis = {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: AiFood[];
  notes?: string;
};

function client() {
  const e = env();
  return new Anthropic({ apiKey: e.ANTHROPIC_API_KEY });
}
// Define a ferramenta com schema para forçar saída JSON estruturada
const tool = {
  name: 'parse_meal',
  description: 'Devolver a análise de refeição como JSON fortemente tipado.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      meal_type: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
      foods: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: { type: 'string' },
            quantity: { type: 'number', minimum: 0 },
            unit: { type: 'string' },
            calories: { type: 'number', minimum: 0 },
            protein_g: { type: 'number', minimum: 0 },
            carbs_g: { type: 'number', minimum: 0 },
            fat_g: { type: 'number', minimum: 0 },
            fiber_g: { type: 'number', minimum: 0 },
            sodium_mg: { type: 'number', minimum: 0 },
            sugar_g: { type: 'number', minimum: 0 }
          },
          required: ['name', 'quantity', 'unit']
        }
      },
      notes: { type: 'string' }
    },
    required: ['meal_type', 'foods']
  }
} as const;

async function callModelWithTool(messages: any[], model: string) {
  const e = env();
  const c = client();
  const res = await c.messages.create({
    model,
    max_tokens: e.ANTHROPIC_MAX_TOKENS,
    temperature: 0,
    system: 'Responda chamando a ferramenta parse_meal com um objeto JSON válido conforme o schema fornecido.',
    tools: [tool as any],
    tool_choice: { type: 'tool', name: 'parse_meal' } as any,
    messages
  } as any);
  const content = (res as any).content || [];
  const toolUse = content.find((c: any) => c.type === 'tool_use' && c.name === 'parse_meal');
  if (!toolUse) {
    // fallback: tentar extrair texto puro e parsear
    const textBlock = content.find((c: any) => c.type === 'text');
    const text = textBlock ? (textBlock as any).text : '';
    if (!text) throw new Error('no_tool_use');
    return JSON.parse(text) as AiMealAnalysis;
  }
  return toolUse.input as AiMealAnalysis;
}

function buildTextMessages(description: string, mealType?: string) {
  const instruction = `Extraia a refeição informada em um objeto JSON. Use unidades simples (g, ml, unidade). Se possível, inclua calorias e macros (protein_g, carbs_g, fat_g, fiber_g, sodium_mg, sugar_g) por item.`;
  const user = `Descrição: ${description}${mealType ? `\nTipo sugerido: ${mealType}` : ''}`;
  return [
    { role: 'user', content: [{ type: 'text', text: `${instruction}\n\n${user}` }] }
  ];
}

export async function analyzeMealFromText(description: string, mealType?: string): Promise<AiMealAnalysis> {
  const e = env();
  const messages = buildTextMessages(description, mealType);
  try {
    return await callModelWithTool(messages, e.ANTHROPIC_MODEL_DEFAULT);
  } catch {
    return await callModelWithTool(messages, e.ANTHROPIC_MODEL_FALLBACK);
  }
}

function buildImageMessages(base64Data: string, mediaType: string) {
  const sys = `Identifique os alimentos na imagem e devolva a análise via ferramenta parse_meal.`;
  return [
    {
      role: 'user',
      content: [
        { type: 'text', text: sys },
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } } as any
      ]
    }
  ];
}

export async function analyzeMealFromImage(bytes: Uint8Array, mediaType: string): Promise<AiMealAnalysis> {
  const e = env();
  const base64 = Buffer.from(bytes).toString('base64');
  const messages = buildImageMessages(base64, mediaType);
  try {
    return await callModelWithTool(messages, e.ANTHROPIC_MODEL_DEFAULT);
  } catch {
    return await callModelWithTool(messages, e.ANTHROPIC_MODEL_FALLBACK);
  }
}
