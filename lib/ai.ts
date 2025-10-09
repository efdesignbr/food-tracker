import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env';
import { logger } from './logger';

export type AiFood = {
  name: string;
  quantity: number;
  unit: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sodium_mg?: number;
  sugar_g?: number;
};

export type AiMealAnalysis = {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: AiFood[];
  notes?: string;
};

function getClient() {
  const e = env();
  return new GoogleGenerativeAI(e.GEMINI_API_KEY);
}

// Schema JSON para forçar resposta estruturada
const responseSchema = {
  type: 'object',
  properties: {
    meal_type: {
      type: 'string',
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      description: 'Tipo da refeição'
    },
    foods: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nome do alimento' },
          quantity: { type: 'number', description: 'Quantidade' },
          unit: { type: 'string', description: 'Unidade (g, ml, unidade, colher, etc)' },
          calories: { type: 'number', description: 'Calorias totais' },
          protein_g: { type: 'number', description: 'Proteínas em gramas' },
          carbs_g: { type: 'number', description: 'Carboidratos em gramas' },
          fat_g: { type: 'number', description: 'Gorduras em gramas' },
          fiber_g: { type: 'number', description: 'Fibras em gramas' },
          sodium_mg: { type: 'number', description: 'Sódio em miligramas' },
          sugar_g: { type: 'number', description: 'Açúcares em gramas' }
        },
        required: ['name', 'quantity', 'unit']
      }
    },
    notes: { type: 'string', description: 'Observações sobre a refeição' }
  },
  required: ['meal_type', 'foods']
};

const systemPrompt = `Você é um assistente especializado em nutrição. Sua tarefa é analisar refeições e retornar informações nutricionais precisas.

IMPORTANTE:
- Sempre retorne valores realistas e precisos
- Use a tabela TACO (Tabela Brasileira de Composição de Alimentos) como referência quando possível
- Se não tiver certeza dos valores exatos, faça estimativas conservadoras baseadas em alimentos similares
- Normalize as porções para valores comuns (ex: 100g, 200ml, 1 unidade)
- Inclua TODOS os nutrientes quando possível: calorias, proteínas, carboidratos, gorduras, fibras, sódio e açúcares
`;

export async function analyzeMealFromText(description: string, mealType?: string): Promise<AiMealAnalysis> {
  const e = env();
  const genAI = getClient();

  const model = genAI.getGenerativeModel({
    model: e.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema as any,
      temperature: 0.1,
    }
  });

  const prompt = `${systemPrompt}

Analise a seguinte descrição de refeição e retorne um JSON estruturado com os alimentos e seus valores nutricionais:

Descrição: ${description}
${mealType ? `Tipo sugerido: ${mealType}` : ''}

Para cada alimento, forneça:
- Nome do alimento
- Quantidade e unidade (use unidades comuns: g, ml, unidade, colher, etc)
- Calorias totais
- Macronutrientes: proteína (g), carboidratos (g), gorduras (g)
- Micronutrientes: fibras (g), sódio (mg), açúcares (g)

Retorne apenas o JSON, sem texto adicional.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text) as AiMealAnalysis;
    return parsed;
  } catch (error: any) {
    logger.error('Gemini API error', error);
    throw new Error(`Erro ao analisar refeição: ${error.message}`);
  }
}

export async function analyzeMealFromImage(bytes: Uint8Array, mediaType: string): Promise<AiMealAnalysis> {
  const e = env();
  const genAI = getClient();

  const model = genAI.getGenerativeModel({
    model: e.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema as any,
      temperature: 0.1,
    }
  });

  const prompt = `${systemPrompt}

Analise a imagem desta refeição e identifique todos os alimentos visíveis.

Para cada alimento identificado, forneça:
- Nome do alimento
- Quantidade estimada e unidade (g, ml, unidade, etc)
- Calorias totais estimadas
- Macronutrientes estimados: proteína (g), carboidratos (g), gorduras (g)
- Micronutrientes estimados: fibras (g), sódio (mg), açúcares (g)

Também identifique o tipo de refeição (breakfast, lunch, dinner, snack) baseado nos alimentos e horário típico.

Retorne apenas o JSON estruturado, sem texto adicional.`;

  try {
    // Converte para base64
    const base64Data = Buffer.from(bytes).toString('base64');

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mediaType
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();
    const parsed = JSON.parse(text) as AiMealAnalysis;
    return parsed;
  } catch (error: any) {
    logger.error('Gemini Vision API error', error);
    throw new Error(`Erro ao analisar imagem: ${error.message}`);
  }
}
