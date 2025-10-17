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
Sua tarefa é extrair informações precisas de fotos de embalagens e tabelas nutricionais brasileiras.

IMPORTANTE - VALORES POR PORÇÃO:
- Leia com atenção TODOS os campos da tabela nutricional
- Preste atenção especial ao tamanho da porção (serving size)
- Todos os valores devem ser POR PORÇÃO, não por 100g
- Se a tabela mostrar valores por 100g E por porção, use os valores POR PORÇÃO
- Retorne apenas valores que você conseguir ler claramente na imagem
- Se algum valor não estiver visível, omita esse campo do JSON

CAMPOS OBRIGATÓRIOS (quando visíveis):
- Nome do produto (obrigatório)
- Marca (se visível)
- Tamanho da porção
- Calorias/Valor energético
- Proteínas
- Carboidratos totais
- Gorduras totais

CAMPOS OPCIONAIS (quando visíveis na tabela):
- Fibras alimentares
- Sódio (em mg)
- Açúcares
- Gorduras saturadas
- Gorduras trans
- Colesterol

CONVERSÕES IMPORTANTES:
- Sódio: se estiver em g, multiplique por 1000 para ter mg
- Calorias: aceite tanto kcal quanto kJ (se for kJ, divida por 4.184)
- Porção: se descrita como "X colheres (Yg)", use "Yg" como serving_size
- Porção: mantenha a unidade original (g, ml, unidade, etc)

ATENÇÃO ESPECIAL:
- Procure TODOS os nutrientes listados, não apenas os principais
- Gorduras saturadas geralmente aparecem como sub-item de gorduras totais
- Açúcares geralmente aparecem como sub-item de carboidratos
- Fibras podem estar separadas ou como sub-item de carboidratos`;

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

Analise a imagem desta embalagem ou tabela nutricional brasileira e extraia TODAS as informações nutricionais visíveis.

Retorne um JSON com TODOS os campos que conseguir identificar:

CAMPOS PRINCIPAIS (obrigatórios quando visíveis):
- name: Nome do produto (OBRIGATÓRIO)
- brand: Marca do produto (se visível)
- serving_size: Tamanho da porção exata (ex: "30g", "200ml", "1 unidade (50g)")
- calories: Valor energético/calorias em kcal por porção
- protein: Proteínas em gramas por porção
- carbs: Carboidratos totais em gramas por porção
- fat: Gorduras totais em gramas por porção

CAMPOS ADICIONAIS (incluir quando disponíveis na tabela):
- fiber: Fibras alimentares em gramas por porção
- sodium: Sódio em MILIGRAMAS por porção (não gramas!)
- sugar: Açúcares em gramas por porção
- saturated_fat: Gorduras saturadas em gramas por porção

INSTRUÇÕES CRÍTICAS:
1. LEIA TODOS OS ITENS da tabela nutricional, não apenas os principais
2. Todos os valores devem ser POR PORÇÃO (não por 100g)
3. Se houver duas colunas (100g e porção), use sempre a coluna da PORÇÃO
4. Para sódio, se o valor estiver em gramas, converta para miligramas (multiplique por 1000)
5. Retorne apenas campos que você conseguir ler com clareza
6. Valores decimais são aceitáveis (ex: 2.5g, 150.3mg)

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
