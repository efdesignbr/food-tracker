import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../env';
import { logger } from '../logger';

export type NutritionLabelAnalysis = {
  name: string;
  brand?: string;
  serving_size?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
  saturated_fat?: number;
};

function getClient() {
  const e = env();
  return new GoogleGenerativeAI(e.GEMINI_API_KEY);
}

// Schema JSON para análise de tabela nutricional
const nutritionLabelSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'Nome do alimento/produto conforme aparece na embalagem'
    },
    brand: {
      type: 'string',
      description: 'Marca do produto'
    },
    serving_size: {
      type: 'string',
      description: 'Tamanho da porção (ex: 100g, 200ml, 1 unidade)'
    },
    calories: {
      type: 'number',
      description: 'Calorias por porção'
    },
    protein: {
      type: 'number',
      description: 'Proteínas em gramas por porção'
    },
    carbs: {
      type: 'number',
      description: 'Carboidratos em gramas por porção'
    },
    fat: {
      type: 'number',
      description: 'Gorduras totais em gramas por porção'
    },
    fiber: {
      type: 'number',
      description: 'Fibras em gramas por porção'
    },
    sodium: {
      type: 'number',
      description: 'Sódio em miligramas por porção'
    },
    sugar: {
      type: 'number',
      description: 'Açúcares em gramas por porção'
    },
    saturated_fat: {
      type: 'number',
      description: 'Gorduras saturadas em gramas por porção'
    }
  },
  required: ['name']
};

export async function analyzeNutritionLabel(
  bytes: Uint8Array,
  mediaType: string
): Promise<NutritionLabelAnalysis> {
  const e = env();
  const genAI = getClient();

  const model = genAI.getGenerativeModel({
    model: e.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: nutritionLabelSchema as any,
      temperature: 0,
    }
  });

  const prompt = `Extraia os dados nutricionais desta tabela nutricional brasileira.

A tabela tem colunas: 100g, PORCAO, %VD
Use APENAS os valores da coluna PORCAO (coluna do meio).

Extraia estes campos da coluna PORCAO:
- Valor energetico em kcal -> calories
- Carboidratos em g -> carbs
- Acucares em g -> sugar
- Proteinas em g -> protein
- Gorduras totais em g -> fat
- Gorduras saturadas em g -> saturated_fat
- Fibras em g -> fiber
- Sodio em mg -> sodium
- Porcao (ex: 25g) -> serving_size
- Nome do produto -> name
- Marca -> brand

Extraia APENAS numeros (sem g, mg, kcal).
Inclua TODOS os 8 nutrientes visiveis.
`;

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
    const parsed = JSON.parse(text) as NutritionLabelAnalysis;

    return parsed;
  } catch (error: any) {
    logger.error('Nutrition label analysis error', error);
    throw new Error(`Erro ao analisar tabela nutricional: ${error.message}`);
  }
}
