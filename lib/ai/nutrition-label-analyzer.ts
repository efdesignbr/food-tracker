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

  const prompt = `Você é um sistema OCR para extrair dados de tabelas nutricionais brasileiras.

TAREFA: Extrair TODOS os valores nutricionais da COLUNA DA PORÇÃO (não da coluna 100g).

FORMATO DA TABELA:
A tabela pode ter 2 ou 3 colunas:
- Coluna 1: "100g"
- Coluna 2: PORÇÃO (ex: "25g", "30g", "200ml") ← USE ESTA COLUNA
- Coluna 3 (opcional): "%VD" (ignore esta coluna)

IMPORTANTE: Procure no cabeçalho da tabela a informação de porção (ex: "Porções por embalagem: 4", "Porção: 25 g (1 xícara)")

EXEMPLO:
┌──────────────────────┬──────┬──────┬─────┐
│                      │ 100g │ 25g  │ %VD │
├──────────────────────┼──────┼──────┼─────┤
│ Valor energético     │ 519  │ 131  │  7  │ → "calories": 131, "serving_size": "25g"
│ Carboidratos (g)     │ 84   │ 21   │  7  │ → "carbs": 21
│ Açúcares totais (g)  │ 1.2  │ 0.3  │     │ → "sugar": 0.3
│ Proteínas (g)        │ 5    │ 1.2  │  2  │ → "protein": 1.2
│ Gorduras totais (g)  │ 11   │ 2.8  │  5  │ → "fat": 2.8
│ Saturadas (g)        │ 4.7  │ 1.2  │  5  │ → "saturated_fat": 1.2
│ Trans (g)            │ 0    │ 0    │     │
│ Fibras alimentares   │ 0    │ 0    │  0  │ → "fiber": 0
│ Sódio (mg)           │ 428  │ 107  │  4  │ → "sodium": 107
└──────────────────────┴──────┴──────┴─────┘

PASSOS:

1. Localize o cabeçalho "INFORMAÇÃO NUTRICIONAL"
2. Identifique a porção (linha "Porção:" ou cabeçalho da coluna 2)
3. Identifique a COLUNA DA PORÇÃO (segunda coluna, entre "100g" e "%VD")
4. Para CADA nutriente, extraia o valor da COLUNA DA PORÇÃO:

   - "Valor energético" → "calories" (em kcal, não kJ)
   - "Carboidratos" → "carbs" (em g)
   - "Açúcares totais" ou "dos quais açúcares" → "sugar" (em g)
   - "Proteínas" → "protein" (em g)
   - "Gorduras totais" → "fat" (em g)
   - "Gorduras saturadas" ou "Saturadas" → "saturated_fat" (em g)
   - "Fibra alimentar" ou "Fibras" → "fiber" (em g)
   - "Sódio" → "sodium" (em mg)

5. Para nome/marca: procure fora da tabela nutricional

REGRAS CRÍTICAS:
✓ Use APENAS a coluna da PORÇÃO (coluna do meio geralmente)
✓ NUNCA use valores da coluna "100g"
✓ NUNCA use valores da coluna "%VD"
✓ Extraia APENAS números (sem unidades)
✓ Se encontrar "kJ" ao invés de "kcal", divida por 4.184
✓ Inclua TODOS os 8 campos nutricionais visíveis

ATENÇÃO: A coluna da porção geralmente fica ENTRE "100g" e "%VD"!
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
