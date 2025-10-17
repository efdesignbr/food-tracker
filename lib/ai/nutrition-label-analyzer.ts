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

const systemPrompt = `Você é um assistente especializado em leitura de tabelas nutricionais de alimentos.
Sua tarefa é extrair informações precisas de fotos de embalagens e tabelas nutricionais.

IMPORTANTE:
- Leia com atenção todos os valores da tabela nutricional
- Preste atenção especial ao tamanho da porção (serving size)
- Todos os valores devem ser POR PORÇÃO, não por 100g
- Se a tabela mostrar valores por 100g E por porção, use os valores POR PORÇÃO
- Para sódio, converta para miligramas (mg) se estiver em gramas
- Retorne apenas valores que você conseguir ler claramente na imagem
- Se algum valor não estiver visível, omita esse campo do JSON

CONVERSÕES COMUNS:
- Se sódio estiver em g, multiplique por 1000 para ter mg
- Se a porção estiver em ml e o produto for líquido, mantenha em ml
- Se a porção estiver descrita como "X colheres (Yg)", use "Yg" como serving_size`;

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
      temperature: 0.1,
    }
  });

  const prompt = `${systemPrompt}

Analise a imagem desta embalagem ou tabela nutricional e extraia todas as informações nutricionais visíveis.

Retorne um JSON com:
- name: Nome do produto
- brand: Marca (se visível)
- serving_size: Tamanho da porção (ex: "30g", "200ml", "1 unidade")
- calories: Calorias por porção
- protein: Proteínas em gramas por porção
- carbs: Carboidratos em gramas por porção
- fat: Gorduras totais em gramas por porção
- fiber: Fibras em gramas por porção (se disponível)
- sodium: Sódio em MILIGRAMAS por porção
- sugar: Açúcares em gramas por porção (se disponível)
- saturated_fat: Gorduras saturadas em gramas por porção (se disponível)

LEMBRE-SE: Todos os valores devem ser POR PORÇÃO, conforme indicado no campo "Porção" da tabela.

Retorne apenas o JSON, sem texto adicional.`;

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
